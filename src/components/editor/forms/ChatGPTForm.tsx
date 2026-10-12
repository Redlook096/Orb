"use client";

import type { AiMessage, ChatGPTInput } from "@/remotion/templates/chatgpt/meta";
import { Field, Segmented, TextInput, Toggle } from "../../fields/basic";
import { ListEditor, inlineInput, newId, type Setter } from "./shared";
import { cn } from "../../ui/primitives";

export const ChatGPTForm: React.FC<{ input: ChatGPTInput; set: Setter<ChatGPTInput> }> = ({ input, set }) => (
  <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Field label="Theme">
        <Segmented value={input.theme} onChange={(theme) => set({ theme })} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} />
      </Field>
      <Field label="Layout">
        <Segmented value={input.layout} onChange={(layout) => set({ layout })} options={[{ value: "split", label: "Split" }, { value: "full", label: "Full" }]} />
      </Field>
      <Field label="Assistant label">
        <TextInput value={input.modelLabel} onChange={(modelLabel) => set({ modelLabel })} />
      </Field>
    </div>
    <Field label={`Conversation (${input.messages.length})`}>
      <ListEditor<AiMessage>
        items={input.messages}
        onChange={(messages) => set({ messages })}
        addLabel="Add message"
        create={() => ({ id: newId(), role: input.messages.at(-1)?.role === "user" ? "assistant" : "user", text: "" })}
        render={(m, update) => (
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => update({ role: m.role === "user" ? "assistant" : "user" })}
              className={cn("mt-0.5 w-16 shrink-0 rounded-lg py-1.5 text-[11px] font-bold", m.role === "user" ? "bg-ink-600 text-ink-100" : "bg-[#10A37F] text-white")}
            >
              {m.role === "user" ? "User" : "AI"}
            </button>
            <textarea rows={2} className={cn(inlineInput, "resize-y")} value={m.text} onChange={(e) => update({ text: e.target.value })} />
          </div>
        )}
      />
    </Field>
    <Toggle checked={input.readUser} onChange={(readUser) => set({ readUser })} label="Read user messages aloud" />
  </>
);
