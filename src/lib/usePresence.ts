"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "./supabase";

const PRESENCE_CHANNEL = "global-presence-v2";
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const OFFLINE_THRESHOLD = 70000; // 70 seconds

export function usePresence(userId: string | null) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const lastSeenRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase.channel(PRESENCE_CHANNEL);

    channel
      .on(
        "broadcast",
        { event: "heartbeat" },
        (payload) => {
          const { user_id } = payload.payload as { user_id: string };
          if (!user_id || user_id === userId) return;
          lastSeenRef.current.set(user_id, Date.now());
          setOnlineUserIds(new Set(lastSeenRef.current.keys()));
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "heartbeat",
            payload: { user_id: userId },
          });
        }
      });

    const heartbeat = setInterval(() => {
      channel.send({
        type: "broadcast",
        event: "heartbeat",
        payload: { user_id: userId },
      });
    }, HEARTBEAT_INTERVAL);

    const cleanup = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [uid, time] of lastSeenRef.current.entries()) {
        if (now - time > OFFLINE_THRESHOLD) {
          lastSeenRef.current.delete(uid);
          changed = true;
        }
      }
      if (changed) {
        setOnlineUserIds(new Set(lastSeenRef.current.keys()));
      }
    }, 10000);

    return () => {
      clearInterval(heartbeat);
      clearInterval(cleanup);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineUserIds;
}
