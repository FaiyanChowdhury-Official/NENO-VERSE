import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { checkIsAdmin, adminListCustomers } from "@/lib/admin.functions";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { ItemsPanel } from "@/components/admin/ItemsPanel";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { ReviewsPanel, StoriesPanel } from "@/components/admin/ReviewsPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন প্যানেল — অক্টোপাস" },
      { name: "description", content: "প্রোডাক্ট, কোর্স, অর্ডার ও গ্রাহক ব্যবস্থাপনা।" },
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
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="orders">অর্ডার</TabsTrigger>
          <TabsTrigger value="items">প্রোডাক্ট ও কোর্স</TabsTrigger>
          <TabsTrigger value="categories">ক্যাটাগরি</TabsTrigger>
          <TabsTrigger value="reviews">রিভিউ</TabsTrigger>
          <TabsTrigger value="stories">সাফল্যের গল্প</TabsTrigger>
          <TabsTrigger value="customers">গ্রাহক (CRM)</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6"><OrdersPanel /></TabsContent>
        <TabsContent value="items" className="mt-6"><ItemsPanel /></TabsContent>
        <TabsContent value="categories" className="mt-6"><CategoriesPanel /></TabsContent>
        <TabsContent value="reviews" className="mt-6"><ReviewsPanel /></TabsContent>
        <TabsContent value="stories" className="mt-6"><StoriesPanel /></TabsContent>
        <TabsContent value="customers" className="mt-6"><CustomersPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function CustomersPanel() {
  const list = useServerFn(adminListCustomers);
  const customers = useQuery({ queryKey: ["admin-customers"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const rows = (customers.data ?? []).filter((c) => !q || `${c.full_name} ${c.phone} ${c.email}`.toLowerCase().includes(q.toLowerCase()));
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
