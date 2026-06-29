import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.ComponentProps<"div"> {
  hover?: boolean
}

function GlassCard({ className, hover = true, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10",
        hover && "transition-all duration-300 ease-out hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-white/[0.15]",
        className
      )}
      {...props}
    />
  )
}

function GlassCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-5 pb-0", className)}
      {...props}
    />
  )
}

function GlassCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-base font-semibold leading-none tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

function GlassCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("p-5", className)}
      {...props}
    />
  )
}

function GlassCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center border-t border-white/5 p-5 pt-0", className)}
      {...props}
    />
  )
}

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardFooter }
