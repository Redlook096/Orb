import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { FRAMES, frameById } from "@/lib/catalog";

export const generateStaticParams = () => FRAMES.map((f) => ({ template: f.slug }));

export default async function EditorPage({ params }: { params: Promise<{ template: string }> }) {
  const frame = frameById((await params).template);
  if (!frame) notFound();
  return <Editor template={frame.id} />;
}
