import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "শর্তাবলি — NENO-VERSE" },
      { name: "description", content: "NENO-VERSE ব্যবহারের শর্তাবলি ও ক্রয় নীতিমালা।" },
      { property: "og:title", content: "শর্তাবলি — NENO-VERSE" },
      { property: "og:description", content: "ব্যবহারের শর্ত ও ক্রয় নীতিমালা।" },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    t: "অ্যাকাউন্ট",
    d: "সঠিক তথ্য দিয়ে অ্যাকাউন্ট খুলতে হবে। অ্যাকাউন্টের নিরাপত্তা ব্যবহারকারীর দায়িত্ব।",
  },
  {
    t: "ক্রয় ও পেমেন্ট",
    d: "বিকাশ, রকেট বা ব্যাংক ট্রান্সফারে পেমেন্ট করার পর যাচাই সম্পন্ন হলে অ্যাক্সেস দেওয়া হয়।",
  },
  {
    t: "ব্যবহারের সীমা",
    d: "কেনা প্রোডাক্ট ও কোর্স ব্যক্তিগত ব্যবহারের জন্য। পুনঃবিক্রি বা শেয়ার করা নিষিদ্ধ।",
  },
  {
    t: "ফেরত নীতি",
    d: "ডিজিটাল পণ্যের ক্ষেত্রে সাধারণত ফেরত প্রযোজ্য নয়। প্রযুক্তিগত সমস্যা হলে সাপোর্ট সহায়তা করবে।",
  },
];

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">শর্তাবলি</h1>
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
