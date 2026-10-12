import React from "react";
import { Img } from "remotion";
import { hashString } from "./random";

const GRADIENTS = [
  ["#ff9a8b", "#ff6a88"],
  ["#a18cd1", "#fbc2eb"],
  ["#84fab0", "#8fd3f4"],
  ["#f6d365", "#fda085"],
  ["#5ee7df", "#b490ca"],
  ["#c79081", "#dfa579"],
  ["#89f7fe", "#66a6ff"],
  ["#fddb92", "#d1fdff"],
];

export const initials = (name: string) =>
  name
    .replace(/^[ur]\//i, "")
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

/** A photo avatar when a source is given, otherwise a gradient disc with initials. */
export const Avatar: React.FC<{ src?: string | null; name: string; size: number; ring?: string; flat?: string }> = ({
  src,
  name,
  size,
  ring,
  flat,
}) => {
  const [a, b] = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: flat ?? `linear-gradient(140deg, ${a}, ${b})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.4,
        fontFamily: "Inter, sans-serif",
        boxShadow: ring ? `0 0 0 ${Math.max(2, size * 0.04)}px ${ring}` : undefined,
      }}
    >
      {src ? <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name)}
    </div>
  );
};
