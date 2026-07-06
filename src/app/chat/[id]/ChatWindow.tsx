"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Smile, X, Search, MoreVertical, Download, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { getChatMessages, sendChatMessage, getProfile, getUserStatus, ChatMessage, OC } from "@/lib/supabase-queries";
import { usePresence } from "@/lib/usePresence";
import { getPublicImageUrl, getInitials, cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import Image from "next/image";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊",
      "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋",
      "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫",
      "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒",
      "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒",
    ],
  },
  {
    name: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
      "💟", "♥️", "💋", "🫶", "👐", "🤲", "🤝", "🙏", "✌️", "🤟",
    ],
  },
  {
    name: "Animals",
    emojis: [
      "🐱", "🐶", "🐺", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
      "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦",
      "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐗", "🐴", "🦄",
    ],
  },
  {
    name: "Food",
    emojis: [
      "🍕", "🍔", "🍟", "🌮", "🍣", "🍩", "🍪", "🎂", "🍫", "🍭",
      "🍬", "🍭", "🍮", "🍯", "☕", "🍵", "🥤", "🧃", "🍷", "🍸",
      "🍹", "🍺", "🍻", "🥂", "🥃", "🍷", "🧋", "🧉", "🧊", "🥛",
    ],
  },
  {
    name: "Activities",
    emojis: [
      "🎮", "🎲", "🎯", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽", "🏀",
      "🏈", "⚾", "🎾", "🏐", "🎱", "🔮", "🎭", "🎨", "🎬", "🎤",
      "🎧", "🎵", "🎶", "🎹", "🎸", "🎺", "🎻", "🥁", "🪘", "🎪",
    ],
  },
  {
    name: "Nature",
    emojis: [
      "🌹", "🌸", "🌺", "🌻", "🌼", "🍀", "🌵", "🌲", "🌳", "🍁",
      "🍂", "🍃", "🌿", "☘️", "🪴", "🌱", "🌍", "🌎", "🌏", "🌕",
      "🌙", "⭐", "🌟", "✨", "💫", "🔥", "💧", "🌊", "🌈", "☁️",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "💻", "📱", "💡", "🔋", "🔑", "🎁", "🎈", "🎉", "💌", "📝",
      "📚", "🎒", "🖊️", "📌", "📎", "🔒", "🔓", "💎", "🧲", "🪄",
      "🔮", "🪅", "🪆", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "💊",
    ],
  },
  {
    name: "Symbols",
    emojis: [
      "💀", "👻", "👽", "🤖", "🎃", "😈", "👿", "👹", "👺", "☠️",
      "⚡", "💢", "💥", "💫", "💦", "💨", "🕳️", "💣", "💬", "👁️‍🗨️",
      "🗨️", "🗯️", "💭", "💤", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣",
    ],
  },
];

interface KlipyGif {
  id: number;
  title: string;
  url: string;
}

const KLIPY_KEY = process.env.NEXT_PUBLIC_KLIPY_API_KEY || "";

const KAOMOJIS = [
  "(╯°□°)╯︵ ┻━┻", "┬─┬ノ( º _ ºノ)", "( ͡° ͜ʖ ͡°)", "¯\\_(ツ)_/¯",
  "(ಥ_ಥ)", "(ಥ﹏ಥ)", "(づ￣ ³￣)づ", "(っ˘ω˘ς )", "(ノ´ヮ`)ノ*: ・゚✧",
  "( ˘ ³˘)♥", "(⁄ ⁄•⁄ω⁄•⁄ ⁄)", "(∩｀-´)⊃━☆ﾟ.*･｡ﾟ", "(ﾉ◕ヮ◕)ﾉ*:・゚✧",
  "(ง •̀_•́)ง", "(ɔ ˘⌣˘)˘⌣˘ c)", "♪♪ ヽ(ˇ∀ˇ )ゞ", "(─‿─)",
  "(｡◕‿◕｡)", "(◕‿◕)", "(◠‿◠)", "(◕ᴗ◕✿)", "(▰◕‿◕▰)",
  "(●'◡'●)", "(❁´◡`❁)", "(♡μ_μ)", "( ◜‿◝ )", "(词≖◡≖)",
];

interface ChatWindowProps {
  sessionId: string;
  oc1: unknown;
  oc2: unknown;
  oc2Name: string | null;
  myOcId?: string;
}

export function ChatWindow({ sessionId, oc1, oc2, oc2Name, myOcId }: ChatWindowProps) {
  const { user } = useAuth();
  const rawOc1 = oc1 as OC;
  const rawOc2 = oc2 as OC | null;
  const myOC = myOcId
    ? (myOcId === rawOc1?.id ? rawOc1 : (rawOc2 ?? rawOc1))
    : rawOc1;
  const theirOC = myOC.id === rawOc1?.id ? rawOc2 : rawOc1;
  const partnerUserId = theirOC?.user_id;
  const presenceMap = usePresence(user && !("is_guest" in user) ? user.id : null);
  const realtimeStatus = partnerUserId ? presenceMap.get(partnerUserId) : undefined;
  const [polledStatus, setPolledStatus] = useState<string | undefined>(undefined);
  const partnerStatus = realtimeStatus ?? polledStatus;
  const isPartnerOnline = partnerStatus === "online" || partnerStatus === "idle";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"emoji" | "gif" | "kaomoji" | null>(null);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<KlipyGif[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifPage, setGifPage] = useState(1);
  const [hasMoreGifs, setHasMoreGifs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gifSearchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    async function load() {
      try {
        const [data, profileData] = await Promise.all([
          getChatMessages(sessionId),
          user && !("is_guest" in user) ? getProfile(user.id) : Promise.resolve(null),
        ]);
        setMessages(data);
        setLargeText(profileData?.large_chat_text ?? false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, user]);

  // Fallback: poll partner status every 5 seconds
  useEffect(() => {
    if (!partnerUserId) return;
    const poll = setInterval(async () => {
      try {
        const status = await getUserStatus(partnerUserId);
        if (status) setPolledStatus(status);
      } catch {
        // Silently ignore
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [partnerUserId]);

  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT") {
          console.error("Realtime subscription failed for chat:", sessionId, "status:", status);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Fallback: poll for new messages every 3 seconds
  useEffect(() => {
    if (!sessionId) return;
    const poll = setInterval(async () => {
      try {
        const data = await getChatMessages(sessionId);
        setMessages((prev) => {
          if (data.length === prev.length) return prev;
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = data.filter((m) => !existingIds.has(m.id));
          if (newMessages.length === 0) return prev;
          return [...prev, ...newMessages];
        });
      } catch {
        // Silently ignore polling errors
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const searchGifs = useCallback(async (query: string, page = 1, append = false) => {
    if (!KLIPY_KEY) return;
    if (!query.trim()) {
      if (!append) setGifResults([]);
      return;
    }
    if (append) setLoadingMore(true);
    else setGifLoading(true);
    try {
      const res = await fetch(
        `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/search?q=${encodeURIComponent(query)}&page=${page}&per_page=24&format_filter=gif`
      );
      const data = await res.json();
      const gifs: KlipyGif[] = (data.data ?? []).map(
        (r: { id: number; title?: string; file?: { md?: { gif?: { url?: string } }; sm?: { gif?: { url?: string } } } }) => ({
          id: r.id,
          title: r.title || "",
          url: r.file?.md?.gif?.url || r.file?.sm?.gif?.url || "",
        })
      ).filter((g: KlipyGif) => g.url);
      setGifResults((prev) => append ? [...prev, ...gifs] : gifs);
      setHasMoreGifs(gifs.length >= 20);
    } catch {
      if (!append) setGifResults([]);
    } finally {
      setGifLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadTrendingGifs = useCallback(async () => {
    if (!KLIPY_KEY) return;
    setGifLoading(true);
    try {
      const res = await fetch(
        `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/trending?per_page=24&format_filter=gif`
      );
      const data = await res.json();
      const gifs: KlipyGif[] = (data.data ?? []).map(
        (r: { id: number; title?: string; file?: { md?: { gif?: { url?: string } }; sm?: { gif?: { url?: string } } } }) => ({
          id: r.id,
          title: r.title || "",
          url: r.file?.md?.gif?.url || r.file?.sm?.gif?.url || "",
        })
      ).filter((g: KlipyGif) => g.url);
      setGifResults(gifs);
      setHasMoreGifs(false);
    } catch {
      setGifResults([]);
    } finally {
      setGifLoading(false);
    }
  }, []);

  const loadMoreGifs = useCallback(() => {
    const nextPage = gifPage + 1;
    setGifPage(nextPage);
    searchGifs(gifQuery, nextPage, true);
  }, [gifPage, gifQuery, searchGifs]);

  useEffect(() => {
    if (activeTab === "gif" && !gifQuery.trim() && gifResults.length === 0) {
      loadTrendingGifs();
    }
  }, [activeTab, gifQuery, gifResults.length, loadTrendingGifs]);

  function handleGifSearchChange(value: string) {
    setGifQuery(value);
    setGifPage(1);
    if (gifSearchTimeout.current) clearTimeout(gifSearchTimeout.current);
    if (!value.trim()) {
      setGifResults([]);
      setHasMoreGifs(false);
      loadTrendingGifs();
      return;
    }
    gifSearchTimeout.current = setTimeout(() => searchGifs(value, 1, false), 400);
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(sessionId, myOC.id, input.trim());
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleSendGif(gif: KlipyGif) {
    if (sending) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(sessionId, myOC.id, "", gif.url);
      setMessages((prev) => [...prev, msg]);
      setActiveTab(null);
      setGifQuery("");
      setGifResults([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send GIF");
    } finally {
      setSending(false);
    }
  }

  function addEmoji(emoji: string) {
    setInput((prev) => prev + emoji);
  }

  function addKaomoji(kaomoji: string) {
    setInput((prev) => prev + kaomoji);
  }

  function handleExportChat() {
    const lines = messages.map((msg) => {
      const sender = msg.from_oc_id === myOC.id ? myOC.name : theirOC?.name || "Unknown";
      const time = new Date(msg.created_at || "1970-01-01T00:00:00Z").toLocaleString();
      const text = msg.image_url ? "[GIF]" : msg.text;
      return `[${time}] ${sender}: ${text}`;
    });
    const header = `Chat: ${myOC.name} ↔ ${theirOC?.name || oc2Name || "Unknown"}\nExported: ${new Date().toLocaleString()}\n${"─".repeat(50)}\n\n`;
    const blob = new Blob([header + lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${myOC.name}-${theirOC?.name || "unknown"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported");
  }

  async function handleReport() {
    if (!reportReason || !user || "is_guest" in user) return;
    setReporting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_oc_id: theirOC?.id || "",
        reason: reportReason,
        details: reportDetails || null,
      });
      if (error) throw error;
      toast.success("Report submitted. Thank you for helping keep the community safe.");
      setShowReportDialog(false);
      setReportReason("");
      setReportDetails("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setReporting(false);
    }
  }

  const isMyMessage = (msg: ChatMessage) => msg.from_oc_id === myOC.id;

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.trim().toLowerCase();
    return messages.filter((msg) => msg.text.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  function formatMessageTime(dateStr: string) {
    return new Date(dateStr || "1970-01-01T00:00:00Z").toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const chatContent = (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <Link href="/chat" className="rounded-md p-1 hover:bg-white/10">
          <ArrowLeft className="size-5 text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/oc/${myOC.id}?from=chat`}
            onClick={(e) => e.stopPropagation()}
            className="cursor-pointer"
          >
            <div className="relative size-10 overflow-hidden rounded-full bg-muted transition-all duration-200 hover:ring-2 hover:ring-purple-500/50">
              {myOC.image_url ? (
                <Image
                  src={getPublicImageUrl(myOC.image_url)}
                  alt={myOC.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] font-bold">
                  {getInitials(myOC.name)}
                </div>
              )}
            </div>
          </Link>
          <span className="text-muted-foreground">↔</span>
          <Link
            href={`/oc/${theirOC?.id}?from=chat`}
            onClick={(e) => e.stopPropagation()}
            className="cursor-pointer"
          >
            <div className="relative size-10 overflow-hidden rounded-full bg-muted transition-all duration-200 hover:ring-2 hover:ring-purple-500/50">
              {theirOC?.image_url ? (
                <Image
                  src={getPublicImageUrl(theirOC.image_url)}
                  alt={theirOC.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] font-bold">
                  {getInitials(theirOC?.name || oc2Name || "?")}
                </div>
              )}
            </div>
          </Link>
        </div>
        <div className="ml-2 min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {myOC.name} ↔ {theirOC?.name || oc2Name || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            {partnerStatus === "online" ? (
              <span className="text-green-500">● Online</span>
            ) : partnerStatus === "idle" ? (
              <span className="text-yellow-500">● Idle</span>
            ) : partnerStatus === "busy" ? (
              <span className="text-red-500">● Busy</span>
            ) : (
              <span>● Offline</span>
            )}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => setShowSearch((s) => !s)}>
          <Search className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground" />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportChat}>
              <Download className="size-4 mr-2" />
              Export Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-destructive">
              <Flag className="size-4 mr-2" />
              Report User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      {showSearch && (
        <div className="border-b border-white/5 px-4 py-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="border-white/10 bg-white/[0.03] pl-8 text-sm"
              autoFocus
            />
          </div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="relative">
              <div className="size-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                <span className="text-3xl">💬</span>
              </div>
              <span className="absolute -top-1 -right-1 text-lg">✨</span>
              <span className="absolute -bottom-1 -left-1 text-lg">✨</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {searchQuery.trim() ? "No matching messages." : "No messages yet."}
            </p>
            <p className="text-sm">{searchQuery.trim() ? "Try a different search term." : "Break the ice."}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Today separator */}
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-muted-foreground">Today</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isMyMessage(msg) ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    largeText ? "text-base" : "text-sm",
                    isMyMessage(msg)
                      ? "rounded-br-sm bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                      : "rounded-bl-sm bg-white/[0.06] text-foreground ring-1 ring-white/5"
                  )}
                >
                  {msg.image_url ? (
                    <Image
                      src={getPublicImageUrl(msg.image_url)}
                      alt="GIF"
                      width={200}
                      height={200}
                      className="rounded-lg"
                      unoptimized
                    />
                  ) : (
                    <span className="text-left">{msg.text}</span>
                  )}
                  <div className={cn(
                    "mt-1 flex items-center gap-1 text-[10px]",
                    isMyMessage(msg) ? "text-white/60" : "text-muted-foreground"
                  )}>
                    <span>{formatMessageTime(msg.created_at || "")}</span>
                    {isMyMessage(msg) && (
                      <span>✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Picker panel — opens above input */}
      {activeTab && (
        <div className="border-t border-purple-500/10 bg-[#0c0c18]">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-white/5 px-3 pt-2">
            <button
              onClick={() => setActiveTab("emoji")}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "emoji"
                  ? "border-b-2 border-purple-500 text-purple-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Smile className="size-3.5" />
              Emoji
            </button>
            <button
              onClick={() => setActiveTab("gif")}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "gif"
                  ? "border-b-2 border-purple-500 text-purple-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-[10px] font-bold">GIF</span>
            </button>
            <button
              onClick={() => setActiveTab("kaomoji")}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "kaomoji"
                  ? "border-b-2 border-purple-500 text-purple-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              (◕‿◕)
            </button>
            <div className="ml-auto">
              <Button variant="ghost" size="icon-xs" onClick={() => setActiveTab(null)}>
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Panel content */}
          <div className="p-3">
            {activeTab === "emoji" && (
              <div>
                <div className="mb-2 flex gap-1 overflow-x-auto scrollbar-hide">
                  {EMOJI_CATEGORIES.map((cat, i) => (
                    <button
                      key={cat.name}
                      onClick={() => setEmojiCategory(i)}
                      className={cn(
                        "shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                        emojiCategory === i
                          ? "bg-purple-500/20 text-purple-400"
                          : "text-muted-foreground hover:bg-white/5"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-10 gap-0.5">
                  {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="rounded-md p-1.5 text-lg hover:bg-white/10 transition-colors"
                      aria-label={`Emoji ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "gif" && (
              <div>
                <div className="relative mb-3">
                  <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={gifQuery}
                    onChange={(e) => handleGifSearchChange(e.target.value)}
                    placeholder="Search GIFs..."
                    className="border-white/10 bg-white/[0.03] pl-8 text-sm"
                  />
                </div>
                {gifLoading ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">Searching...</div>
                ) : gifResults.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-1">
                      {gifResults.map((gif) => (
                        <button
                          key={gif.id}
                          onClick={() => handleSendGif(gif)}
                          className="overflow-hidden rounded-lg hover:ring-2 hover:ring-purple-500/50 transition-all"
                          title={gif.title}
                        >
                          <Image
                            src={gif.url}
                            alt={gif.title || "GIF"}
                            width={150}
                            height={100}
                            className="w-full object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                    {hasMoreGifs && (
                      <button
                        onClick={loadMoreGifs}
                        disabled={loadingMore}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 text-xs text-muted-foreground hover:bg-white/10 transition-colors"
                      >
                        {loadingMore ? "Loading..." : "Load more"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Search for a GIF to send
                  </div>
                )}
                <div className="mt-2 text-center">
                  <a
                    href="https://klipy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    Powered by KLIPY
                  </a>
                </div>
              </div>
            )}

            {activeTab === "kaomoji" && (
              <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto">
                {KAOMOJIS.map((kaomoji, i) => (
                  <button
                    key={i}
                    onClick={() => addKaomoji(kaomoji)}
                    className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors text-left"
                  >
                    {kaomoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input area — buttons on left, input in center, send on right */}
      <div className="border-t border-purple-500/10 bg-[#0a0a14]">
        <div className="flex items-end gap-2 p-3">
          {/* Left side: Emoji + GIF buttons stacked vertically */}
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setActiveTab(activeTab === "emoji" || activeTab === "kaomoji" ? null : "emoji")}
              className={cn(activeTab === "emoji" || activeTab === "kaomoji" ? "text-purple-400" : "text-muted-foreground")}
              aria-label="Emoji picker"
            >
              <Smile className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setActiveTab(activeTab === "gif" ? null : "gif")}
              className={cn(activeTab === "gif" ? "text-purple-400" : "text-muted-foreground")}
              aria-label="GIF picker"
            >
              <span className="text-[10px] font-bold">GIF</span>
            </Button>
          </div>

          {/* Center: Input field */}
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="min-h-[48px] border-white/10 bg-white/[0.03] pr-4"
            />
          </div>

          {/* Right: Send button */}
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="h-12 w-12 shrink-0 rounded-xl bg-purple-600 px-3 text-white hover:bg-purple-500 shadow-[0_0_16px_rgba(147,51,234,0.4)]"
            aria-label="Send message"
          >
            <Send className="size-5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pt-12 md:pt-16">
        {/* Mobile */}
        <div className="flex flex-1 flex-col md:hidden">
          {chatContent}
        </div>

        {/* Desktop: framed container with purple glow */}
        <div className="hidden md:flex flex-1 flex-col px-6 py-4">
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-purple-500/25 bg-[#0a0a14] shadow-[0_0_50px_rgba(147,51,234,0.12)]">
            {/* Purple glow reflection on left side */}
            <div className="pointer-events-none absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-purple-500/50 via-purple-500/25 to-purple-500/50 blur-sm" />
            {/* Purple glow reflection on right side */}
            <div className="pointer-events-none absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-purple-500/50 via-purple-500/25 to-purple-500/50 blur-sm" />
            {chatContent}
          </div>
        </div>
      </main>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Report User</DialogTitle>
            <DialogDescription>
              Report {theirOC?.name || "this user"} for inappropriate behavior. Your report will be reviewed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Reason</Label>
            <div className="flex flex-col gap-2">
              {[
                "Inappropriate content",
                "Harassment",
                "Spam",
                "Fake account",
                "Other",
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="accent-destructive"
                  />
                  {reason}
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Additional details (optional)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional context..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reportReason || reporting}
              onClick={handleReport}
            >
              {reporting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
