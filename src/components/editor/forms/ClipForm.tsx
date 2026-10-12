"use client";

import type { BlurInput, CaptionsInput, ClipInput, SplitInput } from "@/remotion/templates/clip/meta";
import type { TemplateId } from "@/remotion/lib/types";
import { Field, Segmented, Slider, TextInput, Toggle } from "../../fields/basic";
import { MediaPicker } from "../../fields/MediaPicker";
import type { Setter } from "./shared";

export const ClipForm: React.FC<{ template: TemplateId; input: ClipInput; set: Setter<ClipInput & Partial<SplitInput & BlurInput & CaptionsInput>> }> = ({ template, input, set }) => {
  const any = input as ClipInput & Partial<SplitInput & BlurInput & CaptionsInput>;
  return (
    <>
      <Field label="Your clip" hint="MP4, MOV or WebM. Long clips are fine; the video lasts as long as the clip.">
        <MediaPicker
          kind="video"
          value={input.clip ? { src: input.clip.src, name: input.clip.name } : null}
          onChange={(a) =>
            set({
              clip: a ? { src: a.src, duration: a.duration, width: a.width, height: a.height, name: a.name } : null,
              transcript: null,
              // Vertical clips fill the frame; landscape ones keep their full picture over a blur.
              ...(template === "captions" && a?.width && a?.height ? { fit: a.width / a.height > 0.8 ? ("contain" as const) : ("cover" as const) } : {}),
            })
          }
          label="Upload your clip"
        />
      </Field>
      {input.transcript?.length ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[12px] text-emerald-200">
          Transcript ready · {input.transcript.length} words
          <button type="button" className="font-semibold text-emerald-300 hover:text-emerald-100" onClick={() => set({ transcript: null })}>
            Re-transcribe
          </button>
        </div>
      ) : null}
      <Field label="Clip volume">
        <Slider value={input.clipVolume} min={0} max={1.5} step={0.05} onChange={(clipVolume) => set({ clipVolume })} format={(v) => `${Math.round(v * 100)}%`} />
      </Field>
      {template === "split-screen" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Clip share of the screen">
            <Slider value={any.ratio ?? 0.5} min={0.3} max={0.7} step={0.01} onChange={(ratio) => set({ ratio })} format={(v) => `${Math.round(v * 100)}%`} />
          </Field>
          <Field label="Clip position">
            <Segmented value={any.clipOnTop === false ? "bottom" : "top"} onChange={(v) => set({ clipOnTop: v === "top" })} options={[{ value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }]} />
          </Field>
        </div>
      ) : null}
      {template === "blur" ? (
        <>
          <Field label="Headline" hint="Shown in a white box above the clip. Leave empty to hide.">
            <TextInput value={any.headline ?? ""} onChange={(headline) => set({ headline })} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Background blur">
              <Slider value={any.blur ?? 42} min={10} max={90} onChange={(blur) => set({ blur })} format={(v) => `${v}px`} />
            </Field>
            <Field label="Clip zoom">
              <Slider value={any.zoom ?? 1} min={1} max={1.8} step={0.05} onChange={(zoom) => set({ zoom })} format={(v) => `${Math.round(v * 100)}%`} />
            </Field>
          </div>
        </>
      ) : null}
      {template === "captions" ? (
        <Field label="Framing">
          <Segmented value={any.fit ?? "cover"} onChange={(fit) => set({ fit })} options={[{ value: "cover", label: "Fill 9:16" }, { value: "contain", label: "Fit + blur" }]} />
        </Field>
      ) : null}
      {template !== "captions" ? null : <Toggle checked={input.captions.enabled} onChange={(enabled) => set({ captions: { ...input.captions, enabled } })} label="Burn in captions" hint="Transcribed automatically when you generate" />}
    </>
  );
};
