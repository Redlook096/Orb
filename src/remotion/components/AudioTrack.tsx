import React from "react";
import { Audio, Sequence, interpolate, useVideoConfig } from "remotion";
import type { AudioClip, MusicSpec } from "../lib/types";
import { toFrames } from "../lib/constants";
import { musicSrc, resolveSrc } from "../lib/static";

export const AudioClips: React.FC<{ clips: AudioClip[] }> = ({ clips }) => (
  <>
    {clips.map((clip, i) => (
      <Sequence
        key={`${clip.src}-${i}`}
        from={toFrames(clip.at)}
        // Every clip unmounts when it ends; open-ended sequences would pile up audio tags.
        durationInFrames={Math.max(1, toFrames(clip.duration ?? (clip.src.startsWith("sfx:") ? 2.5 : 30)))}
        layout="none"
        name={`audio-${i}`}
      >
        <Audio src={resolveSrc(clip.src)} volume={clip.volume ?? 1} />
      </Sequence>
    ))}
  </>
);

/** Background music that loops for the whole video and fades out over the last second. */
export const MusicBed: React.FC<{ music: MusicSpec }> = ({ music }) => {
  const { durationInFrames, fps } = useVideoConfig();
  if (!music.track || music.volume <= 0) return null;
  return (
    <Audio
      src={musicSrc(music.track)}
      loop
      volume={(f) =>
        music.volume *
        interpolate(f, [0, fps * 0.4, durationInFrames - fps * 1.2, durationInFrames], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
};
