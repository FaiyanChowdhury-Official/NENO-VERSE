import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderPlus,
  Star,
  Sparkles,
  Users,
  Wallet,
  Clock,
  Settings,
  LifeBuoy,
  ScrollText,
} from "lucide-react";
import { SettingsPanel, SupportPanel, AuditPanel } from "@/components/admin/OpsPanels";
import { checkIsAdmin, adminListCustomers, adminStats } from "@/lib/admin.functions";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const NAV = [
  { id: "overview", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "orders", label: "অর্ডার", icon: ShoppingCart },
  { id: "items", label: "প্রোডাক্ট ও কোর্স", icon: Package },
  { id: "categories", label: "ক্যাটাগরি", icon: FolderPlus },
  { id: "reviews", label: "রিভিউ", icon: Star },
  { id: "stories", label: "সাফল্যের গল্প", icon: Sparkles },
  { id: "customers", label: "গ্রাহক (CRM)", icon: Users },
  { id: "support", label: "সাপোর্ট টিকিট", icon: LifeBuoy },
  { id: "audit", label: "অডিট লগ", icon: ScrollText },
  { id: "settings", label: "সেটিংস", icon: Settings },
] as const;

type Section = (typeof NAV)[number]["id"];

function AdminPage() {
  const isAdminFn = useServerFn(checkIsAdmin);
  const role = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn() });
  const [section, setSection] = useState<Section>("overview");

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
    <div className="min-h-screen bg-primary-soft/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="sticky top-0 z-20 -mx-3 shrink-0 bg-primary-soft/80 px-3 py-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 lg:w-60">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-card sm:p-3 lg:sticky lg:top-6">
            <p className="hidden px-3 pb-2 pt-1 text-xs lg:block font-semibold uppercase tracking-wide text-subtle-foreground">অ্যাডমিন মেনু</p>
            <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium sm:px-3.5 sm:py-2.5 transition-colors ${
                    section === item.id
                      ? "bg-primary-soft text-primary-soft-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <header className="mb-4 sm:mb-6">
            <h1 className="text-xl font-extrabold text-foreground sm:text-3xl">স্বাগতম, অ্যাডমিন</h1>
            <p className="mt-1 text-sm text-muted-foreground">আপনার ব্যবসার সর্বশেষ অবস্থা এক নজরে।</p>
          </header>

          <StatsRow />

          <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-card sm:mt-6 sm:p-6">
            {section === "overview" && <OverviewPanel onGo={setSection} />}
            {section === "orders" && <OrdersPanel />}
            {section === "items" && <ItemsPanel />}
            {section === "categories" && <CategoriesPanel />}
            {section === "reviews" && <ReviewsPanel />}
            {section === "stories" && <StoriesPanel />}
            {section === "customers" && <CustomersPanel />}
            {section === "support" && <SupportPanel />}
            {section === "audit" && <AuditPanel />}
            {section === "settings" && <SettingsPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatsRow() {
  const statsFn = useServerFn(adminStats);
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const s = stats.data;
  const cards = [
    { label: "মোট আয়", value: s ? formatBdt(s.revenue) : "—", icon: Wallet },
    { label: "মোট অর্ডার", value: s ? String(s.orders) : "—", icon: ShoppingCart },
    { label: "অপেক্ষমাণ অর্ডার", value: s ? String(s.pending) : "—", icon: Clock },
    { label: "গ্রাহক", value: s ? String(s.customers) : "—", icon: Users },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-3.5 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground sm:text-sm">{c.label}</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 bg-primary-soft text-primary-soft-foreground">
              <c.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 truncate text-lg font-extrabold text-foreground sm:text-2xl">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function OverviewPanel({ onGo }: { onGo: (s: Section) => void }) {
  const items = [
    { id: "orders" as Section, title: "অর্ডার পর্যালোচনা", desc: "নতুন পেমেন্ট অনুমোদন বা বাতিল করুন।", icon: ShoppingCart },
    { id: "items" as Section, title: "প্রোডাক্ট ও কোর্স", desc: "দাম, অ্যাক্সেস ধরন, ভিডিও ও লিংক পরিচালনা।", icon: Package },
    { id: "categories" as Section, title: "ক্যাটাগরি", desc: "নতুন ক্যাটাগরি তৈরি, সম্পাদনা বা মুছুন।", icon: FolderPlus },
    { id: "reviews" as Section, title: "রিভিউ", desc: "গ্রাহকের রিভিউ অনুমোদন করুন।", icon: Star },
    { id: "stories" as Section, title: "সাফল্যের গল্প", desc: "হোমপেজের গল্প যোগ বা সম্পাদনা করুন।", icon: Sparkles },
    { id: "customers" as Section, title: "গ্রাহক (CRM)", desc: "গ্রাহকের তথ্য ও খরচ দেখুন।", icon: Users },
    { id: "support" as Section, title: "সাপোর্ট টিকিট", desc: "গ্রাহকের প্রশ্নের উত্তর দিন।", icon: LifeBuoy },
    { id: "settings" as Section, title: "সেটিংস", desc: "বিকাশ/রকেট/ব্যাংক তথ্য ও যোগাযোগ।", icon: Settings },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onGo(it.id)}
          className="rounded-2xl border border-border bg-background p-5 text-left transition-shadow hover:shadow-lift"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <it.icon className="h-5 w-5" />
          </span>
          <p className="mt-3 font-bold text-foreground">{it.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
        </button>
      ))}
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
      <Input className="w-full sm:max-w-xs" placeholder="নাম, ফোন, ইমেইল দিয়ে খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-subtle-foreground">
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
