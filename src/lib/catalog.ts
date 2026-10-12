import type { TemplateId } from "@/remotion/lib/types";

export interface FrameInfo {
  id: TemplateId;
  slug: string;
  name: string;
  short: string;
  description: string;
  category: "Story" | "Chat" | "Game" | "Clip";
  accent: string;
  badge?: string;
  /** What the guide teaches, step by step. */
  steps: { title: string; body: string }[];
  tips: string[];
  aiKind?: "reddit" | "fake-texts" | "twitter" | "chatgpt" | "would-you-rather" | "quiz";
}

export const FRAMES: FrameInfo[] = [
  {
    id: "reddit",
    slug: "reddit",
    name: "Reddit Story",
    short: "Narrated Reddit post over gameplay",
    description: "A Reddit post card pops in while the title is read, then the story plays with word-by-word captions over gameplay.",
    category: "Story",
    accent: "#FF4500",
    badge: "Most viral",
    aiKind: "reddit",
    steps: [
      { title: "Write or generate the story", body: "Paste a post or press Write with AI. Keep the title as a question or a confession; it is the hook viewers read in the first second." },
      { title: "Style the post card", body: "Set the subreddit, username, upvotes and comments. Light cards stand out on dark gameplay; dark cards feel more native." },
      { title: "Pick a narrator", body: "Deep male voices (Adam, Onyx) suit drama; warm female voices (Heart, Bella) suit wholesome or funny posts. 1.1× speed keeps retention high." },
      { title: "Choose gameplay and captions", body: "Block Parkour and Rail Runner keep eyes on screen. Classic or Hormozi captions with 2–3 words per page read fastest." },
      { title: "Generate", body: "Preview with voice to check pacing, then Generate video. You get a 1080×1920 MP4 at 30 fps, mastered to −14 LUFS." },
    ],
    tips: ["Stories of 150–220 words land at 60–75 seconds, the sweet spot for Shorts.", "End on a question (\"Am I wrong?\") to drive comments.", "Turn music to 10–15% so it never fights the narrator."],
  },
  {
    id: "fake-texts",
    slug: "fake-texts",
    name: "Fake Texts",
    short: "iMessage, WhatsApp & Instagram chats",
    description: "A realistic chat fills the top half while messages pop in one by one with send/receive sounds and a different voice for each person.",
    category: "Chat",
    accent: "#0A84FF",
    aiKind: "fake-texts",
    steps: [
      { title: "Pick the app", body: "iMessage, WhatsApp or Instagram DMs, in light or dark mode. Set the contact name and optional photo." },
      { title: "Write the conversation", body: "Add messages for Me (right) and Them (left). Short messages hit harder; save the twist for the last 2–3 texts." },
      { title: "Give each side a voice", body: "Choose a voice for you and one for the contact so viewers can follow by ear." },
      { title: "Layout and gameplay", body: "Split puts the chat on top and gameplay below (the classic format). Full floats the phone over the background." },
      { title: "Generate", body: "Typing indicators, delivered labels and tails are animated automatically." },
    ],
    tips: ["8–14 messages is ideal.", "Emoji-only messages render large, just like the real apps.", "Turn off narration for a silent, music-only edit."],
  },
  {
    id: "split-screen",
    slug: "split-screen",
    name: "Split-Screen",
    short: "Your clip on top, gameplay below",
    description: "Stack any clip over satisfying gameplay with auto-generated captions on the seam, the classic retention format.",
    category: "Clip",
    accent: "#22C55E",
    steps: [
      { title: "Upload your clip", body: "Podcasts, interviews, movie scenes you own, anything with speech. Most formats are accepted and converted for you." },
      { title: "Pick the gameplay", body: "Choose a procedural background or upload your own gameplay recording." },
      { title: "Captions", body: "Captions are transcribed automatically and sit on the line between the two halves." },
      { title: "Generate", body: "The video lasts as long as your clip." },
    ],
    tips: ["Clips of 30–90 seconds perform best.", "Drag the split ratio to give faces more room."],
  },
  {
    id: "twitter",
    slug: "twitter",
    name: "Tweet Thread",
    short: "X/Twitter threads read aloud",
    description: "Tweet cards slide in one after another; each word lights up as it is spoken.",
    category: "Story",
    accent: "#1D9BF0",
    aiKind: "twitter",
    steps: [
      { title: "Set the author", body: "Name, handle, avatar and verified badge." },
      { title: "Write the thread", body: "One card per tweet. Open with a bold claim, then pay it off." },
      { title: "Theme", body: "Dark, Dim or Light, matching the app's own themes." },
      { title: "Generate", body: "Engagement numbers and views are shown on every card." },
    ],
    tips: ["Numbers in the first tweet (\"$180k\", \"12 months\") lift retention.", "Neon Drive and Hyperspace backgrounds suit tech and money threads."],
  },
  {
    id: "chatgpt",
    slug: "chatgpt",
    name: "AI Chat",
    short: "ChatGPT-style conversations",
    description: "The prompt is typed into the composer, sent, and the answer streams in word by word, synced to the voice.",
    category: "Chat",
    accent: "#10A37F",
    aiKind: "chatgpt",
    steps: [
      { title: "Write the exchange", body: "Alternate user prompts and assistant answers. Funny, unhinged or surprisingly wholesome answers work best." },
      { title: "Voices", body: "One voice for the user and one for the assistant." },
      { title: "Layout", body: "Split keeps gameplay under the chat; Full shows only the chat." },
      { title: "Generate", body: "Typing sounds and the send animation are added for you." },
    ],
    tips: ["Keep answers under 40 words so the stream stays readable.", "Rename the assistant label to match your story."],
  },
  {
    id: "would-you-rather",
    slug: "would-you-rather",
    name: "Would You Rather",
    short: "Red vs blue dilemmas with results",
    description: "Two options, a ticking countdown, then the vote split is revealed with animated percentages.",
    category: "Game",
    accent: "#E53935",
    aiKind: "would-you-rather",
    steps: [
      { title: "Add dilemmas", body: "Each has two options, an emoji or image for each, and the share of people who picked A." },
      { title: "Timing", body: "Pick a 3–5 second countdown so viewers can answer in their head." },
      { title: "Colors", body: "Classic red/blue or any two colors. Optionally show gameplay behind." },
      { title: "Generate", body: "Ticks, reveal dings and transitions are added automatically." },
    ],
    tips: ["Close splits (45–55%) spark the most comments.", "5–8 questions keeps it under a minute."],
  },
  {
    id: "quiz",
    slug: "quiz",
    name: "Quiz",
    short: "Trivia with countdown & reveal",
    description: "Question card, four options flying in, a countdown, then the right answer lights up green.",
    category: "Game",
    accent: "#F59E0B",
    aiKind: "quiz",
    steps: [
      { title: "Write questions", body: "Four options each; mark the correct one. Add an emoji for the badge." },
      { title: "Voice", body: "Read the question only, or the options too. Optionally announce the answer." },
      { title: "Countdown", body: "3 seconds is snappy; 5 gives viewers time to play along." },
      { title: "Generate", body: "Progress dots show how far along the quiz is." },
    ],
    tips: ["Promise a score in the title (\"Only 1% get 5/5\").", "Mix easy and hard questions to keep people watching."],
  },
  {
    id: "blur",
    slug: "blur",
    name: "Blur Frame",
    short: "Landscape clip in a blurred vertical frame",
    description: "Turns any horizontal video into a vertical one with a blurred fill, a headline box and captions.",
    category: "Clip",
    accent: "#A855F7",
    steps: [
      { title: "Upload a horizontal clip", body: "Landscape videos are centered; the blurred copy fills the rest of the frame." },
      { title: "Headline", body: "Add a hook like \"Wait for the end 😳\" in a white box at the top." },
      { title: "Captions", body: "Turn on captions to transcribe speech automatically." },
      { title: "Generate", body: "Exports a 9:16 MP4 ready for Shorts." },
    ],
    tips: ["Zoom in slightly to make faces larger on phones."],
  },
  {
    id: "captions",
    slug: "captions",
    name: "Auto Captions",
    short: "Add viral captions to any video",
    description: "Transcribes your video and burns in animated word-by-word captions in ten styles.",
    category: "Clip",
    accent: "#FACC15",
    steps: [
      { title: "Upload your video", body: "Talking-head clips, podcasts, voiceovers. Vertical or horizontal." },
      { title: "Pick a caption style", body: "Hormozi, Beast, Karaoke, Highlight Box and more. Set words per page and highlight color." },
      { title: "Fit", body: "Fill crops to 9:16; Fit keeps the full frame over a blurred background." },
      { title: "Generate", body: "Captions follow the speech word by word." },
    ],
    tips: ["Put captions at the bottom for talking heads so faces stay clear."],
  },
];

export const frameById = (id: string) => FRAMES.find((f) => f.id === id || f.slug === id);

export interface ToolInfo {
  slug: string;
  href: string;
  name: string;
  short: string;
  icon: string;
  accent: string;
}

export const TOOLS: ToolInfo[] = [
  { slug: "voiceover", href: "/tools/voiceover", name: "AI Voiceover", short: "Script to natural speech, 30+ voices", icon: "AudioLines", accent: "#8B5CF6" },
  { slug: "captions", href: "/create/captions", name: "Auto Captions", short: "Animated captions for any video", icon: "Captions", accent: "#FACC15" },
  { slug: "script-writer", href: "/tools/script-writer", name: "Script Writer", short: "Stories, chats & quizzes written by AI", icon: "PenLine", accent: "#22D3EE" },
  { slug: "ideas", href: "/tools/ideas", name: "Idea Generator", short: "10 viral ideas for your niche", icon: "Lightbulb", accent: "#F59E0B" },
  { slug: "downloader", href: "/tools/downloader", name: "Video Downloader", short: "Save a clip from a link to your library", icon: "Download", accent: "#22C55E" },
  { slug: "transcriber", href: "/tools/transcriber", name: "Transcriber", short: "Video to SRT subtitles", icon: "FileText", accent: "#F472B6" },
];
