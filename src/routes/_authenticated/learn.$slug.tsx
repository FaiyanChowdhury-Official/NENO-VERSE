import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PlayCircle, Lock } from "lucide-react";
import { getCourse } from "@/data/catalog";
import { getCourseAccess } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/learn/$slug")({
  head: () => ({
    meta: [
      { title: "ক্লাসরুম — অক্টোপাস" },
      { name: "description", content: "আপনার কেনা কোর্সের ক্লাস দেখুন।" },
      { property: "og:title", content: "ক্লাসরুম — অক্টোপাস" },
      { property: "og:description", content: "কোর্সের ক্লাস।" },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const { slug } = Route.useParams();
  const course = getCourse(slug);
  const check = useServerFn(getCourseAccess);
  const access = useQuery({ queryKey: ["access", slug], queryFn: () => check({ data: { slug } }) });
  const lessons = course?.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m.title }))) ?? [];
  const [idx, setIdx] = useState(0);

  if (!course) return <p className="py-24 text-center text-muted-foreground">কোর্স পাওয়া যায়নি।</p>;
  if (access.isLoading) return <p className="py-24 text-center text-muted-foreground">লোড হচ্ছে...</p>;
  if (!access.data?.hasAccess) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Lock className="mx-auto size-10 text-primary" />
        <p className="mt-4 text-muted-foreground">এই কোর্সে আপনার অ্যাক্সেস এখনো চালু হয়নি।</p>
        <Button asChild className="mt-6"><Link to="/dashboard">ড্যাশবোর্ডে ফিরুন</Link></Button>
      </div>
    );
  }
  const current = lessons[idx];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-foreground/90 text-background">
          <div className="text-center">
            <PlayCircle className="mx-auto size-14 opacity-80" />
            <p className="mt-3 text-sm opacity-80">ভিডিও শীঘ্রই যুক্ত হবে</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-subtle-foreground">{current?.module}</p>
        <h1 className="text-2xl font-extrabold text-foreground">{current?.title}</h1>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>আগের ক্লাস</Button>
          <Button disabled={idx >= lessons.length - 1} onClick={() => setIdx(idx + 1)}>পরের ক্লাস</Button>
        </div>
      </div>
      <aside className="surface-card h-fit max-h-[70vh] overflow-auto p-3">
        <h2 className="px-2 py-2 font-bold text-foreground">{course.name}</h2>
        {lessons.map((l, i) => (
          <button
            key={i}
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
