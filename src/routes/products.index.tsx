import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { useCatalog } from "@/data/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "ডিজিটাল প্রোডাক্ট — অক্টোপাস" },
      {
        name: "description",
        content: "টেমপ্লেট, ই-বুক, ডিজাইন অ্যাসেট ও বিজনেস টুল — সব ডিজিটাল প্রোডাক্ট এক জায়গায়।",
      },
      { property: "og:title", content: "ডিজিটাল প্রোডাক্ট — অক্টোপাস" },
      { property: "og:description", content: "প্রয়োজনীয় ডিজিটাল প্রোডাক্ট খুঁজুন ও কিনুন।" },
    ],
  }),
  component: ProductsPage,
});

const sortOptions = [
  { key: "popular", label: "জনপ্রিয়" },
  { key: "new", label: "নতুন" },
  { key: "offer", label: "অফার" },
  { key: "price", label: "কম মূল্য" },
] as const;

function ProductsPage() {
  const { productCategories, products } = useCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["key"]>("popular");

  const list = useMemo(() => {
    let items = products.filter(
      (p) =>
        (category === "all" || p.categorySlug === category) &&
        (query.trim() === "" ||
          p.name.includes(query.trim()) ||
          p.shortDescription.includes(query.trim())),
    );
    if (sort === "new") items = items.filter((p) => p.isNew).concat(items.filter((p) => !p.isNew));
    if (sort === "offer") items = items.filter((p) => p.originalPrice);
    if (sort === "price") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "popular")
      items = items.filter((p) => p.popular).concat(items.filter((p) => !p.popular));
    return items;
  }, [query, category, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">ডিজিটাল প্রোডাক্ট</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        কাজে লাগবে এমন টেমপ্লেট, ই-বুক ও ডিজাইন অ্যাসেট বেছে নিন।
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <div className="relative max-w-lg">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="আপনি কী খুঁজছেন?"
            className="h-12 rounded-full pl-11"
            aria-label="প্রোডাক্ট খুঁজুন"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            সব ক্যাটাগরি
          </FilterChip>
          {productCategories.map((c) => (
            <FilterChip
              key={c.slug}
              active={category === c.slug}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {sortOptions.map((o) => (
            <FilterChip key={o.key} active={sort === o.key} onClick={() => setSort(o.key)}>
              {o.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          কোনো প্রোডাক্ট পাওয়া যায়নি। অন্য কিছু খুঁজে দেখুন।
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
