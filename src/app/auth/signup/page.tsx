"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(email, password);
      setRegisteredEmail(email);
      setSignupSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google signup failed");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-border bg-card p-8 ring-1 ring-foreground/10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Flame className="size-7 text-primary" />
          </div>
          <h1 className="text-center text-2xl font-bold">Sign Up</h1>
        </div>

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
                minLength={6}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-2 text-xs text-muted-foreground">or</span>
          </div>
        </div>

        <Button variant="outline" onClick={handleGoogle} className="w-full">
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Confirmation Email Modal */}
      <Dialog open={signupSuccess} onOpenChange={(open) => {
        if (!open) {
          setSignupSuccess(false);
          router.push("/auth/login");
        }
      }}>
        <DialogContent className="sm:max-w-md border-purple-500/20 bg-[#0e0e1a]">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-purple-500/10 ring-1 ring-purple-500/20">
              <Mail className="size-8 text-purple-400" />
            </div>
            <DialogTitle className="text-xl">Check your email</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              We sent a confirmation link to
            </DialogDescription>
            <p className="mt-1 text-sm font-medium text-foreground break-all">{registeredEmail}</p>
          </DialogHeader>
          <div className="mt-2 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
            <p>Click the link in the email to activate your account and start swiping.</p>
            <div className="rounded-lg bg-white/5 px-4 py-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Didn&apos;t get the email?</p>
              <p className="mt-1">Check your spam folder or try signing up again.</p>
            </div>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => {
                setSignupSuccess(false);
                router.push("/auth/login");
              }}
            >
              Back to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
