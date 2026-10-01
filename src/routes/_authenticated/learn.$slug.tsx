import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle } from "lucide-react";
import { getDeviceId } from "@/lib/device";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Lock } from "lucide-react";
import { getCourseContent, getLessonStream } from "@/lib/orders.functions";
import { SecurePlayer } from "@/components/site/SecurePlayer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/learn/$slug")({
  validateSearch: z.object({ kind: z.enum(["product", "course"]).optional() }),
  head: () => ({
    meta: [
      { title: "ক্লাসরুম — NENO-VERSE" },
      { name: "description", content: "আপনার কেনা কোর্সের ভিডিও দেখুন।" },
      { property: "og:title", content: "ক্লাসরুম — NENO-VERSE" },
      { property: "og:description", content: "কোর্সের ভিডিও।" },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const { slug } = Route.useParams();
  const { kind = "course" } = Route.useSearch();
  const fetchContent = useServerFn(getCourseContent);
  const q = useQuery({ queryKey: ["content", kind, slug], queryFn: () => fetchContent({ data: { kind, slug } }) });
  const [idx, setIdx] = useState(0);
  const fetchStream = useServerFn(getLessonStream);
  const lessonId = q.data?.hasAccess ? q.data.lessons[idx]?.id : undefined;
  const stream = useQuery({
    queryKey: ["stream", lessonId],
    queryFn: () => fetchStream({ data: { lessonId: lessonId!, deviceId: getDeviceId() } }),
    enabled: !!lessonId,
    staleTime: 4 * 60_000, // signed links last 5 min; refetch before expiry
    gcTime: 0,
  });

  const progress = useQuery({
    queryKey: ["progress", slug],
    enabled: !!q.data?.hasAccess,
    queryFn: async () => {
      const ids = q.data?.hasAccess ? q.data.lessons.map((l) => l.id) : [];
      if (!ids.length) return [] as string[];
      return ((await supabase.from("lesson_progress").select("lesson_id").in("lesson_id", ids)).data ?? []).map((r) => r.lesson_id);
    },
  });

  if (q.isLoading) return <p className="py-24 text-center text-muted-foreground">লোড হচ্ছে...</p>;
  if (!q.data?.hasAccess) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Lock className="mx-auto size-10 text-primary" />
        <p className="mt-4 text-muted-foreground">এই কনটেন্টে আপনার অ্যাক্সেস চালু নেই বা মেয়াদ শেষ হয়েছে।</p>
        <Button asChild className="mt-6"><Link to="/dashboard">ড্যাশবোর্ডে ফিরুন</Link></Button>
      </div>
    );
  }
  const { lessons, name, note } = q.data;
  const current = lessons[idx];
  const done = new Set(progress.data ?? []);
  const doneCount = lessons.filter((l) => done.has(l.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const groups: { title: string; items: { l: (typeof lessons)[number]; i: number }[] }[] = [];
  lessons.forEach((l, i) => {
    const last = groups.at(-1);
    if (last && last.title === l.module) last.items.push({ l, i });
    else groups.push({ title: l.module, items: [{ l, i }] });
  });
  async function toggleDone() {
    if (!current) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (done.has(current.id)) await supabase.from("lesson_progress").delete().eq("lesson_id", current.id).eq("user_id", u.user.id);
    else {
      await supabase.from("lesson_progress").insert({ lesson_id: current.id, user_id: u.user.id });
      if (idx < lessons.length - 1) setIdx(idx + 1);
    }
    progress.refetch();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="aspect-video overflow-hidden rounded-2xl bg-foreground">
          {stream.data?.kind === "blocked" ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-background">{stream.data.reason}</div>
          ) : (
          <SecurePlayer
            source={stream.data ?? null}
            title={current?.title ?? ""}
            emptyText={!lessons.length ? "এখনো কোনো ক্লাস যুক্ত হয়নি" : stream.isLoading ? "লোড হচ্ছে..." : "এই ক্লাসের ভিডিও শীঘ্রই যুক্ত হবে"}
            onExpired={() => stream.refetch()}
          />
          )}
        </div>
        {current && (
          <>
            <p className="mt-4 text-xs text-subtle-foreground">{current.module}</p>
            <h1 className="text-2xl font-extrabold text-foreground">{current.title}</h1>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>আগের ক্লাস</Button>
          <Button disabled={idx >= lessons.length - 1} onClick={() => setIdx(idx + 1)}>পরের ক্লাস</Button>
          {current && (
            <Button variant={done.has(current.id) ? "outline" : "secondary"} onClick={toggleDone}>
              <CheckCircle2 className="size-4" /> {done.has(current.id) ? "সম্পন্ন (বাতিল করুন)" : "সম্পন্ন হিসেবে চিহ্নিত করুন"}
            </Button>
          )}
        </div>
        {note && <p className="mt-6 whitespace-pre-line rounded-xl bg-muted p-4 text-sm text-muted-foreground">{note}</p>}
      </div>
      <aside className="surface-card h-fit max-h-[75vh] overflow-auto p-3 lg:sticky lg:top-20">
        <h2 className="px-2 pt-2 font-bold text-foreground">{name}</h2>
        <div className="px-2 pb-3 pt-2">
          <div className="flex justify-between text-xs text-muted-foreground"><span>অগ্রগতি</span><span>{doneCount.toLocaleString("bn-BD")}/{lessons.length.toLocaleString("bn-BD")} • {pct.toLocaleString("bn-BD")}%</span></div>
          <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
        {groups.map((g, gi) => (
          <div key={gi} className="mb-2">
            <p className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs font-bold text-foreground">
              <span>মডিউল {(gi + 1).toLocaleString("bn-BD")}: {g.title || "সাধারণ"}</span>
              <span className="font-normal text-muted-foreground">{g.items.filter((x) => done.has(x.l.id)).length.toLocaleString("bn-BD")}/{g.items.length.toLocaleString("bn-BD")}</span>
            </p>
            {g.items.map(({ l, i }) => (
              <button
                key={l.id}
                onClick={() => setIdx(i)}
                className={`mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${i === idx ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {done.has(l.id) ? <CheckCircle2 className="size-4 shrink-0 text-primary" /> : <Circle className="size-4 shrink-0" />}
                <span className="flex-1">{l.title}</span>
                <span className="shrink-0 text-xs">{l.duration}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>
    </div>
  );
}
