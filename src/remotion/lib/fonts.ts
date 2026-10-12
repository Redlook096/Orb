import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/anton/400.css";
import "@fontsource/bangers/400.css";
import "@fontsource/permanent-marker/400.css";

export const FONT_UI = "Inter, system-ui, -apple-system, sans-serif";
export const FONT_EMOJI = '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"';

/** Every face a composition may draw with; loaded up front so frame 0 is never a fallback font. */
export const FONT_FACES = [
  "500 40px Montserrat",
  "700 40px Montserrat",
  "800 40px Montserrat",
  "900 40px Montserrat",
  "400 40px Inter",
  "500 40px Inter",
  "600 40px Inter",
  "700 40px Inter",
  "800 40px Inter",
  "600 40px Poppins",
  "700 40px Poppins",
  "800 40px Poppins",
  "900 40px Poppins",
  "400 40px Roboto",
  "500 40px Roboto",
  "700 40px Roboto",
  "400 40px Anton",
  "400 40px Bangers",
  '400 40px "Permanent Marker"',
];

let loading: Promise<unknown> | null = null;

export const loadAllFonts = (): Promise<unknown> => {
  if (typeof document === "undefined") return Promise.resolve();
  if (!loading) {
    loading = Promise.all(
      FONT_FACES.map((f) => document.fonts.load(f, "AaBbWw0123!?").catch(() => undefined)),
    ).then(() => document.fonts.ready);
  }
  return loading;
};
