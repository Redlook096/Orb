import { staticFile } from "remotion";

/** Turns a timeline audio reference into a playable URL in the current runtime. */
export const resolveSrc = (src: string) => (src.startsWith("sfx:") ? staticFile(`sfx/${src.slice(4)}.mp3`) : src);

/** Music ids are files in public/music; anything with a slash is already a URL. */
export const musicSrc = (track: string) => (track.includes("/") ? track : staticFile(`music/${track}.mp3`));
