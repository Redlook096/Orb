"use client";

import type { ChatMessage, FakeTextsInput } from "@/remotion/templates/fake-texts/meta";
import { Field, Segmented, TextInput, Toggle } from "../../fields/basic";
import { MediaPicker } from "../../fields/MediaPicker";
import { ListEditor, inlineInput, newId, type Setter } from "./shared";
import { cn } from "../../ui/primitives";

export const FakeTextsForm: React.FC<{ input: FakeTextsInput; set: Setter<FakeTextsInput> }> = ({ input, set }) => (
  <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="App">
        <Segmented value={input.app} onChange={(app) => set({ app })} options={[{ value: "imessage", label: "iMessage" }, { value: "whatsapp", label: "WhatsApp" }, { value: "instagram", label: "Instagram" }]} />
      </Field>
      <Field label="Theme">
        <Segmented value={input.theme} onChange={(theme) => set({ theme })} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} />
      </Field>
      <Field label="Contact name">
        <TextInput value={input.contactName} onChange={(contactName) => set({ contactName })} />
      </Field>
      <Field label="Layout">
        <Segmented value={input.layout} onChange={(layout) => set({ layout })} options={[{ value: "split", label: "Split" }, { value: "full", label: "Floating" }]} />
      </Field>
    </div>
    <Field label="Contact photo (optional)">
      <MediaPicker kind="image" value={input.contactAvatar ? { src: input.contactAvatar } : null} onChange={(a) => set({ contactAvatar: a?.src ?? null })} compact />
    </Field>
    <Field label={`Messages (${input.messages.length})`}>
      <ListEditor<ChatMessage>
        items={input.messages}
        onChange={(messages) => set({ messages })}
        addLabel="Add message"
        create={() => ({ id: newId(), from: input.messages.at(-1)?.from === "me" ? "them" : "me", text: "" })}
        render={(m, update) => (
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => update({ from: m.from === "me" ? "them" : "me" })}
              className={cn("mt-0.5 w-16 shrink-0 rounded-lg py-1.5 text-[11px] font-bold", m.from === "me" ? "bg-[#0A84FF] text-white" : "bg-ink-600 text-ink-100")}
              title="Switch sender"
            >
              {m.from === "me" ? "Me" : "Them"}
            </button>
            <textarea rows={1} className={cn(inlineInput, "min-h-[34px] resize-y")} value={m.text} placeholder="Message…" onChange={(e) => update({ text: e.target.value })} />
          </div>
        )}
      />
    </Field>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Toggle checked={input.readMessages} onChange={(readMessages) => set({ readMessages })} label="Read aloud" />
      <Toggle checked={input.typingIndicator} onChange={(typingIndicator) => set({ typingIndicator })} label="Typing dots" />
      <Toggle checked={input.sounds} onChange={(sounds) => set({ sounds })} label="Message sounds" />
    </div>
  </>
);
