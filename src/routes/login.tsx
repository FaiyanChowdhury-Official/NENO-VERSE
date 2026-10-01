import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "লগইন — অক্টোপাস" },
      { name: "description", content: "অক্টোপাস অ্যাকাউন্টে লগইন করে আপনার প্রোডাক্ট ও কোর্স দেখুন।" },
      { property: "og:title", content: "লগইন — অক্টোপাস" },
      { property: "og:description", content: "অ্যাকাউন্টে প্রবেশ করুন।" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground">লগইন</h1>
      <p className="mt-4 text-muted-foreground">
        অ্যাকাউন্ট ব্যবস্থা পরের ধাপে চালু হবে। এখন আপনি প্রোডাক্ট ও কোর্স ঘুরে দেখতে পারেন।
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/products" className="font-semibold text-primary">
          প্রোডাক্ট দেখুন
        </Link>
        <span className="text-subtle-foreground">•</span>
        <Link to="/courses" className="font-semibold text-primary">
          কোর্স দেখুন
        </Link>
      </div>
    </div>
  );
}
