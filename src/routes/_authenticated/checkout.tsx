import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useCatalog } from "@/data/catalog";
import { createOrder } from "@/lib/orders.functions";
import { paymentMethods, type PaymentMethod } from "@/lib/payments";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/checkout")({
  validateSearch: z.object({ type: z.enum(["product", "course"]), slug: z.string() }),
  head: () => ({
    meta: [
      { title: "চেকআউট — অক্টোপাস" },
      { name: "description", content: "বিকাশ, রকেট বা ব্যাংক ট্রান্সফারে নিরাপদে পেমেন্ট করুন।" },
      { property: "og:title", content: "চেকআউট — অক্টোপাস" },
      { property: "og:description", content: "নিরাপদ পেমেন্ট।" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { type, slug } = Route.useSearch();
  const { getProduct, getCourse } = useCatalog();
  const item = type === "product" ? getProduct(slug) : getCourse(slug);
  const navigate = useNavigate();
  const submit = useServerFn(createOrder);
  const [method, setMethod] = useState<PaymentMethod>("bkash");
  const [busy, setBusy] = useState(false);

  if (!item) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted-foreground">আইটেমটি পাওয়া যায়নি।</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-primary">হোমে ফিরুন</Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const r = await submit({
        data: {
          itemType: type,
          itemSlug: slug,
          paymentMethod: method,
          senderNumber: String(f.get("sender")),
          transactionId: String(f.get("trx")),
        },
      });
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("অর্ডার জমা হয়েছে! পেমেন্ট যাচাই হলে অ্যাক্সেস পাবেন।");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("তথ্য সঠিকভাবে পূরণ করুন");
    } finally {
      setBusy(false);
    }
  }

  const pm = paymentMethods[method];

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px]">
      <form onSubmit={onSubmit} className="surface-card space-y-6 p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-foreground">পেমেন্ট করুন</h1>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(paymentMethods) as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                method === m ? "border-primary bg-primary-soft text-primary-soft-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {paymentMethods[m].label}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-muted p-4 text-sm">
          <p className="font-semibold text-foreground">টাকা পাঠান: {pm.account}</p>
          <p className="mt-1 font-semibold text-primary">পরিমাণ: {formatBdt(item.price)}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">
            {pm.instructions.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender">{method === "bank" ? "যে অ্যাকাউন্ট/নম্বর থেকে পাঠিয়েছেন" : "যে নম্বর থেকে পাঠিয়েছেন"}</Label>
          <Input id="sender" name="sender" required minLength={5} maxLength={60} placeholder="01XXXXXXXXX" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trx">ট্রানজেকশন আইডি</Label>
          <Input id="trx" name="trx" required minLength={4} maxLength={60} placeholder="যেমন: 9A7B3C2D1E" />
        </div>
        <Button type="submit" size="lg" className="w-full font-semibold" disabled={busy}>
          {busy ? "জমা হচ্ছে..." : "অর্ডার নিশ্চিত করুন"}
        </Button>
        <p className="text-center text-xs text-subtle-foreground">
          আমাদের টিম পেমেন্ট যাচাই করে সাধারণত কয়েক ঘণ্টার মধ্যে অ্যাক্সেস চালু করে।
        </p>
      </form>

      <aside className="surface-card h-fit p-6">
        <img src={item.image} alt={item.name} className="aspect-video w-full rounded-xl object-cover" />
        <p className="mt-4 text-xs font-medium text-subtle-foreground">{type === "course" ? "কোর্স" : "ডিজিটাল প্রোডাক্ট"}</p>
        <h2 className="mt-1 font-bold text-foreground">{item.name}</h2>
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold">
          <span>মোট</span>
          <span className="text-primary">{formatBdt(item.price)}</span>
        </div>
      </aside>
    </div>
  );
}
