import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের সম্পর্কে — অক্টোপাস" },
      {
        name: "description",
        content: "অক্টোপাস বাংলাদেশের ডিজিটাল প্রোডাক্ট ও অনলাইন কোর্সের নিরাপদ প্ল্যাটফর্ম।",
      },
      { property: "og:title", content: "আমাদের সম্পর্কে — অক্টোপাস" },
      { property: "og:description", content: "আমরা কারা এবং কী করি।" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">আমাদের সম্পর্কে</h1>
      <div className="mt-6 space-y-5 text-muted-foreground">
        <p>
          অক্টোপাস বাংলাদেশের মানুষের জন্য তৈরি একটি ডিজিটাল প্রোডাক্ট ও অনলাইন কোর্স প্ল্যাটফর্ম।
          আমাদের লক্ষ্য—প্রয়োজনীয় ডিজিটাল রিসোর্স সহজে, সাশ্রয়ী দামে ও নিরাপদে পৌঁছে দেওয়া।
        </p>
        <p>
          স্থানীয় পেমেন্ট মাধ্যম বিকাশ, রকেট ও ব্যাংক ট্রান্সফারে পেমেন্ট করা যায়। পেমেন্ট যাচাই
          হওয়ার সঙ্গে সঙ্গে আপনার ড্যাশবোর্ডে প্রোডাক্ট বা কোর্সের অ্যাক্সেস যুক্ত হয়ে যায়।
        </p>
        <p>
          আমরা বিশ্বাস করি শেখা ও কাজের সরঞ্জাম সবার হাতের নাগালে থাকা উচিত। তাই পুরো প্ল্যাটফর্ম
          বাংলায়, সহজ ভাষায় সাজানো।
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { t: "বিশ্বাসযোগ্যতা", d: "যাচাই করা প্রোডাক্ট ও কোর্স" },
          { t: "সরলতা", d: "কম ধাপে কেনাকাটা" },
          { t: "নিরাপত্তা", d: "সুরক্ষিত অ্যাক্সেস ও ডেলিভারি" },
        ].map((v) => (
          <div key={v.t} className="surface-card p-6">
            <h2 className="font-semibold text-foreground">{v.t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
