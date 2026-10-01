import { useQuery } from "@tanstack/react-query";
import { fetchSetting, defaultStorefront, type StorefrontSettings } from "@/lib/settings";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, HeadphonesIcon, Play, ShieldCheck, Wallet, Zap } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";
import { CourseCard } from "@/components/site/CourseCard";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/data/catalog";
import { SuccessStories } from "@/components/site/Reviews";
import { toBengaliDigits } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NENO-VERSE — ডিজিটাল প্রোডাক্ট ও অনলাইন কোর্স" },
      {
        name: "description",
        content:
          "বাংলাদেশের জন্য তৈরি ডিজিটাল প্রোডাক্ট ও অনলাইন কোর্সের প্ল্যাটফর্ম। বিকাশ, রকেট ও ব্যাংক ট্রান্সফারে নিরাপদ পেমেন্ট।",
      },
      { property: "og:title", content: "NENO-VERSE — ডিজিটাল প্রোডাক্ট ও অনলাইন কোর্স" },
      {
        property: "og:description",
        content: "প্রয়োজনীয় ডিজিটাল প্রোডাক্ট ও কোর্স কিনুন, পেমেন্ট যাচাইয়ের পর সরাসরি অ্যাক্সেস নিন।",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ShieldCheck, title: "নিরাপদ পেমেন্ট", text: "বিকাশ, রকেট ও ব্যাংক ট্রান্সফার" },
  { icon: Zap, title: "দ্রুত অ্যাক্সেস", text: "পেমেন্ট যাচাইয়ের পর সরাসরি অ্যাক্সেস" },
  { icon: BadgeCheck, title: "নিরাপদ ডেলিভারি", text: "প্রোডাক্ট ও কোর্সের সুরক্ষিত অ্যাক্সেস" },
  { icon: Wallet, title: "বাংলাদেশের জন্য", text: "BDT ও স্থানীয় পেমেন্ট সুবিধা" },
  { icon: HeadphonesIcon, title: "সহায়তা", text: "প্রয়োজনে দ্রুত সাপোর্ট" },
];

function Index() {
  const { courses, products } = useCatalog();
  const featuredProducts = products.filter((p) => p.popular || p.isNew).slice(0, 3);
  const featuredCourses = courses.slice(0, 3);

  const sfq = useQuery({ queryKey: ["setting", "storefront"], queryFn: () => fetchSetting<StorefrontSettings>("storefront") });
  const sf = { ...defaultStorefront, ...(sfq.data ?? {}) };
  const [titleA, titleB] = sf.title.includes("{highlight}") ? sf.title.split("{highlight}") : [sf.title + " ", ""];

  return (
    <div>
      {sf.announcement && <div className="bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">{sf.announcement}</div>}
      {/* Hero — DEVSKILL-style soft peach */}
      <section className="hero-wallpaper relative overflow-hidden">
        {/* floating decorative dots */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="absolute top-[18%] left-[42%] size-3 rounded-full bg-primary" />
          <span className="absolute top-[30%] right-[8%] size-3.5 rounded-full bg-teal" />
          <span className="absolute bottom-[22%] left-[6%] size-2.5 rounded-full bg-teal" />
          <span className="absolute top-[12%] right-[30%] size-2 rounded-full bg-primary/70" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex -rotate-2 items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-cta">
              {sf.badge}
            </span>
            <h1 className="animate-rise mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {titleA}<span className="text-primary">{sf.highlight}</span>{titleB}
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              {sf.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="rounded-full bg-teal px-7 font-semibold text-teal-foreground hover:bg-teal/90">
                <Link to="/courses">
                  শুরু করুন <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Link to="/products" className="group inline-flex items-center gap-3 font-semibold text-foreground">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-cta transition-transform group-hover:scale-105">
                  <Play className="size-5 fill-current" />
                </span>
                প্রোডাক্ট দেখুন
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                { k: sf.stat1_label, v: sf.stat1_value },
                { k: sf.stat2_label, v: sf.stat2_value },
                { k: sf.stat3_label, v: sf.stat3_value },
              ].map((s) => (
                <div key={s.k}>
                  <dd className="text-3xl font-extrabold text-foreground">{s.v}</dd>
                  <dt className="mt-1 text-sm text-muted-foreground">{s.k}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative animate-rise [animation-delay:200ms]">
            <div aria-hidden className="absolute inset-10 -z-10 rounded-full bg-primary/20 blur-3xl animate-glow" />
            <div aria-hidden className="absolute -top-4 right-6 size-16 rotate-12 rounded-2xl bg-teal-soft shadow-card animate-float" />
            <div aria-hidden className="absolute bottom-8 -left-2 size-14 -rotate-6 rounded-2xl bg-primary-soft shadow-card animate-float [animation-delay:1.2s]" />
            <img
              src={heroImage}
              alt="বই হাতে হাসিখুশি AI রোবট"
              width={1200}
              height={1200}
              className="w-full animate-float [animation-duration:7s] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_70%)]"
            />
          </div>
        </div>
      </section>

      {/* Feature strip — colorful icon chips */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f, i) => (
            <div key={f.title} className="surface-card hover-lift p-5">
              <span className={`inline-flex size-11 items-center justify-center rounded-xl ${i % 2 === 0 ? "bg-primary-soft text-primary-soft-foreground" : "bg-teal-soft text-teal"}`}>
                <f.icon className="size-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className={`mx-auto max-w-6xl px-4 py-20 sm:px-6 ${sf.show_products ? "" : "hidden"}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-block -rotate-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">প্রোডাক্ট</span>
            <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
              জনপ্রিয় <span className="text-primary">ডিজিটাল প্রোডাক্ট</span>
            </h2>
            <p className="mt-2 text-muted-foreground">কিনলেই সঙ্গে সঙ্গে ডাউনলোডের সুবিধা।</p>
          </div>
          <Button asChild variant="ghost" className="font-semibold text-primary">
            <Link to="/products">
              সব দেখুন <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className={`bg-card py-20 ${sf.show_courses ? "" : "hidden"}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block -rotate-2 rounded-full bg-teal px-3 py-1 text-xs font-semibold text-teal-foreground">কোর্স</span>
              <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">জনপ্রিয় <span className="text-primary">কোর্স</span></h2>
              <p className="mt-2 text-muted-foreground">
                বাংলায় ধাপে ধাপে শেখার সুযোগ, যেকোনো সময় যেকোনো ডিভাইসে।
              </p>
            </div>
            <Button asChild variant="ghost" className="font-semibold text-primary">
              <Link to="/courses">
                সব দেখুন <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span className="inline-block -rotate-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">ধাপে ধাপে</span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            কীভাবে <span className="text-primary">কাজ করে</span>
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { t: "পছন্দ করুন", d: "প্রোডাক্ট বা কোর্স বেছে নিন।" },
            { t: "অ্যাকাউন্ট খুলুন", d: "মোবাইল বা ইমেইল দিয়ে রেজিস্ট্রেশন।" },
            { t: "পেমেন্ট করুন", d: "বিকাশ, রকেট বা ব্যাংক ট্রান্সফার।" },
            { t: "অ্যাক্সেস নিন", d: "যাচাইয়ের পর ড্যাশবোর্ড থেকে ব্যবহার।" },
          ].map((step, i) => (
            <div key={step.t} className="surface-card p-6">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-soft-foreground">
                {toBengaliDigits(i + 1)}
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{step.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.d}</p>
            </div>
          ))}
        </div>
      </section>
      {sf.show_stories && <SuccessStories />}
    </div>
  );
}
