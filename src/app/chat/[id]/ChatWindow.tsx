"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Smile, Image as ImageIcon, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { getChatMessages, sendChatMessage, ChatMessage, OC } from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials, cn } from "@/lib/utils";
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
}

export function ChatWindow({ sessionId, oc1, oc2, oc2Name }: ChatWindowProps) {
  const myOC = oc1 as OC;
  const theirOC = oc2 as OC | null;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"emoji" | "gif" | "kaomoji" | null>(null);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<string[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gifSearchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    async function load() {
      try {
        const data = await getChatMessages(sessionId);
        setMessages(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGifResults([]);
      return;
    }
    setGifLoading(true);
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_TENOR_API_KEY || "AIzaSyDAsJZvqNMzK10NjGHdsVdHEVlHKZQnEiM"}&limit=20&media_filter=gif`
      );
      const data = await res.json();
      const gifs = (data.results ?? []).map(
        (r: { media_formats?: { gif?: { url?: string } } }) => r.media_formats?.gif?.url ?? ""
      ).filter(Boolean);
      setGifResults(gifs);
    } catch {
      setGifResults([]);
    } finally {
      setGifLoading(false);
    }
  }, []);

  function handleGifSearchChange(value: string) {
    setGifQuery(value);
    if (gifSearchTimeout.current) clearTimeout(gifSearchTimeout.current);
    gifSearchTimeout.current = setTimeout(() => searchGifs(value), 400);
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

  async function handleSendGif(gifUrl: string) {
    if (sending) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(sessionId, myOC.id, "", gifUrl);
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

  const isMyMessage = (msg: ChatMessage) => msg.from_oc_id === myOC.id;

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pt-12 md:pt-16">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-md">
          <Link href="/chat" className="rounded-md p-1 hover:bg-muted">
            <ArrowLeft className="size-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/oc/${myOC.id}?from=chat`}
              onClick={(e) => e.stopPropagation()}
              className="cursor-pointer"
            >
              <div className="relative size-10 overflow-hidden rounded-full bg-muted transition-all duration-200 hover:ring-2 hover:ring-primary/50">
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
              <div className="relative size-10 overflow-hidden rounded-full bg-muted transition-all duration-200 hover:ring-2 hover:ring-primary/50">
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
          <div className="ml-2 min-w-0">
            <p className="truncate text-sm font-semibold">
              {myOC.name} ↔ {theirOC?.name || oc2Name || "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground">Break the ice.</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="relative">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl">💬</span>
                </div>
                <span className="absolute -top-1 -right-1 text-lg">✨</span>
                <span className="absolute -bottom-1 -left-1 text-lg">✨</span>
              </div>
              <p className="text-lg font-semibold text-foreground">No messages yet.</p>
              <p className="text-sm">Break the ice.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isMyMessage(msg) ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      isMyMessage(msg)
                        ? "rounded-br-sm bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
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
                      msg.text
                    )}
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        isMyMessage(msg) ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {new Date(msg.created_at || "1970-01-01T00:00:00Z").toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isMyMessage(msg) && (
                        <span className="ml-1">✓✓</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel */}
        {activeTab && (
          <div className="border-t border-white/5 bg-white/[0.02] backdrop-blur-md">
            <div className="flex items-center gap-1 border-b border-white/5 px-3 pt-2">
              <button
                onClick={() => setActiveTab("emoji")}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "emoji"
                    ? "border-b-2 border-primary text-primary"
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
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ImageIcon className="size-3.5" />
                GIF
              </button>
              <button
                onClick={() => setActiveTab("kaomoji")}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "kaomoji"
                    ? "border-b-2 border-primary text-primary"
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
                            ? "bg-primary/20 text-primary"
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
                    <div className="grid grid-cols-3 gap-1 max-h-60 overflow-y-auto">
                      {gifResults.map((gif, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendGif(gif)}
                          className="overflow-hidden rounded-lg hover:ring-2 hover:ring-primary/50 transition-all"
                        >
                          <Image
                            src={gif}
                            alt="GIF"
                            width={150}
                            height={100}
                            className="w-full object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Search for a GIF to send
                    </div>
                  )}
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

        {/* Input */}
        <div className="sticky bottom-0 border-t border-white/5 bg-background/80 p-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setActiveTab(activeTab === "emoji" || activeTab === "gif" || activeTab === "kaomoji" ? null : "emoji")}
              className={activeTab ? "text-primary" : ""}
              aria-label="Emoji picker"
            >
              <Smile className="size-5" />
            </Button>
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
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setActiveTab(activeTab === "gif" ? null : "gif")}
              className={activeTab === "gif" ? "text-primary" : ""}
              aria-label="GIF picker"
            >
              <span className="text-xs font-bold">GIF</span>
            </Button>
            <Button
              size="icon-sm"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="rounded-xl bg-primary px-3 hover:bg-primary/90"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
