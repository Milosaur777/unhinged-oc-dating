"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
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
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <span key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={cn(
                      "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground",
                      isActive
                        ? "bg-white/10 text-foreground active-glow"
                        : "hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <span className="pointer-events-none absolute inset-0 animate-light-beam rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    )}
                    <link.icon className="relative z-10 size-3.5" />
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                  {link.href === "/likes" && likesCount > 0 && (
                    <span className="absolute -top-2 left-1/2 z-30 flex min-w-[18px] -translate-x-1/2 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-[0_0_8px_rgba(255,45,123,0.6)]">
                      {likesCount > 99 ? "99+" : likesCount}
                    </span>
                  )}
                </span>
              );
            })}
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
                    <Avatar className="size-[44px]">
                      <AvatarImage src={getPublicImageUrl(creatorAvatarUrl)} alt={creatorName || "Creator"} />
                      <AvatarFallback className="text-xs">
                        {creatorName ? getInitials(creatorName) : <User className="size-5" />}
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
        <div className="flex h-12 items-center px-3">
          <Link href="/" className="flex shrink-0 items-center text-lg font-bold text-foreground">
            <Image
              src="/icon.avif"
              alt="Unhinged"
              width={36}
              height={36}
              className="size-9 object-contain"
            />
          </Link>

          <nav className="flex flex-1 items-center justify-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <span key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={cn(
                      "relative flex items-center justify-center overflow-hidden rounded-full p-2 text-muted-foreground transition-all duration-200 hover:text-foreground",
                      isActive
                        ? "bg-white/10 text-foreground active-glow"
                        : "hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <span className="pointer-events-none absolute inset-0 animate-light-beam rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    )}
                    <link.icon className="relative z-10 size-4" />
                  </Link>
                  {link.href === "/likes" && likesCount > 0 && (
                    <span className="absolute -top-0.5 right-0 z-30 flex min-w-[14px] items-center justify-center rounded-full bg-primary px-0.5 text-[7px] font-bold text-primary-foreground shadow-[0_0_6px_rgba(255,45,123,0.6)]">
                      {likesCount > 99 ? "99+" : likesCount}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-0.5 rounded-full p-0.5 transition-opacity hover:opacity-80">
                    <Avatar className="size-8">
                      <AvatarImage src={getPublicImageUrl(creatorAvatarUrl)} alt={creatorName || "Creator"} />
                      <AvatarFallback className="text-[10px]">
                        {creatorName ? getInitials(creatorName) : <User className="size-3.5" />}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  render={
                    <Link href="/creator" className="cursor-pointer">
                      <User className="mr-2 size-4" />
                      Creator Profile
                    </Link>
                  }
                />
                <DropdownMenuItem className="cursor-default">
                  <Bell className="mr-2 size-4" />
                  Notifications
                  {likesCount > 0 && (
                    <span className="ml-auto flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {likesCount > 99 ? "99+" : likesCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <a
                      href="https://ko-fi.com/unhinged"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer"
                    >
                      <ExternalLink className="mr-2 size-4" />
                      Support Unhinged
                    </a>
                  }
                />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
