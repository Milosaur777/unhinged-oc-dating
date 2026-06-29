"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDashboardChats, DashboardChat } from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

export function ChatSidebar() {
  const { user, isGuest } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [chats, setChats] = useState<DashboardChat[]>([]);
  const [loading, setLoading] = useState(true);

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
        "sticky top-14 z-30 hidden h-[calc(100vh-3.5rem)] flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex items-center justify-between border-b border-border p-3">
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
              <ChatCard key={chat.id} chat={chat} collapsed={collapsed} />
            ))}
          </div>
        )}
      </ScrollArea>

      {!collapsed && (
        <div className="border-t border-border p-3">
          <div className="rounded-xl border border-white/10 bg-card/60 p-4 shadow-[0_0_20px_rgba(255,45,123,0.12)] backdrop-blur-md ring-1 ring-white/5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Do you like the app? Support it to help keep it running.
            </p>
            <a
              href="https://ko-fi.com/unhinged"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full"
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ExternalLink className="size-3.5" />
                Support on Ko-Fi
              </Button>
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}

function ChatCard({ chat, collapsed }: { chat: DashboardChat; collapsed: boolean }) {
  const partner = chat.partner_oc;
  const imageUrl = getPublicImageUrl(partner?.image_url);

  return (
    <Link
      href={`/chat/${chat.id}`}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted",
        collapsed && "justify-center"
      )}
    >
      <div className="relative shrink-0">
        <div className="relative size-10 overflow-hidden rounded-full border border-border bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={partner?.name || "Partner OC"}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs font-bold">
              {getInitials(partner?.name || "?")}
            </div>
          )}
        </div>
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card",
            chat.is_online ? "bg-green-500" : "bg-muted-foreground"
          )}
          aria-label={chat.is_online ? "Online" : "Offline"}
        />
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{partner?.name || "Unknown"}</p>
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
              Lv. {chat.chat_level}
            </Badge>
          </div>
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
