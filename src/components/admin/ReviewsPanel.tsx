import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Star, Wand2, ThumbsUp, ThumbsDown, Lightbulb, Loader2, Download, MessageSquareReply, Copy } from "lucide-react";
import { toast } from "sonner";
import { analyzeReviews, draftReviewReply, type ReviewInsights } from "@/lib/review-insights.functions";
import {
  adminDeleteReview,
  adminDeleteStory,
  adminListReviews,
  adminListStories,
  adminSaveStory,
  adminSetReviewStatus,
} from "@/lib/admin.functions";
import { orderStatusLabels } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDelete, statusStyle, useAdminAction } from "./shared";

export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex text-primary">
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-4 ${i <= n ? "fill-current" : "opacity-30"}`} />)}
    </span>
  );
}

export function ReviewsPanel() {
  const list = useServerFn(adminListReviews);
  const setStatus = useServerFn(adminSetReviewStatus);
  const del = useServerFn(adminDeleteReview);
  const analyze = useServerFn(analyzeReviews);
  const run = useAdminAction();
  const reviews = useQuery({ queryKey: ["admin-reviews"], queryFn: () => list() });
  const keys = [["admin-reviews"], ["reviews"]];
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [insights, setInsights] = useState<ReviewInsights | null>(null);
  const [aiError, setAiError] = useState("");

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function runAnalysis() {
    setBusy(true); setAiError(""); setInsights(null);
    try {
      const r = await analyze({ data: { ids: selected.slice(0, 50) } });
      if (r.ok) setInsights(r.insights); else setAiError(r.error);
    } catch {
      setAiError("AI বিশ্লেষণ ব্যর্থ হয়েছে।");
    } finally {
      setBusy(false);
    }
  }

  if (reviews.isLoading) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;
  if (!reviews.data?.length) return <p className="text-muted-foreground">এখনো কোনো রিভিউ আসেনি। ক্রেতারা প্রোডাক্ট/কোর্স পেজ থেকে রিভিউ দিতে পারবেন।</p>;
  const all = reviews.data.map((r) => r.id);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-primary-soft/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-bold text-foreground"><Wand2 className="h-4 w-4 text-primary" /> AI রিভিউ বিশ্লেষণ</p>
            <p className="mt-0.5 text-xs text-muted-foreground">রিভিউ বেছে নিন — AI ভালো দিক, দুর্বল দিক ও উন্নতির পরামর্শ দেবে। (সর্বোচ্চ ৫০টি)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(selected.length === all.length ? [] : all)}>
              {selected.length === all.length ? "সব বাদ দিন" : "সব বাছুন"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportCsv(selected.length ? reviews.data!.filter((r) => selected.includes(r.id)) : reviews.data!)}>
              <Download className="h-4 w-4" /> CSV {selected.length ? `(${selected.length})` : "(সব)"}
            </Button>
            <Button size="sm" disabled={!selected.length || busy} onClick={runAnalysis}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              বিশ্লেষণ করুন ({selected.length})
            </Button>
          </div>
        </div>
        {busy && <p className="mt-3 text-sm text-muted-foreground">AI রিভিউগুলো পড়ছে...</p>}
        {aiError && <p className="mt-3 text-sm text-destructive">{aiError}</p>}
        {insights && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InsightCard title="ইতিবাচক দিক" icon={ThumbsUp} items={insights.positives} />
            <InsightCard title="নেতিবাচক দিক" icon={ThumbsDown} items={insights.negatives} />
            <InsightCard title="উন্নতির পরামর্শ" icon={Lightbulb} items={insights.suggestions} />
          </div>
        )}
      </div>

      {reviews.data.map((r) => (
        <div key={r.id} className="surface-card flex flex-col flex-wrap gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <label className="flex min-w-0 flex-1 cursor-pointer gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} aria-label="বিশ্লেষণের জন্য বাছুন" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><Stars n={r.rating} /><span className="font-semibold text-foreground">{r.reviewer_name}</span></div>
              <p className="mt-1 break-words text-sm text-foreground">{r.comment}</p>
              <p className="mt-1 break-words text-xs text-subtle-foreground">{r.item_type === "course" ? "কোর্স" : "প্রোডাক্ট"}: {r.item_slug} • {new Date(r.created_at).toLocaleDateString("bn-BD")}</p>
            </div>
          </label>
          <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[r.status]}`}>{r.status === "approved" ? "প্রকাশিত" : orderStatusLabels[r.status]}</span>
            {r.status !== "approved" && <Button size="sm" onClick={() => run(() => setStatus({ data: { id: r.id, status: "approved" } }), "প্রকাশিত হয়েছে", keys)}>প্রকাশ করুন</Button>}
            {r.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => run(() => setStatus({ data: { id: r.id, status: "rejected" } }), "লুকানো হয়েছে", keys)}>লুকান</Button>}
            <ConfirmDelete onConfirm={() => run(() => del({ data: { id: r.id } }), "মুছে ফেলা হয়েছে", keys)} />
          </div>
          <ReplyDraft id={r.id} />
        </div>
      ))}
    </div>
  );
}

function csvCell(v: unknown) {
  const t = String(v ?? "");
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

function exportCsv(rows: { reviewer_name: string; rating: number; comment: string; item_type: string; item_slug: string; status: string; created_at: string }[]) {
  const head = ["গ্রাহক", "রেটিং", "রিভিউ", "ধরন", "পণ্য", "স্ট্যাটাস", "তারিখ"];
  const lines = rows.map((r) => [r.reviewer_name, r.rating, r.comment, r.item_type === "course" ? "কোর্স" : "প্রোডাক্ট", r.item_slug, r.status, new Date(r.created_at).toISOString().slice(0, 10)].map(csvCell).join(","));
  const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `reviews-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function ReplyDraft({ id }: { id: string }) {
  const draft = useServerFn(draftReviewReply);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  async function go() {
    setBusy(true); setErr("");
    try {
      const r = await draft({ data: { id } });
      if (r.ok) setText(r.reply); else setErr(r.error);
    } catch { setErr("খসড়া তৈরি ব্যর্থ হয়েছে।"); }
    finally { setBusy(false); }
  }
  return (
    <div className="w-full basis-full pl-7">
      <Button size="sm" variant="ghost" className="text-primary" disabled={busy} onClick={go}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareReply className="h-4 w-4" />}
        {text ? "নতুন খসড়া" : "AI জবাবের খসড়া"}
      </Button>
      {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
      {text && (
        <div className="mt-2 space-y-2">
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(text); toast.success("কপি হয়েছে"); }}>
            <Copy className="h-4 w-4" /> কপি করুন
          </Button>
        </div>
      )}
    </div>
  );
}

function InsightCard({ title, icon: Icon, items }: { title: string; icon: typeof Star; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground"><Icon className="h-4 w-4 text-primary" />{title}</p>
      {items.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
      ) : <p className="mt-2 text-sm text-muted-foreground">কিছু পাওয়া যায়নি।</p>}
    </div>
  );
}

type Story = { id: string; name: string; role: string; story: string; image_url: string; rating: number; published: boolean; sort_order: number };

export function StoriesPanel() {
  const list = useServerFn(adminListStories);
  const del = useServerFn(adminDeleteStory);
  const run = useAdminAction();
  const stories = useQuery({ queryKey: ["admin-stories"], queryFn: () => list() });
  const [editing, setEditing] = useState<Story | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {(stories.data ?? []).map((s) => (
          <div key={s.id} className="surface-card flex flex-wrap items-start justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><Stars n={s.rating} /><span className="font-semibold text-foreground">{s.name}</span><span className="text-xs text-subtle-foreground">{s.role}</span></div>
              <p className="mt-1 text-sm text-muted-foreground">{s.story}</p>
              {!s.published && <p className="mt-1 text-xs font-semibold text-destructive">লুকানো</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(s)}>এডিট</Button>
              <ConfirmDelete onConfirm={() => run(() => del({ data: { id: s.id } }), "মুছে ফেলা হয়েছে", [["admin-stories"], ["stories"]])} />
            </div>
          </div>
        ))}
        {stories.data?.length === 0 && <p className="text-muted-foreground">কোনো গল্প নেই।</p>}
      </div>
      <StoryForm key={editing?.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />
    </div>
  );
}

function StoryForm({ initial, onDone }: { initial: Story | null; onDone: () => void }) {
  const save = useServerFn(adminSaveStory);
  const run = useAdminAction();
  const [published, setPublished] = useState(initial?.published ?? true);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await run(
      () =>
        save({
          data: {
            ...(initial && { id: initial.id }),
            name: String(f.get("name")),
            role: String(f.get("role")),
            story: String(f.get("story")),
            image_url: String(f.get("image")),
            rating: Number(f.get("rating")),
            published,
            sort_order: Number(f.get("sort") || 0),
          },
        }),
      "সংরক্ষণ হয়েছে",
      [["admin-stories"], ["stories"]],
    );
    if (ok) {
      (e.target as HTMLFormElement).reset();
      onDone();
    }
  }
  return (
    <form onSubmit={onSubmit} className="surface-card h-fit space-y-3 p-5">
      <h3 className="font-bold text-foreground">{initial ? "গল্প এডিট করুন" : "নতুন সাফল্যের গল্প"}</h3>
      <Input name="name" placeholder="গ্রাহকের নাম" defaultValue={initial?.name} required />
      <Input name="role" placeholder="পেশা ও এলাকা (যেমন: ফ্রিল্যান্সার, ঢাকা)" defaultValue={initial?.role} />
      <Textarea name="story" rows={4} placeholder="তাদের কথা..." defaultValue={initial?.story} required />
      <Input name="image" placeholder="ছবির লিংক (ঐচ্ছিক)" defaultValue={initial?.image_url} />
      <div className="flex gap-2">
        <select name="rating" defaultValue={initial?.rating ?? 5} className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} স্টার</option>)}
        </select>
        <Input name="sort" type="number" placeholder="ক্রম" defaultValue={initial?.sort_order ?? 0} className="w-24" />
      </div>
      <label className="flex items-center gap-2 text-sm"><Switch checked={published} onCheckedChange={setPublished} /> হোমপেজে দেখান</label>
      <div className="flex gap-2">
        <Button type="submit">{initial ? "সংরক্ষণ" : "যোগ করুন"}</Button>
        {initial && <Button type="button" variant="ghost" onClick={onDone}>বাতিল</Button>}
      </div>
    </form>
  );
}
