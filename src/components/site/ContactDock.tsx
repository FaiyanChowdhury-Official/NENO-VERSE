import { useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, X, Bot, Loader2 } from "lucide-react";
import { useSetting, type GeneralSettings } from "@/lib/settings";
import { askAssistant } from "@/lib/assistant.functions";

type Msg = { role: "user" | "assistant"; content: string };

export function contactLinks(g: Partial<GeneralSettings> | null | undefined) {
  if (!g) return [];
  const wa = (g.whatsapp ?? "").replace(/\D/g, "");
  const tg = (g.telegram ?? "").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");
  return [
    wa && { name: "WhatsApp", href: `https://wa.me/${wa.startsWith("0") ? "88" + wa : wa}` },
    tg && { name: "Telegram", href: `https://t.me/${tg}` },
    g.messenger && { name: "Messenger", href: g.messenger },
  ].filter(Boolean) as { name: string; href: string }[];
}

export function ContactDock() {
  const gen = useSetting<GeneralSettings>("general");
  const links = contactLinks(gen.data);
  const [open, setOpen] = useState<"none" | "chat" | "contact">("none");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "আসসালামু আলাইকুম! কোর্স, প্রোডাক্ট, দাম বা কেনার নিয়ম নিয়ে যেকোনো প্রশ্ন করুন।" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(askAssistant);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (open === "chat") inputRef.current?.focus(); }, [open, busy]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const q = input.trim().slice(0, 2000);
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await ask({ data: { messages: next.slice(1).slice(-20) } });
      setMsgs([...next, { role: "assistant", content: r.ok ? r.reply : r.error }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "উত্তর আনা যায়নি, আবার চেষ্টা করুন।" }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open === "chat" && (
        <div className="flex h-[min(520px,75vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <p className="flex items-center gap-2 text-sm font-bold"><Bot className="h-4 w-4" /> NENO-VERSE সহকারী</p>
            <button onClick={() => setOpen("none")} aria-label="বন্ধ করুন"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "text-foreground"}`}>{m.content}</div>
            ))}
            {busy && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> লিখছে...</p>}
            <div ref={endRef} />
          </div>
          {links.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2 text-xs">
              <span className="text-muted-foreground">মানুষের সাথে কথা বলুন:</span>
              {links.map((l) => <a key={l.name} href={l.href} target="_blank" rel="noreferrer" className="font-semibold text-primary">{l.name}</a>)}
            </div>
          )}
          <form onSubmit={send} className="flex gap-2 border-t border-border p-2">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} placeholder="প্রশ্ন লিখুন..." className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" disabled={busy || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50" aria-label="পাঠান"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
      {open === "contact" && links.length > 0 && (
        <div className="w-56 space-y-1 rounded-2xl border border-border bg-card p-2 shadow-lift">
          {links.map((l) => <a key={l.name} href={l.href} target="_blank" rel="noreferrer" className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">{l.name}-এ যোগাযোগ</a>)}
        </div>
      )}
      <div className="flex gap-2">
        {links.length > 0 && (
          <button onClick={() => setOpen(open === "contact" ? "none" : "contact")} className="flex h-12 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-lift" aria-label="যোগাযোগ">
            <MessageCircle className="h-5 w-5 text-primary" /> যোগাযোগ
          </button>
        )}
        <button onClick={() => setOpen(open === "chat" ? "none" : "chat")} className="flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lift" aria-label="সহকারীকে জিজ্ঞাসা করুন">
          <Bot className="h-5 w-5" /> প্রশ্ন করুন
        </button>
      </div>
    </div>
  );
}
