"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Heart,
  Coffee,
  Sparkles,
  Shield,
  Rocket,
  Gift,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const tiers = [
  {
    name: "Coffee",
    amount: "$3",
    icon: Coffee,
    description: "Buy me a coffee. Every bit helps keep the servers running.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    name: "Supporter",
    amount: "$5",
    icon: Heart,
    description: "Show some love. Funds go toward hosting and new features.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    name: "Champion",
    amount: "$10",
    icon: Sparkles,
    description: "You're awesome. Help accelerate development and priority features.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
];

const useCases = [
  {
    icon: Shield,
    title: "Server costs",
    desc: "Database space, domain, and hosting.",
  },
  {
    icon: Rocket,
    title: "New features",
    desc: "More headers, better matching, custom themes.",
  },
  {
    icon: Gift,
    title: "Community rewards",
    desc: "Exclusive cosmetics and supporter badges.",
  },
];

export default function SupportPage() {
  return (
    <main className="noise-bg min-h-screen px-4 py-12">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        <GlassCard className="overflow-hidden p-0">
          <div className="relative h-32 w-full overflow-hidden">
            <Image
              src="/headers/Abstract.avif"
              alt=""
              fill
              className="object-cover object-right-top"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            <div className="absolute bottom-4 left-5">
              <h1 className="text-2xl font-bold">Support Unhinged</h1>
              <p className="text-sm text-muted-foreground">
                Help keep the platform alive and growing
              </p>
            </div>
          </div>

          <div className="p-5">
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Unhinged is built by a solo developer. Your support directly funds
              server costs, new features, and community rewards. No paywalls,
              no locked content — just optional support to keep the project
              alive.
            </p>

            <div className="mb-6 grid grid-cols-3 gap-3">
              {useCases.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
                >
                  <item.icon className="mx-auto mb-1.5 size-5 text-primary" />
                  <h3 className="text-xs font-semibold">{item.title}</h3>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {tiers.map((tier) => (
                <a
                  key={tier.name}
                  href="https://ko-fi.com/unhinged"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div
                    className={`flex items-center gap-4 rounded-xl border ${tier.border} ${tier.bg} p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
                  >
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${tier.bg}`}
                    >
                      <tier.icon className={`size-6 ${tier.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{tier.name}</h3>
                        <span className={`text-sm font-bold ${tier.color}`}>
                          {tier.amount}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Payments are processed securely through{" "}
                <a
                  href="https://ko-fi.com/unhinged"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Ko-Fi
                </a>
                . No account required.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
