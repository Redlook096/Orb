"use client";

import React from "react";
import { LoaderCircle } from "lucide-react";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({ variant = "secondary", size = "md", loading, icon, className, children, disabled, ...rest }) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all select-none disabled:cursor-not-allowed disabled:opacity-50",
      size === "sm" && "h-8 px-3 text-xs",
      size === "md" && "h-10 px-4 text-sm",
      size === "lg" && "h-12 px-6 text-[15px]",
      variant === "primary" && "bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-[0_8px_30px_-8px_rgb(139_92_246/0.7)] hover:brightness-110 active:brightness-95",
      variant === "secondary" && "border border-white/10 bg-white/[0.04] text-ink-100 hover:bg-white/[0.08]",
      variant === "ghost" && "text-ink-300 hover:bg-white/[0.06] hover:text-ink-100",
      variant === "danger" && "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
      className,
    )}
  >
    {loading ? <LoaderCircle className="size-4 animate-spin" /> : icon}
    {children}
  </button>
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div {...rest} className={cn("rounded-2xl border border-white/[0.07] bg-ink-900/80", className)} />
);

export const Badge: React.FC<{ children: React.ReactNode; tone?: "default" | "good" | "warn" | "bad" | "brand"; className?: string }> = ({ children, tone = "default", className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
      tone === "default" && "bg-white/[0.07] text-ink-300",
      tone === "good" && "bg-emerald-500/15 text-emerald-300",
      tone === "warn" && "bg-amber-500/15 text-amber-300",
      tone === "bad" && "bg-red-500/15 text-red-300",
      tone === "brand" && "bg-brand-500/20 text-brand-300",
      className,
    )}
  >
    {children}
  </span>
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode; eyebrow?: string }> = ({ title, subtitle, actions, eyebrow }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow ? <div className="mb-2 text-xs font-semibold tracking-[0.18em] text-brand-400 uppercase">{eyebrow}</div> : null}
      <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-2xl text-[15px] text-ink-300">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
  </div>
);

export const Notice: React.FC<{ tone?: "info" | "warn" | "error" | "good"; children: React.ReactNode; className?: string }> = ({ tone = "info", children, className }) => (
  <div
    className={cn(
      "rounded-xl border px-4 py-3 text-sm",
      tone === "info" && "border-sky-500/25 bg-sky-500/10 text-sky-200",
      tone === "warn" && "border-amber-500/25 bg-amber-500/10 text-amber-200",
      tone === "error" && "border-red-500/25 bg-red-500/10 text-red-200",
      tone === "good" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
      className,
    )}
  >
    {children}
  </div>
);

export const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <div className={cn("h-2 overflow-hidden rounded-full bg-white/[0.07]", className)}>
    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent transition-[width] duration-500" style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
  </div>
);

export const Empty: React.FC<{ icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }> = ({ icon, title, body, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
    <div className="mb-4 rounded-2xl bg-white/[0.05] p-4 text-ink-300">{icon}</div>
    <div className="font-semibold text-ink-100">{title}</div>
    {body ? <p className="mt-1 max-w-sm text-sm text-ink-400">{body}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
