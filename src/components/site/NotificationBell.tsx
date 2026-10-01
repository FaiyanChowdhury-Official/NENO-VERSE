import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NotificationBell({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
    refetchInterval: 60_000,
  });
  const unread = (q.data ?? []).filter((n) => !n.read_at).length;

  async function markAll() {
    if (!unread) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
  }

  return (
    <Popover onOpenChange={(o) => o && markAll()}>
      <PopoverTrigger className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="নোটিফিকেশন">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">নোটিফিকেশন</p>
        <div className="max-h-80 overflow-y-auto">
          {(q.data ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই।</p>
          ) : (
            q.data!.map((n) => (
              <Link key={n.id} to="/dashboard" className={`block border-b border-border px-4 py-3 last:border-0 hover:bg-muted ${n.read_at ? "" : "bg-primary-soft/40"}`}>
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[11px] text-subtle-foreground">{new Date(n.created_at).toLocaleString("bn-BD")}</p>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
