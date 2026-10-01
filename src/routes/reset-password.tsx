import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "নতুন পাসওয়ার্ড — অক্টোপাস" },
      { name: "description", content: "আপনার অক্টোপাস অ্যাকাউন্টের নতুন পাসওয়ার্ড সেট করুন।" },
      { property: "og:title", content: "নতুন পাসওয়ার্ড — অক্টোপাস" },
      { property: "og:description", content: "পাসওয়ার্ড রিসেট করুন।" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    if (password.length < 8) return toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error("পাসওয়ার্ড পরিবর্তন হয়নি। লিংকটি আবার চেষ্টা করুন।");
    toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <form onSubmit={onSubmit} className="surface-card space-y-4 p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-foreground">নতুন পাসওয়ার্ড সেট করুন</h1>
        <div className="space-y-2">
          <Label htmlFor="np">নতুন পাসওয়ার্ড</Label>
          <Input id="np" name="password" type="password" required minLength={8} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>সংরক্ষণ করুন</Button>
      </form>
    </div>
  );
}
