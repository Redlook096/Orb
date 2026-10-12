"use client";

import { useMemo } from "react";
import { TEMPLATE_META } from "@/remotion/registry";
import type { TemplateId } from "@/remotion/lib/types";
import { PhoneFrame, PreviewPlayer } from "@/components/player/PreviewPlayer";

export const GuidePreview: React.FC<{ template: TemplateId }> = ({ template }) => {
  const input = useMemo(() => TEMPLATE_META[template].demo(), [template]);
  return (
    <div className="mx-auto max-w-[320px]">
      <PhoneFrame>
        <PreviewPlayer template={template} input={input} />
      </PhoneFrame>
    </div>
  );
};
