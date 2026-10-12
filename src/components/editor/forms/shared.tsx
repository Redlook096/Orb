"use client";

import React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "../../ui/primitives";

export type Setter<T> = (patch: Partial<T>) => void;

export const newId = () => Math.random().toString(36).slice(2, 9);

/** Generic list editor with add / remove / reorder controls. */
export function ListEditor<T extends { id: string }>({
  items,
  onChange,
  render,
  create,
  addLabel,
  max = 60,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  create: () => T;
  addLabel: string;
  max?: number;
}) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.id} className="group flex gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="min-w-0 flex-1">{render(item, (patch) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...patch } : x))), i)}</div>
          <div className="flex shrink-0 flex-col gap-0.5 opacity-60 transition group-hover:opacity-100">
            <button type="button" className="rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" className="rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">
              <ArrowDown className="size-3.5" />
            </button>
            <button type="button" className="rounded-md p-1 text-ink-400 hover:bg-red-500/20 hover:text-red-300" onClick={() => onChange(items.filter((x) => x.id !== item.id))} aria-label="Remove">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      {items.length < max ? (
        <Button variant="secondary" size="sm" icon={<Plus className="size-3.5" />} onClick={() => onChange([...items, create()])} className="w-full border-dashed">
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}

export const inlineInput =
  "w-full rounded-lg border border-white/[0.07] bg-ink-850 px-2.5 py-1.5 text-[13px] text-ink-100 placeholder:text-ink-500 outline-none focus:border-brand-500/60";
