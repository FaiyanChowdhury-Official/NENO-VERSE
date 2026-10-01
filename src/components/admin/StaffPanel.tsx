import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { adminAddStaff, adminListStaff, adminRemoveStaff, type StaffRole } from "@/lib/admin.functions";
import { ROLE_LABELS } from "@/components/admin/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_HELP: Record<StaffRole, string> = {
  admin: "সব কিছু — সেটিংস, স্টাফ, নিরাপত্তা সহ।",
  content_manager: "প্রোডাক্ট, কোর্স, ভিডিও, ক্যাটাগরি, রিভিউ, সাফল্যের গল্প, বিক্রয় চ্যানেল।",
  finance_manager: "অর্ডার ও পেমেন্ট যাচাই, অ্যানালিটিক্স, গ্রাহক তালিকা।",
  support_manager: "সাপোর্ট টিকিট ও যোগাযোগ বার্তা।",
};

export function StaffPanel() {
  const list = useServerFn(adminListStaff);
  const add = useServerFn(adminAddStaff);
  const remove = useServerFn(adminRemoveStaff);
  const qc = useQueryClient();
  const staff = useQuery({ queryKey: ["admin-staff"], queryFn: () => list() });
  const [role, setRole] = useState<StaffRole>("content_manager");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    setBusy(true);
    try {
      await add({ data: { email, role } });
      toast.success("রোল দেওয়া হয়েছে");
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "যোগ করা যায়নি");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    try {
      await remove({ data: { id } });
      toast.success("রোল সরানো হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "সরানো যায়নি");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">স্টাফ ও রোল</h2>
        <p className="text-sm text-muted-foreground">প্রত্যেক স্টাফ শুধু নিজের কাজের অংশ দেখতে ও পরিচালনা করতে পারবেন।</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-border bg-background p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="staff-email">স্টাফের ইমেইল (আগে রেজিস্টার করা থাকতে হবে)</Label>
          <Input id="staff-email" name="email" type="email" required maxLength={255} placeholder="name@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-role">রোল</Label>
          <select
            id="staff-role"
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {(Object.keys(ROLE_HELP) as StaffRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={busy}>রোল দিন</Button>
        <p className="text-xs text-muted-foreground sm:col-span-3">{ROLE_HELP[role]}</p>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-subtle-foreground">
            <tr className="border-b border-border"><th className="p-3">নাম</th><th className="p-3">ইমেইল</th><th className="p-3">রোল</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {(staff.data ?? []).map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-foreground">{s.name || "—"}</td>
                <td className="p-3">{s.email}</td>
                <td className="p-3"><span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-soft-foreground">{ROLE_LABELS[s.role]}</span></td>
                <td className="p-3 text-right">
                  {!(s.isSelf && s.role === "admin") && (
                    <Button size="sm" variant="ghost" onClick={() => onRemove(s.id)} aria-label="রোল সরান"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staff.isLoading && <p className="p-4 text-muted-foreground">লোড হচ্ছে...</p>}
      </div>
    </div>
  );
}
