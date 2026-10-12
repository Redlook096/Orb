import React from "react";
import { AbsoluteFill } from "remotion";
import { FontGate } from "../components/FontGate";
import { AudioClips, MusicBed } from "../components/AudioTrack";
import { CaptionLayer } from "../components/Captions";
import type { BaseTimeline } from "../lib/types";
import type { CommonInput } from "./common";
import { FONT_UI } from "../lib/fonts";

/** Shared chrome for every template: fonts, music, speech/SFX and the caption layer. */
export const Shell: React.FC<{
  input: CommonInput;
  timeline: BaseTimeline;
  children: React.ReactNode;
  captionTop?: string;
  showCaptions?: boolean;
}> = ({ input, timeline, children, captionTop, showCaptions = true }) => (
  <FontGate>
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT_UI, overflow: "hidden" }}>
      {children}
      {showCaptions && timeline.captions.length > 0 ? (
        <CaptionLayer words={timeline.captions} settings={input.captions} top={captionTop} />
      ) : null}
      <AudioClips clips={timeline.audio} />
      <MusicBed music={input.music} />
    </AbsoluteFill>
  </FontGate>
);
