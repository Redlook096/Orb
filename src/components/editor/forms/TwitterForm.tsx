"use client";

import type { Tweet, TwitterInput } from "@/remotion/templates/twitter/meta";
import { Field, Segmented, TextInput, Toggle } from "../../fields/basic";
import { MediaPicker } from "../../fields/MediaPicker";
import { ListEditor, inlineInput, newId, type Setter } from "./shared";
import { cn } from "../../ui/primitives";

export const TwitterForm: React.FC<{ input: TwitterInput; set: Setter<TwitterInput> }> = ({ input, set }) => (
  <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Display name">
        <TextInput value={input.name} onChange={(name) => set({ name })} />
      </Field>
      <Field label="Handle">
        <TextInput prefix="@" value={input.handle} onChange={(handle) => set({ handle: handle.replace(/^@/, "") })} />
      </Field>
      <Field label="Theme">
        <Segmented value={input.theme} onChange={(theme) => set({ theme })} options={[{ value: "dark", label: "Dark" }, { value: "dim", label: "Dim" }, { value: "light", label: "Light" }]} />
      </Field>
      <Field label="Date line">
        <TextInput value={input.date} onChange={(date) => set({ date })} />
      </Field>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Avatar (optional)">
        <MediaPicker kind="image" value={input.avatar ? { src: input.avatar } : null} onChange={(a) => set({ avatar: a?.src ?? null })} compact />
      </Field>
      <div className="pt-6">
        <Toggle checked={input.verified} onChange={(verified) => set({ verified })} label="Verified badge" />
      </div>
    </div>
    <Field label={`Thread (${input.tweets.length} tweets)`}>
      <ListEditor<Tweet>
        items={input.tweets}
        onChange={(tweets) => set({ tweets })}
        addLabel="Add tweet"
        max={12}
        create={() => ({ id: newId(), text: "", replies: "120", retweets: "480", likes: "3.2K", views: "210K" })}
        render={(t, update, i) => (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="mt-1.5 w-6 shrink-0 text-center text-[11px] font-bold text-ink-400">{i + 1}</span>
              <textarea rows={3} className={cn(inlineInput, "resize-y")} value={t.text} placeholder="What's happening?" onChange={(e) => update({ text: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 gap-1.5 pl-8">
              {(["replies", "retweets", "likes", "views"] as const).map((k) => (
                <input key={k} className={inlineInput} value={t[k]} onChange={(e) => update({ [k]: e.target.value })} placeholder={k} title={k} />
              ))}
            </div>
          </div>
        )}
      />
    </Field>
  </>
);
