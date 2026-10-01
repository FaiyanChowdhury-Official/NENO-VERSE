import { useSuspenseQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/catalog.functions";

export type Category = { slug: string; name: string };

export type Product = {
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string[];
  includes: string[];
  fileInfo: string;
  price: number;
  originalPrice?: number;
  image: string;
  popular?: boolean;
  isNew?: boolean;
};

export type Lesson = { title: string; duration: string; free?: boolean };
export type Module = { title: string; lessons: Lesson[] };

export type Course = {
  slug: string;
  name: string;
  categorySlug: string;
  level: "beginner" | "intermediate" | "advanced";
  instructor: string;
  shortDescription: string;
  description: string[];
  outcomes: string[];
  lessonCount: number;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  modules: Module[];
  popular?: boolean;
  isNew?: boolean;
};

export type Catalog = {
  productCategories: Category[];
  courseCategories: Category[];
  products: Product[];
  courses: Course[];
};

export const levelLabels: Record<Course["level"], string> = {
  beginner: "প্রাথমিক",
  intermediate: "মধ্যম",
  advanced: "অ্যাডভান্সড",
};

export function categoryName(list: Category[], slug: string): string {
  return list.find((c) => c.slug === slug)?.name ?? slug;
}

/** Live catalog from the database. Root loader preloads it. */
export function useCatalog() {
  const { data } = useSuspenseQuery(catalogQuery);
  return {
    ...data,
    getProduct: (slug: string) => data.products.find((p) => p.slug === slug),
    getCourse: (slug: string) => data.courses.find((c) => c.slug === slug),
  };
}
