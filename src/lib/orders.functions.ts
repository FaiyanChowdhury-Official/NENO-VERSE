import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const orderInput = z.object({
  itemType: z.enum(["product", "course"]),
  itemSlug: z.string().min(1).max(120),
  paymentMethod: z.enum(["bkash", "rocket", "bank"]),
  senderNumber: z.string().trim().min(5).max(60),
  transactionId: z.string().trim().min(4).max(60).regex(/^[A-Za-z0-9\-_/]+$/),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => orderInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: item } = await context.supabase
      .from("items")
      .select("name,price,published")
      .eq("kind", data.itemType)
      .eq("slug", data.itemSlug)
      .maybeSingle();
    if (!item || !item.published) return { ok: false as const, error: "প্রোডাক্ট পাওয়া যায়নি" };

    const { data: existing } = await context.supabase
      .from("orders")
      .select("id")
      .eq("user_id", context.userId)
      .eq("item_type", data.itemType)
      .eq("item_slug", data.itemSlug)
      .eq("status", "pending")
      .limit(1);
    if (existing && existing.length > 0) {
      return { ok: false as const, error: "এই আইটেমের একটি অর্ডার যাচাইয়ের অপেক্ষায় আছে" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").insert({
      user_id: context.userId,
      item_type: data.itemType,
      item_slug: data.itemSlug,
      item_name: item.name,
      amount: item.price, // price always from database, never from client
      payment_method: data.paymentMethod,
      sender_number: data.senderNumber,
      transaction_id: data.transactionId.toUpperCase(),
      status: "pending",
    });
    if (error) {
      console.error("createOrder", error);
      if (error.code === "23505") return { ok: false as const, error: "এই ট্রানজেকশন আইডি আগে ব্যবহার হয়েছে" };
      return { ok: false as const, error: "অর্ডার জমা দেওয়া যায়নি, আবার চেষ্টা করুন" };
    }
    return { ok: true as const };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id,item_type,item_slug,item_name,amount,payment_method,transaction_id,status,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("অর্ডার লোড করা যায়নি");
    return data;
  });

type AccessItem = {
  id: string;
  kind: "product" | "course";
  slug: string;
  name: string;
  image_url: string;
  access_type: string;
  access_note: string;
  access_days: number | null;
};

/** Returns the user's active entitlements (approved + not expired). */
async function activeEntitlements(supabase: any, userId: string) {
  const { data: orders } = await supabase
    .from("orders")
    .select("item_type,item_slug,approved_at,created_at")
    .eq("user_id", userId)
    .eq("status", "approved");
  if (!orders?.length) return [] as { item: AccessItem; expiresAt: string | null }[];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: items } = await supabaseAdmin
    .from("items")
    .select("id,kind,slug,name,image_url,access_type,access_note,access_days");
  const out = new Map<string, { item: AccessItem; expiresAt: string | null }>();
  for (const o of orders as { item_type: string; item_slug: string; approved_at: string | null; created_at: string }[]) {
    const item = (items ?? []).find((i) => i.kind === o.item_type && i.slug === o.item_slug) as AccessItem | undefined;
    if (!item) continue;
    const start = new Date(o.approved_at ?? o.created_at);
    const expiresAt = item.access_days ? new Date(start.getTime() + item.access_days * 86400000).toISOString() : null;
    if (expiresAt && new Date(expiresAt) < new Date()) continue;
    const prev = out.get(item.id);
    if (!prev || (prev.expiresAt && (!expiresAt || expiresAt > prev.expiresAt))) out.set(item.id, { item, expiresAt });
  }
  return [...out.values()];
}

export const getMyLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ents = await activeEntitlements(context.supabase, context.userId);
    if (!ents.length) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: links } = await supabaseAdmin
      .from("item_links")
      .select("item_id,url,label")
      .in("item_id", ents.map((e) => e.item.id));
    return ents.map(({ item, expiresAt }) => {
      const link = (links ?? []).find((l) => l.item_id === item.id);
      const hasLink = item.access_type !== "lessons" && !!link?.url;
      return {
        kind: item.kind,
        slug: item.slug,
        name: item.name,
        image: item.image_url,
        accessType: item.access_type,
        note: item.access_note,
        expiresAt,
        linkUrl: hasLink ? link!.url : null,
        linkLabel: hasLink ? link!.label || "অ্যাক্সেস লিংক খুলুন" : null,
      };
    });
  });

export const getCourseContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind: z.enum(["product", "course"]), slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const ents = await activeEntitlements(context.supabase, context.userId);
    const ent = ents.find((e) => e.item.kind === data.kind && e.item.slug === data.slug);
    if (!ent || ent.item.access_type === "link") return { hasAccess: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select("id,module_title,title,duration,sort_order,lesson_videos(video_url)")
      .eq("item_id", ent.item.id)
      .order("sort_order");
    return {
      hasAccess: true as const,
      name: ent.item.name,
      note: ent.item.access_note,
      lessons: (lessons ?? []).map((l: any) => ({
        id: l.id as string,
        module: l.module_title as string,
        title: l.title as string,
        duration: l.duration as string,
        videoUrl: ((Array.isArray(l.lesson_videos) ? l.lesson_videos[0] : l.lesson_videos)?.video_url ?? "") as string,
      })),
    };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles").select("full_name,phone").eq("id", context.userId).maybeSingle();
    return { fullName: data?.full_name ?? "", phone: data?.phone ?? "", email: (context.claims as { email?: string }).email ?? "" };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ fullName: z.string().trim().min(1).max(100), phone: z.string().trim().max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update({ full_name: data.fullName, phone: data.phone }).eq("id", context.userId);
    if (error) throw new Error("প্রোফাইল সংরক্ষণ হয়নি");
    return { ok: true };
  });
