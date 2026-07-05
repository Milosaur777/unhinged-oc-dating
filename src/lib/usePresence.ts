"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "./supabase";

export type UserStatus = "online" | "idle" | "busy" | "invisible";

interface PresenceState {
  user_id: string;
  status: UserStatus;
  online_at: number;
}

export function usePresence(userId: string | null) {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserStatus>>(new Map());

  const fetchAndTrack = useCallback(async () => {
    if (!userId) return;

    const supabase = createClient();

    // Fetch current user's status from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    const myStatus: UserStatus = (profile?.status as UserStatus) || "online";

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const map = new Map<string, UserStatus>();
        for (const key of Object.keys(state)) {
          const presences = state[key];
          for (const p of presences) {
            if (p.user_id && p.user_id !== userId && p.status !== "invisible") {
              map.set(p.user_id, p.status);
            }
          }
        }
        setPresenceMap(map);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setPresenceMap((prev) => {
          const next = new Map(prev);
          for (const p of newPresences as Array<{ user_id?: string; status?: string }>) {
            if (p.user_id && p.user_id !== userId && p.status !== "invisible") {
              next.set(p.user_id, p.status as UserStatus);
            }
          }
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setPresenceMap((prev) => {
          const next = new Map(prev);
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
          await channel.track({
            user_id: userId,
            status: myStatus,
            online_at: Date.now(),
          });
        }
      });

    // Re-track every 20s to keep presence alive
    const heartbeat = setInterval(() => {
      channel.track({
        user_id: userId,
        status: myStatus,
        online_at: Date.now(),
      });
    }, 20000);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const cleanup = fetchAndTrack();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [fetchAndTrack]);

  return presenceMap;
}
