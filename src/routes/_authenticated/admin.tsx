import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Clock, Users, ShoppingCart } from "lucide-react";
import { adminStats } from "@/lib/admin.functions";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV, CHIPS, OVERVIEW_ICON, ROLE_LABELS, canOpen } from "@/components/admin/nav";
import { useStaffAccess } from "@/components/admin/useStaffAccess";

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
  component: AdminLayout,
});

const navCls = "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium sm:px-3.5 sm:py-2.5 transition-colors text-muted-foreground hover:bg-muted hover:text-foreground";
const activeCls = "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium sm:px-3.5 sm:py-2.5 bg-foreground text-background shadow-card";

function AdminLayout() {
  const access = useStaffAccess();

  if (access.isLoading) return <p className="py-24 text-center text-muted-foreground">লোড হচ্ছে...</p>;
  const a = access.data;
  if (!a?.isAdmin) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">এই পেজে প্রবেশের অনুমতি নেই।</p>
        <Button asChild className="mt-6"><Link to="/dashboard">ড্যাশবোর্ডে ফিরুন</Link></Button>
      </div>
    );
  }
  const nav = ADMIN_NAV.filter((n) => canOpen(n.area, a));
  const roleText = a.isFullAdmin ? "অ্যাডমিন" : a.roles.map((r) => ROLE_LABELS[r]).filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6 lg:flex-row">
        <aside className="sticky top-0 z-20 -mx-3 shrink-0 bg-background/90 px-3 py-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 lg:w-60">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-card sm:p-3 lg:sticky lg:top-6">
            <p className="hidden px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-subtle-foreground lg:block">অ্যাডমিন মেনু</p>
            <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col">
              <Link to="/admin" activeOptions={{ exact: true }} className={navCls} activeProps={{ className: activeCls }}>
                <span className={`flex size-7 items-center justify-center rounded-lg ${CHIPS[0]}`}><OVERVIEW_ICON className="h-4 w-4" /></span>
                ড্যাশবোর্ড
              </Link>
              {nav.map((item) => (
                <Link key={item.slug} to="/admin/$section" params={{ section: item.slug }} className={navCls} activeProps={{ className: activeCls }}>
                  <span className={`flex size-7 items-center justify-center rounded-lg ${CHIPS[item.chip]}`}><item.icon className="h-4 w-4" /></span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-4 sm:mb-6">
            <h1 className="text-xl font-extrabold text-foreground sm:text-3xl">স্বাগতম, {roleText}</h1>
            <p className="mt-1 text-sm text-muted-foreground">আপনার কাজের অংশ এক নজরে।</p>
          </header>
          {a.areas.includes("finance") && <StatsRow />}
          <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-card sm:mt-6 sm:p-6">
            <Outlet />
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
    { label: "মোট আয়", value: s ? formatBdt(s.revenue) : "—", icon: Wallet, chip: 0 },
    { label: "মোট অর্ডার", value: s ? String(s.orders) : "—", icon: ShoppingCart, chip: 3 },
    { label: "অপেক্ষমাণ অর্ডার", value: s ? String(s.pending) : "—", icon: Clock, chip: 4 },
    { label: "গ্রাহক", value: s ? String(s.customers) : "—", icon: Users, chip: 2 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-3.5 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground sm:text-sm">{c.label}</p>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${CHIPS[c.chip]}`}><c.icon className="h-4 w-4" /></span>
          </div>
          <p className="mt-2 truncate text-lg font-extrabold text-foreground sm:text-2xl">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
