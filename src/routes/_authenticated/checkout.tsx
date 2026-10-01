import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useCatalog } from "@/data/catalog";
import { createOrder } from "@/lib/orders.functions";
import { paymentMethods, PROOF_METHODS, type PaymentMethod } from "@/lib/payments";
import { useSetting, type PaymentSettings } from "@/lib/settings";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/checkout")({
  validateSearch: z.object({ type: z.enum(["product", "course"]), slug: z.string() }),
  head: () => ({
    meta: [
      { title: "চেকআউট — NENO-VERSE" },
      { name: "description", content: "বিকাশ, রকেট বা ব্যাংক ট্রান্সফারে নিরাপদে পেমেন্ট করুন।" },
      { property: "og:title", content: "চেকআউট — NENO-VERSE" },
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
  const settings = useSetting<PaymentSettings>("payment");
  const [outletSlug, setOutletSlug] = useState("");
  const [proof, setProof] = useState("");
  const [proofBusy, setProofBusy] = useState(false);
  async function uploadProof(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error("ছবি ৫MB-এর কম হতে হবে"); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error("শুধু PNG, JPG বা WebP ছবি দিন"); return; }
    setProofBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const path = `${u.user?.id}/${crypto.randomUUID()}.${(file.name.split(".").pop() ?? "jpg").toLowerCase()}`;
    const { error } = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
    setProofBusy(false);
    if (error) { toast.error("স্ক্রিনশট আপলোড হয়নি"); return; }
    setProof(path); toast.success("স্ক্রিনশট যুক্ত হয়েছে");
  }
  useEffect(() => { setOutletSlug(localStorage.getItem("octopus-outlet") ?? ""); }, []);
  const outletPrice = useQuery({
    queryKey: ["outlet-price", outletSlug, type, slug],
    enabled: !!outletSlug,
    queryFn: async () => {
      const { data: it } = await supabase.from("items").select("id").eq("kind", type).eq("slug", slug).maybeSingle();
      const { data: o } = await supabase.from("outlets").select("id").eq("slug", outletSlug).maybeSingle();
      if (!it || !o) return null;
      const { data: oi } = await supabase.from("outlet_items").select("price").eq("outlet_id", o.id).eq("item_id", it.id).eq("active", true).maybeSingle();
      return oi?.price ?? null;
    },
  });
  const extra = useQuery({
    queryKey: ["item-extra", type, slug],
    queryFn: async () => (await supabase.from("items").select("requires_customer_info,customer_info_label").eq("kind", type).eq("slug", slug).maybeSingle()).data,
  });
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
          customerNote: String(f.get("note") ?? ""),
          outletSlug: outletSlug,
          paymentProof: proof,
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

  const ps = settings.data ? { ...settings.data, nagad: settings.data.nagad ?? defaultNagad } : null;
  const enabled = (Object.keys(paymentMethods) as PaymentMethod[]).filter((m) => !ps || ps[m]?.enabled !== false);
  const account = !ps
    ? "লোড হচ্ছে..."
    : method === "bank"
      ? [ps.bank.bank_name, ps.bank.account_name, ps.bank.account_number && `A/C: ${ps.bank.account_number}`, ps.bank.branch && `শাখা: ${ps.bank.branch}`].filter(Boolean).join(", ") || "তথ্য শীঘ্রই যোগ হবে"
      : ps[method].number || "নম্বর শীঘ্রই যোগ হবে";
  const steps = ps?.[method]?.instructions ? ps[method].instructions.split(/\n+/).filter(Boolean) : paymentMethods[method].instructions;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px]">
      <form onSubmit={onSubmit} className="surface-card space-y-6 p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-foreground">পেমেন্ট করুন</h1>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {enabled.map((m) => (
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
          <p className="font-semibold text-foreground">টাকা পাঠান: {account}</p>
          <p className="mt-1 font-semibold text-primary">পরিমাণ: {formatBdt(outletPrice.data ?? item.price)}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">
            {steps.map((s) => <li key={s}>{s}</li>)}
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
        {extra.data?.requires_customer_info && (
          <div className="space-y-2">
            <Label htmlFor="note">{extra.data.customer_info_label || "অ্যাক্টিভেশনের তথ্য"}</Label>
            <Input id="note" name="note" required minLength={3} maxLength={500} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="proof">{PROOF_METHODS.includes(method) ? "পেমেন্টের স্ক্রিনশট (আবশ্যক)" : "পেমেন্টের স্ক্রিনশট (ঐচ্ছিক)"}</Label>
          <Input id="proof" type="file" accept="image/png,image/jpeg,image/webp" disabled={proofBusy} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProof(f); }} />
          {proofBusy && <p className="text-xs text-muted-foreground">আপলোড হচ্ছে...</p>}
          {proof && !proofBusy && <p className="text-xs text-primary">স্ক্রিনশট যুক্ত হয়েছে</p>}
        </div>
        <Button type="submit" size="lg" className="w-full font-semibold" disabled={busy || proofBusy || (PROOF_METHODS.includes(method) && !proof)}>
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
          <span className="text-primary">{formatBdt(outletPrice.data ?? item.price)}</span>
        </div>
      </aside>
    </div>
  );
}
