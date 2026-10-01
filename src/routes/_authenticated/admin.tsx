import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { adminListCustomers, adminListOrders, adminUpdateOrder, checkIsAdmin } from "@/lib/admin.functions";
import { orderStatusLabels, paymentMethods } from "@/lib/payments";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন প্যানেল — অক্টোপাস" },
      { name: "description", content: "অর্ডার যাচাই ও গ্রাহক ব্যবস্থাপনা।" },
      { property: "og:title", content: "অ্যাডমিন — অক্টোপাস" },
      { property: "og:description", content: "অভ্যন্তরীণ প্যানেল।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const isAdminFn = useServerFn(checkIsAdmin);
  const role = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn() });
  if (role.isLoading) return <p className="py-24 text-center text-muted-foreground">লোড হচ্ছে...</p>;
  if (!role.data?.isAdmin) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">এই পেজে প্রবেশের অনুমতি নেই।</p>
        <Button asChild className="mt-6"><Link to="/dashboard">ড্যাশবোর্ডে ফিরুন</Link></Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground">অ্যাডমিন প্যানেল</h1>
      <Tabs defaultValue="orders" className="mt-6">
        <TabsList>
          <TabsTrigger value="orders">অর্ডার</TabsTrigger>
          <TabsTrigger value="customers">গ্রাহক (CRM)</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6"><OrdersPanel /></TabsContent>
        <TabsContent value="customers" className="mt-6"><CustomersPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

const statusStyle = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-primary-soft text-primary-soft-foreground",
  rejected: "bg-destructive/10 text-destructive",
} as const;

function OrdersPanel() {
  const list = useServerFn(adminListOrders);
  const update = useServerFn(adminUpdateOrder);
  const qc = useQueryClient();
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

  async function setStatus(id: string, status: "approved" | "rejected") {
    try {
      await update({ data: { id, status } });
      toast.success(status === "approved" ? "অনুমোদিত হয়েছে" : "বাতিল করা হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch {
      toast.error("আপডেট হয়নি");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="যাচাই বাকি" value={String(stats.pending)} />
        <Stat label="মোট আয় (অনুমোদিত)" value={formatBdt(stats.revenue)} />
        <Stat label="মোট অর্ডার" value={String(stats.total)} />
      </div>
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
                <p className="text-sm text-muted-foreground">
                  {o.customer_name || "নাম নেই"} • {o.customer_phone}
                </p>
                <p className="text-xs text-subtle-foreground">
                  {paymentMethods[o.payment_method].label} • প্রেরক: {o.sender_number} • TrxID: <b>{o.transaction_id}</b> •{" "}
                  {new Date(o.created_at).toLocaleString("bn-BD")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-foreground">{formatBdt(o.amount)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[o.status]}`}>{orderStatusLabels[o.status]}</span>
                {o.status !== "approved" && <Button size="sm" onClick={() => setStatus(o.id, "approved")}>অনুমোদন</Button>}
                {o.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => setStatus(o.id, "rejected")}>বাতিল</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersPanel() {
  const list = useServerFn(adminListCustomers);
  const customers = useQuery({ queryKey: ["admin-customers"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const rows = (customers.data ?? []).filter(
    (c) => !q || `${c.full_name} ${c.phone} ${c.email}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <Input className="max-w-xs" placeholder="নাম, ফোন, ইমেইল দিয়ে খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-subtle-foreground">
            <tr className="border-b border-border">
              <th className="p-3">নাম</th><th className="p-3">ফোন</th><th className="p-3">ইমেইল</th>
              <th className="p-3">অর্ডার</th><th className="p-3">মোট খরচ</th><th className="p-3">যোগদান</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-foreground">{c.full_name || "—"}</td>
                <td className="p-3">{c.phone || "—"}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.orderCount}</td>
                <td className="p-3">{formatBdt(c.spent)}</td>
                <td className="p-3">{new Date(c.created_at).toLocaleDateString("bn-BD")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.isLoading && <p className="p-4 text-muted-foreground">লোড হচ্ছে...</p>}
      </div>
    </div>
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
