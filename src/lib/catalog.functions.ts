import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import type { Catalog, Course, Module } from "@/data/catalog";

export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const [cats, items, lessons] = await Promise.all([
    sb.from("categories").select("kind,slug,name").order("sort_order"),
    sb
      .from("items")
      .select("id,kind,slug,name,category_slug,short_description,description,highlights,file_info,level,instructor,duration,lesson_count,price,original_price,image_url,popular,is_new")
      .eq("published", true)
      .order("sort_order"),
    sb.from("lessons").select("item_id,module_title,title,duration,is_free,sort_order").order("sort_order"),
  ]);
  if (cats.error || items.error || lessons.error) {
    console.error(cats.error ?? items.error ?? lessons.error);
    return { productCategories: [], courseCategories: [], products: [], courses: [] };
  }
  const opt = (n: number | null) => (n == null ? {} : { originalPrice: n });
  return {
    productCategories: cats.data.filter((c) => c.kind === "product").map(({ slug, name }) => ({ slug, name })),
    courseCategories: cats.data.filter((c) => c.kind === "course").map(({ slug, name }) => ({ slug, name })),
    products: items.data
      .filter((i) => i.kind === "product")
      .map((i) => ({
        slug: i.slug,
        name: i.name,
        categorySlug: i.category_slug,
        shortDescription: i.short_description,
        description: i.description,
        includes: i.highlights,
        fileInfo: i.file_info,
        price: i.price,
        ...opt(i.original_price),
        image: i.image_url,
        popular: i.popular,
        isNew: i.is_new,
      })),
    courses: items.data
      .filter((i) => i.kind === "course")
      .map((i) => {
        const modules: Module[] = [];
        for (const l of lessons.data.filter((l) => l.item_id === i.id)) {
          let m = modules.find((x) => x.title === l.module_title);
          if (!m) modules.push((m = { title: l.module_title, lessons: [] }));
          m.lessons.push({ title: l.title, duration: l.duration, free: l.is_free });
        }
        return {
          slug: i.slug,
          name: i.name,
          categorySlug: i.category_slug,
          level: (["beginner", "intermediate", "advanced"].includes(i.level) ? i.level : "beginner") as Course["level"],
          instructor: i.instructor,
          shortDescription: i.short_description,
          description: i.description,
          outcomes: i.highlights,
          lessonCount: i.lesson_count,
          duration: i.duration,
          price: i.price,
          ...opt(i.original_price),
          image: i.image_url,
          modules,
          popular: i.popular,
          isNew: i.is_new,
        };
      }),
  };
});

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});
