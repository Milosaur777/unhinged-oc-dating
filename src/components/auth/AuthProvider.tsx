"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

export interface GuestUser {
  id: string;
  email: string;
  display_name: string;
  is_guest: true;
}

export interface GuestOC {
  id: string;
  name: string;
  image_url: string | null;
  fields: { field_key: string; value: string | null; label: string }[];
  tags: string[];
  truths_and_lie: string[];
  created_at: string;
}

interface AuthContextValue {
  user: User | GuestUser | null;
  loading: boolean;
  isGuest: boolean;
  guestOCs: GuestOC[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  createGuest: () => GuestUser;
  logout: () => Promise<void>;
  addGuestOC: (oc: GuestOC) => void;
  updateGuestOC: (oc: GuestOC) => void;
  deleteGuestOC: (ocId: string) => void;
  getGuestOC: (ocId: string) => GuestOC | undefined;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GUEST_KEY = "unhinged_guest";
const GUEST_OCS_KEY = "unhinged_guest_ocs";

function loadGuest(): GuestUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GUEST_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.is_guest) return parsed as GuestUser;
  } catch {
    localStorage.removeItem(GUEST_KEY);
  }
  return null;
}

function loadGuestOCs(): GuestOC[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(GUEST_OCS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GuestOC[];
  } catch {
    localStorage.removeItem(GUEST_OCS_KEY);
    return [];
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | GuestUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestOCs, setGuestOCs] = useState<GuestOC[]>(() => loadGuestOCs());
  const supabase = createClient();
  const isGuest = user ? "is_guest" in user : false;

  useEffect(() => {
    const guest = loadGuest();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      } else if (guest) {
        setUser(guest);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        localStorage.removeItem(GUEST_KEY);
        localStorage.removeItem(GUEST_OCS_KEY);
        setGuestOCs([]);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_OCS_KEY, JSON.stringify(guestOCs));
  }, [guestOCs]);

  const createGuest = useCallback((): GuestUser => {
    const guest: GuestUser = {
      id: `guest_${crypto.randomUUID()}`,
      email: "",
      display_name: "Guest User",
      is_guest: true,
    };
    localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
    setUser(guest);
    setGuestOCs([]);
    return guest;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [supabase]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
    [supabase]
  );

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, [supabase]);

  const logout = useCallback(async () => {
    if (isGuest) {
      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(GUEST_OCS_KEY);
      setUser(null);
      setGuestOCs([]);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  }, [isGuest, supabase]);

  const addGuestOC = useCallback((oc: GuestOC) => {
    setGuestOCs((prev) => [...prev, oc]);
  }, []);

  const updateGuestOC = useCallback((oc: GuestOC) => {
    setGuestOCs((prev) => prev.map((o) => (o.id === oc.id ? oc : o)));
  }, []);

  const deleteGuestOC = useCallback((ocId: string) => {
    setGuestOCs((prev) => prev.filter((o) => o.id !== ocId));
  }, []);

  const getGuestOC = useCallback(
    (ocId: string) => guestOCs.find((o) => o.id === ocId),
    [guestOCs]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        guestOCs,
        login,
        signup,
        loginWithGoogle,
        createGuest,
        logout,
        addGuestOC,
        updateGuestOC,
        deleteGuestOC,
        getGuestOC,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
