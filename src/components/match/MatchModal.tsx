"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicImageUrl } from "@/lib/utils";

interface MatchModalProps {
  open: boolean;
  myOc: { name: string; image_url: string | null } | null;
  matchedOc: { name: string; image_url: string | null; id: string } | null;
  onStartChat: () => void;
  onClose: () => void;
}

function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.2, 0],
        y: [0, -30 - Math.random() * 40],
      }}
      transition={{
        duration: 1.2 + Math.random() * 0.6,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
      }}
    >
      <div className="text-xl" style={{ color: `hsl(${300 + Math.random() * 60}, 100%, ${70 + Math.random() * 20}%)` }}>
        ✦
      </div>
    </motion.div>
  );
}

function ConfettiPiece({ delay, startX }: { delay: number; startX: number }) {
  const color = `hsl(${Math.random() * 60 + 300}, 100%, ${65 + Math.random() * 20}%)`;
  const size = 4 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute pointer-events-none rounded-sm"
      style={{
        left: `${startX}%`,
        top: "-5%",
        width: size,
        height: size * (0.5 + Math.random() * 0.5),
        backgroundColor: color,
        rotate: rotation,
      }}
      initial={{ y: -20, opacity: 1, rotate: rotation }}
      animate={{
        y: ["0vh", "110vh"],
        opacity: [1, 1, 0],
        rotate: [rotation, rotation + 360 + Math.random() * 720],
        x: [0, (Math.random() - 0.5) * 100],
      }}
      transition={{
        duration: 2.5 + Math.random() * 1.5,
        delay,
        ease: "easeIn",
      }}
    />
  );
}

export default function MatchModal({ open, myOc, matchedOc, onStartChat, onClose }: MatchModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setShow(true);
    } else {
      const t = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!show || !matchedOc) return null;

  const myImg = myOc ? getPublicImageUrl(myOc.image_url) : null;
  const matchedImg = getPublicImageUrl(matchedOc.image_url);

  const sparkles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: 10 + Math.random() * 80,
    y: 15 + Math.random() * 70,
  }));

  const confetti = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.5,
    startX: Math.random() * 100,
  }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Confetti layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confetti.map((c) => (
              <ConfettiPiece key={c.id} delay={c.delay} startX={c.startX} />
            ))}
          </div>

          {/* Sparkle layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {sparkles.map((s) => (
              <Sparkle key={s.id} delay={s.delay} x={s.x} y={s.y} />
            ))}
          </div>

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-6"
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
          >
            {/* Title */}
            <motion.h1
              className="text-4xl font-extrabold tracking-tight md:text-5xl"
              style={{
                background: "linear-gradient(135deg, #ff2d7b 0%, #a855f7 50%, #ff2d7b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
              }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              It&apos;s a Match!
            </motion.h1>

            {/* Portraits */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* My OC */}
              <motion.div
                className="relative"
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-60 blur-md" />
                  <div className="relative size-24 overflow-hidden rounded-full border-2 border-pink-500/50 md:size-32">
                    {myImg ? (
                      <img src={myImg} alt={myOc?.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center-center bg-zinc-800 text-2xl font-bold text-muted-foreground">
                        {myOc?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-center text-xs font-medium text-pink-300 md:text-sm">{myOc?.name}</p>
              </motion.div>

              {/* Heart */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                <div className="text-3xl md:text-4xl" style={{ color: "#ff2d7b" }}>♥</div>
              </motion.div>

              {/* Matched OC */}
              <motion.div
                className="relative"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-60 blur-md" />
                  <div className="relative size-24 overflow-hidden rounded-full border-2 border-purple-500/50 md:size-32">
                    {matchedImg ? (
                      <img src={matchedImg} alt={matchedOc.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-zinc-800 text-2xl font-bold text-muted-foreground">
                        {matchedOc.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-center text-xs font-medium text-purple-300 md:text-sm">{matchedOc.name}</p>
              </motion.div>
            </div>

            {/* CTA */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                size="lg"
                onClick={onStartChat}
                className="gap-2 rounded-full px-8 shadow-[0_0_24px_rgba(255,45,123,0.45)] hover:shadow-[0_0_32px_rgba(255,45,123,0.6)]"
              >
                <MessageCircle className="size-5" />
                Start Chatting
              </Button>
              <button
                onClick={onClose}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
