import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSetting, type GeneralSettings, type PaymentSettings } from "@/lib/settings";
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
  useEffect(() => { if (pay.data) setP(pay.data); }, [pay.data]);
  useEffect(() => { if (gen.data) setG(gen.data); }, [gen.data]);
  if (!p || !g) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;

  const up = <K extends keyof PaymentSettings>(k: K, patch: Partial<PaymentSettings[K]>) => setP({ ...p, [k]: { ...p[k], ...patch } });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">পেমেন্ট সেটিংস</h2>
        <p className="text-sm text-muted-foreground">চেকআউট পেজে গ্রাহকরা এখানকার তথ্যই দেখবেন।</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {(["bkash", "rocket"] as const).map((k) => (
            <div key={k} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between"><p className="font-semibold">{k === "bkash" ? "বিকাশ" : "রকেট"}</p><Switch checked={p[k].enabled} onCheckedChange={(v) => up(k, { enabled: v })} /></div>
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
        <h2 className="text-lg font-bold text-foreground">সাধারণ ও সোশ্যাল</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["site_name", "ওয়েবসাইটের নাম"], ["phone", "ফোন"], ["email", "ইমেইল"], ["address", "ঠিকানা"],
            ["facebook", "Facebook লিংক"], ["youtube", "YouTube লিংক"], ["instagram", "Instagram লিংক"], ["whatsapp", "WhatsApp নম্বর"],
          ] as [keyof GeneralSettings, string][]).map(([k, l]) => (
            <Field key={k} label={l} value={g[k] ?? ""} onChange={(v) => setG({ ...g, [k]: v })} />
          ))}
        </div>
        <Button onClick={async () => { await save("general", g); qc.invalidateQueries({ queryKey: ["setting", "general"] }); }}>সেভ করুন</Button>
      </section>
    </div>
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
        {[["active", "চলমান"], ["all", "সব"], ...Object.entries(ticketStatusLabels)].map(([k, l]) => (
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
