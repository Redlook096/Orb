"use client";

import type { WyrInput, WyrQuestion } from "@/remotion/templates/wyr/meta";
import { ColorField, Field, Segmented, Slider, TextInput } from "../../fields/basic";
import { ListEditor, inlineInput, newId, type Setter } from "./shared";

export const WyrForm: React.FC<{ input: WyrInput; set: Setter<WyrInput> }> = ({ input, set }) => (
  <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Title pill">
        <TextInput value={input.title} onChange={(title) => set({ title })} />
      </Field>
      <Field label="Countdown">
        <Slider value={input.countdown} min={2} max={6} onChange={(countdown) => set({ countdown })} format={(v) => `${v}s`} />
      </Field>
      <Field label="Option A color">
        <ColorField value={input.aColor} onChange={(aColor) => set({ aColor })} swatches={["#E53935", "#F97316", "#DB2777", "#16A34A"]} />
      </Field>
      <Field label="Option B color">
        <ColorField value={input.bColor} onChange={(bColor) => set({ bColor })} swatches={["#1E63E9", "#0891B2", "#7C3AED", "#111827"]} />
      </Field>
    </div>
    <Field label="Look">
      <Segmented value={input.layout} onChange={(layout) => set({ layout })} options={[{ value: "colors", label: "Solid colors" }, { value: "background", label: "Over background" }]} />
    </Field>
    <Field label={`Questions (${input.questions.length})`}>
      <ListEditor<WyrQuestion>
        items={input.questions}
        onChange={(questions) => set({ questions })}
        addLabel="Add question"
        max={20}
        create={() => ({ id: newId(), a: "", b: "", aEmoji: "🔥", bEmoji: "❄️", percentA: 50 })}
        render={(q, update) => (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input className={`${inlineInput} w-12 text-center`} value={q.aEmoji} onChange={(e) => update({ aEmoji: e.target.value })} />
              <input className={inlineInput} value={q.a} placeholder="Option A" onChange={(e) => update({ a: e.target.value })} style={{ borderLeft: `3px solid ${input.aColor}` }} />
            </div>
            <div className="flex gap-1.5">
              <input className={`${inlineInput} w-12 text-center`} value={q.bEmoji} onChange={(e) => update({ bEmoji: e.target.value })} />
              <input className={inlineInput} value={q.b} placeholder="Option B" onChange={(e) => update({ b: e.target.value })} style={{ borderLeft: `3px solid ${input.bColor}` }} />
            </div>
            <div className="flex items-center gap-2 pl-1 text-[11px] text-ink-400">
              Picked A
              <div className="flex-1">
                <Slider value={q.percentA} min={1} max={99} onChange={(percentA) => update({ percentA })} format={(v) => `${v}%`} />
              </div>
            </div>
          </div>
        )}
      />
    </Field>
  </>
);
