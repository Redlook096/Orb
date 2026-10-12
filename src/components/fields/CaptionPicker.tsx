"use client";

import "@/remotion/lib/fonts";
import { CAPTION_STYLES } from "@/remotion/lib/captions";
import { CaptionWord } from "@/remotion/components/Captions";
import type { CaptionSettings, CaptionStyleId } from "@/remotion/lib/types";
import { ColorField, Field, Segmented, Slider, Toggle } from "./basic";
import { cn } from "../ui/primitives";

const SAMPLE = ["SO", "VIRAL"];

export const CaptionPicker: React.FC<{ value: CaptionSettings; onChange: (v: CaptionSettings) => void; allowDisable?: boolean }> = ({ value, onChange, allowDisable = true }) => {
  const set = (patch: Partial<CaptionSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-4">
      {allowDisable ? <Toggle checked={value.enabled} onChange={(enabled) => set({ enabled })} label="Show captions" hint="Word-by-word, synced to the voice" /> : null}
      {value.enabled ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
            {(Object.keys(CAPTION_STYLES) as CaptionStyleId[]).map((id) => {
              const s = CAPTION_STYLES[id];
              const active = value.style === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => set({ style: id, maxWords: s.defaultMaxWords, uppercase: s.defaultUppercase, highlight: s.defaultHighlight })}
                  className={cn("relative flex h-[76px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 bg-[linear-gradient(135deg,#2b2140,#13121c)] transition", active ? "border-brand-400" : "border-transparent hover:border-white/20")}
                >
                  <div
                    style={{ fontFamily: s.font, fontWeight: s.weight, fontSize: 18, lineHeight: 1.1, letterSpacing: (s.letterSpacing ?? 0) / 4, textTransform: s.defaultUppercase ? "uppercase" : "none", whiteSpace: "nowrap" }}
                  >
                    {(s.single ? ["VIRAL"] : SAMPLE).map((w, i) => (
                      <CaptionWord
                        key={w}
                        text={s.defaultUppercase ? w : w.toLowerCase()}
                        style={{ ...s, shadow: undefined }}
                        size={18}
                        scale={1}
                        color={s.active === "color" && i === (s.single ? 0 : 1) ? s.defaultHighlight : s.active === "karaoke" && i < 1 ? s.defaultHighlight : s.fill}
                        boxColor={s.active === "box" && i === 1 ? s.defaultHighlight : undefined}
                        glowColor={s.active === "glow" ? s.defaultHighlight : undefined}
                      />
                    ))}
                  </div>
                  <div className="absolute bottom-1 text-[10px] font-semibold text-ink-300">{s.name}</div>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Position">
              <Segmented value={value.position} onChange={(position) => set({ position })} options={[{ value: "top", label: "Top" }, { value: "center", label: "Center" }, { value: "bottom", label: "Bottom" }]} />
            </Field>
            <Field label="Highlight color">
              <ColorField value={value.highlight} onChange={(highlight) => set({ highlight })} swatches={["#FFE135", "#3CFF6B", "#FF2E4C", "#00E5FF", "#7C3AED", "#FF9F1C"]} />
            </Field>
            {!CAPTION_STYLES[value.style]?.single ? (
              <Field label="Words per page">
                <Slider value={value.maxWords} min={1} max={6} onChange={(maxWords) => set({ maxWords })} />
              </Field>
            ) : null}
            <Field label="Size">
              <Slider value={value.scale} min={0.6} max={1.5} step={0.05} onChange={(scale) => set({ scale })} format={(v) => `${Math.round(v * 100)}%`} />
            </Field>
          </div>
          <Toggle checked={value.uppercase} onChange={(uppercase) => set({ uppercase })} label="ALL CAPS" />
        </>
      ) : null}
    </div>
  );
};
