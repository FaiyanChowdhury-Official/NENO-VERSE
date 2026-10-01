import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthResult = { data: any; error: { message: string } | null };
const oauth = () => (supabase.auth as any).oauth as {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({ meta: [{ title: "অ্যাপ সংযোগ অনুমোদন — NENO-VERSE" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { redirect: location.pathname + location.searchStr } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8 text-center">অনুরোধটি লোড করা যায়নি: {String((error as Error)?.message ?? error)}</main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "একটি অ্যাপ";

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("রিডাইরেক্ট পাওয়া যায়নি।"); return; }
    window.location.href = target;
  }

  return (
    <main className="mx-auto my-16 max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold text-foreground">{name} আপনার অ্যাকাউন্টে যুক্ত হতে চায়</h1>
      <p className="mt-2 text-sm text-muted-foreground">অনুমোদন দিলে {name} আপনার হয়ে NENO-VERSE-এর ক্যাটালগ ও আপনার অর্ডার দেখতে পারবে।</p>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" disabled={busy} onClick={() => decide(false)}>বাতিল</Button>
        <Button disabled={busy} onClick={() => decide(true)}>অনুমোদন দিন</Button>
      </div>
    </main>
  );
}
