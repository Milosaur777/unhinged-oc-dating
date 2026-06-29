"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  LogOut,
  Heart,
  Flame,
  MessageCircle,
  Home,
  User,
  Bell,
  ChevronDown,
  Settings,
  ExternalLink,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import { getIncomingLikes, getProfile } from "@/lib/supabase-queries";
import { cn, getPublicImageUrl, getInitials } from "@/lib/utils";
import { toast } from "sonner";

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/swipe", label: "Swipe", icon: Flame },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/likes", label: "Likes", icon: Heart },
];

export function DashboardHeader() {
  const { user, isGuest, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creatorAvatarUrl, setCreatorAvatarUrl] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string>("");

  useEffect(() => {
    if (isGuest || !user || "is_guest" in user) return;
    getProfile(user.id)
      .then((profile) => {
        setCreatorAvatarUrl(profile?.creator_avatar_url ?? null);
        setCreatorName(profile?.creator_name || profile?.display_name || user.email || "");
      })
      .catch(() => {
        setCreatorAvatarUrl(null);
        setCreatorName(user.email || "");
      });
  }, [user, isGuest]);

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
    router.push("/");
  }

  return (
    <>
      {/* Desktop: sticky top bar */}
      <header className="sticky top-0 z-40 hidden border-b border-white/10 bg-background/95 backdrop-blur-sm md:block">
        <div className="flex h-14 w-full items-center px-2.5">
          <Link href="/" className="flex shrink-0 items-center text-lg font-bold text-foreground">
            <Image
              src="/icon.avif"
              alt="Unhinged"
              width={40}
              height={40}
              className="size-10 object-contain"
            />
          </Link>

          <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground",
                  pathname === link.href
                    ? "bg-white/10 text-foreground"
                    : "hover:bg-white/5",
                  pathname === link.href && link.href === "/" && "active-glow"
                )}
              >
                {pathname === link.href && link.href === "/" && (
                  <span className="pointer-events-none absolute inset-0 animate-light-beam rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                )}
                <link.icon className="relative z-10 size-3.5" />
                <span className="relative z-10">{link.label}</span>
                {link.href === "/likes" && likesCount > 0 && (
                  <span className="absolute -top-1 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                    {likesCount > 9 ? "9+" : likesCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="relative rounded-full"
                    aria-label="Notifications"
                  >
                    <Bell className="size-4" />
                    {likesCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,45,123,0.8)]" />
                    )}
                  </Button>
                }
              />
              <TooltipContent side="bottom">Updates &amp; announcements coming soon</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-1 rounded-full px-1.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      pathname === "/creator" && "bg-white/10 text-foreground"
                    )}
                  >
                    <Avatar size="sm" className="size-10">
                      <AvatarImage src={getPublicImageUrl(creatorAvatarUrl)} alt={creatorName || "Creator"} />
                      <AvatarFallback className="text-xs">
                        {creatorName ? getInitials(creatorName) : <User className="size-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="size-4 opacity-70" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  render={
                    <Link href="/creator" className="cursor-pointer">
                      <User className="mr-2 size-4" />
                      Profile
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link href="/creator" className="cursor-pointer">
                      <Settings className="mr-2 size-4" />
                      Settings
                    </Link>
                  }
                />
                <DropdownMenuItem
                  disabled
                  className="cursor-not-allowed"
                  onClick={() => toast.info("Account switching is coming soon")}
                >
                  <Users className="mr-2 size-4" />
                  Switch Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="rounded-full"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile: sticky top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/95 backdrop-blur-sm md:hidden">
        <div className="flex h-12 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Image
              src="/icon.avif"
              alt="Unhinged"
              width={36}
              height={36}
              className="size-9 object-contain"
            />
          </Link>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="relative"
                    aria-label="Notifications"
                  >
                    <Bell className="size-4" />
                    {likesCount > 0 && (
                      <span className="absolute top-1 right-1 size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,45,123,0.8)]" />
                    )}
                  </Button>
                }
              />
              <TooltipContent side="bottom">Updates &amp; announcements coming soon</TooltipContent>
            </Tooltip>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Open menu">
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-64 border-white/10 bg-[#0a0a14]/95 backdrop-blur-xl">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <div className="flex flex-col gap-2 pt-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        pathname === link.href
                          ? "bg-white/10 text-foreground shadow-[0_0_12px_rgba(255,45,123,0.2)]"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
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
                      "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      pathname === "/creator"
                        ? "bg-white/10 text-foreground shadow-[0_0_12px_rgba(255,45,123,0.2)]"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <User className="size-4" />
                    Creator
                  </Link>
                  <a
                    href="https://ko-fi.com/unhinged"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                    Support Unhinged
                  </a>
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
    </>
  );
}
