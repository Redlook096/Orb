import { FrameGrid } from "@/components/gallery";
import { PageHeader } from "@/components/ui/primitives";
import { FRAMES } from "@/lib/catalog";

const GROUPS: { title: string; categories: string[] }[] = [
  { title: "Stories", categories: ["Story"] },
  { title: "Chats", categories: ["Chat"] },
  { title: "Games", categories: ["Game"] },
  { title: "Your clips", categories: ["Clip"] },
];

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Create" title="Pick a frame" subtitle="Each frame is a ready-made format. Fill in your inputs, choose a voice and gameplay, and export in one click." />
      <div className="space-y-12">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mb-4 text-[13px] font-bold tracking-[0.14em] text-ink-400 uppercase">{g.title}</h2>
            <FrameGrid frames={FRAMES.filter((f) => g.categories.includes(f.category))} />
          </section>
        ))}
      </div>
    </div>
  );
}
