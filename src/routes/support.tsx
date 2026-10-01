import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/ContactForm";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "সহায়তা — অক্টোপাস" },
      {
        name: "description",
        content: "অর্ডার, পেমেন্ট বা অ্যাক্সেস নিয়ে সমস্যা হলে অক্টোপাস সাপোর্টে যোগাযোগ করুন।",
      },
      { property: "og:title", content: "সহায়তা — অক্টোপাস" },
      { property: "og:description", content: "সাপোর্ট টিমের সঙ্গে যোগাযোগের মাধ্যম।" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">সহায়তা</h1>
      <p className="mt-3 text-muted-foreground">
        অর্ডার, পেমেন্ট বা অ্যাক্সেস নিয়ে কোনো সমস্যা হলে আমাদের জানান।
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Phone, t: "ফোন", d: "সকাল ১০টা – রাত ৮টা" },
          { icon: Mail, t: "ইমেইল", d: "২৪ ঘণ্টার মধ্যে উত্তর" },
          { icon: MessageCircle, t: "সাপোর্ট টিকিট", d: "ড্যাশবোর্ড → সাপোর্ট ট্যাব থেকে" },
        ].map((c) => (
          <div key={c.t} className="surface-card p-6">
            <c.icon className="size-6 text-primary" strokeWidth={1.6} />
            <h2 className="mt-3 font-semibold text-foreground">{c.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>

      <ContactForm />
      <div className="surface-card mt-8 p-6">
        <h2 className="font-semibold text-foreground">যোগাযোগের তথ্য এখনো যুক্ত করা হয়নি</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          আপনার আসল ফোন নম্বর, ইমেইল ঠিকানা ও সাপোর্টের সময় জানালে এখানে বসিয়ে দেব। অ্যাকাউন্ট ও
          টিকিট ব্যবস্থা পরের ধাপে যুক্ত হবে।
        </p>
        <Link to="/faq" className="mt-4 inline-block text-sm font-semibold text-primary">
          আগে সাধারণ প্রশ্ন দেখুন →
        </Link>
      </div>
    </div>
  );
}
