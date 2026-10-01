import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const ticketStatusLabels: Record<string, string> = {
  open: "খোলা", in_progress: "কাজ চলছে", waiting_user: "আপনার উত্তরের অপেক্ষায়", resolved: "সমাধান হয়েছে", closed: "বন্ধ",
};
export const ticketCategories: Record<string, string> = {
  payment: "পেমেন্ট", access: "অ্যাক্সেস", course: "কোর্স", product: "প্রোডাক্ট", general: "সাধারণ",
};

export function TicketThread({ ticketId, staff }: { ticketId: string; staff: boolean }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const msgs = useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => (await supabase.from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at")).data ?? [],
  });
  async function send(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("ticket_messages").insert({ ticket_id: ticketId, author_id: u.user!.id, is_staff: staff, body: body.trim().slice(0, 5000) });
    setBusy(false);
    if (error) { toast.error("পাঠানো যায়নি"); return; }
    setBody("");
    qc.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
    qc.invalidateQueries({ queryKey: ["tickets"] });
  }
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {(msgs.data ?? []).map((m) => (
          <div key={m.id} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${m.is_staff ? "bg-primary-soft text-primary-soft-foreground" : "ml-auto bg-muted text-foreground"}`}>
            <p className="text-[11px] font-semibold opacity-70">{m.is_staff ? "সাপোর্ট টিম" : "গ্রাহক"} • {new Date(m.created_at).toLocaleString("bn-BD")}</p>
            <p className="mt-0.5 whitespace-pre-wrap break-words">{m.body}</p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row">
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="উত্তর লিখুন..." maxLength={5000} />
        <Button type="submit" disabled={busy} className="sm:self-end">পাঠান</Button>
      </form>
    </div>
  );
}

export function MySupportTickets() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tickets = useQuery({
    queryKey: ["tickets", "mine"],
    queryFn: async () => (await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false })).data ?? [],
  });

  async function create(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = String(f.get("subject") ?? "").trim();
    const message = String(f.get("message") ?? "").trim();
    const orderRaw = String(f.get("order") ?? "").trim();
    if (subject.length < 3 || message.length < 5) { toast.error("বিষয় ও বার্তা লিখুন"); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const isUuid = /^[0-9a-f-]{36}$/i.test(orderRaw);
    const { data: t, error } = await supabase.from("support_tickets")
      .insert({ user_id: u.user!.id, subject: subject.slice(0, 200), category: String(f.get("category")), order_id: isUuid ? orderRaw : null })
      .select("id").single();
    if (!error && t) await supabase.from("ticket_messages").insert({ ticket_id: t.id, author_id: u.user!.id, body: message.slice(0, 5000) });
    setBusy(false);
    if (error) { toast.error("টিকিট খোলা যায়নি"); return; }
    toast.success("টিকিট খোলা হয়েছে");
    (e.target as HTMLFormElement).reset();
    qc.invalidateQueries({ queryKey: ["tickets"] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <form onSubmit={create} className="surface-card space-y-3 p-5">
        <p className="font-bold text-foreground">নতুন সাপোর্ট টিকিট</p>
        <div className="space-y-1.5"><Label htmlFor="subject">বিষয়</Label><Input id="subject" name="subject" maxLength={200} required /></div>
        <div className="space-y-1.5">
          <Label htmlFor="category">ধরন</Label>
          <select id="category" name="category" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(ticketCategories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="order">অর্ডার আইডি (ঐচ্ছিক)</Label><Input id="order" name="order" maxLength={36} /></div>
        <div className="space-y-1.5"><Label htmlFor="message">বার্তা</Label><Textarea id="message" name="message" rows={4} maxLength={5000} required /></div>
        <Button type="submit" disabled={busy} className="w-full">{busy ? "পাঠানো হচ্ছে..." : "টিকিট খুলুন"}</Button>
      </form>
      <div className="space-y-3">
        {(tickets.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">এখনো কোনো টিকিট নেই।</p>}
        {(tickets.data ?? []).map((t) => (
          <div key={t.id} className="surface-card p-4">
            <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(open === t.id ? null : t.id)}>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{t.subject}</p>
                <p className="text-xs text-subtle-foreground">{ticketCategories[t.category] ?? t.category} • {new Date(t.updated_at).toLocaleDateString("bn-BD")}</p>
              </div>
              <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-soft-foreground">{ticketStatusLabels[t.status]}</span>
            </button>
            {open === t.id && <div className="mt-4 border-t border-border pt-4"><TicketThread ticketId={t.id} staff={false} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
