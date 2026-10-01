import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { Logo } from "./Logo";
import { useSetting, type GeneralSettings, type PaymentSettings } from "@/lib/settings";
import { paymentMethods } from "@/lib/payments";

const columns = [
  {
    title: "প্ল্যাটফর্ম",
    links: [
      { to: "/products", label: "ডিজিটাল প্রোডাক্ট" },
      { to: "/courses", label: "অনলাইন কোর্স" },
      { to: "/about", label: "আমাদের সম্পর্কে" },
    ],
  },
  {
    title: "সহায়তা",
    links: [
      { to: "/support", label: "সাপোর্ট" },
      { to: "/faq", label: "সাধারণ প্রশ্ন" },
    ],
  },
  {
    title: "আইনি",
    links: [
      { to: "/privacy", label: "প্রাইভেসি পলিসি" },
      { to: "/terms", label: "শর্তাবলি" },
    ],
  },
] as const;

const social = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "instagram", label: "Instagram", Icon: Instagram },
] as const;

export function Footer() {
  const gen = useSetting<GeneralSettings>("general");
  const pay = useSetting<PaymentSettings>("payment");
  const socials = (gen.data ? social.map(({ key, label, Icon }) => ({ href: gen.data![key] ?? "", label, Icon })) : [])
    .filter((s) => s.href);
  const paymentLine = pay.data
    ? (Object.entries(pay.data) as [keyof PaymentSettings, { enabled: boolean }&Record<string, unknown>][])
        .filter(([, v]) => v.enabled)
        .map(([k]) => paymentMethods[k]?.label ?? (k === "bank" ? "ব্যাংক ট্রান্সফার" : ""))
        .filter(Boolean)
        .join(" • ")
    : "বিকাশ • রকেট • নগদ • ব্যাংক ট্রান্সফার";

  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            বাংলাদেশের জন্য তৈরি ডিজিটাল প্রোডাক্ট ও অনলাইন কোর্সের নিরাপদ প্ল্যাটফর্ম।
          </p>
          <p className="mt-4 text-sm text-subtle-foreground">
            পেমেন্ট: {paymentLine || "শীঘ্রই"}
          </p>
          {socials.length > 0 && (
            <div className="mt-4 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-primary">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-sm text-subtle-foreground">
        © ২০২৬ NENO-VERSE — সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}
