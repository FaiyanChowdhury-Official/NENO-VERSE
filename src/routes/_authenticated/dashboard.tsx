import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";
import { useStaffAccess } from "@/components/admin/useStaffAccess";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "আমার ড্যাশবোর্ড — NENO-VERSE" },
      { name: "description", content: "আপনার কেনা প্রোডাক্ট, কোর্স ও অর্ডারের অবস্থা দেখুন।" },
      { property: "og:title", content: "আমার ড্যাশবোর্ড — NENO-VERSE" },
      { property: "og:description", content: "আপনার লাইব্রেরি ও অর্ডার।" },
    ],
  }),
  component: DashboardLayout,
});

const tab = "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const tabActive = "rounded-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground shadow-card";

function DashboardLayout() {
  const fetchProfile = useServerFn(getMyProfile);
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const role = useStaffAccess();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-foreground">
        স্বাগতম{profile.data?.fullName ? `, ${profile.data.fullName}` : ""}!
      </h1>
      {role.data?.isAdmin && (
        <Button asChild variant="outline" className="mt-4"><Link to="/admin">অ্যাডমিন প্যানেল</Link></Button>
      )}
      <nav className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5">
        <Link to="/dashboard" activeOptions={{ exact: true }} className={tab} activeProps={{ className: tabActive }}>আমার লাইব্রেরি</Link>
        <Link to="/dashboard/$tab" params={{ tab: "orders" }} className={tab} activeProps={{ className: tabActive }}>অর্ডার</Link>
        <Link to="/dashboard/$tab" params={{ tab: "support" }} className={tab} activeProps={{ className: tabActive }}>সাপোর্ট</Link>
        <Link to="/dashboard/$tab" params={{ tab: "profile" }} className={tab} activeProps={{ className: tabActive }}>প্রোফাইল</Link>
      </nav>
      <div className="mt-6"><Outlet /></div>
    </div>
  );
}
