import { Link } from "@tanstack/react-router";
import { Clock, PlayCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryName, courseCategories, levelLabels, type Course } from "@/data/catalog";
import { toBengaliDigits } from "@/lib/format";
import { PriceTag } from "./PriceTag";

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="surface-card hover-lift flex flex-col overflow-hidden">
      <Link
        to="/courses/$slug"
        params={{ slug: course.slug }}
        className="block overflow-hidden bg-muted"
      >
        <img
          src={course.image}
          alt={course.name}
          loading="lazy"
          width={1024}
          height={640}
          className="aspect-[16/10] w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
            {categoryName(courseCategories, course.categorySlug)}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {levelLabels[course.level]}
          </span>
        </div>
        <h3 className="text-base font-semibold text-foreground">
          <Link to="/courses/$slug" params={{ slug: course.slug }} className="hover:text-primary">
            {course.name}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="size-3.5" /> {course.instructor}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="size-3.5" /> {toBengaliDigits(course.lessonCount)} টি ক্লাস
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {course.duration}
          </span>
        </div>
        <PriceTag price={course.price} {...(course.originalPrice !== undefined && { originalPrice: course.originalPrice })} className="mt-auto pt-2" />
        <Button asChild className="mt-2 w-full rounded-xl font-semibold">
          <Link to="/courses/$slug" params={{ slug: course.slug }}>
            কোর্স দেখুন
          </Link>
        </Button>
      </div>
    </article>
  );
}
