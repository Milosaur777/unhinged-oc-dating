"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

function SeparatorWithText({ text }: { text: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-transparent px-2 text-xs uppercase tracking-wide text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}

export function LoginCard() {
  const router = useRouter();
  const { login, loginWithGoogle, createGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google login failed");
    }
  }

  function handleQuickTest() {
    createGuest();
    router.push("/");
  }

  return (
    <main className="noise-bg flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-sm p-8 shadow-[0_8px_60px_rgba(255,45,123,0.1)]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-primary/20 blur-2xl" aria-hidden="true" />
            <div className="relative flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
              <Image
                src="/icon.avif"
                alt="Unhinged"
                width={64}
                height={64}
                className="size-16 object-contain"
              />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome to Unhinged</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>
        </div>

        <Button onClick={handleQuickTest} className="mt-4 w-full">
          Quick Test Login
        </Button>

        <div className="mt-4">
          <SeparatorWithText text="or sign in manually" />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border-white/10 bg-white/5 pl-9 backdrop-blur-md focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border-white/10 bg-white/5 pl-9 backdrop-blur-md focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4">
          <SeparatorWithText text="or" />
        </div>

        <Button variant="outline" onClick={handleGoogle} className="mt-4 w-full">
          Continue with Google
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Don&apos;t have an account?</span>
          <Button variant="secondary" size="sm" onClick={() => router.push("/auth/signup")}>
            Sign up
          </Button>
        </div>
      </GlassCard>
    </main>
  );
}
