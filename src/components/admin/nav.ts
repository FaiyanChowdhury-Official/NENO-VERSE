import {
  LayoutDashboard, ShoppingCart, Package, FolderPlus, Star, Sparkles, Users, Settings,
  LifeBuoy, ScrollText, BarChart3, Store, Share2, ShieldCheck, Inbox, UserCog,
} from "lucide-react";

export const CHIPS = [
  "bg-primary text-primary-foreground shadow-sm",
  "bg-chip-violet text-primary-foreground shadow-sm",
  "bg-chip-sky text-primary-foreground shadow-sm",
  "bg-chip-rose text-primary-foreground shadow-sm",
  "bg-chip-amber text-primary-foreground shadow-sm",
  "bg-teal text-teal-foreground shadow-sm",
] as const;

/** area: which staff role may open it. "admin" = full admin only, "any" = every staff member. */
export type NavArea = "any" | "content" | "finance" | "support" | "admin";

export const ADMIN_NAV = [
  { slug: "orders", label: "অর্ডার", icon: ShoppingCart, chip: 3, area: "finance", desc: "নতুন পেমেন্ট অনুমোদন বা বাতিল করুন।" },
  { slug: "analytics", label: "অ্যানালিটিক্স", icon: BarChart3, chip: 2, area: "finance", desc: "বিক্রি ও আয়ের হিসাব।" },
  { slug: "customers", label: "গ্রাহক (CRM)", icon: Users, chip: 2, area: "finance", desc: "গ্রাহকের তথ্য ও খরচ দেখুন।" },
  { slug: "products", label: "প্রোডাক্ট ও কোর্স", icon: Package, chip: 5, area: "content", desc: "দাম, অ্যাক্সেস ধরন, ভিডিও ও লিংক পরিচালনা।" },
  { slug: "categories", label: "ক্যাটাগরি", icon: FolderPlus, chip: 1, area: "content", desc: "নতুন ক্যাটাগরি তৈরি, সম্পাদনা বা মুছুন।" },
  { slug: "channels", label: "বিক্রয় চ্যানেল", icon: Share2, chip: 1, area: "content", desc: "আউটলেট ও বিক্রয় চ্যানেল।" },
  { slug: "reviews", label: "রিভিউ", icon: Star, chip: 4, area: "content", desc: "গ্রাহকের রিভিউ অনুমোদন করুন।" },
  { slug: "stories", label: "সাফল্যের গল্প", icon: Sparkles, chip: 3, area: "content", desc: "হোমপেজের গল্প যোগ বা সম্পাদনা করুন।" },
  { slug: "messages", label: "যোগাযোগ বার্তা", icon: Inbox, chip: 5, area: "support", desc: "ওয়েবসাইট থেকে আসা বার্তা।" },
  { slug: "support", label: "সাপোর্ট টিকিট", icon: LifeBuoy, chip: 1, area: "support", desc: "গ্রাহকের প্রশ্নের উত্তর দিন।" },
  { slug: "storefront", label: "স্টোরফ্রন্ট সেটিংস", icon: Store, chip: 4, area: "admin", desc: "হোমপেজের লেখা ও অংশ।" },
  { slug: "staff", label: "স্টাফ ও রোল", icon: UserCog, chip: 3, area: "admin", desc: "কনটেন্ট, ফাইন্যান্স ও সাপোর্ট ম্যানেজার যোগ করুন।" },
  { slug: "security", label: "অ্যাক্সেস নিরাপত্তা", icon: ShieldCheck, chip: 0, area: "admin", desc: "ডিভাইস ও অ্যাক্সেস লগ।" },
  { slug: "audit", label: "অডিট লগ", icon: ScrollText, chip: 4, area: "admin", desc: "কে কখন কী পরিবর্তন করেছে।" },
  { slug: "settings", label: "সেটিংস", icon: Settings, chip: 2, area: "admin", desc: "বিকাশ/রকেট/ব্যাংক তথ্য ও যোগাযোগ।" },
] as const;

export type AdminSlug = (typeof ADMIN_NAV)[number]["slug"];
export const OVERVIEW_ICON = LayoutDashboard;

export function canOpen(area: NavArea, access: { isFullAdmin: boolean; areas: string[] }) {
  if (access.isFullAdmin || area === "any") return true;
  if (area === "admin") return false;
  return access.areas.includes(area);
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "পূর্ণ অ্যাডমিন",
  content_manager: "কনটেন্ট ম্যানেজার",
  finance_manager: "ফাইন্যান্স ম্যানেজার",
  support_manager: "সাপোর্ট ম্যানেজার",
};
