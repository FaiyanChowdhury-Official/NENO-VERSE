import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "অ্যাকাউন্ট খুলুন — অক্টোপাস" },
      { name: "description", content: "অক্টোপাসে অ্যাকাউন্ট খুলে ডিজিটাল প্রোডাক্ট ও কোর্স কিনুন।" },
      { property: "og:title", content: "অ্যাকাউন্ট খুলুন — অক্টোপাস" },
      { property: "og:description", content: "নতুন অ্যাকাউন্ট তৈরি করুন।" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground">অ্যাকাউন্ট খুলুন</h1>
      <p className="mt-4 text-muted-foreground">
        রেজিস্ট্রেশন, চেকআউট ও পেমেন্ট যাচাই পরের ধাপে যুক্ত হবে। তখন বিকাশ, রকেট ও ব্যাংক
        ট্রান্সফারে কেনা যাবে।
      </p>
      <Link to="/" className="mt-8 inline-block font-semibold text-primary">
        হোমে ফিরে যান
      </Link>
    </div>
  );
}
