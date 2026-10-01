import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getCourse, getProduct } from "@/data/catalog";

const orderInput = z.object({
  itemType: z.enum(["product", "course"]),
  itemSlug: z.string().min(1).max(120),
  paymentMethod: z.enum(["bkash", "rocket", "bank"]),
  senderNumber: z.string().trim().min(5).max(60),
  transactionId: z
    .string()
    .trim()
    .min(4)
    .max(60)
    .regex(/^[A-Za-z0-9\-_/]+$/),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => orderInput.parse(data))
  .handler(async ({ data, context }) => {
    const item = data.itemType === "product" ? getProduct(data.itemSlug) : getCourse(data.itemSlug);
    if (!item) return { ok: false as const, error: "প্রোডাক্ট পাওয়া যায়নি" };

    // Block duplicate pending/approved orders for the same item
    const { data: existing } = await context.supabase
      .from("orders")
      .select("id,status")
      .eq("user_id", context.userId)
      .eq("item_slug", data.itemSlug)
      .in("status", ["pending", "approved"])
      .limit(1);
    if (existing && existing.length > 0) {
      return { ok: false as const, error: "এই আইটেমের একটি অর্ডার ইতিমধ্যে আছে" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").insert({
      user_id: context.userId,
      item_type: data.itemType,
      item_slug: data.itemSlug,
      item_name: item.name,
      amount: item.price, // price always taken from server-side catalog
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

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("full_name,phone")
      .eq("id", context.userId)
      .maybeSingle();
    return { fullName: data?.full_name ?? "", phone: data?.phone ?? "", email: (context.claims as { email?: string }).email ?? "" };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ fullName: z.string().trim().min(1).max(100), phone: z.string().trim().max(20) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone })
      .eq("id", context.userId);
    if (error) throw new Error("প্রোফাইল সংরক্ষণ হয়নি");
    return { ok: true };
  });

export const getCourseAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("orders")
      .select("id")
      .eq("user_id", context.userId)
      .eq("item_slug", data.slug)
      .eq("item_type", "course")
      .eq("status", "approved")
      .limit(1);
    return { hasAccess: !!rows && rows.length > 0 };
  });
