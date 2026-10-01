import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSetting, defaultStorefront, defaultNagad, type GeneralSettings, type PaymentSettings, type StorefrontSettings } from "@/lib/settings";
import { paymentMethods } from "@/lib/payments";
import { TicketThread, ticketCategories, ticketStatusLabels } from "@/components/site/SupportTickets";

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {multiline ? <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} /> : <Input value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

async function save(key: string, value: unknown) {
  const { error } = await supabase.from("site_settings").upsert({ key, value: value as never });
  if (error) toast.error("সেভ করা যায়নি"); else toast.success("সেভ হয়েছে");
}

export function SettingsPanel() {
  const qc = useQueryClient();
  const pay = useSetting<PaymentSettings>("payment");
  const gen = useSetting<GeneralSettings>("general");
  const [p, setP] = useState<PaymentSettings | null>(null);
  const [g, setG] = useState<GeneralSettings | null>(null);
  useEffect(() => { if (pay.data) setP({ ...pay.data, nagad: pay.data.nagad ?? defaultNagad }); }, [pay.data]);
  useEffect(() => { if (gen.data) setG(gen.data); }, [gen.data]);
  if (!p || !g) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;

  const up = <K extends keyof PaymentSettings>(k: K, patch: Partial<PaymentSettings[K]>) => setP({ ...p, [k]: { ...p[k], ...patch } });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">পেমেন্ট সেটিংস</h2>
        <p className="text-sm text-muted-foreground">চেকআউট পেজে গ্রাহকরা এখানকার তথ্যই দেখবেন।</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {(["bkash", "rocket", "nagad"] as const).map((k) => (
            <div key={k} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between"><p className="font-semibold">{paymentMethods[k].label}</p><Switch checked={p[k].enabled} onCheckedChange={(v) => up(k, { enabled: v })} /></div>
              <Field label="নম্বর" value={p[k].number} onChange={(v) => up(k, { number: v })} />
              <Field label="নির্দেশনা" multiline value={p[k].instructions} onChange={(v) => up(k, { instructions: v })} />
            </div>
          ))}
          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between"><p className="font-semibold">ব্যাংক ট্রান্সফার</p><Switch checked={p.bank.enabled} onCheckedChange={(v) => up("bank", { enabled: v })} /></div>
            <Field label="ব্যাংকের নাম" value={p.bank.bank_name} onChange={(v) => up("bank", { bank_name: v })} />
            <Field label="অ্যাকাউন্টের নাম" value={p.bank.account_name} onChange={(v) => up("bank", { account_name: v })} />
            <Field label="অ্যাকাউন্ট নম্বর" value={p.bank.account_number} onChange={(v) => up("bank", { account_number: v })} />
            <Field label="শাখা" value={p.bank.branch} onChange={(v) => up("bank", { branch: v })} />
            <Field label="নির্দেশনা" multiline value={p.bank.instructions} onChange={(v) => up("bank", { instructions: v })} />
          </div>
        </div>
        <Button onClick={async () => { await save("payment", p); qc.invalidateQueries({ queryKey: ["setting", "payment"] }); }}>পেমেন্ট সেটিংস সেভ করুন</Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">যোগাযোগ ও সোশ্যাল</h2>
        <p className="text-sm text-muted-foreground">WhatsApp, Telegram, Messenger দিলে ওয়েবসাইটের কোণে “যোগাযোগ” বোতামে দেখাবে।</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["site_name", "ওয়েবসাইটের নাম"], ["phone", "ফোন"], ["email", "ইমেইল"], ["address", "ঠিকানা"],
            ["whatsapp", "WhatsApp নম্বর (যেমন 01XXXXXXXXX)"], ["telegram", "Telegram ইউজারনেম (যেমন @octopus)"], ["messenger", "Messenger লিংক (m.me/...)"],
            ["facebook", "Facebook লিংক"], ["youtube", "YouTube লিংক"], ["instagram", "Instagram লিংক"],
          ] as [keyof GeneralSettings, string][]).map(([k, l]) => (
            <Field key={k} label={l} value={g[k] ?? ""} onChange={(v) => setG({ ...g, [k]: v })} />
          ))}
        </div>
        <Button onClick={async () => { await save("general", g); qc.invalidateQueries({ queryKey: ["setting", "general"] }); }}>সেভ করুন</Button>
      </section>
      <StaffAccessToggle />
    </div>
  );
}

function StaffAccessToggle() {
  const qc = useQueryClient();
  const s = useSetting<{ enabled: boolean }>("staff_access");
  const enabled = s.data?.enabled !== false;
  return (
    <section className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">স্টাফ অ্যাক্সেস</h2>
          <p className="text-sm text-muted-foreground">বন্ধ করলে কনটেন্ট, ফাইন্যান্স ও সাপোর্ট ম্যানেজাররা অ্যাডমিন প্যানেলে ঢুকতে পারবেন না। তারা সাধারণ গ্রাহকের মতো লগইন করতে পারবেন। আপনি (অ্যাডমিন) সবসময় পারবেন।</p>
        </div>
        <Switch checked={enabled} onCheckedChange={async (v) => { await save("staff_access", { enabled: v }); qc.invalidateQueries({ queryKey: ["setting", "staff_access"] }); }} />
      </div>
    </section>
  );
}

export function SupportPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("active");
  const tickets = useQuery({
    queryKey: ["tickets", "admin"],
    queryFn: async () => (await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false })).data ?? [],
  });
  const rows = (tickets.data ?? []).filter((t) => filter === "all" || (filter === "active" ? !["resolved", "closed"].includes(t.status) : t.status === filter));

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("support_tickets").update({ status: status as never }).eq("id", id);
    if (error) toast.error("বদলানো যায়নি"); else qc.invalidateQueries({ queryKey: ["tickets"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([["active", "চলমান"], ["all", "সব"], ...Object.entries(ticketStatusLabels)] as [string, string][]).map(([k, l]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>
        ))}
      </div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">কোনো টিকিট নেই।</p>}
      {rows.map((t) => (
        <div key={t.id} className="surface-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <button className="min-w-0 text-left" onClick={() => setOpen(open === t.id ? null : t.id)}>
              <p className="font-semibold text-foreground">{t.subject}</p>
              <p className="text-xs text-subtle-foreground">{ticketCategories[t.category] ?? t.category}{t.order_id ? ` • অর্ডার ${t.order_id.slice(0, 8)}` : ""} • {new Date(t.updated_at).toLocaleString("bn-BD")}</p>
            </button>
            <select value={t.status} onChange={(e) => setStatus(t.id, e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {Object.entries(ticketStatusLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          {open === t.id && <div className="mt-4 border-t border-border pt-4"><TicketThread ticketId={t.id} staff /></div>}
        </div>
      ))}
    </div>
  );
}

const actionLabels: Record<string, string> = {
  order_approved: "পেমেন্ট অনুমোদন", order_rejected: "পেমেন্ট বাতিল", order_pending: "অর্ডার পেন্ডিং",
  item_created: "প্রোডাক্ট/কোর্স তৈরি", item_updated: "প্রোডাক্ট/কোর্স আপডেট", item_deleted: "প্রোডাক্ট/কোর্স মুছে ফেলা",
  price_changed: "দাম পরিবর্তন", item_published: "প্রকাশ", settings_changed: "সেটিংস পরিবর্তন",
  role_insert: "রোল যোগ", role_update: "রোল পরিবর্তন", role_delete: "রোল সরানো",
};

export function AuditPanel() {
  const logs = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  if (!logs.data?.length) return <p className="text-sm text-muted-foreground">{logs.isLoading ? "লোড হচ্ছে..." : "এখনো কোনো রেকর্ড নেই।"}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-muted/60 text-left text-subtle-foreground">
          <tr className="border-b border-border"><th className="p-3">সময়</th><th className="p-3">কাজ</th><th className="p-3">লক্ষ্য</th><th className="p-3">বিস্তারিত</th></tr>
        </thead>
        <tbody>
          {logs.data.map((l) => (
            <tr key={l.id} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap p-3">{new Date(l.created_at).toLocaleString("bn-BD")}</td>
              <td className="p-3 font-medium text-foreground">{actionLabels[l.action] ?? l.action}</td>
              <td className="p-3">{l.target}</td>
              <td className="p-3 text-xs text-muted-foreground">{JSON.stringify(l.metadata)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- অ্যানালিটিক্স ---------------- */
export function AnalyticsPanel() {
  const [days, setDays] = useState(30);
  const orders = useQuery({
    queryKey: ["analytics-orders"],
    queryFn: async () => (await supabase.from("orders").select("amount,status,payment_method,item_name,item_type,created_at").order("created_at", { ascending: false }).limit(5000)).data ?? [],
  });
  const since = Date.now() - days * 86400000;
  const rows = (orders.data ?? []).filter((o) => new Date(o.created_at).getTime() >= since);
  const approved = rows.filter((o) => o.status === "approved");
  const revenue = approved.reduce((s, o) => s + o.amount, 0);
  const byDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) byDay.set(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), 0);
  approved.forEach((o) => { const d = o.created_at.slice(0, 10); if (byDay.has(d)) byDay.set(d, byDay.get(d)! + o.amount); });
  const max = Math.max(1, ...byDay.values());
  const top = new Map<string, { n: number; amt: number }>();
  approved.forEach((o) => { const t = top.get(o.item_name) ?? { n: 0, amt: 0 }; top.set(o.item_name, { n: t.n + 1, amt: t.amt + o.amount }); });
  const topList = [...top.entries()].sort((a, b) => b[1].amt - a[1].amt).slice(0, 8);
  const methods = ["bkash", "rocket", "nagad", "bank"].map((m) => ({ m, n: approved.filter((o) => o.payment_method === m).length }));
  const methodLabel: Record<string, string> = { bkash: "বিকাশ", rocket: "রকেট", nagad: "নগদ", bank: "ব্যাংক" };
  const fmt = (n: number) => `৳${n.toLocaleString("bn-BD")}`;
  const approvalRate = rows.length ? Math.round((approved.length / rows.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90, 365].map((d) => <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>{d === 365 ? "১ বছর" : `${d.toLocaleString("bn-BD")} দিন`}</Button>)}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["আয়", fmt(revenue)], ["অনুমোদিত অর্ডার", approved.length.toLocaleString("bn-BD")], ["গড় অর্ডার মূল্য", fmt(approved.length ? Math.round(revenue / approved.length) : 0)], ["অনুমোদনের হার", `${approvalRate.toLocaleString("bn-BD")}%`]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-xl font-extrabold text-foreground">{v}</p></div>
        ))}
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-bold text-foreground">দৈনিক আয়</p>
        <div className="flex h-40 items-end gap-[2px] overflow-x-auto">
          {[...byDay.entries()].map(([d, v]) => (
            <div key={d} title={`${d}: ${fmt(v)}`} className="min-w-[4px] flex-1 rounded-t bg-primary/80" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-bold text-foreground">সেরা বিক্রিত আইটেম</p>
          {topList.length === 0 ? <p className="text-sm text-muted-foreground">এই সময়ে কোনো বিক্রি নেই।</p> : (
            <ul className="space-y-2 text-sm">{topList.map(([name, t]) => <li key={name} className="flex justify-between gap-3"><span className="truncate">{name}</span><span className="shrink-0 font-semibold">{t.n.toLocaleString("bn-BD")} টি • {fmt(t.amt)}</span></li>)}</ul>
          )}
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-bold text-foreground">পেমেন্ট মাধ্যম</p>
          <div className="space-y-3">
            {methods.map(({ m, n }) => (
              <div key={m}>
                <div className="flex justify-between text-sm"><span>{methodLabel[m]}</span><span className="font-semibold">{n.toLocaleString("bn-BD")}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${approved.length ? (n / approved.length) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- বিক্রয় চ্যানেল (Outlets) ---------------- */
export function OutletsPanel() {
  const qc = useQueryClient();
  const outlets = useQuery({ queryKey: ["outlets"], queryFn: async () => (await supabase.from("outlets").select("*").order("sort_order")).data ?? [] });
  const orders = useQuery({ queryKey: ["outlet-orders"], queryFn: async () => (await supabase.from("orders").select("outlet_slug,amount,status,item_name").limit(5000)).data ?? [] });
  const [sel, setSel] = useState<string | null>(null);
  const [name, setName] = useState(""); const [slug, setSlug] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const summary = (os: string) => {
    const rows = (orders.data ?? []).filter((o) => (o.outlet_slug || "website") === os);
    const ok = rows.filter((o) => o.status === "approved");
    return { orders: rows.length, sold: ok.length, revenue: ok.reduce((t, o) => t + o.amount, 0), pending: rows.filter((o) => o.status === "pending").length };
  };

  async function add() {
    const sl = slug.trim().toLowerCase();
    if (!name.trim() || !/^[a-z0-9-]{2,40}$/.test(sl)) { toast.error("নাম ও ইংরেজি ছোট হাতের স্লাগ দিন (যেমন: tiktok)"); return; }
    const { error } = await supabase.from("outlets").insert({ name: name.trim(), slug: sl, sort_order: (outlets.data?.length ?? 0) });
    if (error) toast.error("যোগ করা যায়নি — স্লাগ আগে ব্যবহার হয়ে থাকতে পারে"); else { setName(""); setSlug(""); qc.invalidateQueries({ queryKey: ["outlets"] }); }
  }
  async function toggle(id: string, active: boolean) {
    await supabase.from("outlets").update({ active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["outlets"] });
  }
  async function remove(id: string) {
    if (!confirm("এই আউটলেট মুছে ফেলবেন?")) return;
    await supabase.from("outlets").delete().eq("id", id);
    setSel(null); qc.invalidateQueries({ queryKey: ["outlets"] });
  }

  const current = (outlets.data ?? []).find((o) => o.id === sel);
  const fmt = (n: number) => `৳${n.toLocaleString("bn-BD")}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">বিক্রয় চ্যানেল (আউটলেট)</h2>
        <p className="text-sm text-muted-foreground">প্রতিটি আউটলেটের নিজস্ব লিংক, প্রোডাক্ট, দাম ও বিক্রির হিসাব। আউটলেট লিংক দিয়ে আসা গ্রাহক সেই আউটলেটের দামে কিনবে।</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(outlets.data ?? []).map((o) => {
          const sm = summary(o.slug);
          return (
            <button key={o.id} onClick={() => setSel(o.id)} className={`rounded-xl border p-4 text-left transition-shadow hover:shadow-lift ${sel === o.id ? "border-primary bg-primary-soft/40" : "border-border"}`}>
              <div className="flex items-center justify-between gap-2"><p className="font-semibold">{o.name}</p><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.active ? "bg-primary-soft text-primary-soft-foreground" : "bg-muted text-muted-foreground"}`}>{o.active ? "চালু" : "বন্ধ"}</span></div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-muted-foreground">আয়</p><p className="font-bold">{fmt(sm.revenue)}</p></div>
                <div><p className="text-muted-foreground">বিক্রি</p><p className="font-bold">{sm.sold.toLocaleString("bn-BD")}</p></div>
                <div><p className="text-muted-foreground">অপেক্ষমাণ</p><p className="font-bold">{sm.pending.toLocaleString("bn-BD")}</p></div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3 sm:flex-row">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="নতুন আউটলেটের নাম (যেমন: TikTok)" />
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="স্লাগ (যেমন: tiktok)" className="sm:max-w-[180px]" />
        <Button onClick={add}>আউটলেট যোগ করুন</Button>
      </div>
      {current && <OutletDetail outlet={current} origin={origin} onToggle={toggle} onRemove={remove} />}
    </div>
  );
}

function OutletDetail({ outlet, origin, onToggle, onRemove }: { outlet: { id: string; slug: string; name: string; active: boolean }; origin: string; onToggle: (id: string, a: boolean) => void; onRemove: (id: string) => void }) {
  const qc = useQueryClient();
  const items = useQuery({ queryKey: ["outlet-all-items"], queryFn: async () => (await supabase.from("items").select("id,kind,slug,name,price,published").order("sort_order")).data ?? [] });
  const links = useQuery({ queryKey: ["outlet-items", outlet.id], queryFn: async () => (await supabase.from("outlet_items").select("*").eq("outlet_id", outlet.id)).data ?? [] });
  const [prices, setPrices] = useState<Record<string, string>>({});
  useEffect(() => { setPrices(Object.fromEntries((links.data ?? []).map((l) => [l.item_id, String(l.price)]))); }, [links.data]);
  const link = `${origin}/?outlet=${outlet.slug}`;

  async function saveItem(itemId: string, active: boolean) {
    const price = Number(prices[itemId]);
    if (!Number.isInteger(price) || price < 0) { toast.error("সঠিক দাম দিন"); return; }
    const { error } = await supabase.from("outlet_items").upsert({ outlet_id: outlet.id, item_id: itemId, price, active }, { onConflict: "outlet_id,item_id" });
    if (error) toast.error("সেভ হয়নি"); else { toast.success("সেভ হয়েছে"); qc.invalidateQueries({ queryKey: ["outlet-items", outlet.id] }); }
  }
  async function removeItem(itemId: string) {
    await supabase.from("outlet_items").delete().eq("outlet_id", outlet.id).eq("item_id", itemId);
    qc.invalidateQueries({ queryKey: ["outlet-items", outlet.id] });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-bold text-foreground">{outlet.name}</p>
          <p className="truncate text-xs text-muted-foreground">{link}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("লিংক কপি হয়েছে"); }}>লিংক কপি</Button>
          <label className="flex items-center gap-2 text-sm"><Switch checked={outlet.active} onCheckedChange={(c) => onToggle(outlet.id, c)} />চালু</label>
          <Button size="sm" variant="outline" onClick={() => onRemove(outlet.id)}>মুছুন</Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">দাম খালি রাখলে বা যোগ না করলে সাধারণ দাম প্রযোজ্য হবে।</p>
      <div className="space-y-2">
        {(items.data ?? []).map((it) => {
          const l = (links.data ?? []).find((x) => x.item_id === it.id);
          return (
            <div key={it.id} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.name}{!it.published && <span className="ml-2 text-xs text-muted-foreground">(অপ্রকাশিত)</span>}</p>
                <p className="text-xs text-muted-foreground">সাধারণ দাম: ৳{it.price.toLocaleString("bn-BD")}{l ? ` • আউটলেটে ${l.active ? "চালু" : "বন্ধ"}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} className="h-9 w-28" placeholder="আউটলেট দাম" value={prices[it.id] ?? ""} onChange={(e) => setPrices({ ...prices, [it.id]: e.target.value })} />
                <Button size="sm" onClick={() => saveItem(it.id, true)}>সেভ</Button>
                {l && <Button size="sm" variant="outline" onClick={() => (l.active ? saveItem(it.id, false) : removeItem(it.id))}>{l.active ? "বন্ধ" : "সরান"}</Button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- স্টোরফ্রন্ট সেটিংস ---------------- */
export function StorefrontPanel() {
  const qc = useQueryClient();
  const sf = useQuery({ queryKey: ["setting", "storefront"], queryFn: async () => (await supabase.from("site_settings").select("value").eq("key", "storefront").maybeSingle()).data?.value as StorefrontSettings | undefined });
  const [v, setV] = useState<StorefrontSettings>(defaultStorefront);
  useEffect(() => { if (sf.data) setV({ ...defaultStorefront, ...sf.data }); }, [sf.data]);
  const set = (k: keyof StorefrontSettings, val: string | boolean) => setV({ ...v, [k]: val });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">স্টোরফ্রন্ট সেটিংস</h2>
        <p className="text-sm text-muted-foreground">হোমপেজে গ্রাহকরা যা দেখবে তা এখান থেকে বদলান।</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ঘোষণা বার (খালি রাখলে দেখাবে না)" value={v.announcement} onChange={(x) => set("announcement", x)} />
        <Field label="হিরো ব্যাজ" value={v.badge} onChange={(x) => set("badge", x)} />
        <Field label="প্রধান শিরোনাম" value={v.title} onChange={(x) => set("title", x)} />
        <Field label="শিরোনামের রঙিন অংশ" value={v.highlight} onChange={(x) => set("highlight", x)} />
        <div className="sm:col-span-2"><Field label="সাব-টাইটেল" multiline value={v.subtitle} onChange={(x) => set("subtitle", x)} /></div>
        {([1, 2, 3] as const).map((i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <Field label={`পরিসংখ্যান ${i} — লেবেল`} value={v[`stat${i}_label`]} onChange={(x) => set(`stat${i}_label`, x)} />
            <Field label="মান" value={v[`stat${i}_value`]} onChange={(x) => set(`stat${i}_value`, x)} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-6">
        {([["show_products", "জনপ্রিয় প্রোডাক্ট সেকশন"], ["show_courses", "কোর্স সেকশন"], ["show_stories", "সাফল্যের গল্প সেকশন"]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center gap-2 text-sm"><Switch checked={v[k]} onCheckedChange={(c) => set(k, c)} />{l}</label>
        ))}
      </div>
      <Button onClick={async () => { await save("storefront", v); qc.invalidateQueries({ queryKey: ["setting", "storefront"] }); }}>সেভ করুন</Button>
    </div>
  );
}

/* ---------------- অ্যাক্সেস নিরাপত্তা ---------------- */
export function SecurityPanel() {
  const qc = useQueryClient();
  const logs = useQuery({
    queryKey: ["access-logs"],
    queryFn: async () => (await supabase.from("access_logs").select("*").order("created_at", { ascending: false }).limit(300)).data ?? [],
  });
  const devices = useQuery({
    queryKey: ["user-devices"],
    queryFn: async () => (await supabase.from("user_devices").select("*").order("last_seen", { ascending: false }).limit(500)).data ?? [],
  });
  // Suspicious: users with many distinct IPs in last 7 days or blocked attempts
  const week = Date.now() - 7 * 86400000;
  const perUser = new Map<string, { ips: Set<string>; blocked: number }>();
  (logs.data ?? []).filter((l) => new Date(l.created_at).getTime() > week).forEach((l) => {
    const u = perUser.get(l.user_id) ?? { ips: new Set(), blocked: 0 };
    if (l.ip) u.ips.add(l.ip);
    if (l.blocked) u.blocked++;
    perUser.set(l.user_id, u);
  });
  const suspicious = [...perUser.entries()].filter(([, u]) => u.ips.size >= 4 || u.blocked > 0);

  async function removeDevice(id: string) {
    const { error } = await supabase.from("user_devices").delete().eq("id", id);
    if (error) toast.error("সরানো যায়নি"); else { toast.success("ডিভাইস সরানো হয়েছে"); qc.invalidateQueries({ queryKey: ["user-devices"] }); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">অ্যাক্সেস নিরাপত্তা</h2>
        <p className="text-sm text-muted-foreground">প্রতিটি অ্যাকাউন্ট সর্বোচ্চ ২টি ডিভাইসে ব্যবহার করা যায়। সন্দেহজনক অ্যাকাউন্টের অর্ডার বাতিল করলে অ্যাক্সেস সাথে সাথে বন্ধ হয়ে যাবে।</p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="mb-2 text-sm font-bold text-foreground">সন্দেহজনক অ্যাকাউন্ট (গত ৭ দিন)</p>
        {suspicious.length === 0 ? <p className="text-sm text-muted-foreground">কোনো সন্দেহজনক কার্যকলাপ নেই।</p> : (
          <ul className="space-y-1 text-sm">{suspicious.map(([uid, u]) => <li key={uid} className="break-all"><b>{uid.slice(0, 8)}</b> — {u.ips.size.toLocaleString("bn-BD")}টি ভিন্ন IP, {u.blocked.toLocaleString("bn-BD")}টি ব্লক হওয়া চেষ্টা</li>)}</ul>
        )}
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">নিবন্ধিত ডিভাইস</p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/60 text-left text-subtle-foreground"><tr className="border-b border-border"><th className="p-3">গ্রাহক</th><th className="p-3">ডিভাইস</th><th className="p-3">IP</th><th className="p-3">শেষ ব্যবহার</th><th className="p-3"></th></tr></thead>
            <tbody>
              {(devices.data ?? []).map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono text-xs">{d.user_id.slice(0, 8)}</td>
                  <td className="max-w-[240px] truncate p-3 text-xs">{d.user_agent || "—"}</td>
                  <td className="p-3 text-xs">{d.ip || "—"}</td>
                  <td className="whitespace-nowrap p-3 text-xs">{new Date(d.last_seen).toLocaleString("bn-BD")}</td>
                  <td className="p-3"><Button size="sm" variant="outline" onClick={() => removeDevice(d.id)}>সরান</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">সাম্প্রতিক অ্যাক্সেস</p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/60 text-left text-subtle-foreground"><tr className="border-b border-border"><th className="p-3">সময়</th><th className="p-3">গ্রাহক</th><th className="p-3">আইটেম</th><th className="p-3">IP</th><th className="p-3">অবস্থা</th></tr></thead>
            <tbody>
              {(logs.data ?? []).map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap p-3 text-xs">{new Date(l.created_at).toLocaleString("bn-BD")}</td>
                  <td className="p-3 font-mono text-xs">{l.user_id.slice(0, 8)}</td>
                  <td className="p-3 text-xs">{l.item_slug}</td>
                  <td className="p-3 text-xs">{l.ip || "—"}</td>
                  <td className="p-3 text-xs">{l.blocked ? <span className="font-semibold text-destructive">ব্লক</span> : "অনুমোদিত"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
