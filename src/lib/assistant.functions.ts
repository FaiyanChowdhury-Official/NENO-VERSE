import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const msgSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(20),
});

/** Public help assistant: answers questions about courses/products using live catalog data. */
export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d) => msgSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; reply: string } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    const sbKey = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    if (!key) return { ok: false, error: "সহকারী এখন চালু নেই।" };
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env["SUPABASE_URL"]!, sbKey, {
      auth: { persistSession: false },
      global: { fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (sbKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${sbKey}`) h.delete("Authorization");
        h.set("apikey", sbKey);
        return fetch(input, { ...init, headers: h });
      } },
    });
    const [{ data: items }, { data: lessons }, { data: gen }] = await Promise.all([
      sb.from("items").select("id,kind,slug,name,short_description,highlights,price,original_price,level,instructor,duration,lesson_count,access_type,access_days").eq("published", true).limit(200),
      sb.from("lessons").select("item_id,module_title,title").order("sort_order").limit(1000),
      sb.from("site_settings").select("value").eq("key", "general").maybeSingle(),
    ]);
    const catalog = (items ?? []).map((i: any) => {
      const mods = [...new Set((lessons ?? []).filter((l: any) => l.item_id === i.id).map((l: any) => l.module_title).filter(Boolean))];
      return `- [${i.kind === "course" ? "কোর্স" : "প্রোডাক্ট"}] ${i.name} | দাম ৳${i.price}${i.original_price ? ` (আগে ৳${i.original_price})` : ""} | লিংক: /${i.kind === "course" ? "courses" : "products"}/${i.slug}${i.access_days ? ` | মেয়াদ ${i.access_days} দিন` : " | আজীবন অ্যাক্সেস"}${i.kind === "course" ? ` | লেভেল ${i.level}, ${i.lesson_count}টি ক্লাস${i.instructor ? `, ইন্সট্রাক্টর ${i.instructor}` : ""}${mods.length ? `, মডিউল: ${mods.join("; ")}` : ""}` : ""} | ${i.short_description} ${(i.highlights ?? []).join(", ")}`;
    }).join("\n");
    const g = (gen?.value ?? {}) as Record<string, string>;
    const contact = [g["phone"] && `ফোন ${g["phone"]}`, g["whatsapp"] && `WhatsApp ${g["whatsapp"]}`, g["telegram"] && `Telegram ${g["telegram"]}`, g["email"] && `ইমেইল ${g["email"]}`].filter(Boolean).join(", ") || "ড্যাশবোর্ডের সাপোর্ট ট্যাব";

    const instructions = `তুমি "অক্টোপাস" ওয়েবসাইটের সহায়ক। সবসময় সংক্ষিপ্ত, ভদ্র বাংলায় উত্তর দাও।
শুধু নিচের তথ্য ব্যবহার করো; জানা না থাকলে বানিয়ে বলবে না, বরং যোগাযোগের মাধ্যম জানাবে (${contact})।
কেনার নিয়ম: অ্যাকাউন্ট খুলে প্রোডাক্ট/কোর্স পেজে "কিনুন" চাপুন → বিকাশ/রকেট/ব্যাংকে টাকা পাঠিয়ে ট্রানজেকশন আইডি দিন → আমাদের টিম যাচাই করলে ড্যাশবোর্ডে অ্যাক্সেস চালু হয় (সাধারণত কয়েক ঘণ্টায়)। কোর্স ভিডিও শুধু ওয়েবসাইটের ভেতরে দেখা যায়, ডাউনলোড করা যায় না; একটি অ্যাকাউন্ট সর্বোচ্চ ২টি ডিভাইসে চলে।
রিফান্ড, ছাড় বা কোনো প্রতিশ্রুতি নিজে থেকে দেবে না। পেমেন্ট নম্বর জানতে চাইলে চেকআউট পেজ দেখতে বলো।
ক্যাটালগ:
${catalog || "(এখন কোনো আইটেম প্রকাশিত নেই)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions,
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok || !res.body) {
      console.error("assistant AI error", res.status, await res.text().catch(() => ""));
      if (res.status === 429) return { ok: false, error: "এখন অনেকে প্রশ্ন করছেন — একটু পরে আবার চেষ্টা করুন।" };
      if (res.status === 402 || res.status === 403) return { ok: false, error: "সহকারী সাময়িকভাবে বন্ধ আছে। অনুগ্রহ করে WhatsApp/সাপোর্টে যোগাযোগ করুন।" };
      return { ok: false, error: "উত্তর আনা যায়নি, আবার চেষ্টা করুন।" };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", failed = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, idx); buf = buf.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const p = line.slice(5).trim();
          if (!p || p === "[DONE]") continue;
          try {
            const ev = JSON.parse(p);
            if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
            else if (ev.type === "response.refusal.delta" || ev.type === "response.failed" || ev.type === "error") failed = true;
          } catch { /* partial */ }
        }
      }
    }
    if (failed || !text.trim()) return { ok: false, error: "এই প্রশ্নের উত্তর দিতে পারছি না। সাপোর্টে যোগাযোগ করুন।" };
    return { ok: true, reply: text.trim() };
  });
