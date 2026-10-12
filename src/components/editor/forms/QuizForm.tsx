"use client";

import type { QuizInput, QuizQuestion } from "@/remotion/templates/quiz/meta";
import { ColorField, Field, Slider, TextInput, Toggle } from "../../fields/basic";
import { ListEditor, inlineInput, newId, type Setter } from "./shared";
import { cn } from "../../ui/primitives";

const LETTERS = ["A", "B", "C", "D"];

export const QuizForm: React.FC<{ input: QuizInput; set: Setter<QuizInput> }> = ({ input, set }) => (
  <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Title">
        <TextInput value={input.title} onChange={(title) => set({ title })} />
      </Field>
      <Field label="Countdown">
        <Slider value={input.countdown} min={2} max={8} onChange={(countdown) => set({ countdown })} format={(v) => `${v}s`} />
      </Field>
    </div>
    <Field label="Correct answer color">
      <ColorField value={input.accent} onChange={(accent) => set({ accent })} swatches={["#22C55E", "#10B981", "#3B82F6", "#F59E0B"]} />
    </Field>
    <Field label={`Questions (${input.questions.length})`}>
      <ListEditor<QuizQuestion>
        items={input.questions}
        onChange={(questions) => set({ questions })}
        addLabel="Add question"
        max={20}
        create={() => ({ id: newId(), question: "", options: ["", "", "", ""], answer: 0, emoji: "❓" })}
        render={(q, update) => (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input className={`${inlineInput} w-12 text-center`} value={q.emoji} onChange={(e) => update({ emoji: e.target.value })} />
              <input className={inlineInput} value={q.question} placeholder="Question" onChange={(e) => update({ question: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {q.options.map((o, i) => (
                <div key={i} className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => update({ answer: i })}
                    className={cn("w-8 shrink-0 rounded-lg text-[11px] font-bold", q.answer === i ? "text-white" : "bg-ink-700 text-ink-300")}
                    style={q.answer === i ? { background: input.accent } : undefined}
                    title="Mark as correct"
                  >
                    {LETTERS[i]}
                  </button>
                  <input className={inlineInput} value={o} placeholder={`Option ${LETTERS[i]}`} onChange={(e) => update({ options: q.options.map((x, j) => (j === i ? e.target.value : x)) })} />
                </div>
              ))}
            </div>
          </div>
        )}
      />
    </Field>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Toggle checked={input.readOptions} onChange={(readOptions) => set({ readOptions })} label="Read options aloud" />
      <Toggle checked={input.speakAnswer} onChange={(speakAnswer) => set({ speakAnswer })} label="Announce the answer" />
    </div>
  </>
);
