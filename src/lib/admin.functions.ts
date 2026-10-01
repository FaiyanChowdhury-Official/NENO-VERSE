import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error("লোড হয়নি");
    const ids = [...new Set(orders.map((o) => o.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name,phone").in("id", ids)
      : { data: [] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return orders.map((o) => ({
      ...o,
      customer_name: map.get(o.user_id)?.full_name ?? "",
      customer_phone: map.get(o.user_id)?.phone ?? "",
    }));
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected", "pending"]),
        note: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status, admin_note: data.note ?? null })
      .eq("id", data.id);
    if (error) throw new Error("আপডেট হয়নি");
    return { ok: true };
  });

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: orders }, users] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,full_name,phone,created_at").order("created_at", { ascending: false }).limit(1000),
      supabaseAdmin.from("orders").select("user_id,amount,status"),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    const emails = new Map(users.data?.users.map((u) => [u.id, u.email ?? ""]) ?? []);
    return (profiles ?? []).map((p) => {
      const mine = (orders ?? []).filter((o) => o.user_id === p.id);
      return {
        ...p,
        email: emails.get(p.id) ?? "",
        orderCount: mine.length,
        spent: mine.filter((o) => o.status === "approved").reduce((s, o) => s + o.amount, 0),
      };
    });
  });
