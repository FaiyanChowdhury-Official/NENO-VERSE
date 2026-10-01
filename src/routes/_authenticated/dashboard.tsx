import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getMyProfile, listMyOrders, updateMyProfile } from "@/lib/orders.functions";
import { orderStatusLabels, paymentMethods } from "@/lib/payments";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "আমার ড্যাশবোর্ড — অক্টোপাস" },
      { name: "description", content: "আপনার কেনা প্রোডাক্ট, কোর্স ও অর্ডারের অবস্থা দেখুন।" },
      { property: "og:title", content: "আমার ড্যাশবোর্ড — অক্টোপাস" },
      { property: "og:description", content: "আপনার লাইব্রেরি ও অর্ডার।" },
    ],
  }),
  component: Dashboard,
});

const statusStyle = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-primary-soft text-primary-soft-foreground",
  rejected: "bg-destructive/10 text-destructive",
} as const;

function Dashboard() {
  const fetchOrders = useServerFn(listMyOrders);
  const fetchProfile = useServerFn(getMyProfile);
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const owned = (orders.data ?? []).filter((o) => o.status === "approved");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground">
        স্বাগতম{profile.data?.fullName ? `, ${profile.data.fullName}` : ""}!
      </h1>

      <Tabs defaultValue="library" className="mt-8">
        <TabsList>
          <TabsTrigger value="library">আমার লাইব্রেরি</TabsTrigger>
          <TabsTrigger value="orders">অর্ডার</TabsTrigger>
          <TabsTrigger value="profile">প্রোফাইল</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          {orders.isLoading ? (
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
                <div key={o.id} className="surface-card p-5">
                  <p className="text-xs font-medium text-subtle-foreground">{o.item_type === "course" ? "কোর্স" : "ডিজিটাল প্রোডাক্ট"}</p>
                  <h3 className="mt-1 font-bold text-foreground">{o.item_name}</h3>
                  {o.item_type === "course" ? (
                    <Button asChild size="sm" className="mt-4">
                      <Link to="/learn/$slug" params={{ slug: o.item_slug }}>ক্লাস শুরু করুন</Link>
                    </Button>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">ডাউনলোড ফাইল শীঘ্রই এখানে চালু হবে।</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {(orders.data ?? []).length === 0 ? (
            <p className="text-muted-foreground">কোনো অর্ডার নেই।</p>
          ) : (
            <div className="space-y-3">
              {orders.data!.map((o) => (
                <div key={o.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-foreground">{o.item_name}</p>
                    <p className="text-xs text-subtle-foreground">
                      {paymentMethods[o.payment_method].label} • TrxID: {o.transaction_id} •{" "}
                      {new Date(o.created_at).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{formatBdt(o.amount)}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[o.status]}`}>
                      {orderStatusLabels[o.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          {profile.data && <ProfileForm initial={profile.data} />}
        </TabsContent>
      </Tabs>
    </div>
  );
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
