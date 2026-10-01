import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
import { ProductCard } from "@/components/site/ProductCard";
import { CourseCard } from "@/components/site/CourseCard";
import { Input } from "@/components/ui/input";
import { useCatalog } from "@/data/catalog";
import { cn } from "@/lib/utils";

const schema = z.object({
  q: z.string().max(100).optional().catch(undefined),
  type: z.enum(["all", "product", "course"]).optional().catch(undefined),
  cat: z.string().max(60).optional().catch(undefined),
  max: z.number().int().min(0).optional().catch(undefined),
  sort: z.enum(["relevant", "popular", "new", "price"]).optional().catch(undefined),
});

export const Route = createFileRoute("/search")({
  validateSearch: schema,
  head: () => ({
    meta: [
      { title: "খুঁজুন — অক্টোপাস" },
      { name: "description", content: "সব ডিজিটাল প্রোডাক্ট ও কোর্স এক জায়গায় খুঁজুন — নাম, বিবরণ, ক্যাটাগরি ও দাম অনুযায়ী।" },
      { property: "og:title", content: "খুঁজুন — অক্টোপাস" },
      { property: "og:description", content: "প্রোডাক্ট ও কোর্স খুঁজুন, ক্যাটাগরি ও দাম দিয়ে ফিল্টার করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

const priceSteps = [
  { v: undefined, label: "যেকোনো দাম" },
  { v: 500, label: "৳৫০০ পর্যন্ত" },
  { v: 1000, label: "৳১,০০০ পর্যন্ত" },
  { v: 3000, label: "৳৩,০০০ পর্যন্ত" },
] as const;
const sorts = [
  { k: "relevant", label: "প্রাসঙ্গিক" },
  { k: "popular", label: "জনপ্রিয়" },
  { k: "new", label: "নতুন" },
  { k: "price", label: "কম মূল্য" },
] as const;

function SearchPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { products, courses, productCategories, courseCategories } = useCatalog();
  const q = (s.q ?? "").trim().toLowerCase();
  const type = s.type ?? "all";
  const sort = s.sort ?? "relevant";
  const set = (patch: Partial<z.infer<typeof schema>>) =>
    navigate({ search: (p) => ({ ...p, ...patch }), replace: true });

  const cats = [...productCategories, ...courseCategories];
  const catName = (slug: string) => cats.find((c) => c.slug === slug)?.name ?? "";

  const results = useMemo(() => {
    const all = [
      ...products.map((p) => ({ kind: "product" as const, item: p, text: [p.name, p.shortDescription, p.description, catName(p.categorySlug), ...p.includes].join(" ") })),
      ...courses.map((c) => ({ kind: "course" as const, item: c, text: [c.name, c.shortDescription, c.description, c.instructor, catName(c.categorySlug), ...c.outcomes].join(" ") })),
    ];
    let list = all
      .filter((r) => type === "all" || r.kind === type)
      .filter((r) => !s.cat || r.item.categorySlug === s.cat)
      .filter((r) => s.max == null || r.item.price <= s.max)
      .map((r) => {
        const name = r.item.name.toLowerCase();
        const score = !q ? 1 : name.includes(q) ? 3 : r.text.toLowerCase().includes(q) ? 1 : 0;
        return { ...r, score };
      })
      .filter((r) => r.score > 0);
    if (sort === "relevant") list = list.sort((a, b) => b.score - a.score || Number(b.item.popular) - Number(a.item.popular));
    if (sort === "popular") list = list.sort((a, b) => Number(b.item.popular) - Number(a.item.popular));
    if (sort === "new") list = list.sort((a, b) => Number(b.item.isNew) - Number(a.item.isNew));
    if (sort === "price") list = list.sort((a, b) => a.item.price - b.item.price);
    return list;
  }, [products, courses, q, type, s.cat, s.max, sort]);

  const visibleCats = type === "product" ? productCategories : type === "course" ? courseCategories : cats;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">খুঁজুন</h1>
      <div className="relative mt-6 max-w-xl">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle-foreground" />
        <Input
          autoFocus
          defaultValue={s.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined })}
          placeholder="প্রোডাক্ট, কোর্স বা ক্যাটাগরির নাম লিখুন"
          className="h-12 rounded-full pl-11"
          aria-label="খুঁজুন"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Row>
          {([["all", "সব"], ["product", "ডিজিটাল প্রোডাক্ট"], ["course", "কোর্স"]] as const).map(([k, l]) => (
            <Chip key={k} active={type === k} onClick={() => set({ type: k === "all" ? undefined : k, cat: undefined })}>{l}</Chip>
          ))}
        </Row>
        <Row>
          <Chip active={!s.cat} onClick={() => set({ cat: undefined })}>সব ক্যাটাগরি</Chip>
          {visibleCats.map((c) => (
            <Chip key={c.slug} active={s.cat === c.slug} onClick={() => set({ cat: c.slug })}>{c.name}</Chip>
          ))}
        </Row>
        <Row>
          {priceSteps.map((p) => (
            <Chip key={p.label} active={s.max === p.v} onClick={() => set({ max: p.v })}>{p.label}</Chip>
          ))}
          <span className="mx-1 w-px bg-border" />
          {sorts.map((o) => (
            <Chip key={o.k} active={sort === o.k} onClick={() => set({ sort: o.k === "relevant" ? undefined : o.k })}>{o.label}</Chip>
          ))}
        </Row>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">{results.length.toLocaleString("bn-BD")}টি ফলাফল</p>
      {results.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">কিছু পাওয়া যায়নি। অন্য শব্দ বা ফিল্টার দিয়ে চেষ্টা করুন।</p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) =>
            r.kind === "product" ? <ProductCard key={"p" + r.item.slug} product={r.item} /> : <CourseCard key={"c" + r.item.slug} course={r.item} />,
          )}
        </div>
      )}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-transparent bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
