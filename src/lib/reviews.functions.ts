import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function publicClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const target = z.object({ kind: z.enum(["product", "course"]), slug: z.string().min(1).max(120) });

export const listReviews = createServerFn({ method: "GET" })
  .inputValidator((d) => target.parse(d))
  .handler(async ({ data }) => {
    const sb = await publicClient();
    const { data: rows } = await sb
      .from("reviews")
      .select("id,reviewer_name,rating,comment,created_at")
      .eq("item_type", data.kind)
      .eq("item_slug", data.slug)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);
    return rows ?? [];
  });

export const reviewsQuery = (kind: "product" | "course", slug: string) =>
  queryOptions({ queryKey: ["reviews", kind, slug], queryFn: () => listReviews({ data: { kind, slug } }) });

export const listStories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await publicClient();
  const { data } = await sb
    .from("success_stories")
    .select("id,name,role,story,image_url,rating")
    .eq("published", true)
    .order("sort_order")
    .limit(12);
  return data ?? [];
});

export const storiesQuery = queryOptions({ queryKey: ["stories"], queryFn: () => listStories() });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    target.extend({ rating: z.number().int().min(1).max(5), comment: z.string().trim().min(3).max(1000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: bought } = await context.supabase
      .from("orders")
      .select("id")
      .eq("user_id", context.userId)
      .eq("item_type", data.kind)
      .eq("item_slug", data.slug)
      .eq("status", "approved")
      .is("deleted_at", null)
      .limit(1);
    if (!bought?.length) return { ok: false as const, error: "শুধু ক্রেতারাই রিভিউ দিতে পারবেন" };
    const { data: profile } = await context.supabase.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reviews").upsert(
      {
        user_id: context.userId,
        item_type: data.kind,
        item_slug: data.slug,
        reviewer_name: profile?.full_name || "গ্রাহক",
        rating: data.rating,
        comment: data.comment,
        status: "pending",
      },
      { onConflict: "user_id,item_type,item_slug" },
    );
    if (error) {
      console.error(error);
      return { ok: false as const, error: "রিভিউ জমা হয়নি" };
    }
    return { ok: true as const };
  });
