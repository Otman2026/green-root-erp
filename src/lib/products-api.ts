import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductBatch = Database["public"]["Tables"]["product_batches"]["Row"];
export type ProductDocument = Database["public"]["Tables"]["product_documents"]["Row"];

export type ProductWithRelations = Product & {
  category?: Pick<Category, "id" | "name" | "name_ar" | "color"> | null;
  supplier?: Pick<Supplier, "id" | "name"> | null;
  images?: ProductImage[];
  batches?: ProductBatch[];
  documents?: ProductDocument[];
};

/* -------------------- PRODUCTS -------------------- */

export async function listProducts(params?: {
  search?: string;
  categoryId?: string | null;
  supplierId?: string | null;
  status?: string;
}): Promise<ProductWithRelations[]> {
  let q = supabase
    .from("products")
    .select("*, category:categories(id,name,name_ar,color), supplier:suppliers(id,name), images:product_images(*)")
    .order("created_at", { ascending: false });

  if (params?.status) q = q.eq("status", params.status);
  if (params?.categoryId) q = q.eq("category_id", params.categoryId);
  if (params?.supplierId) q = q.eq("supplier_id", params.supplierId);
  if (params?.search) {
    const s = `%${params.search}%`;
    q = q.or(
      `name.ilike.${s},name_ar.ilike.${s},trade_name.ilike.${s},active_ingredient.ilike.${s},barcode.ilike.${s},sku.ilike.${s}`
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ProductWithRelations[];
}

export async function getProduct(id: string): Promise<ProductWithRelations> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(id,name,name_ar,color), supplier:suppliers(id,name), images:product_images(*), batches:product_batches(*), documents:product_documents(*)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ProductWithRelations;
}

export async function createProduct(input: ProductInsert): Promise<Product> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("products")
    .insert({ ...input, created_by: u.user?.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, patch: ProductUpdate): Promise<Product> {
  const { data, error } = await supabase.from("products").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function archiveProduct(id: string) { return updateProduct(id, { status: "archived" }); }
export async function restoreProduct(id: string) { return updateProduct(id, { status: "active" }); }
export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- STATS -------------------- */

export async function getProductStats() {
  const today = new Date().toISOString().slice(0, 10);
  const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [total, expired, expiring, lowRows] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("product_batches").select("id", { count: "exact", head: true }).lt("expiry_date", today),
    supabase.from("product_batches").select("id", { count: "exact", head: true }).gte("expiry_date", today).lte("expiry_date", in60),
    supabase.from("products").select("id, stock_quantity, min_stock_alert"),
  ]);
  const lowCount = (lowRows.data ?? []).filter((r) => Number(r.stock_quantity) <= Number(r.min_stock_alert ?? 0)).length;

  return {
    total: total.count ?? 0,
    lowStock: lowCount,
    expired: expired.count ?? 0,
    expiringSoon: expiring.count ?? 0,
  };
}

/* -------------------- CATEGORIES -------------------- */

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name");
  if (error) throw error;
  return data ?? [];
}
export async function createCategory(input: Database["public"]["Tables"]["categories"]["Insert"]) {
  const { data, error } = await supabase.from("categories").insert(input).select("*").single();
  if (error) throw error;
  return data;
}
export async function updateCategory(id: string, patch: Database["public"]["Tables"]["categories"]["Update"]) {
  const { data, error } = await supabase.from("categories").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}
export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function ensureCategoryBySlug(
  slug: string,
  defaults: { name: string; name_ar?: string; icon?: string; color?: string }
): Promise<Category> {
  const { data: existing } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (existing) return existing as Category;
  const { data, error } = await supabase
    .from("categories")
    .insert({ slug, name: defaults.name, name_ar: defaults.name_ar ?? defaults.name, icon: defaults.icon, color: defaults.color })
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}


/* -------------------- SUPPLIERS -------------------- */

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from("suppliers").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}
export async function createSupplier(input: Database["public"]["Tables"]["suppliers"]["Insert"]) {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("suppliers").insert({ ...input, created_by: u.user?.id }).select("*").single();
  if (error) throw error;
  return data;
}
export async function updateSupplier(id: string, patch: Database["public"]["Tables"]["suppliers"]["Update"]) {
  const { data, error } = await supabase.from("suppliers").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}
export async function deleteSupplier(id: string) {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- IMAGES -------------------- */

export async function uploadProductImage(productId: string, file: File, isPrimary = false) {
  const path = `${productId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600", upsert: false,
  });
  if (upErr) throw upErr;
  const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365);
  const url = signed?.signedUrl ?? "";
  const { data, error } = await supabase.from("product_images").insert({
    product_id: productId, url, storage_path: path, is_primary: isPrimary,
  }).select("*").single();
  if (error) throw error;
  if (isPrimary) await supabase.from("products").update({ primary_image_url: url }).eq("id", productId);
  return data;
}

export async function deleteProductImage(id: string, storagePath: string | null) {
  if (storagePath) await supabase.storage.from("product-images").remove([storagePath]);
  const { error } = await supabase.from("product_images").delete().eq("id", id);
  if (error) throw error;
}

export async function setPrimaryImage(productId: string, imageId: string, url: string) {
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);
  await supabase.from("products").update({ primary_image_url: url }).eq("id", productId);
}

/* -------------------- BATCHES -------------------- */

export async function addBatch(input: Database["public"]["Tables"]["product_batches"]["Insert"]) {
  const { data, error } = await supabase.from("product_batches").insert(input).select("*").single();
  if (error) throw error;
  return data;
}
export async function deleteBatch(id: string) {
  const { error } = await supabase.from("product_batches").delete().eq("id", id);
  if (error) throw error;
}
