"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Bug,
  Sparkles,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

interface UpdateEntry {
  date: string;
  title: string;
  description: string;
  type: "fix" | "feature" | "status";
}

const updates: UpdateEntry[] = [
  {
    date: "2026-06-30",
    title: "Header system overhaul",
    description:
      "20 custom headers with per-header mobile positioning. Beach updated, Library renamed to Study, Forest & Mine added.",
    type: "feature",
  },
  {
    date: "2026-06-30",
    title: "Dashboard redesign",
    description:
      "Collapsible chat sidebar, creator banner, stat cards, drag-and-drop reordering, Create New OC card with pulse animation.",
    type: "feature",
  },
  {
    date: "2026-06-30",
    title: "Mobile nav overhaul",
    description:
      "Removed hamburger menu. All nav visible as icon-only. Creator avatar dropdown with profile, notifications, support, logout.",
    type: "feature",
  },
  {
    date: "2026-06-30",
    title: "Chat duplicate fix",
    description:
      "Chat sessions now canonicalize OC pair order. Same pair always maps to one conversation regardless of who initiates.",
    type: "fix",
  },
  {
    date: "2026-06-30",
    title: "Image upload persistence",
    description:
      "Upload handlers no longer overwrite on save. Creator header/avatar uploads are side-effect free until you click Save.",
    type: "fix",
  },
  {
    date: "2026-06-29",
    title: "Vercel deployment",
    description:
      "App live at unhinged-rp.vercel.app. Framework detection fixed, env vars configured, SSO protection disabled.",
    type: "status",
  },
];

const typeConfig = {
  fix: { icon: Bug, label: "Bug Fix", color: "text-green-400" },
  feature: { icon: Sparkles, label: "Feature", color: "text-primary" },
  status: { icon: TrendingUp, label: "Status", color: "text-blue-400" },
};

interface UpdatesModalProps {
  children: React.ReactElement;
}

export function UpdatesModal({ children }: UpdatesModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-md overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-white/10 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Bell className="size-5 text-primary" />
            What&apos;s New
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4">
            {updates.map((update, i) => {
              const cfg = typeConfig[update.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className={`size-4 ${cfg.color}`} />
                    <Badge
                      variant="secondary"
                      className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wider"
                    >
                      {cfg.label}
                    </Badge>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {update.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold">{update.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {update.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="mb-1 text-sm font-semibold text-primary">
              Support the project
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              If you&apos;re enjoying Unhinged, consider supporting development.
              All funds go toward server costs and new features.
            </p>
            <Button
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => {
                window.location.href = "/support";
              }}
            >
              <ExternalLink className="size-3.5" />
              Support on Ko-Fi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
