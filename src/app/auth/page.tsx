"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, LogIn, UserPlus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AuthPage() {
  const router = useRouter();
  const { createGuest } = useAuth();

  function handleGuest() {
    createGuest();
    router.push("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl border border-border bg-card p-8 ring-1 ring-foreground/10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Flame className="size-9 text-primary" />
          </div>
          <h1 className="text-center text-2xl font-bold">Welcome to Unhinged</h1>
          <p className="text-center text-sm text-muted-foreground">
            Match with original characters. Swipe, chat, and connect.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button onClick={handleGuest} variant="outline" className="w-full gap-2">
            <Zap className="size-4" />
            Quick Test Login
          </Button>
          <Link href="/auth/login" className="w-full">
            <Button className="w-full gap-2">
              <LogIn className="size-4" />
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup" className="w-full">
            <Button variant="secondary" className="w-full gap-2">
              <UserPlus className="size-4" />
              Sign Up
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to embrace the chaos.
        </p>
      </div>
    </main>
  );
}
