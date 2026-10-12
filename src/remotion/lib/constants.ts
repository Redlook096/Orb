export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const toFrames = (seconds: number) => Math.max(0, Math.round(seconds * FPS));
