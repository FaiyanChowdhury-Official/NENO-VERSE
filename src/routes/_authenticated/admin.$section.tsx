import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { ADMIN_NAV, canOpen, type AdminSlug } from "@/components/admin/nav";
import { useStaffAccess } from "@/components/admin/useStaffAccess";
import { SettingsPanel, SupportPanel, AuditPanel, AnalyticsPanel, OutletsPanel, StorefrontPanel, SecurityPanel } from "@/components/admin/OpsPanels";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { ItemsPanel } from "@/components/admin/ItemsPanel";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { ContactsPanel } from "@/components/admin/ContactsPanel";
import { ReviewsPanel, StoriesPanel } from "@/components/admin/ReviewsPanel";
import { CustomersPanel } from "@/components/admin/CustomersPanel";
import { StaffPanel } from "@/components/admin/StaffPanel";

const PANELS: Record<AdminSlug, ComponentType> = {
  orders: OrdersPanel,
  analytics: AnalyticsPanel,
  customers: CustomersPanel,
  products: ItemsPanel,
  categories: CategoriesPanel,
  channels: OutletsPanel,
  reviews: ReviewsPanel,
  stories: StoriesPanel,
  messages: ContactsPanel,
  support: SupportPanel,
  storefront: StorefrontPanel,
  staff: StaffPanel,
  security: SecurityPanel,
  audit: AuditPanel,
  settings: SettingsPanel,
};

export const Route = createFileRoute("/_authenticated/admin/$section")({
  head: ({ params }) => {
    const n = ADMIN_NAV.find((x) => x.slug === params.section);
    const t = `${n?.label ?? "অ্যাডমিন"} — অক্টোপাস অ্যাডমিন`;
    return { meta: [{ title: t }, { property: "og:title", content: t }, { name: "robots", content: "noindex" }] };
  },
  component: SectionPage,
});

function SectionPage() {
  const { section } = Route.useParams();
  const access = useStaffAccess();
  const nav = ADMIN_NAV.find((n) => n.slug === section);
  if (!access.data) return null;
  if (!nav) return <Missing text="এই পাতাটি পাওয়া যায়নি।" />;
  if (!canOpen(nav.area, access.data)) return <Missing text="এই অংশ দেখার অনুমতি আপনার রোলে নেই।" />;
  const Panel = PANELS[nav.slug];
  return <Panel />;
}

function Missing({ text }: { text: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">{text}</p>
      <Link to="/admin" className="mt-4 inline-block font-semibold text-primary">অ্যাডমিন ড্যাশবোর্ডে ফিরুন</Link>
    </div>
  );
}
