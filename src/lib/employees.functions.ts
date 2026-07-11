import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CreateInput = {
  email: string;
  password: string;
  fullName: string;
  username?: string;
  phone?: string;
  role: string;
};

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateInput) => {
    if (!data.email || !data.password || !data.fullName || !data.role) {
      throw new Error("البريد وكلمة السر والاسم والدور مطلوبة");
    }
    if (data.password.length < 8) throw new Error("كلمة السر يجب أن تكون 8 أحرف على الأقل");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Authorize: caller must be org owner/admin or system_owner
    const [{ data: mem }, { data: roles }] = await Promise.all([
      supabase.from("organization_members").select("organization_id, role").eq("user_id", userId).limit(1),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const isSys = (roles ?? []).some((r: any) => r.role === "system_owner");
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    const orgMember = mem?.[0];
    const isOwner = orgMember?.role === "owner";
    if (!isSys && !isAdmin && !isOwner) {
      throw new Error("غير مصرح: يجب أن تكون مالك المؤسسة أو مسؤولاً");
    }
    if (!orgMember && !isSys) throw new Error("لا توجد مؤسسة مرتبطة بحسابك");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        username: data.username,
        phone: data.phone,
      },
    });
    if (cErr || !created.user) throw new Error(cErr?.message ?? "فشل إنشاء الحساب");

    const newUserId = created.user.id;

    // handle_new_user trigger created profile + default org + employee role.
    // Override: attach to caller's org instead, and set the requested role.
    if (orgMember) {
      // Remove auto-created org membership (if any) and attach to caller's org
      await supabaseAdmin.from("organization_members").delete().eq("user_id", newUserId);
      await supabaseAdmin.from("organization_members").insert({
        organization_id: orgMember.organization_id,
        user_id: newUserId,
        role: "employee",
      });
    }

    // Replace default role with requested one
    if (data.role !== "employee") {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId).eq("role", "employee");
      const { error: rErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role: data.role as any });
      if (rErr) throw new Error(rErr.message);
    }

    return { ok: true, userId: newUserId };
  });
