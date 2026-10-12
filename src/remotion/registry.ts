import type { TemplateId } from "./lib/types";
import type { TemplateMeta } from "./templates/common";
import { redditMeta } from "./templates/reddit/meta";
import { fakeTextsMeta } from "./templates/fake-texts/meta";
import { blurMeta, captionsMeta, splitMeta } from "./templates/clip/meta";
import { twitterMeta } from "./templates/twitter/meta";
import { chatgptMeta } from "./templates/chatgpt/meta";
import { wyrMeta } from "./templates/wyr/meta";
import { quizMeta } from "./templates/quiz/meta";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyMeta = TemplateMeta<any, any>;

export const TEMPLATE_META: Record<TemplateId, AnyMeta> = {
  reddit: redditMeta,
  "fake-texts": fakeTextsMeta,
  "split-screen": splitMeta,
  twitter: twitterMeta,
  chatgpt: chatgptMeta,
  "would-you-rather": wyrMeta,
  quiz: quizMeta,
  blur: blurMeta,
  captions: captionsMeta,
};

export const TEMPLATE_IDS = Object.keys(TEMPLATE_META) as TemplateId[];
