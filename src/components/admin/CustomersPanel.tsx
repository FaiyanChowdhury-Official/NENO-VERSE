import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListCustomers } from "@/lib/admin.functions";
import { formatBdt } from "@/lib/format";
import { Input } from "@/components/ui/input";

export function CustomersPanel() {
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
