import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewsQuery, storiesQuery, submitReview } from "@/lib/reviews.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function Stars({ n, size = "size-4" }: { n: number; size?: string }) {
  return (
    <span className="inline-flex text-primary" aria-label={`${n} স্টার`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= n ? "fill-current" : "opacity-30"}`} />)}
    </span>
  );
}

export function ItemReviews({ kind, slug }: { kind: "product" | "course"; slug: string }) {
  const { data: reviews = [] } = useQuery(reviewsQuery(kind, slug));
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-foreground">গ্রাহকদের রিভিউ</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars n={Math.round(avg)} /> {avg.toFixed(1)} ({reviews.length}টি রিভিউ)
          </div>
        )}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className="surface-card p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{r.reviewer_name}</span>
              <Stars n={r.rating} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-muted-foreground">এখনো কোনো রিভিউ নেই।</p>}
      </div>
      <ReviewForm kind={kind} slug={slug} />
    </section>
  );
}

function ReviewForm({ kind, slug }: { kind: "product" | "course"; slug: string }) {
  const { user } = useAuth();
  const submit = useServerFn(submitReview);
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        রিভিউ দিতে <Link to="/auth" className="font-semibold text-primary">লগইন করুন</Link> (শুধু ক্রেতারা রিভিউ দিতে পারবেন)।
      </p>
    );
  }
  if (done) return <p className="mt-6 text-sm font-medium text-primary">ধন্যবাদ! যাচাইয়ের পর আপনার রিভিউ প্রকাশ হবে।</p>;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const comment = String(new FormData(e.currentTarget).get("comment"));
    setBusy(true);
    try {
      const r = await submit({ data: { kind, slug, rating, comment } });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setDone(true);
      qc.invalidateQueries({ queryKey: ["reviews", kind, slug] });
    } catch {
      toast.error("রিভিউ কমপক্ষে ৩ অক্ষরের হতে হবে");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-card mt-6 space-y-3 p-5">
      <p className="font-semibold text-foreground">আপনার রিভিউ লিখুন</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} স্টার`}>
            <Star className={`size-6 text-primary ${i <= rating ? "fill-current" : "opacity-30"}`} />
          </button>
        ))}
      </div>
      <Textarea name="comment" rows={3} required minLength={3} maxLength={1000} placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..." />
      <Button type="submit" disabled={busy}>জমা দিন</Button>
    </form>
  );
}

export function SuccessStories() {
  const { data: stories = [] } = useQuery(storiesQuery);
  if (!stories.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-3xl font-extrabold text-foreground">সাফল্যের গল্প</h2>
      <p className="mt-2 text-muted-foreground">আমাদের গ্রাহকরা যা বলছেন</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {stories.map((s) => (
          <figure key={s.id} className="surface-card flex flex-col p-6">
            <Stars n={s.rating} />
            <blockquote className="mt-3 flex-1 text-foreground">“{s.story}”</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="size-10 rounded-full object-cover" />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-soft-foreground">{s.name.charAt(0)}</span>
              )}
              <span>
                <span className="block font-semibold text-foreground">{s.name}</span>
                <span className="block text-xs text-subtle-foreground">{s.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
