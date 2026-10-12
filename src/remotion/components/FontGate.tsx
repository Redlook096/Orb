import React, { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { loadAllFonts } from "../lib/fonts";

/** Holds the render until every caption/UI font is decoded. */
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    let done = false;
    loadAllFonts().finally(() => {
      if (!done) continueRender(handle);
      done = true;
    });
    return () => {
      if (!done) continueRender(handle);
      done = true;
    };
  }, [handle]);
  return <>{children}</>;
};
