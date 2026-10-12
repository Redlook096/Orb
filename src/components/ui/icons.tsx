import {
  AudioLines,
  Bot,
  Captions,
  CircleHelp,
  Columns2,
  Download,
  Droplets,
  FileText,
  Hash,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  PenLine,
  Scale,
  type LucideIcon,
} from "lucide-react";

export const FRAME_ICONS: Record<string, LucideIcon> = {
  reddit: MessageSquare,
  "fake-texts": MessageCircle,
  "split-screen": Columns2,
  twitter: Hash,
  chatgpt: Bot,
  "would-you-rather": Scale,
  quiz: CircleHelp,
  blur: Droplets,
  captions: Captions,
};

export const TOOL_ICONS: Record<string, LucideIcon> = {
  AudioLines,
  Captions,
  PenLine,
  Lightbulb,
  Download,
  FileText,
};
