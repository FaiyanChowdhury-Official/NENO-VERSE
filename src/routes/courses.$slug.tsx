import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock, Lock, PlayCircle, User } from "lucide-react";
import { CourseCard } from "@/components/site/CourseCard";
import { PriceTag } from "@/components/site/PriceTag";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { categoryName, levelLabels, useCatalog } from "@/data/catalog";
import { catalogQuery } from "@/lib/catalog.functions";
import { toBengaliDigits } from "@/lib/format";

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params, context }) => {
    const cat = await context.queryClient.ensureQueryData(catalogQuery);
    const course = cat.courses.find((c) => c.slug === params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "কোর্স পাওয়া যায়নি — অক্টোপাস" }, { name: "robots", content: "noindex" }],
      };
    }
    const { course } = loaderData;
    return {
      meta: [
        { title: `${course.name} — অক্টোপাস` },
        { name: "description", content: course.shortDescription },
        { property: "og:title", content: `${course.name} — অক্টোপাস` },
        { property: "og:description", content: course.shortDescription },
      ],
    };
  },
  notFoundComponent: CourseNotFound,
  component: CourseDetail,
});

function CourseNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground">কোর্সটি পাওয়া যায়নি</h1>
      <p className="mt-3 text-muted-foreground">সম্ভবত লিংকটি পুরনো অথবা কোর্সটি সরানো হয়েছে।</p>
      <Button asChild className="mt-6 rounded-full">
        <Link to="/courses">সব কোর্স দেখুন</Link>
      </Button>
    </div>
  );
}

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const related = courses.filter((c) => c.slug !== course.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> সব কোর্স
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <img
            src={course.image}
            alt={course.name}
            width={1024}
            height={640}
            className="w-full rounded-3xl border border-border object-cover"
          />
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
              {categoryName(courseCategories, course.categorySlug)}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {levelLabels[course.level]}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">{course.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4" /> {course.instructor}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="size-4" /> {toBengaliDigits(course.lessonCount)} টি ক্লাস
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" /> {course.duration}
            </span>
          </div>

          <div className="mt-6 space-y-4 text-muted-foreground">
            {course.description.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-bold text-foreground">কোর্স শেষে আপনি পারবেন</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {course.outcomes.map((o) => (
              <li key={o} className="flex items-start gap-3 text-muted-foreground">
                <Check className="mt-1 size-4 shrink-0 text-success" />
                {o}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-xl font-bold text-foreground">কোর্স কারিকুলাম</h2>
          <Accordion type="single" collapsible className="mt-4 surface-card px-5">
            {course.modules.map((m) => (
              <AccordionItem key={m.title} value={m.title}>
                <AccordionTrigger className="text-left font-semibold">{m.title}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3">
                    {m.lessons.map((l) => (
                      <li
                        key={l.title}
                        className="flex items-center justify-between gap-4 text-sm text-muted-foreground"
                      >
                        <span className="inline-flex items-center gap-2">
                          {l.free ? (
                            <PlayCircle className="size-4 text-primary" />
                          ) : (
                            <Lock className="size-4 text-subtle-foreground" />
                          )}
                          {l.title}
                          {l.free ? (
                            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary-soft-foreground">
                              ফ্রি
                            </span>
                          ) : null}
                        </span>
                        <span>{l.duration}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <PriceTag price={course.price} {...(course.originalPrice !== undefined && { originalPrice: course.originalPrice })} size="lg" />
            <Button size="lg" className="mt-6 w-full rounded-xl font-semibold" asChild>
              <Link to="/checkout" search={{ type: "course", slug: course.slug }}>এখনই কিনুন</Link>
            </Button>
            <p className="mt-3 text-center text-xs text-subtle-foreground">
              কেনার জন্য অ্যাকাউন্ট প্রয়োজন
            </p>
            <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
              <li>আজীবন অ্যাক্সেস</li>
              <li>মোবাইল ও কম্পিউটারে দেখা যাবে</li>
              <li>নিরাপদ ভিডিও প্লেয়ার</li>
            </ul>
            <div className="mt-6 rounded-xl bg-primary-soft p-4 text-sm text-primary-soft-foreground">
              পেমেন্ট মাধ্যম: বিকাশ • রকেট • ব্যাংক ট্রান্সফার
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-20">
        <h2 className="text-2xl font-bold text-foreground">আরও কোর্স</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
