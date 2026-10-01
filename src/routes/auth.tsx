import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["login", "signup"]).optional(),
});

function safePath(p?: string) {
  if (!p) return "/dashboard";
  try {
    const u = new URL(p, "http://x");
    if (p.startsWith("http") && typeof window !== "undefined" && !p.startsWith(window.location.origin)) return "/dashboard";
    return u.pathname + u.search;
  } catch {
    return "/dashboard";
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "লগইন বা অ্যাকাউন্ট খুলুন — NENO-VERSE" },
      { name: "description", content: "NENO-VERSEে লগইন করুন বা নতুন অ্যাকাউন্ট খুলে প্রোডাক্ট ও কোর্স কিনুন।" },
      { property: "og:title", content: "লগইন — NENO-VERSE" },
      { property: "og:description", content: "আপনার NENO-VERSE অ্যাকাউন্টে প্রবেশ করুন।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const target = safePath(search.redirect);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"tabs" | "forgot" | "check-email">("tabs");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ href: target, replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ href: target, replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) toast.error("ইমেইল বা পাসওয়ার্ড সঠিক নয়");
  }

  async function onSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password.length < 8) { toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password,
      options: {
        emailRedirectTo: window.location.origin + target,
        data: { full_name: String(f.get("name")), phone: String(f.get("phone")) },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message.includes("registered") ? "এই ইমেইলে আগেই অ্যাকাউন্ট আছে" : "অ্যাকাউন্ট খোলা যায়নি"); return; }
    if (!data.session) setView("check-email");
  }

  async function onForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(String(f.get("email")), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    toast.success("পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে");
    setView("tabs");
  }

  async function onGoogle() {
    sessionStorage.setItem("post_auth_redirect", target);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Google দিয়ে লগইন করা যায়নি");
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("post_auth_redirect");
    if (saved) sessionStorage.removeItem("post_auth_redirect");
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="surface-card p-6 sm:p-8">
        {view === "check-email" ? (
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">ইমেইল চেক করুন</h1>
            <p className="mt-3 text-muted-foreground">
              আপনার ইমেইলে একটি নিশ্চিতকরণ লিংক পাঠানো হয়েছে। লিংকে ক্লিক করলেই অ্যাকাউন্ট চালু হবে।
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setView("tabs")}>লগইনে ফিরুন</Button>
          </div>
        ) : view === "forgot" ? (
          <form onSubmit={onForgot} className="space-y-4">
            <h1 className="text-2xl font-extrabold text-foreground">পাসওয়ার্ড ভুলে গেছেন?</h1>
            <div className="space-y-2">
              <Label htmlFor="femail">ইমেইল</Label>
              <Input id="femail" name="email" type="email" required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>রিসেট লিংক পাঠান</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setView("tabs")}>ফিরে যান</Button>
          </form>
        ) : (
          <Tabs defaultValue={search.mode ?? "login"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">লগইন</TabsTrigger>
              <TabsTrigger value="signup">অ্যাকাউন্ট খুলুন</TabsTrigger>
            </TabsList>

            <Button type="button" variant="outline" className="mt-6 w-full" onClick={onGoogle}>
              Google দিয়ে চালিয়ে যান
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs text-subtle-foreground">
              <span className="h-px flex-1 bg-border" /> অথবা <span className="h-px flex-1 bg-border" />
            </div>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lemail">ইমেইল</Label>
                  <Input id="lemail" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lpass">পাসওয়ার্ড</Label>
                  <Input id="lpass" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={busy}>লগইন</Button>
                <button type="button" onClick={() => setView("forgot")} className="w-full text-sm font-medium text-primary">
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sname">পুরো নাম</Label>
                  <Input id="sname" name="name" required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sphone">মোবাইল নম্বর</Label>
                  <Input id="sphone" name="phone" type="tel" placeholder="01XXXXXXXXX" required pattern="01[0-9]{9}" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semail">ইমেইল</Label>
                  <Input id="semail" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spass">পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</Label>
                  <Input id="spass" name="password" type="password" required minLength={8} autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={busy}>অ্যাকাউন্ট খুলুন</Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
