"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (!code) {
      setStatus("error");
      setMessage("No verification code found in the URL.");
      return;
    }

    const supabase = createClient();

    supabase.auth
      .exchangeCodeForSession(code)
      .then(async ({ data, error }) => {
        if (error || !data.user) {
          console.error("[auth/callback] exchangeCodeForSession error:", error);
          setStatus("error");
          setMessage(error?.message ?? "Failed to verify your email.");
          return;
        }

        const user = data.user;
        const displayName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User";

        // Ensure profile exists (trigger may have already created it)
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            username: user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`,
            display_name: displayName,
            avatar_url: user.user_metadata?.avatar_url || null,
            bio: null,
            creator_name: null,
            creator_bio: null,
            creator_avatar_url: null,
            creator_header_url: "/headers/Abstract.avif",
            creator_discord: null,
            creator_website: null,
            creator_visible: true,
          },
          { onConflict: "id" }
        );

        if (profileError) {
          console.error("[auth/callback] Profile upsert error:", profileError.message);
        }

        setStatus("success");
        setMessage("Your email is verified!");

        // Redirect after a brief moment so the user sees the success state
        setTimeout(() => {
          router.push(next);
        }, 1500);
      })
      .catch((err) => {
        console.error("[auth/callback] Unexpected error:", err);
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h1 className="text-xl font-bold">Verifying your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-green-500">All set!</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <p className="mt-1 text-xs text-muted-foreground">Redirecting you now…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-destructive">Verification failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button
              className="mt-6 w-full"
              onClick={() => router.push("/auth/login")}
            >
              Go to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h1 className="text-xl font-bold">Verifying your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Just a moment…
            </p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
