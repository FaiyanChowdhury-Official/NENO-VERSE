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
      { title: "ক্লাসরুম — অক্টোপাস" },
      { name: "description", content: "আপনার কেনা কোর্সের ভিডিও দেখুন।" },
      { property: "og:title", content: "ক্লাসরুম — অক্টোপাস" },
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
        <div className="mt-4 flex gap-2">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>আগের ক্লাস</Button>
          <Button disabled={idx >= lessons.length - 1} onClick={() => setIdx(idx + 1)}>পরের ক্লাস</Button>
        </div>
        {note && <p className="mt-6 whitespace-pre-line rounded-xl bg-muted p-4 text-sm text-muted-foreground">{note}</p>}
      </div>
      <aside className="surface-card h-fit max-h-[70vh] overflow-auto p-3">
        <h2 className="px-2 py-2 font-bold text-foreground">{name}</h2>
        {lessons.map((l, i) => (
          <button
            key={l.id}
            onClick={() => setIdx(i)}
            className={`flex w-full justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${i === idx ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <span>{l.title}</span>
            <span className="shrink-0 text-xs">{l.duration}</span>
          </button>
        ))}
      </aside>
    </div>
  );
}
