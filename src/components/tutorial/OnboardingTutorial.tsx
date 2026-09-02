"use client";

import { useState } from "react";
import {
  Flame,
  UserPlus,
  Heart,
  MessageCircle,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Flame,
    title: "Welcome to Unhinged",
    description:
      "Match with original characters. Swipe, chat, and connect in a roleplay universe where every character has a story.",
  },
  {
    icon: UserPlus,
    title: "Create Your Character",
    description:
      "Build your RP/OC with personality, tags, appearance, and a \"Two Truths & a Lie\" game to spark conversations.",
  },
  {
    icon: Heart,
    title: "Swipe & Match",
    description:
      "Browse characters, swipe right to like. When both sides match, the chat unlocks and the story begins.",
  },
  {
    icon: MessageCircle,
    title: "Chat & Levels",
    description:
      "Messages unlock deeper content as your chat level increases. The more you write, the more you see.",
  },
  {
    icon: Shield,
    title: "Block Tags",
    description:
      "Add block tags to hide characters you don't want to see. Your roster, your rules.",
  },
  {
    icon: Zap,
    title: "Ready?",
    description:
      "Jump in. Create a character or quick-test as a guest. The chaos awaits.",
  },
];

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  function handleOpen() {
    setStep(0);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className="w-full gap-2"
      >
        <BookOpen className="size-4" />
        Tutorial
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-md">
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Icon */}
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="size-8 text-primary" />
            </div>

            {/* Text */}
            <div className="flex flex-col items-center gap-2 text-center">
              <DialogTitle className="text-xl font-bold">
                {current.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "size-2 rounded-full transition-all duration-200",
                    i === step
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex w-full items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={prev}
                disabled={isFirst}
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>

              {isLast ? (
                <Button size="sm" onClick={handleClose} className="gap-1">
                  <Zap className="size-4" />
                  Get Started
                </Button>
              ) : (
                <Button size="sm" onClick={next} className="gap-1">
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
