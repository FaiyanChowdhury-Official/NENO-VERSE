import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

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

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            বাংলাদেশের জন্য তৈরি ডিজিটাল প্রোডাক্ট ও অনলাইন কোর্সের নিরাপদ প্ল্যাটফর্ম।
          </p>
          <p className="mt-4 text-sm text-subtle-foreground">
            পেমেন্ট: বিকাশ • রকেট • ব্যাংক ট্রান্সফার
          </p>
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
