import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CourseCard } from "@/components/site/CourseCard";
import { Input } from "@/components/ui/input";
import { levelLabels, useCatalog } from "@/data/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "অনলাইন কোর্স — অক্টোপাস" },
      {
        name: "description",
        content: "ফ্রিল্যান্সিং, ডিজাইন, মার্কেটিং ও ডেভেলপমেন্ট নিয়ে বাংলায় অনলাইন কোর্স।",
      },
      { property: "og:title", content: "অনলাইন কোর্স — অক্টোপাস" },
      { property: "og:description", content: "বাংলায় ধাপে ধাপে শেখার অনলাইন কোর্স।" },
    ],
  }),
  component: CoursesPage,
});

const levels = ["beginner", "intermediate", "advanced"] as const;

function CoursesPage() {
  const { courseCategories, courses } = useCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");

  const list = useMemo(
    () =>
      courses.filter(
        (c) =>
          (category === "all" || c.categorySlug === category) &&
          (level === "all" || c.level === level) &&
          (query.trim() === "" ||
            c.name.includes(query.trim()) ||
            c.shortDescription.includes(query.trim())),
      ),
    [query, category, level],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">অনলাইন কোর্স</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        দক্ষতা বাড়ানোর জন্য বাংলায় তৈরি কোর্স, আজীবন অ্যাক্সেস সহ।
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <div className="relative max-w-lg">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="কোন কোর্সটি খুঁজছেন?"
            className="h-12 rounded-full pl-11"
            aria-label="কোর্স খুঁজুন"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            সব ক্যাটাগরি
          </Chip>
          {courseCategories.map((c) => (
            <Chip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={level === "all"} onClick={() => setLevel("all")}>
            সব লেভেল
          </Chip>
          {levels.map((l) => (
            <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
              {levelLabels[l]}
            </Chip>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">কোনো কোর্স পাওয়া যায়নি।</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
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
