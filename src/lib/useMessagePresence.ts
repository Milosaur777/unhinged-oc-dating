"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "./supabase";

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Tracks partner online status based on recent message activity.
 * Uses existing Supabase realtime (which already works for messages).
 */
export function useMessagePresence(
  userId: string | null,
  ocIdToUserId: Map<string, string>
) {
  const [lastActiveMap, setLastActiveMap] = useState<Map<string, number>>(new Map());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const chatIdsRef = useRef<string[]>([]);

  const markOnline = useCallback((partnerUserId: string) => {
    if (!partnerUserId) return;
    
    setLastActiveMap((prev) => {
      const next = new Map(prev);
      next.set(partnerUserId, Date.now());
      return next;
    });

    const existing = timeoutsRef.current.get(partnerUserId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
      setLastActiveMap((prev) => {
        const next = new Map(prev);
        const lastSeen = next.get(partnerUserId);
        if (lastSeen && Date.now() - lastSeen >= ONLINE_WINDOW_MS) {
          next.delete(partnerUserId);
        }
        return next;
      });
    }, ONLINE_WINDOW_MS);

    timeoutsRef.current.set(partnerUserId, timeout);
  }, []);

  useEffect(() => {
    if (!userId || ocIdToUserId.size === 0) return;

    const chatIds = Array.from(ocIdToUserId.keys());
    chatIdsRef.current = chatIds;

    const supabase = createClient();
    const channel = supabase
      .channel("sidebar-presence")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const msg = payload.new as { from_oc_id: string; created_at: string };
          const senderUserId = ocIdToUserId.get(msg.from_oc_id);
          if (senderUserId && senderUserId !== userId) {
            markOnline(senderUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
    };
  }, [userId, ocIdToUserId, markOnline]);

  const isOnline = useCallback(
    (partnerUserId: string) => {
      const lastSeen = lastActiveMap.get(partnerUserId);
      if (!lastSeen) return false;
      return Date.now() - lastSeen < ONLINE_WINDOW_MS;
    },
    [lastActiveMap]
  );

  return isOnline;
}
