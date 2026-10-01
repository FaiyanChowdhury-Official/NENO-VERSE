import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "প্রাইভেসি পলিসি — অক্টোপাস" },
      { name: "description", content: "অক্টোপাস কীভাবে আপনার তথ্য সংগ্রহ ও সুরক্ষা করে।" },
      { property: "og:title", content: "প্রাইভেসি পলিসি — অক্টোপাস" },
      { property: "og:description", content: "তথ্য সংগ্রহ ও সুরক্ষার নীতিমালা।" },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    t: "আমরা কী তথ্য সংগ্রহ করি",
    d: "অ্যাকাউন্ট তৈরির সময় নাম, মোবাইল নম্বর ও ইমেইল; অর্ডারের সময় পেমেন্ট যাচাইয়ের তথ্য।",
  },
  {
    t: "তথ্য কীভাবে ব্যবহার করা হয়",
    d: "অর্ডার প্রক্রিয়া, অ্যাক্সেস প্রদান, সাপোর্ট ও প্রয়োজনীয় নোটিফিকেশন পাঠানোর জন্য।",
  },
  {
    t: "তথ্য সুরক্ষা",
    d: "আপনার তথ্য সুরক্ষিত সার্ভারে সংরক্ষণ করা হয় এবং অনুমোদিত ব্যক্তি ছাড়া কেউ দেখতে পারে না।",
  },
  {
    t: "তৃতীয় পক্ষ",
    d: "আইনি বাধ্যবাধকতা ছাড়া আপনার ব্যক্তিগত তথ্য কারও কাছে বিক্রি বা হস্তান্তর করা হয় না।",
  },
];

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">প্রাইভেসি পলিসি</h1>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.t}>
            <h2 className="text-lg font-semibold text-foreground">{s.t}</h2>
            <p className="mt-2 text-muted-foreground">{s.d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
