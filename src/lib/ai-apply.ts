import type { TemplateId } from "@/remotion/lib/types";

const id = () => Math.random().toString(36).slice(2, 9);

type AnyObj = Record<string, unknown>;

/** Merges AI-generated content for a template into an editor project. */
export const applyGenerated = (template: TemplateId, data: AnyObj, input: AnyObj): AnyObj => {
  switch (template) {
    case "reddit":
      return { ...input, ...pick(data, ["subreddit", "username", "title", "body", "upvotes", "comments"]) };
    case "fake-texts":
      return {
        ...input,
        contactName: data.contactName ?? input.contactName,
        messages: ((data.messages as AnyObj[]) ?? []).map((m) => ({ id: id(), from: m.from === "me" ? "me" : "them", text: String(m.text ?? "") })),
      };
    case "twitter":
      return {
        ...input,
        name: data.name ?? input.name,
        handle: String(data.handle ?? input.handle).replace(/^@/, ""),
        tweets: ((data.tweets as AnyObj[]) ?? []).map((t) => ({ id: id(), text: String(t.text ?? ""), replies: String(t.replies ?? "0"), retweets: String(t.retweets ?? "0"), likes: String(t.likes ?? "0"), views: String(t.views ?? "0") })),
      };
    case "chatgpt":
      return { ...input, messages: ((data.messages as AnyObj[]) ?? []).map((m) => ({ id: id(), role: m.role === "assistant" ? "assistant" : "user", text: String(m.text ?? "") })) };
    case "would-you-rather":
      return {
        ...input,
        questions: ((data.questions as AnyObj[]) ?? []).map((q) => ({
          id: id(),
          a: String(q.a ?? ""),
          b: String(q.b ?? ""),
          aEmoji: String(q.aEmoji ?? "🅰️"),
          bEmoji: String(q.bEmoji ?? "🅱️"),
          percentA: Math.min(99, Math.max(1, Math.round(Number(q.percentA) || 50))),
        })),
      };
    case "quiz":
      return {
        ...input,
        title: data.title ?? input.title,
        questions: ((data.questions as AnyObj[]) ?? []).map((q) => {
          const options = ((q.options as string[]) ?? []).slice(0, 4);
          while (options.length < 4) options.push("");
          return { id: id(), question: String(q.question ?? ""), options, answer: Math.min(3, Math.max(0, Math.round(Number(q.answer) || 0))), emoji: String(q.emoji ?? "❓") };
        }),
      };
    default:
      return input;
  }
};

const pick = (o: AnyObj, keys: string[]) => Object.fromEntries(keys.filter((k) => o[k] !== undefined && o[k] !== "").map((k) => [k, o[k]]));

export const INCOMING_KEY = (template: string) => `orb:incoming:${template}`;
