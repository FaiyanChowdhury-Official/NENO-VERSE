import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getMyLibrary, getMyProfile, listMyOrders, updateMyProfile } from "@/lib/orders.functions";
import { orderStatusLabels, paymentLabel } from "@/lib/payments";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const statusStyle = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-primary-soft text-primary-soft-foreground",
  rejected: "bg-destructive/10 text-destructive",
} as const;

export function MyLibrary() {
  const fetchLib = useServerFn(getMyLibrary);
  const lib = useQuery({ queryKey: ["my-library"], queryFn: () => fetchLib() });
  const owned = lib.data ?? [];
  return (
    <>
          {lib.isLoading ? (
            <p className="text-muted-foreground">লোড হচ্ছে...</p>
          ) : owned.length === 0 ? (
            <div className="surface-card p-8 text-center">
              <p className="text-muted-foreground">এখনো কোনো অনুমোদিত প্রোডাক্ট বা কোর্স নেই।</p>
              <div className="mt-4 flex justify-center gap-3">
                <Button asChild variant="outline"><Link to="/products">প্রোডাক্ট দেখুন</Link></Button>
                <Button asChild><Link to="/courses">কোর্স দেখুন</Link></Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {owned.map((o) => (
                <div key={o.kind + o.slug} className="surface-card overflow-hidden">
                  {o.image && <img src={o.image} alt={o.name} className="aspect-[16/7] w-full object-cover" />}
                  <div className="p-5">
                    <p className="text-xs font-medium text-subtle-foreground">{o.kind === "course" ? "কোর্স" : "ডিজিটাল প্রোডাক্ট"}</p>
                    <h3 className="mt-1 font-bold text-foreground">{o.name}</h3>
                    {o.note && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{o.note}</p>}
                    {o.expiresAt && (
                      <p className="mt-2 text-xs text-subtle-foreground">মেয়াদ: {new Date(o.expiresAt).toLocaleDateString("bn-BD")} পর্যন্ত</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {o.accessType !== "link" && (
                        <Button asChild size="sm">
                          <Link to="/learn/$slug" params={{ slug: o.slug }} search={{ kind: o.kind }}>ভিডিও দেখুন</Link>
                        </Button>
                      )}
                      {o.hasLink && (
                        <Button asChild size="sm" variant={o.accessType === "link" ? "default" : "outline"}>
                          <Link to="/access/$kind/$slug" params={{ kind: o.kind, slug: o.slug }}>{o.linkLabel}</Link>
                        </Button>
                      )}
                      {o.accessType === "link" && !o.hasLink && (
                        <p className="text-sm text-muted-foreground">অ্যাক্সেস লিংক শীঘ্রই যুক্ত হবে।</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
    </>
  );
}

export function MyOrders() {
  const fetchOrders = useServerFn(listMyOrders);
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  return (
    <>
          {(orders.data ?? []).length === 0 ? (
            <p className="text-muted-foreground">কোনো অর্ডার নেই।</p>
          ) : (
            <div className="space-y-3">
              {orders.data!.map((o) => (
                <div key={o.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{o.item_name}</p>
                    <p className="text-xs text-subtle-foreground">
                      {paymentLabel(o.payment_method)} • TrxID: {o.transaction_id} •{" "}
                      {new Date(o.created_at).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{formatBdt(o.amount)}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[o.status]}`}>
                      {orderStatusLabels[o.status]}
                    </span>
                  </div>
                  <OrderSteps order={o} />
                </div>
              ))}
            </div>
          )}
    </>
  );
}

export function MyProfile() {
  const fetchProfile = useServerFn(getMyProfile);
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  return profile.data ? <ProfileForm initial={profile.data} /> : <p className="text-muted-foreground">লোড হচ্ছে...</p>;
}

function ProfileForm({ initial }: { initial: { fullName: string; phone: string; email: string } }) {
  const save = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await save({ data: { fullName: String(f.get("name")), phone: String(f.get("phone")) } });
      toast.success("প্রোফাইল সংরক্ষণ হয়েছে");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch {
      toast.error("সংরক্ষণ হয়নি");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-card max-w-md space-y-4 p-6">
      <div className="space-y-2">
        <Label>ইমেইল</Label>
        <Input value={initial.email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pn">পুরো নাম</Label>
        <Input id="pn" name="name" defaultValue={initial.fullName} required maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pp">মোবাইল নম্বর</Label>
        <Input id="pp" name="phone" defaultValue={initial.phone} maxLength={20} />
      </div>
      <Button type="submit" disabled={busy}>সংরক্ষণ করুন</Button>
    </form>
  );
}

function OrderSteps({ order }: { order: { status: string; created_at: string; approved_at: string | null; delivery_status: string; delivery_note: string; delivered_at: string | null } }) {
  if (order.status === "rejected") {
    return <p className="w-full basis-full rounded-lg bg-destructive/10 p-3 text-sm text-destructive">পেমেন্ট যাচাই সফল হয়নি। প্রশ্ন থাকলে সাপোর্ট ট্যাব থেকে টিকিট খুলুন।</p>;
  }
  const approved = order.status === "approved";
  const steps = [
    { t: "অর্ডার জমা হয়েছে", done: true, at: order.created_at },
    { t: "পেমেন্ট যাচাই", done: approved, at: order.approved_at },
    { t: "অ্যাক্টিভেশন চলছে", done: approved && ["processing", "delivered"].includes(order.delivery_status), at: null },
    { t: "ডেলিভারি সম্পন্ন — ব্যবহার করুন", done: approved && order.delivery_status === "delivered", at: order.delivered_at },
  ];
  return (
    <div className="w-full basis-full border-t border-border pt-3">
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${s.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{(i + 1).toLocaleString("bn-BD")}</span>
            <span>
              <span className={s.done ? "font-semibold text-foreground" : "text-muted-foreground"}>{s.t}</span>
              {s.done && s.at && <span className="block text-subtle-foreground">{new Date(s.at).toLocaleString("bn-BD")}</span>}
            </span>
          </li>
        ))}
      </ol>
      {order.delivery_status === "failed" && <p className="mt-2 text-xs text-destructive">ডেলিভারিতে সমস্যা হয়েছে — আমরা আপনার সাথে যোগাযোগ করব।</p>}
      {order.delivery_note && <p className="mt-2 rounded-lg bg-primary-soft/60 p-2 text-xs text-foreground">{order.delivery_note}</p>}
    </div>
  );
}
