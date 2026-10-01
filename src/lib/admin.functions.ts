import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

export type StaffArea = "content" | "finance" | "support";
async function assertArea(ctx: Ctx, area: StaffArea) {
  const { data } = await ctx.supabase.rpc("has_staff_area", { _user_id: ctx.userId, _area: area });
  if (!data) throw new Error("Forbidden");
}
async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const STAFF_ROLES = ["admin", "content_manager", "finance_manager", "support_manager"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
function fail(error: { message: string } | null, msg = "সংরক্ষণ হয়নি") {
  if (error) {
    console.error(error);
    throw new Error(error.message.includes("duplicate") ? "এই স্লাগ আগেই ব্যবহার হয়েছে" : msg);
  }
}



export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = ((data ?? []) as { role: string }[]).map((r) => r.role);
    const isFullAdmin = roles.includes("admin");
    const areas: StaffArea[] = isFullAdmin
      ? ["content", "finance", "support"]
      : ([
          roles.includes("content_manager") && "content",
          roles.includes("finance_manager") && "finance",
          roles.includes("support_manager") && "support",
        ].filter(Boolean) as StaffArea[]);
    return { isAdmin: isFullAdmin || areas.length > 0, isFullAdmin, roles, areas };
  });

/* ---------------- Staff roles (full admin only) ---------------- */

export const adminListStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("user_roles").select("id,user_id,role").in("role", [...STAFF_ROLES]);
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name").in("id", ids)
      : { data: [] as { id: string; full_name: string | null }[] };
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const em = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const pm = new Map((profiles ?? []).map((p) => [p.id, { full_name: p.full_name, email: em.get(p.id) ?? "" }]));
    return (rows ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      role: r.role as StaffRole,
      name: pm.get(r.user_id)?.full_name ?? "",
      email: pm.get(r.user_id)?.email ?? em.get(r.user_id) ?? "",
      isSelf: r.user_id === context.userId,
    }));
  });

export const adminAddStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ email: z.string().trim().email().max(255), role: z.enum(STAFF_ROLES) })).parse(d)).handler(async ({ data, context }) => {
  await assertAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const prof = users?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
  if (!prof) throw new Error("এই ইমেইলে কোনো অ্যাকাউন্ট নেই — আগে তাকে রেজিস্টার করতে বলুন।");
  const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: prof.id, role: data.role as never }, { onConflict: "user_id,role" });
  fail(error);
  return { ok: true };
});

export const adminRemoveStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid() })).parse(d)).handler(async ({ data, context }) => {
  await assertAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin.from("user_roles").select("user_id,role").eq("id", data.id).maybeSingle();
  if (row?.user_id === context.userId && row.role === "admin") throw new Error("নিজের অ্যাডমিন রোল মুছতে পারবেন না।");
  const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", data.id);
  fail(error);
  return { ok: true };
});

/* ---------------- Orders & customers ---------------- */

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertArea(context, "finance");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error("লোড হয়নি");
    const ids = [...new Set(orders.map((o) => o.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name,phone").in("id", ids)
      : { data: [] as { id: string; full_name: string; phone: string }[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return orders.map((o) => ({ ...o, customer_name: map.get(o.user_id)?.full_name ?? "", customer_phone: map.get(o.user_id)?.phone ?? "" }));
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "pending"]) })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "finance");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: data.status, approved_at: data.status === "approved" ? new Date().toISOString() : null })
    .eq("id", data.id);
  fail(error, "আপডেট হয়নি");
  return { ok: true };
});

export const adminUpdateDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid(), delivery_status: z.enum(["waiting", "processing", "delivered", "failed"]), delivery_note: z.string().max(1000) })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "finance");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ delivery_status: data.delivery_status, delivery_note: data.delivery_note, delivered_at: data.delivery_status === "delivered" ? new Date().toISOString() : null })
    .eq("id", data.id);
  fail(error, "আপডেট হয়নি");
  return { ok: true };
});

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid() })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "finance");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.id);
  fail(error, "ডিলিট হয়নি");
  return { ok: true };
});

export const adminGrantAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ email: z.string().trim().email(), kind: z.enum(["product", "course"]), slug: z.string().min(1) })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "finance");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const user = users?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
  if (!user) throw new Error("এই ইমেইলে কোনো অ্যাকাউন্ট নেই");
  const { data: item } = await supabaseAdmin.from("items").select("name").eq("kind", data.kind).eq("slug", data.slug).maybeSingle();
  if (!item) throw new Error("আইটেম পাওয়া যায়নি");
  const { error } = await supabaseAdmin.from("orders").insert({
    user_id: user.id,
    item_type: data.kind,
    item_slug: data.slug,
    item_name: item.name,
    amount: 0,
    payment_method: "manual",
    sender_number: "admin",
    transaction_id: `MANUAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    status: "approved",
    approved_at: new Date().toISOString(),
  });
  fail(error);
  return { ok: true };
});

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertArea(context, "finance");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: orders }, users] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,full_name,phone,created_at").order("created_at", { ascending: false }).limit(1000),
      supabaseAdmin.from("orders").select("user_id,amount,status"),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    const emails = new Map(users.data?.users.map((u) => [u.id, u.email ?? ""]) ?? []);
    return (profiles ?? []).map((p) => {
      const mine = (orders ?? []).filter((o) => o.user_id === p.id);
      return { ...p, email: emails.get(p.id) ?? "", orderCount: mine.length, spent: mine.filter((o) => o.status === "approved").reduce((s, o) => s + o.amount, 0) };
    });
  });

/* ---------------- Categories ---------------- */

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertArea(context, "content");
    const { data } = await context.supabase.from("categories").select("*").order("kind").order("sort_order");
    return (data ?? []) as { id: string; kind: "product" | "course"; slug: string; name: string; sort_order: number }[];
  });

const slugSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/, "স্লাগে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও - ব্যবহার করুন");

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid().optional(), kind: z.enum(["product", "course"]), slug: slugSchema, name: z.string().trim().min(1).max(80), sort_order: z.number().int().default(0) })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "content");
  const { id, ...row } = data;
  const { error } = id
    ? await context.supabase.from("categories").update(row).eq("id", id)
    : await context.supabase.from("categories").insert(row);
  fail(error);
  return { ok: true };
});

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid() })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "content");
  const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
  fail(error, "ডিলিট হয়নি");
  return { ok: true };
});

/* ---------------- Items (products & courses) ---------------- */

export const adminListItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertArea(context, "content");
    const { data } = await context.supabase.from("items").select("id,kind,slug,name,price,original_price,published,access_type,category_slug,image_url").order("kind").order("sort_order");
    return (data ?? []) as { id: string; kind: "product" | "course"; slug: string; name: string; price: number; original_price: number | null; published: boolean; access_type: string; category_slug: string; image_url: string }[];
  });

const lessonSchema = z.object({
  id: z.string().uuid().optional(),
  module_title: z.string().max(120).default(""),
  title: z.string().trim().min(1).max(200),
  duration: z.string().max(40).default(""),
  is_free: z.boolean().default(false),
  video_url: z.string().max(3000).default(""),
});

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["product", "course"]),
  slug: slugSchema,
  name: z.string().trim().min(1).max(200),
  category_slug: z.string().max(80),
  short_description: z.string().max(400),
  description: z.array(z.string().max(4000)).max(30),
  highlights: z.array(z.string().max(300)).max(40),
  file_info: z.string().max(200),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  instructor: z.string().max(120),
  duration: z.string().max(60),
  price: z.number().int().min(0).max(10_000_000),
  original_price: z.number().int().min(0).max(10_000_000).nullable(),
  image_url: z.string().max(1000),
  popular: z.boolean(),
  is_new: z.boolean(),
  published: z.boolean(),
  sort_order: z.number().int(),
  access_type: z.enum(["lessons", "link", "both"]),
  access_note: z.string().max(2000),
  access_days: z.number().int().positive().nullable(),
  requires_customer_info: z.boolean().default(false),
  customer_info_label: z.string().max(200).default(""),
  link_url: z.string().max(2000),
  link_label: z.string().max(120),
  lessons: z.array(lessonSchema).max(500),
});
export type AdminItemInput = z.infer<typeof itemSchema>;

export const adminGetItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid() })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "content");
  const sb = context.supabase;
  const [{ data: item }, { data: link }, { data: lessons }] = await Promise.all([
    sb.from("items").select("*").eq("id", data.id).single(),
    sb.from("item_links").select("url,label").eq("item_id", data.id).maybeSingle(),
    sb.from("lessons").select("id,module_title,title,duration,is_free,sort_order,lesson_videos(video_url)").eq("item_id", data.id).order("sort_order"),
  ]);
  if (!item) throw new Error("পাওয়া যায়নি");
  return {
    ...item,
    link_url: link?.url ?? "",
    link_label: link?.label ?? "",
    lessons: (lessons ?? []).map((l: any) => ({
      id: l.id,
      module_title: l.module_title,
      title: l.title,
      duration: l.duration,
      is_free: l.is_free,
      video_url: (Array.isArray(l.lesson_videos) ? l.lesson_videos[0] : l.lesson_videos)?.video_url ?? "",
    })),
  } as AdminItemInput;
});

export const adminSaveItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (itemSchema).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "content");
  const sb = context.supabase;
  const { id, link_url, link_label, lessons, ...row } = data;
  const lesson_count = lessons.length || undefined;
  let itemId: string = id ?? "";
  if (id) {
    const { error } = await sb.from("items").update({ ...row, ...(lesson_count && { lesson_count }) }).eq("id", id);
    fail(error);
  } else {
    const { data: ins, error } = await sb.from("items").insert({ ...row, lesson_count: lessons.length }).select("id").single();
    fail(error);
    if (!ins) throw new Error("Insert failed");
    itemId = ins.id;
  }
  const { error: le } = await sb.from("item_links").upsert({ item_id: itemId, url: link_url, label: link_label });
  fail(le);

  // Sync lessons: delete removed, upsert the rest in order
  const { data: existing } = await sb.from("lessons").select("id").eq("item_id", itemId);
  const keep = new Set(lessons.filter((l) => l.id).map((l) => l.id));
  const remove = (existing ?? []).map((e: { id: string }) => e.id).filter((x: string) => !keep.has(x));
  if (remove.length) fail((await sb.from("lessons").delete().in("id", remove)).error);
  for (const [i, l] of lessons.entries()) {
    const payload = { item_id: itemId, module_title: l.module_title, title: l.title, duration: l.duration, is_free: l.is_free, sort_order: i };
    let lessonId = l.id;
    if (lessonId) fail((await sb.from("lessons").update(payload).eq("id", lessonId)).error);
    else {
      const { data: ins, error } = await sb.from("lessons").insert(payload).select("id").single();
      fail(error);
      lessonId = ins!.id;
    }
    fail((await sb.from("lesson_videos").upsert({ lesson_id: lessonId, video_url: l.video_url })).error);
  }
  return { ok: true, id: itemId };
});

export const adminDeleteItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid() })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "content");
  const { error } = await context.supabase.from("items").delete().eq("id", data.id);
  fail(error, "ডিলিট হয়নি");
  return { ok: true };
});

/* ---------------- Reviews & stories ---------------- */

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertArea(context, "content");
    const { data } = await context.supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(500);
    return (data ?? []) as { id: string; item_type: string; item_slug: string; reviewer_name: string; rating: number; comment: string; status: "pending" | "approved" | "rejected"; created_at: string }[];
  });

export const adminSetReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "pending"]) })).parse(d)).handler(
  async ({ data, context }) => {
    await assertArea(context, "content");
    fail((await context.supabase.from("reviews").update({ status: data.status }).eq("id", data.id)).error);
    return { ok: true };
  },
);

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid() })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "content");
  fail((await context.supabase.from("reviews").delete().eq("id", data.id)).error, "ডিলিট হয়নি");
  return { ok: true };
});

export const adminListStories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertArea(context, "content");
    const { data } = await context.supabase.from("success_stories").select("*").order("sort_order");
    return (data ?? []) as { id: string; name: string; role: string; story: string; image_url: string; rating: number; published: boolean; sort_order: number }[];
  });

export const adminSaveStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(100),
    role: z.string().max(120),
    story: z.string().trim().min(1).max(2000),
    image_url: z.string().max(1000),
    rating: z.number().int().min(1).max(5),
    published: z.boolean(),
    sort_order: z.number().int(),
  })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "content");
  const { id, ...row } = data;
  const { error } = id ? await context.supabase.from("success_stories").update(row).eq("id", id) : await context.supabase.from("success_stories").insert(row);
  fail(error);
  return { ok: true };
});

export const adminDeleteStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => (z.object({ id: z.string().uuid() })).parse(d)).handler(async ({ data, context }) => {
  await assertArea(context, "content");
  fail((await context.supabase.from("success_stories").delete().eq("id", data.id)).error, "ডিলিট হয়নি");
  return { ok: true };
});

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertArea(context, "finance");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders } = await supabaseAdmin.from("orders").select("status,amount");
    const { count: customers } = await supabaseAdmin.from("profiles").select("id", { count: "exact", head: true });
    const all = orders ?? [];
    const approved = all.filter((o) => o.status === "approved");
    return {
      revenue: approved.reduce((s, o) => s + (o.amount ?? 0), 0),
      orders: all.length,
      pending: all.filter((o) => o.status === "pending").length,
      customers: customers ?? 0,
    };
  });
