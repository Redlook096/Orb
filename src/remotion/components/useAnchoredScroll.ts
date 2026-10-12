import { useLayoutEffect, useRef, useState } from "react";

/**
 * Chat apps start a conversation at the top and only scroll once the thread overflows.
 * Measures an inner content wrapper (its height does not depend on the alignment, unlike
 * scrollHeight, which ignores upward overflow) against the viewport.
 */
export const useAnchoredScroll = () => {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const v = viewport.current;
    const c = content.current;
    if (!v || !c) return;
    const next = c.offsetHeight > v.clientHeight + 1;
    if (next !== overflowing) setOverflowing(next);
  });
  return { viewport, content, justify: overflowing ? ("flex-end" as const) : ("flex-start" as const) };
};
