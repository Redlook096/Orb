"use client";

import React from "react";
import { cn } from "../ui/primitives";

export const Field: React.FC<{ label?: string; hint?: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }> = ({ label, hint, children, className, aside }) => (
  <label className={cn("block", className)}>
    {label ? (
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-ink-200">{label}</span>
        {aside}
      </div>
    ) : null}
    {children}
    {hint ? <div className="mt-1 text-[11.5px] text-ink-400">{hint}</div> : null}
  </label>
);

const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-ink-850 px-3 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

export const TextInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string; className?: string; maxLength?: number }> = ({ value, onChange, placeholder, prefix, className, maxLength }) => (
  <div className={cn("relative", className)}>
    {prefix ? <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-400">{prefix}</span> : null}
    <input value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(inputCls, "h-10", prefix && "pl-8")} />
  </div>
);

export const TextArea: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; className?: string }> = ({ value, onChange, placeholder, rows = 4, className }) => (
  <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={cn(inputCls, "resize-y py-2.5 leading-relaxed", className)} />
);

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn("flex rounded-xl border border-white/[0.08] bg-ink-850 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[12.5px] font-semibold whitespace-nowrap transition",
            value === o.value ? "bg-white/[0.1] text-white shadow-sm" : "text-ink-400 hover:text-ink-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({ checked, onChange, label, hint }) => (
  <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition hover:bg-white/[0.04]">
    <span>
      <span className="block text-[13px] font-semibold text-ink-100">{label}</span>
      {hint ? <span className="block text-[11.5px] text-ink-400">{hint}</span> : null}
    </span>
    <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition", checked ? "bg-brand-500" : "bg-ink-600")}>
      <span className={cn("absolute top-1 size-4 rounded-full bg-white shadow transition-all", checked ? "left-5" : "left-1")} />
    </span>
  </button>
);

export const Slider: React.FC<{ value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string }> = ({ value, onChange, min, max, step = 1, format }) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-600 accent-brand-500"
    />
    <span className="w-14 text-right text-xs font-semibold text-ink-200 tabular-nums">{format ? format(value) : value}</span>
  </div>
);

export const ColorField: React.FC<{ value: string; onChange: (v: string) => void; swatches?: string[] }> = ({ value, onChange, swatches = [] }) => (
  <div className="flex items-center gap-2">
    <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/10" style={{ background: value }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
    {swatches.map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)} className={cn("size-6 rounded-full border-2 transition", value.toLowerCase() === s.toLowerCase() ? "border-white" : "border-transparent")} style={{ background: s }} aria-label={s} />
    ))}
  </div>
);

export const Section: React.FC<{ title: string; description?: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, description, children, actions }) => (
  <section className="rounded-2xl border border-white/[0.07] bg-ink-900/70 p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-bold text-white">{title}</h3>
        {description ? <p className="mt-0.5 text-[12.5px] text-ink-400">{description}</p> : null}
      </div>
      {actions}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);
