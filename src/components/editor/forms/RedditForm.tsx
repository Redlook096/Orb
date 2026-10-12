"use client";

import type { RedditInput } from "@/remotion/templates/reddit/meta";
import { Field, Segmented, TextArea, TextInput, Toggle } from "../../fields/basic";
import { MediaPicker } from "../../fields/MediaPicker";
import type { Setter } from "./shared";

export const RedditForm: React.FC<{ input: RedditInput; set: Setter<RedditInput> }> = ({ input, set }) => {
  const words = input.body.split(/\s+/).filter(Boolean).length;
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Subreddit">
          <TextInput prefix="r/" value={input.subreddit} onChange={(subreddit) => set({ subreddit: subreddit.replace(/^r\//, "") })} />
        </Field>
        <Field label="Username">
          <TextInput prefix="u/" value={input.username} onChange={(username) => set({ username: username.replace(/^u\//, "") })} />
        </Field>
      </div>
      <Field label="Title" hint="Read aloud while the post card is on screen.">
        <TextArea rows={2} value={input.title} onChange={(title) => set({ title })} />
      </Field>
      <Field label="Story" aside={<span className="text-[11px] text-ink-400">{words} words · ~{Math.round((words / 2.9) / 1.0)}s</span>}>
        <TextArea rows={10} value={input.body} onChange={(body) => set({ body })} placeholder="Paste or write the story. Blank lines start new paragraphs." />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Upvotes">
          <TextInput value={input.upvotes} onChange={(upvotes) => set({ upvotes })} />
        </Field>
        <Field label="Comments">
          <TextInput value={input.comments} onChange={(comments) => set({ comments })} />
        </Field>
        <Field label="Posted">
          <TextInput value={input.timeAgo} onChange={(timeAgo) => set({ timeAgo })} />
        </Field>
        <Field label="Card">
          <Segmented value={input.cardTheme} onChange={(cardTheme) => set({ cardTheme })} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        </Field>
      </div>
      <Field label="Subreddit icon (optional)">
        <MediaPicker kind="image" value={input.avatar ? { src: input.avatar } : null} onChange={(a) => set({ avatar: a?.src ?? null })} compact />
      </Field>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Toggle checked={input.readTitle} onChange={(readTitle) => set({ readTitle })} label="Read title" />
        <Toggle checked={input.verified} onChange={(verified) => set({ verified })} label="Verified badge" />
        <Toggle checked={input.awards} onChange={(awards) => set({ awards })} label="Awards" />
      </div>
    </>
  );
};
