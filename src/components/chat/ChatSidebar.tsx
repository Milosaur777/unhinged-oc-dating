"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDashboardChats, DashboardChat } from "@/lib/supabase-queries";
import { useMessagePresence } from "@/lib/useMessagePresence";
import { getPublicImageUrl, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

export function ChatSidebar() {
  const { user, isGuest } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [chats, setChats] = useState<DashboardChat[]>([]);
  const [loading, setLoading] = useState(true);

  const ocIdToUserId = useMemo(() => {
    const map = new Map<string, string>();
    chats.forEach((chat) => {
      if (chat.partner_oc?.id && chat.partner_oc?.user_id) {
        map.set(chat.partner_oc.id, chat.partner_oc.user_id);
      }
    });
    return map;
  }, [chats]);

  const isOnline = useMessagePresence(
    user && !("is_guest" in user) ? user.id : null,
    ocIdToUserId
  );

  useEffect(() => {
    if (isGuest || !user || "is_guest" in user) return;

    let cancelled = false;
    async function load() {
      try {
        const data = await getDashboardChats(user!.id);
        if (!cancelled) setChats(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load chats");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

  if (isGuest || !user || "is_guest" in user) {
    return null;
  }

  return (
    <aside
      className={cn(
        "sticky top-12 z-30 hidden h-[calc(100vh-3rem)] flex-col border-r border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex items-center justify-between border-b border-white/5 p-3">
        {!collapsed && (
          <h2 className="text-sm font-semibold text-foreground">Active Chats</h2>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((c) => !c)}
          className={cn("shrink-0", collapsed && "mx-auto")}
          aria-label={collapsed ? "Expand chat sidebar" : "Collapse chat sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className={cn("flex flex-col items-center justify-center gap-2 p-4 text-center", collapsed && "px-2")}>
            <MessageCircle className="size-6 text-muted-foreground" />
            {!collapsed && <p className="text-sm text-muted-foreground">No active chats yet.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {chats.map((chat) => (
              <ChatCard
                key={chat.id}
                chat={chat}
                collapsed={collapsed}
                isOnline={isOnline(chat.partner_oc?.user_id || "")}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {!collapsed && (
        <div className="p-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_0_20px_rgba(255,45,123,0.08)]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="size-4" />
              <p className="text-xs font-medium">Enjoying Unhinged?</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
              Support the app to keep it running and growing.
            </p>
            <Link
              href="/support"
              className="mt-3 inline-flex w-full"
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Heart className="size-3.5" />
                Support Unhinged
              </Button>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}

function ChatCard({ chat, collapsed, isOnline }: { chat: DashboardChat; collapsed: boolean; isOnline: boolean }) {
  const partner = chat.partner_oc;
  const myOc = chat.my_oc;
  const partnerImage = getPublicImageUrl(partner?.image_url);
  const myImage = getPublicImageUrl(myOc?.image_url);

  return (
    <Link
      href={`/chat/${chat.id}`}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-transparent bg-white/[0.03] p-2.5 backdrop-blur-md transition-all duration-200 ease-out hover:border-primary/30 hover:bg-white/[0.06] hover:shadow-[0_0_16px_rgba(255,45,123,0.15)]",
        collapsed && "justify-center border-white/5 p-2"
      )}
    >
      <div className="relative shrink-0">
        <Link href={`/oc/${partner?.id}?from=dashboard`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="size-11 border border-white/10 transition-all duration-200 hover:ring-2 hover:ring-primary/50">
            <AvatarImage src={partnerImage} alt={partner?.name || "Partner OC"} />
            <AvatarFallback className="text-xs font-bold">
              {getInitials(partner?.name || "?")}
            </AvatarFallback>
          </Avatar>
        </Link>
        {!collapsed && (
          <Avatar className="absolute -right-1 -bottom-1 size-5 ring-2 ring-zinc-950">
            <AvatarImage src={myImage} alt={myOc?.name || "My OC"} />
            <AvatarFallback className="text-[8px] font-bold">
              {getInitials(myOc?.name || "?")}
            </AvatarFallback>
          </Avatar>
        )}
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-zinc-950",
            isOnline ? "bg-green-500" : "bg-muted-foreground"
          )}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{partner?.name || "Unknown"}</p>
            <Badge
              variant="secondary"
              className="shrink-0 border border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] text-primary"
            >
              Lv. {chat.chat_level}
            </Badge>
          </div>
          <p className="truncate text-xs text-primary/80">
            As {myOc?.name || "Unknown"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {chat.last_message || "No messages yet"}
          </p>
          {chat.last_active_at && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {formatLastActive(chat.last_active_at)}
            </p>
          )}
        </div>
      )}
    </Link>
  );
}

function formatLastActive(date: string): string {
  try {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}
