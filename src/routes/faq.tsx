import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "সাধারণ প্রশ্ন — অক্টোপাস" },
      {
        name: "description",
        content: "পেমেন্ট, অ্যাক্সেস ও ডেলিভারি নিয়ে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্নের উত্তর।",
      },
      { property: "og:title", content: "সাধারণ প্রশ্ন — অক্টোপাস" },
      { property: "og:description", content: "পেমেন্ট ও অ্যাক্সেস সম্পর্কিত প্রশ্নের উত্তর।" },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  {
    q: "কীভাবে পেমেন্ট করব?",
    a: "বিকাশ, রকেট অথবা ব্যাংক ট্রান্সফারে পেমেন্ট করতে পারবেন। চেকআউটে নির্দেশনা ও নম্বর দেওয়া থাকবে।",
  },
  {
    q: "পেমেন্টের কতক্ষণ পর অ্যাক্সেস পাব?",
    a: "পেমেন্ট যাচাই সম্পন্ন হওয়ার পর সাধারণত অল্প সময়ের মধ্যেই আপনার ড্যাশবোর্ডে অ্যাক্সেস যুক্ত হয়ে যায়।",
  },
  {
    q: "কোর্সের ভিডিও কি ডাউনলোড করা যাবে?",
    a: "নিরাপত্তার কারণে কোর্সের ভিডিও শুধু প্ল্যাটফর্মের ভেতরেই দেখা যায়, ডাউনলোড করা যায় না।",
  },
  {
    q: "ডিজিটাল প্রোডাক্ট কতবার ডাউনলোড করা যাবে?",
    a: "কেনার পর আপনার ড্যাশবোর্ড থেকে নির্ধারিত সীমার মধ্যে যেকোনো সময় ডাউনলোড করতে পারবেন।",
  },
  {
    q: "টাকা ফেরত পাওয়ার সুযোগ আছে কি?",
    a: "ডিজিটাল পণ্যের প্রকৃতির কারণে সাধারণত ফেরত দেওয়া হয় না। তবে ফাইল বা অ্যাক্সেসে সমস্যা হলে সাপোর্টে জানালে সমাধান করা হয়।",
  },
];

function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">সাধারণ প্রশ্ন</h1>
      <p className="mt-3 text-muted-foreground">যা জানতে চান, সংক্ষেপে উত্তর দেওয়া হলো।</p>
      <Accordion type="single" collapsible className="surface-card mt-8 px-5">
        {faqs.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
