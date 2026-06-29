"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginCard } from "@/components/auth/LoginCard";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (user) return null;

  return <LoginCard />;
}
