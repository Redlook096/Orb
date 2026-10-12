import type React from "react";
import type { TemplateId } from "./lib/types";
import { RedditVideo } from "./templates/reddit/Video";
import { FakeTextsVideo } from "./templates/fake-texts/Video";
import { BlurVideo, CaptionsVideo, SplitVideo } from "./templates/clip/Video";
import { TwitterVideo } from "./templates/twitter/Video";
import { ChatGPTVideo } from "./templates/chatgpt/Video";
import { WyrVideo } from "./templates/wyr/Video";
import { QuizVideo } from "./templates/quiz/Video";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TEMPLATE_COMPONENTS: Record<TemplateId, React.FC<{ input: any; timeline: any }>> = {
  reddit: RedditVideo,
  "fake-texts": FakeTextsVideo,
  "split-screen": SplitVideo,
  twitter: TwitterVideo,
  chatgpt: ChatGPTVideo,
  "would-you-rather": WyrVideo,
  quiz: QuizVideo,
  blur: BlurVideo,
  captions: CaptionsVideo,
};
