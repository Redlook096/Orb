import { getRemotionEnvironment } from "remotion";

/**
 * In the browser preview, a clip the browser cannot decode should not take down the whole
 * Player; log it instead. During a render, errors still propagate so the job fails loudly.
 */
export const previewSafeOnError = (): ((err: Error) => void) | undefined =>
  getRemotionEnvironment().isPlayer ? (err) => console.warn("[orb] preview media error:", err.message) : undefined;
