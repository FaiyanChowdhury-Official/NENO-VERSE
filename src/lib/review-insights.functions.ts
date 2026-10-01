import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReviewInsights = { positives: string[]; negatives: string[]; suggestions: string[] };

export const analyzeReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).min(1).max(50) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; insights: ReviewInsights } | { ok: false; error: string }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: isAdmin } = await supabase.rpc("has_staff_area", { _user_id: userId, _area: "content" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: rows, error } = await supabase
      .from("reviews")
      .select("rating, comment, item_type, item_slug")
      .in("id", data.ids);
    if (error || !rows?.length) return { ok: false, error: "রিভিউ পাওয়া যায়নি।" };

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI কনফিগারেশন পাওয়া যায়নি।" };

    const list = rows
      .map((r: any, i: number) => `${i + 1}. [${r.item_type}: ${r.item_slug}] রেটিং ${r.rating}/5 — ${String(r.comment).slice(0, 1500)}`)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "তুমি একটি বাংলাদেশি ডিজিটাল প্রোডাক্ট ও কোর্স মার্কেটপ্লেসের গ্রাহক-অভিজ্ঞতা বিশ্লেষক। প্রদত্ত রিভিউ বিশ্লেষণ করে শুধুমাত্র বাংলায় উত্তর দাও। প্রতিটি তালিকায় সর্বোচ্চ ৫টি সংক্ষিপ্ত পয়েন্ট দাও। রিভিউতে নেই এমন কিছু বানাবে না।",
        input: `এই রিভিউগুলো বিশ্লেষণ করো:\n${list}`,
        text: {
          format: {
            type: "json_schema",
            name: "review_insights",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["positives", "negatives", "suggestions"],
              properties: {
                positives: { type: "array", items: { type: "string" } },
                negatives: { type: "array", items: { type: "string" } },
                suggestions: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      console.error("AI gateway error", res.status, await res.text().catch(() => ""));
      if (res.status === 429) return { ok: false, error: "অনেক বেশি অনুরোধ — কিছুক্ষণ পর আবার চেষ্টা করুন।" };
      if (res.status === 402) return { ok: false, error: "AI ক্রেডিট শেষ — ওয়ার্কস্পেস সেটিংস থেকে ক্রেডিট যোগ করুন।" };
      if (res.status === 403) return { ok: false, error: "AI ব্যবহারের অনুমতি নেই (403)।" };
      return { ok: false, error: "AI বিশ্লেষণ ব্যর্থ হয়েছে।" };
    }

    // Consume SSE stream server-side
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    let failed = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
            else if (ev.type === "response.refusal.delta") failed = "AI এই অনুরোধে উত্তর দিতে অস্বীকার করেছে।";
            else if (ev.type === "response.failed" || ev.type === "error") failed = "AI বিশ্লেষণ ব্যর্থ হয়েছে।";
          } catch {
            /* ignore partial */
          }
        }
      }
    }
    if (failed) return { ok: false, error: failed };
    try {
      const parsed = JSON.parse(text) as ReviewInsights;
      return { ok: true, insights: parsed };
    } catch {
      return { ok: false, error: "AI-এর উত্তর বোঝা যায়নি।" };
    }
  });

export const draftReviewReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; reply: string } | { ok: false; error: string }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: isAdmin } = await supabase.rpc("has_staff_area", { _user_id: userId, _area: "content" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: r } = await supabase
      .from("reviews").select("rating, comment, item_type, item_slug, reviewer_name").eq("id", data.id).maybeSingle();
    if (!r) return { ok: false, error: "রিভিউ পাওয়া যায়নি।" };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI কনফিগারেশন পাওয়া যায়নি।" };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "তুমি 'NENO-VERSE' নামের বাংলাদেশি ডিজিটাল প্রোডাক্ট ও কোর্স মার্কেটপ্লেসের গ্রাহকসেবা প্রতিনিধি। গ্রাহকের রিভিউর জবাবে একটি ভদ্র, সহানুভূতিশীল, প্রাসঙ্গিক জবাব শুধু বাংলায় লেখো (৩–৫ বাক্য)। গ্রাহককে নাম ধরে সম্বোধন করো, রিভিউর নির্দিষ্ট বিষয় উল্লেখ করো। নেতিবাচক রিভিউতে আন্তরিক দুঃখপ্রকাশ ও সমাধানের প্রস্তাব দাও; কোনো রিফান্ড, ছাড় বা প্রতিশ্রুতি বানাবে না—প্রয়োজনে সাপোর্টে যোগাযোগ করতে বলো। শুধু জবাবের লেখাটি দাও।",
        input: `গ্রাহক: ${r.reviewer_name || "গ্রাহক"}\n${r.item_type === "course" ? "কোর্স" : "প্রোডাক্ট"}: ${r.item_slug}\nরেটিং: ${r.rating}/5\nরিভিউ: ${String(r.comment).slice(0, 2000)}`,
      }),
    });
    if (!res.ok || !res.body) {
      console.error("AI gateway error", res.status, await res.text().catch(() => ""));
      if (res.status === 429) return { ok: false, error: "অনেক বেশি অনুরোধ — কিছুক্ষণ পর আবার চেষ্টা করুন।" };
      if (res.status === 402) return { ok: false, error: "AI ক্রেডিট শেষ — ওয়ার্কস্পেস সেটিংস থেকে ক্রেডিট যোগ করুন।" };
      if (res.status === 403) return { ok: false, error: "AI ব্যবহারের অনুমতি নেই (403)।" };
      return { ok: false, error: "খসড়া তৈরি ব্যর্থ হয়েছে।" };
    }
    const out = await readSse(res.body);
    if (out.failed) return { ok: false, error: out.failed };
    if (!out.text.trim()) return { ok: false, error: "AI কোনো উত্তর দেয়নি।" };
    return { ok: true, reply: out.text.trim() };
  });

async function readSse(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "", failed = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.refusal.delta") failed = "AI এই অনুরোধে উত্তর দিতে অস্বীকার করেছে।";
          else if (ev.type === "response.failed" || ev.type === "error") failed = "AI অনুরোধ ব্যর্থ হয়েছে।";
        } catch { /* partial */ }
      }
    }
  }
  return { text, failed };
}

export type GeneratedDescription = { short_description: string; description: string[]; highlights: string[] };

export const generateItemDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().trim().min(2).max(150), benefits: z.string().trim().max(2000), duration: z.string().trim().max(100) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; result: GeneratedDescription } | { ok: false; error: string }> => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: isAdmin } = await supabase.rpc("has_staff_area", { _user_id: userId, _area: "content" });
    if (!isAdmin) throw new Error("Forbidden");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI কনফিগারেশন পাওয়া যায়নি।" };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "তুমি 'NENO-VERSE' নামের বাংলাদেশি ডিজিটাল মার্কেটপ্লেসের কপিরাইটার। ডিজিটাল সাবস্ক্রিপশনের জন্য বাংলাদেশি গ্রাহকদের উপযোগী সহজ, আকর্ষণীয়, সৎ বাংলা বিবরণ লেখো। শুধু দেওয়া তথ্য ব্যবহার করো; অফিসিয়াল সম্পর্ক, গ্যারান্টি বা যে সুবিধা দেওয়া হয়নি তা দাবি করবে না। short_description এক বাক্যে (সর্বোচ্চ ১৪০ অক্ষর)। description ২–৪টি ছোট অনুচ্ছেদ, শেষেরটিতে মেয়াদ ও পেমেন্ট যাচাইয়ের পর অ্যাক্টিভেশনের কথা বলো। highlights ৩–৬টি ছোট পয়েন্ট।",
        input: `সাবস্ক্রিপশনের নাম: ${data.name}\nসুবিধা: ${data.benefits || "(দেওয়া হয়নি)"}\nমেয়াদ: ${data.duration || "(দেওয়া হয়নি)"}`,
        text: { format: { type: "json_schema", name: "item_description", strict: true, schema: {
          type: "object", additionalProperties: false, required: ["short_description", "description", "highlights"],
          properties: { short_description: { type: "string" }, description: { type: "array", items: { type: "string" } }, highlights: { type: "array", items: { type: "string" } } },
        } } },
      }),
    });
    if (!res.ok || !res.body) {
      console.error("AI gateway error", res.status, await res.text().catch(() => ""));
      if (res.status === 429) return { ok: false, error: "অনেক বেশি অনুরোধ — কিছুক্ষণ পর আবার চেষ্টা করুন।" };
      if (res.status === 402) return { ok: false, error: "AI ক্রেডিট শেষ — ওয়ার্কস্পেস সেটিংস থেকে ক্রেডিট যোগ করুন।" };
      if (res.status === 403) return { ok: false, error: "AI ব্যবহারের অনুমতি নেই (403)।" };
      return { ok: false, error: "বিবরণ তৈরি ব্যর্থ হয়েছে।" };
    }
    const out = await readSse(res.body);
    if (out.failed) return { ok: false, error: out.failed };
    try { return { ok: true, result: JSON.parse(out.text) as GeneratedDescription }; }
    catch { return { ok: false, error: "AI-এর উত্তর বোঝা যায়নি।" }; }
  });
