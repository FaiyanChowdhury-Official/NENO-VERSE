import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { PlayCircle, Lock } from "lucide-react";
import { getCourseContent } from "@/lib/orders.functions";
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

function embedUrl(url: string): { type: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return { type: "iframe", src: `https://drive.google.com/file/d/${gd[1]}/preview` };
  if (/\.(mp4|webm|m3u8)(\?|$)/i.test(url)) return { type: "video", src: url };
  return { type: "iframe", src: url };
}

function LearnPage() {
  const { slug } = Route.useParams();
  const { kind = "course" } = Route.useSearch();
  const fetchContent = useServerFn(getCourseContent);
  const q = useQuery({ queryKey: ["content", kind, slug], queryFn: () => fetchContent({ data: { kind, slug } }) });
  const [idx, setIdx] = useState(0);

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
  const media = current ? embedUrl(current.videoUrl) : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="aspect-video overflow-hidden rounded-2xl bg-foreground">
          {media?.type === "iframe" ? (
            <iframe key={media.src} src={media.src} title={current?.title} className="size-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          ) : media?.type === "video" ? (
            <video key={media.src} src={media.src} controls controlsList="nodownload" className="size-full" onContextMenu={(e) => e.preventDefault()} />
          ) : (
            <div className="flex size-full items-center justify-center text-background">
              <div className="text-center">
                <PlayCircle className="mx-auto size-14 opacity-80" />
                <p className="mt-3 text-sm opacity-80">{lessons.length ? "এই ক্লাসের ভিডিও শীঘ্রই যুক্ত হবে" : "এখনো কোনো ক্লাস যুক্ত হয়নি"}</p>
              </div>
            </div>
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
