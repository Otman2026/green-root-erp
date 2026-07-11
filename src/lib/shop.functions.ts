import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(6).max(30),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().max(500).optional().or(z.literal("")),
    city: z.string().max(120).optional().or(z.literal("")),
  }),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        qty: z.number().positive().max(10000),
      })
    )
    .min(1)
    .max(100),
  notes: z.string().max(1000).optional(),
});

export const placeStorefrontOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OrderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, selling_price, status, stock_quantity")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length !== ids.length) throw new Error("Some products unavailable");
    for (const p of products) {
      if (p.status !== "active") throw new Error(`Product not available: ${p.name}`);
    }

    // upsert customer by phone
    let customerId: string | null = null;
    const { data: existing } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("phone", data.customer.phone)
      .maybeSingle();
    if (existing?.id) {
      customerId = existing.id;
    } else {
      const { data: newC, error: cErr } = await supabaseAdmin
        .from("customers")
        .insert({
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email || null,
          address: data.customer.address || null,
          city: data.customer.city || null,
          customer_type: "retail",
          is_active: true,
        })
        .select("id")
        .single();
      if (cErr) throw new Error(cErr.message);
      customerId = newC!.id;
    }

    let subtotal = 0;
    const lines = data.items.map((it) => {
      const p = products.find((x) => x.id === it.product_id)!;
      const price = Number(p.selling_price || 0);
      const total = price * it.qty;
      subtotal += total;
      return { product_id: p.id, qty: it.qty, unit_price: price, total, discount: 0, tax: 0 };
    });

    const invoiceNo = `WEB-${Date.now()}`;
    const { data: sale, error: sErr } = await supabaseAdmin
      .from("sales")
      .insert({
        invoice_no: invoiceNo,
        type: "sale",
        status: "draft",
        customer_id: customerId,
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        paid: 0,
        balance: subtotal,
        payment_method: "cash",
        notes: data.notes || null,
        meta: { source: "storefront" },
      })
      .select("id, invoice_no")
      .single();
    if (sErr) throw new Error(sErr.message);

    const { error: iErr } = await supabaseAdmin
      .from("sale_items")
      .insert(lines.map((l) => ({ ...l, sale_id: sale!.id })));
    if (iErr) throw new Error(iErr.message);

    return { id: sale!.id, invoice_no: sale!.invoice_no };
  });
