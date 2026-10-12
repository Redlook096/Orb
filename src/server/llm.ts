import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { ANTHROPIC_MODEL } from "./config";

const SYSTEM = `You write scripts for viral, faceless short-form videos (TikTok, YouTube Shorts, Reels).
Every piece must hook the viewer in the first line, keep tension rising, and land a satisfying or surprising payoff.
Write in plain spoken English that sounds natural when read aloud by a narrator: short sentences, no hashtags, no emojis inside narration, no stage directions.
Stories are fiction. Never use real private individuals, and never defame real public figures.
Keep everything suitable for a general audience on mainstream platforms.`;

export const SCHEMAS = {
  reddit: z.object({
    subreddit: z.string().describe("Subreddit name without r/, e.g. AmItheAsshole, TrueOffMyChest, pettyrevenge, AskReddit"),
    username: z.string().describe("Plausible throwaway username without u/"),
    title: z.string().describe("Post title, under 110 characters, written as a hook"),
    body: z.string().describe("Story body, first person, separated into short paragraphs with blank lines"),
    upvotes: z.string().describe("Like 18.4k"),
    comments: z.string().describe("Like 2.3k"),
  }),
  "fake-texts": z.object({
    contactName: z.string(),
    messages: z.array(z.object({ from: z.enum(["me", "them"]), text: z.string() })).describe("8 to 16 short texts with a twist ending"),
  }),
  twitter: z.object({
    name: z.string(),
    handle: z.string().describe("Without @"),
    tweets: z
      .array(z.object({ text: z.string().describe("Under 260 characters"), replies: z.string(), retweets: z.string(), likes: z.string(), views: z.string() }))
      .describe("A 3 to 6 tweet thread; the first tweet is the hook"),
  }),
  chatgpt: z.object({
    messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).describe("A funny or surprising 4 to 8 message exchange with an AI assistant"),
  }),
  "would-you-rather": z.object({
    questions: z
      .array(
        z.object({
          a: z.string().describe("Option A, under 40 characters"),
          b: z.string().describe("Option B, under 40 characters"),
          aEmoji: z.string().describe("One emoji for option A"),
          bEmoji: z.string().describe("One emoji for option B"),
          percentA: z.number().describe("Share of people choosing A, 1 to 99"),
        }),
      )
      .describe("5 to 8 dilemmas"),
  }),
  quiz: z.object({
    title: z.string().describe("Hook title such as 'Only 1% get 5/5'"),
    questions: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()).describe("Exactly 4 short options"),
          answer: z.number().describe("0-based index of the correct option"),
          emoji: z.string().describe("One emoji illustrating the question"),
        }),
      )
      .describe("4 to 6 factually accurate questions"),
  }),
  script: z.object({
    hook: z.string().describe("First line, under 15 words"),
    script: z.string().describe("Full narration including the hook, 120 to 200 words"),
    cta: z.string().describe("Closing call to action"),
  }),
  ideas: z.object({
    ideas: z
      .array(
        z.object({
          title: z.string(),
          hook: z.string().describe("Opening line of the video"),
          format: z.enum(["reddit", "fake-texts", "twitter", "chatgpt", "would-you-rather", "quiz", "split-screen"]),
          why: z.string().describe("One sentence on why it will perform"),
        }),
      )
      .describe("10 ideas"),
  }),
};

export type GenerateKind = keyof typeof SCHEMAS;

const INSTRUCTIONS: Record<GenerateKind, string> = {
  reddit: "Write a Reddit story post (about 170 to 230 words in the body, roughly 60 to 80 seconds when narrated).",
  "fake-texts": "Write a text-message conversation between 'me' and a contact that tells a complete mini story with a twist.",
  twitter: "Write a viral X/Twitter thread.",
  chatgpt: "Write a conversation between a user and an AI assistant for a short video.",
  "would-you-rather": "Write 'Would you rather' dilemmas that split opinions.",
  quiz: "Write a multiple-choice trivia quiz with verified facts.",
  script: "Write a voiceover script for a faceless short.",
  ideas: "Brainstorm faceless short-form video ideas, mixing formats.",
};

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export class LlmUnavailableError extends Error {}

export const generate = async <K extends GenerateKind>(kind: K, prompt: string): Promise<z.infer<(typeof SCHEMAS)[K]>> => {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new LlmUnavailableError("Set ANTHROPIC_API_KEY to use AI writing.");
  }
  const schema = SCHEMAS[kind];
  const message = await getClient().beta.messages.parse({
    model: ANTHROPIC_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
    system: SYSTEM,
    messages: [{ role: "user", content: `${INSTRUCTIONS[kind]}\n\nTopic or direction from the creator: ${prompt.trim() || "Surprise me with something likely to go viral."}` }],
  });
  if (message.stop_reason === "refusal") throw new Error("The model declined this topic. Try a different direction.");
  if (!message.parsed_output) throw new Error("The model returned an unexpected response. Try again.");
  return message.parsed_output as z.infer<(typeof SCHEMAS)[K]>;
};
