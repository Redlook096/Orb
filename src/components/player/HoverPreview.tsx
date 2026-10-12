"use client";

import { useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { PreviewPlayer } from "./PreviewPlayer";
import type { TemplateId } from "@/remotion/lib/types";

/** A paused poster frame that plays while hovered, used by gallery cards. */
export const HoverPreview: React.FC<{ template: TemplateId; input: unknown; poster?: number }> = ({ template, input, poster = 75 }) => {
  const ref = useRef<PlayerRef>(null);
  const [active, setActive] = useState(false);
  return (
    <div
      className="h-full w-full"
      onMouseEnter={() => {
        setActive(true);
        ref.current?.seekTo(0);
        ref.current?.play();
      }}
      onMouseLeave={() => {
        setActive(false);
        ref.current?.pause();
        ref.current?.seekTo(poster);
      }}
    >
      <PreviewPlayer ref={ref} template={template} input={input} controls={false} muted initialFrame={poster} clickToPlay={false} loop />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent transition-opacity ${active ? "opacity-0" : "opacity-100"}`} />
    </div>
  );
};
