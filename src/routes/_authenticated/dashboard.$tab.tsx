import { createFileRoute, Link } from "@tanstack/react-router";
import { MyOrders, MyProfile } from "@/components/site/DashboardSections";
import { MySupportTickets } from "@/components/site/SupportTickets";

const TITLES: Record<string, string> = { orders: "আমার অর্ডার", support: "সাপোর্ট", profile: "প্রোফাইল" };

export const Route = createFileRoute("/_authenticated/dashboard/$tab")({
  head: ({ params }) => {
    const t = `${TITLES[params.tab] ?? "ড্যাশবোর্ড"} — NENO-VERSE`;
    return { meta: [{ title: t }, { property: "og:title", content: t }, { name: "robots", content: "noindex" }] };
  },
  component: TabPage,
});

function TabPage() {
  const { tab } = Route.useParams();
  if (tab === "orders") return <MyOrders />;
  if (tab === "support") return <MySupportTickets />;
  if (tab === "profile") return <MyProfile />;
  return (
    <p className="text-muted-foreground">
      এই পাতাটি পাওয়া যায়নি। <Link to="/dashboard" className="font-semibold text-primary">লাইব্রেরিতে ফিরুন</Link>
    </p>
  );
}
