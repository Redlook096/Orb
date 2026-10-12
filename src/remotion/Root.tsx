import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./lib/constants";
import { Background } from "./backgrounds";
import { FontGate } from "./components/FontGate";
import type { BackgroundSpec, BaseTimeline } from "./lib/types";
import { TEMPLATE_META } from "./registry";
import { TEMPLATE_COMPONENTS } from "./components";
import { DemoPodcast, type DemoPodcastProps } from "./demo/DemoPodcast";

const BgPreview: React.FC<{ spec: BackgroundSpec }> = ({ spec }) => (
  <FontGate>
    <Background spec={spec} />
  </FontGate>
);

export interface CompositionProps {
  input: unknown;
  timeline: BaseTimeline | null;
  [key: string]: unknown;
}

export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(TEMPLATE_META).map(([id, meta]) => {
      const Component = TEMPLATE_COMPONENTS[id as keyof typeof TEMPLATE_COMPONENTS];
      if (!meta || !Component) return null;
      return (
        <Composition
          key={id}
          id={id}
          component={Component as unknown as React.FC<CompositionProps>}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          durationInFrames={FPS * 10}
          defaultProps={{ input: meta.demo(), timeline: null } as CompositionProps}
          calculateMetadata={({ props }) => {
            // A render always supplies a prepared timeline; Studio falls back to estimated speech.
            const timeline = props.timeline ?? meta.timeline(props.input);
            return {
              durationInFrames: Math.max(1, Math.round(timeline.duration * FPS)),
              props: { ...props, timeline },
            };
          }}
        />
      );
    })}
    <Composition
      id="demo-podcast"
      component={DemoPodcast}
      fps={FPS}
      width={1280}
      height={720}
      durationInFrames={FPS * 18}
      defaultProps={{ lines: [], duration: 18 } as DemoPodcastProps}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.duration * FPS)) })}
    />
    <Composition
      id="background"
      component={BgPreview}
      durationInFrames={FPS * 20}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ spec: { kind: "procedural", id: "parkour", seed: 1 } as BackgroundSpec }}
    />
  </>
);
