import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/site/NotificationBell";
import { Logo } from "./Logo";

const navItems = [
  { to: "/", label: "হোম" },
  { to: "/products", label: "ডিজিটাল প্রোডাক্ট" },
  { to: "/courses", label: "কোর্স" },
  { to: "/support", label: "সহায়তা" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }


  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-primary-soft text-primary-soft-foreground" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link to="/search" aria-label="খুঁজুন" className="ml-auto rounded-full p-2 text-muted-foreground hover:bg-primary-soft hover:text-foreground md:ml-0">
          <Search className="size-5" />
        </Link>
        {user && <div className="md:hidden"><NotificationBell userId={user.id} /></div>}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">ড্যাশবোর্ড</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={signOut}>
                লগআউট
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">লগইন</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-5 font-semibold">
                <Link to="/auth" search={{ mode: "signup" }}>অ্যাকাউন্ট খুলুন</Link>
              </Button>
            </>
          )}
        </div>


        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="মেনু">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">মেনু</SheetTitle>
            <div className="mt-8 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-primary-soft"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link to="/dashboard">ড্যাশবোর্ড</Link>
                    </Button>
                    <Button variant="outline" onClick={() => { setOpen(false); void signOut(); }}>
                      লগআউট
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link to="/auth">লগইন</Link>
                    </Button>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link to="/auth" search={{ mode: "signup" }}>অ্যাকাউন্ট খুলুন</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
