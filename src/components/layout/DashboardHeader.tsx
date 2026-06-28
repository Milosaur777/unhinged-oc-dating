"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, LogOut, Heart, Flame, MessageCircle, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/components/auth/AuthProvider";
import { getIncomingLikes } from "@/lib/supabase-queries";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/swipe", label: "Swipe", icon: Flame },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/likes", label: "Likes", icon: Heart },
];

export function DashboardHeader() {
  const { user, isGuest, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
        if (isGuest || !user || "is_guest" in user) {
          return;
        }
        const realUser = user;

        async function load() {
          try {
            const supabaseModule = await import("@/lib/supabase");
            const supabase = supabaseModule.createClient();
            const { data: ocs } = await supabase.from("ocs").select("id").eq("user_id", realUser.id);
            const ids = ocs?.map((o) => o.id) ?? [];
            if (ids.length === 0) return;
            const likes = await getIncomingLikes(ids);
            setLikesCount(likes.length);
          } catch {
            setLikesCount(0);
          }
        }
        load();
  }, [user, isGuest]);

  async function handleLogout() {
    await logout();
    router.push("/auth");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Flame className="size-5 text-primary" />
          <span>Unhinged</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname === link.href && "bg-muted text-foreground"
              )}
            >
              <link.icon className="size-4" />
              {link.label}
              {link.href === "/likes" && likesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {likesCount > 9 ? "9+" : likesCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/creator"
            className={cn(
              "hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex",
              pathname === "/creator" && "bg-muted text-foreground"
            )}
          >
            <User className="size-4" />
            Creator
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            className="hidden md:flex"
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-64 border-border bg-card">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex flex-col gap-2 pt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <link.icon className="size-4" />
                      {link.label}
                    </span>
                    {link.href === "/likes" && likesCount > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {likesCount > 9 ? "9+" : likesCount}
                      </span>
                    )}
                  </Link>
                ))}
                <Link
                  href="/creator"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === "/creator"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <User className="size-4" />
                  Creator
                </Link>
                <Button
                  variant="outline"
                  className="mt-4 justify-start gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
