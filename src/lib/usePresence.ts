"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase";

export function usePresence(userId: string | null) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        for (const key of Object.keys(state)) {
          const presences = state[key] as Array<{ user_id?: string }>;
          for (const p of presences) {
            if (p.user_id && p.user_id !== userId) {
              ids.add(p.user_id);
            }
          }
        }
        setOnlineUserIds(ids);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          for (const p of newPresences as Array<{ user_id?: string }>) {
            if (p.user_id && p.user_id !== userId) {
              next.add(p.user_id);
            }
          }
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          for (const p of leftPresences as Array<{ user_id?: string }>) {
            if (p.user_id) {
              next.delete(p.user_id);
            }
          }
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, online_at: Date.now() });
        }
      });

    // Re-track every 20s to keep presence alive
    const heartbeat = setInterval(() => {
      channel.track({ user_id: userId, online_at: Date.now() });
    }, 20000);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineUserIds;
}
