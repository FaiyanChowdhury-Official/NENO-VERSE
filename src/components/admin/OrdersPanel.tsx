import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { adminDeleteOrder, adminGrantAccess, adminListItems, adminListOrders, adminUpdateOrder, adminUpdateDelivery } from "@/lib/admin.functions";
import { orderStatusLabels, paymentLabel } from "@/lib/payments";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete, statusStyle, useAdminAction } from "./shared";

export function OrdersPanel() {
  const list = useServerFn(adminListOrders);
  const update = useServerFn(adminUpdateOrder);
  const del = useServerFn(adminDeleteOrder);
  const run = useAdminAction();
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => list() });
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) =>
          (filter === "all" || o.status === filter) &&
          (!q || `${o.transaction_id} ${o.customer_name} ${o.customer_phone} ${o.sender_number} ${o.item_name}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [orders.data, filter, q],
  );
  const stats = useMemo(() => {
    const d = orders.data ?? [];
    return {
      pending: d.filter((o) => o.status === "pending").length,
      revenue: d.filter((o) => o.status === "approved").reduce((s, o) => s + o.amount, 0),
      total: d.length,
    };
  }, [orders.data]);

  const keys = [["admin-orders"]];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="যাচাই বাকি" value={String(stats.pending)} />
        <Stat label="মোট আয় (অনুমোদিত)" value={formatBdt(stats.revenue)} />
        <Stat label="মোট অর্ডার" value={String(stats.total)} />
      </div>
      <GrantAccess />
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "সব" : orderStatusLabels[f]}
          </Button>
        ))}
        <Input className="ml-auto max-w-xs" placeholder="TrxID, নাম, নম্বর দিয়ে খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {orders.isLoading ? (
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">কোনো অর্ডার নেই।</p>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <div key={o.id} className="surface-card flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{o.item_name}</p>
                <p className="text-sm text-muted-foreground">{o.customer_name || "নাম নেই"} • {o.customer_phone}</p>
                <p className="text-xs text-subtle-foreground">
                  {paymentLabel(o.payment_method)} • প্রেরক: {o.sender_number} • TrxID: <b>{o.transaction_id}</b> • {new Date(o.created_at).toLocaleString("bn-BD")}
                  {o.payment_proof && <ProofLink path={o.payment_proof} />}
                  {o.customer_note && <span className="mt-1 block font-semibold text-primary">অ্যাক্টিভেশন তথ্য: {o.customer_note}</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-foreground">{formatBdt(o.amount)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[o.status]}`}>{orderStatusLabels[o.status]}</span>
                {o.status !== "approved" && (
                  <Button size="sm" onClick={() => run(() => update({ data: { id: o.id, status: "approved" } }), "অনুমোদিত হয়েছে", keys)}>অনুমোদন</Button>
                )}
                {o.status !== "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => run(() => update({ data: { id: o.id, status: "rejected" } }), "বাতিল করা হয়েছে", keys)}>
                    {o.status === "approved" ? "অ্যাক্সেস বন্ধ" : "বাতিল"}
                  </Button>
                )}
                <ConfirmDelete label="আর্কাইভ" onConfirm={() => run(() => del({ data: { id: o.id } }), "অর্ডার আর্কাইভ হয়েছে", keys)} />
              </div>
              {o.status === "approved" && <DeliveryEditor order={o} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GrantAccess() {
  const listItems = useServerFn(adminListItems);
  const grant = useServerFn(adminGrantAccess);
  const run = useAdminAction();
  const items = useQuery({ queryKey: ["admin-items"], queryFn: () => listItems() });
  const [open, setOpen] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const [kind, slug] = String(f.get("item")).split(":") as ["product" | "course", string];
    const ok = await run(() => grant({ data: { email: String(f.get("email")), kind, slug } }), "অ্যাক্সেস দেওয়া হয়েছে", [["admin-orders"]]);
    if (ok) (e.target as HTMLFormElement).reset();
  }

  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>+ কাউকে সরাসরি অ্যাক্সেস দিন</Button>;
  return (
    <form onSubmit={onSubmit} className="surface-card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-56 flex-1">
        <label className="text-xs font-medium text-muted-foreground">গ্রাহকের ইমেইল</label>
        <Input name="email" type="email" required />
      </div>
      <div className="min-w-56 flex-1">
        <label className="text-xs font-medium text-muted-foreground">প্রোডাক্ট / কোর্স</label>
        <select name="item" required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {(items.data ?? []).map((i) => (
            <option key={i.id} value={`${i.kind}:${i.slug}`}>{i.kind === "course" ? "কোর্স" : "প্রোডাক্ট"} — {i.name}</option>
          ))}
        </select>
      </div>
      <Button type="submit">অ্যাক্সেস দিন</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>বন্ধ</Button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

const deliveryLabels: Record<string, string> = { waiting: "অপেক্ষমাণ", processing: "অ্যাক্টিভেশন চলছে", delivered: "ডেলিভারি সম্পন্ন", failed: "সমস্যা হয়েছে" };

function DeliveryEditor({ order }: { order: { id: string; delivery_status: string; delivery_note: string; outlet_slug?: string } }) {
  const save = useServerFn(adminUpdateDelivery);
  const run = useAdminAction();
  const [st, setSt] = useState(order.delivery_status);
  const [note, setNote] = useState(order.delivery_note);
  return (
    <div className="flex w-full basis-full flex-col gap-2 rounded-xl bg-muted/50 p-3 sm:flex-row sm:items-center">
      <span className="text-xs font-semibold text-muted-foreground">ডেলিভারি{order.outlet_slug ? ` • আউটলেট: ${order.outlet_slug}` : ""}</span>
      <select value={st} onChange={(e) => setSt(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
        {Object.entries(deliveryLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <Input className="h-9 flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="গ্রাহকের জন্য বার্তা, যেমন: আপনার ইমেইলে ইনভাইট পাঠানো হয়েছে" maxLength={1000} />
      <Button size="sm" onClick={() => run(() => save({ data: { id: order.id, delivery_status: st as "waiting", delivery_note: note } }), "ডেলিভারি আপডেট হয়েছে", [["admin-orders"]])}>সেভ</Button>
    </div>
  );
}

function ProofLink({ path }: { path: string }) {
  return (
    <button type="button" className="mt-1 block font-semibold text-primary underline"
      onClick={async () => {
        const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 120);
        if (data) window.open(data.signedUrl, "_blank", "noopener"); else toast.error("স্ক্রিনশট খোলা যায়নি");
      }}>
      পেমেন্টের স্ক্রিনশট দেখুন
    </button>
  );
}
