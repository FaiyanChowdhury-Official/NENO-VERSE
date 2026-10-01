import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSetting, type GeneralSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function waNumber(n: string) {
  const d = n.replace(/\D/g, "");
  return d.startsWith("0") ? `88${d}` : d;
}

export function ContactForm() {
  const gen = useSetting<GeneralSettings>("general");
  const [f, setF] = useState({ name: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = f.name.trim(), phone = f.phone.trim(), message = f.message.trim();
    if (!name || phone.length < 6 || !message) return toast.error("নাম, ফোন ও বার্তা দিন");
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({ name: name.slice(0, 100), phone: phone.slice(0, 20), message: message.slice(0, 2000) });
    setBusy(false);
    if (error) return toast.error("পাঠানো যায়নি, আবার চেষ্টা করুন");
    toast.success("বার্তা পাঠানো হয়েছে");
    const wa = gen.data?.whatsapp;
    if (wa) {
      const text = `নতুন যোগাযোগ\nনাম: ${name}\nফোন: ${phone}\n${message}`;
      window.open(`https://wa.me/${waNumber(wa)}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }
    setF({ name: "", phone: "", message: "" });
  }

  return (
    <form onSubmit={submit} className="surface-card mt-8 space-y-3 p-6">
      <h2 className="font-semibold text-foreground">আমাদের বার্তা পাঠান</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="আপনার নাম" maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input placeholder="ফোন / WhatsApp নম্বর" maxLength={20} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </div>
      <Textarea rows={4} maxLength={2000} placeholder="কী জানতে চান লিখুন" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      <Button type="submit" disabled={busy} className="rounded-full">{busy ? "পাঠানো হচ্ছে..." : "পাঠান (WhatsApp-এও যাবে)"}</Button>
    </form>
  );
}
