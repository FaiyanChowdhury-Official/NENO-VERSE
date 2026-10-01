import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { waNumber } from "@/components/site/ContactForm";

export function ContactsPanel() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => (await supabase.from("contact_messages").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  async function mark(id: string, status: string) {
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
    if (error) toast.error("বদলানো যায়নি"); else qc.invalidateQueries({ queryKey: ["contact-messages"] });
  }
  const rows = q.data ?? [];
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">সাপোর্ট পেজের ফর্ম থেকে আসা বার্তা। সেটিংসে WhatsApp নম্বর দিলে গ্রাহকের বার্তা সেই নম্বরেও পাঠানো হয়।</p>
      {q.isLoading && <p className="text-muted-foreground">লোড হচ্ছে...</p>}
      {!q.isLoading && rows.length === 0 && <p className="text-sm text-muted-foreground">কোনো বার্তা নেই।</p>}
      {rows.map((m) => (
        <div key={m.id} className="surface-card p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{m.name} <span className="text-sm font-normal text-muted-foreground">• {m.phone}</span></p>
              <p className="text-xs text-subtle-foreground">{new Date(m.created_at).toLocaleString("bn-BD")} • {m.status === "new" ? "নতুন" : "সম্পন্ন"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{m.message}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild size="sm" variant="outline"><a href={`https://wa.me/${waNumber(m.phone)}`} target="_blank" rel="noopener noreferrer">WhatsApp-এ উত্তর</a></Button>
              <Button size="sm" variant={m.status === "new" ? "default" : "outline"} onClick={() => mark(m.id, m.status === "new" ? "done" : "new")}>{m.status === "new" ? "সম্পন্ন" : "নতুন করুন"}</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
