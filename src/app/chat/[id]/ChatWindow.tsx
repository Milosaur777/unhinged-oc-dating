"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { getChatMessages, sendChatMessage, ChatMessage, OC } from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

const EMOJIS = [
  "😀", "😂", "🥰", "😍", "😎", "🤩", "🥳", "😏", "😌", "😔",
  "😭", "😡", "🤯", "🥺", "🤗", "🤭", "🫣", "🤫", "🤔", "🫡",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💖",
  "🔥", "✨", "🌟", "💫", "⭐", "🌙", "☀️", "🌈", "☁️", "🌊",
  "🍕", "🍔", "🍟", "🌮", "🍣", "🍩", "🍪", "🎂", "🍫", "🍭",
  "🐱", "🐶", "🐺", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸",
  "🌹", "🌸", "🌺", "🌻", "🌼", "🍀", "🌵", "🌲", "🌳", "🍁",
  "🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🎮", "🎲", "🎯", "🏆",
  "💻", "📱", "💡", "🔋", "🔑", "🎁", "🎈", "🎉", "💌", "📝",
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
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  function addEmoji(emoji: string) {
    setInput((prev) => prev + emoji);
    setShowEmoji(false);
  }

  const isMyMessage = (msg: ChatMessage) => msg.from_oc_id === myOC.id;

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pt-12 md:pt-16">
        <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-md">
          <Link href="/chat" className="rounded-md p-1 hover:bg-muted">
            <ArrowLeft className="size-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative size-9 overflow-hidden rounded-full bg-muted">
              {myOC.image_url ? (
                <Image
                  src={getPublicImageUrl(myOC.image_url)}
                  alt={myOC.name}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] font-bold">
                  {getInitials(myOC.name)}
                </div>
              )}
            </div>
            <span className="text-muted-foreground">↔</span>
            <div className="relative size-9 overflow-hidden rounded-full bg-muted">
              {theirOC?.image_url ? (
                <Image
                  src={getPublicImageUrl(theirOC.image_url)}
                  alt={theirOC.name}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] font-bold">
                  {getInitials(theirOC?.name || oc2Name || "?")}
                </div>
              )}
            </div>
          </div>
          <div className="ml-2 min-w-0">
            <p className="truncate text-sm font-semibold">
              {myOC.name} ↔ {theirOC?.name || oc2Name || "Unknown"}
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <p>No messages yet.</p>
              <p className="text-sm">Break the ice.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${isMyMessage(msg) ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      isMyMessage(msg)
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground"
                    }`}
                  >
                    {msg.text}
                    {msg.image_url && (
                      <Image
                        src={getPublicImageUrl(msg.image_url)}
                        alt="Attachment"
                        width={200}
                        height={200}
                        className="mt-2 rounded-lg"
                      />
                    )}
                    <p
                      className={`mt-1 text-[10px] ${
                        isMyMessage(msg) ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.created_at || "1970-01-01T00:00:00Z").toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showEmoji && (
          <div className="border-t border-white/5 bg-white/[0.02] p-3 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Emojis</span>
              <Button variant="ghost" size="icon-xs" onClick={() => setShowEmoji(false)}>
                <X className="size-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="rounded-md p-1 text-lg hover:bg-muted"
                  aria-label={`Emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sticky bottom-0 border-t border-white/5 bg-background/80 p-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowEmoji((v) => !v)}
              className={showEmoji ? "text-primary" : ""}
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
              size="icon-sm"
              onClick={handleSend}
              disabled={!input.trim() || sending}
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
