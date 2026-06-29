"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

function SeparatorWithText({ text }: { text: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-2 text-xs uppercase tracking-wide text-muted-foreground">
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
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border bg-card p-8 ring-1 ring-foreground/10 shadow-[0_0_30px_rgba(255,45,123,0.12)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(255,45,123,0.2)]">
            <Image
              src="/icon.avif"
              alt="Unhinged"
              width={40}
              height={40}
              className="size-10 object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome to Unhinged</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>
        </div>

        <Button onClick={handleQuickTest} className="w-full">
          Quick Test Login
        </Button>

        <SeparatorWithText text="or sign in manually" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                className="pl-9"
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
                className="pl-9"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <SeparatorWithText text="or" />

        <Button variant="outline" onClick={handleGoogle} className="w-full">
          Continue with Google
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Don&apos;t have an account?</span>
          <Button variant="secondary" size="sm" onClick={() => router.push("/auth/signup")}>
            Sign up
          </Button>
        </div>
      </div>
    </main>
  );
}
