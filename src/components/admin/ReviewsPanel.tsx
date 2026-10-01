import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
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
  const run = useAdminAction();
  const reviews = useQuery({ queryKey: ["admin-reviews"], queryFn: () => list() });
  const keys = [["admin-reviews"], ["reviews"]];

  if (reviews.isLoading) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;
  if (!reviews.data?.length) return <p className="text-muted-foreground">এখনো কোনো রিভিউ আসেনি। ক্রেতারা প্রোডাক্ট/কোর্স পেজ থেকে রিভিউ দিতে পারবেন।</p>;
  return (
    <div className="space-y-3">
      {reviews.data.map((r) => (
        <div key={r.id} className="surface-card flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><Stars n={r.rating} /><span className="font-semibold text-foreground">{r.reviewer_name}</span></div>
            <p className="mt-1 text-sm text-foreground">{r.comment}</p>
            <p className="mt-1 text-xs text-subtle-foreground">{r.item_type === "course" ? "কোর্স" : "প্রোডাক্ট"}: {r.item_slug} • {new Date(r.created_at).toLocaleDateString("bn-BD")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[r.status]}`}>{r.status === "approved" ? "প্রকাশিত" : orderStatusLabels[r.status]}</span>
            {r.status !== "approved" && <Button size="sm" onClick={() => run(() => setStatus({ data: { id: r.id, status: "approved" } }), "প্রকাশিত হয়েছে", keys)}>প্রকাশ করুন</Button>}
            {r.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => run(() => setStatus({ data: { id: r.id, status: "rejected" } }), "লুকানো হয়েছে", keys)}>লুকান</Button>}
            <ConfirmDelete onConfirm={() => run(() => del({ data: { id: r.id } }), "মুছে ফেলা হয়েছে", keys)} />
          </div>
        </div>
      ))}
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
