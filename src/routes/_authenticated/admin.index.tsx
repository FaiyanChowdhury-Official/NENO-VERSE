import { createFileRoute, Link } from "@tanstack/react-router";
import { ADMIN_NAV, CHIPS, canOpen } from "@/components/admin/nav";
import { useStaffAccess } from "@/components/admin/useStaffAccess";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

function Overview() {
  const access = useStaffAccess();
  if (!access.data) return null;
  const items = ADMIN_NAV.filter((n) => canOpen(n.area, access.data));
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((it) => (
        <Link
          key={it.slug}
          to="/admin/$section"
          params={{ section: it.slug }}
          className="rounded-2xl border border-border bg-background p-5 text-left transition-shadow hover:shadow-lift"
        >
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${CHIPS[it.chip]}`}><it.icon className="h-5 w-5" /></span>
          <p className="mt-3 font-bold text-foreground">{it.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
        </Link>
      ))}
    </div>
  );
}
