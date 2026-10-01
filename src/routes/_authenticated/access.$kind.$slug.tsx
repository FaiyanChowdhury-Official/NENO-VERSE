import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Lock, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";
import { openItemAccess } from "@/lib/orders.functions";
import { getDeviceId } from "@/lib/device";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/access/$kind/$slug")({
  head: () => ({
    meta: [
      { title: "আমার প্রোডাক্ট — অক্টোপাস" },
      { name: "description", content: "আপনার কেনা ডিজিটাল প্রোডাক্ট নিরাপদে ব্যবহার করুন।" },
      { property: "og:title", content: "আমার প্রোডাক্ট — অক্টোপাস" },
      { property: "og:description", content: "সুরক্ষিত অ্যাক্সেস।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccessPage,
});

const VIEWABLE = ["pdf", "png", "jpg", "jpeg", "webp", "gif", "mp4", "webm", "mp3", "txt"];

function Watermark({ email }: { email: string }) {
  const [pos, setPos] = useState({ x: 10, y: 10 });
  useEffect(() => {
    const t = setInterval(() => setPos({ x: 5 + Math.random() * 60, y: 5 + Math.random() * 80 }), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden">
      <span className="absolute rounded bg-foreground/40 px-2 py-1 text-xs font-semibold text-background transition-all duration-1000" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
        {email} • {new Date().toLocaleDateString("bn-BD")}
      </span>
    </div>
  );
}

function AccessPage() {
  const { kind, slug } = Route.useParams();
  const open = useServerFn(openItemAccess);
  const q = useQuery({
    queryKey: ["item-access", kind, slug],
    queryFn: () => open({ data: { kind: kind === "course" ? "course" : "product", slug, deviceId: getDeviceId() } }),
    staleTime: 90_000, // signed file links last 2 minutes
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  if (q.isLoading) return <p className="py-24 text-center text-muted-foreground">যাচাই করা হচ্ছে...</p>;
  const d = q.data;
  if (!d || d.kind === "denied") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock className="mx-auto size-10 text-primary" />
        <p className="mt-4 text-muted-foreground">{d?.reason ?? "অ্যাক্সেস পাওয়া যায়নি।"}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/dashboard">ড্যাশবোর্ড</Link></Button>
          <Button asChild><Link to="/support">সাপোর্ট</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{d.name}</h1>
          {d.expiresAt && <p className="text-xs text-subtle-foreground">মেয়াদ: {new Date(d.expiresAt).toLocaleDateString("bn-BD")} পর্যন্ত</p>}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground">
          <ShieldCheck className="h-4 w-4" /> শুধু আপনার জন্য সুরক্ষিত
        </span>
      </div>
      {d.note && <p className="mt-4 whitespace-pre-line rounded-xl bg-muted p-4 text-sm text-muted-foreground">{d.note}</p>}

      <div className="mt-6">
        {d.kind === "pending" && <p className="text-muted-foreground">কনটেন্ট শীঘ্রই যুক্ত হবে।</p>}

        {d.kind === "file" && (VIEWABLE.includes(d.ext) ? (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <Watermark email={d.email} />
            {["png", "jpg", "jpeg", "webp", "gif"].includes(d.ext) ? (
              <img src={d.src} alt={d.name} draggable={false} className="mx-auto max-h-[80vh] select-none" />
            ) : ["mp4", "webm"].includes(d.ext) ? (
              <video src={d.src} controls controlsList="nodownload noplaybackrate" disablePictureInPicture className="w-full" />
            ) : d.ext === "mp3" ? (
              <audio src={d.src} controls controlsList="nodownload" className="w-full p-4" />
            ) : (
              <iframe title={d.name} src={`${d.src}#toolbar=0&navpanes=0`} className="h-[80vh] w-full" />
            )}
          </div>
        ) : (
          <div className="surface-card p-6 text-center">
            <p className="text-sm text-muted-foreground">এই ফাইলটি ডাউনলোড করে ব্যবহার করতে হয়। লিংকটি ২ মিনিট পর বাতিল হয়ে যায় এবং শুধু আপনার অ্যাকাউন্টে কাজ করে।</p>
            <Button asChild className="mt-4"><a href={d.src}>{d.label}</a></Button>
          </div>
        ))}

        {d.kind === "external" && (
          <div className="surface-card p-6 text-center">
            <p className="text-sm text-muted-foreground">এই কনটেন্টটি একটি বাইরের প্ল্যাটফর্মে আছে। আপনার প্রতিটি অ্যাক্সেস রেকর্ড করা হয়।</p>
            <Button asChild className="mt-4"><a href={d.src} target="_blank" rel="noopener noreferrer">{d.label} <ExternalLink className="h-4 w-4" /></a></Button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-subtle-foreground">
        <Button size="sm" variant="ghost" onClick={() => q.refetch()}><RefreshCw className="h-3.5 w-3.5" /> আবার লোড করুন</Button>
        শেয়ার বা পুনরায় বিক্রি করলে অ্যাকাউন্ট বন্ধ হতে পারে।
      </div>
    </div>
  );
}
