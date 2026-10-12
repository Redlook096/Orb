import Link from "next/link";
import { Plus } from "lucide-react";
import { RecentVideos } from "@/components/RecentVideos";
import { PageHeader } from "@/components/ui/primitives";

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader
        eyebrow="Library"
        title="My videos"
        subtitle="Every render, newest first. Videos stay on this server until you delete them."
        actions={
          <Link href="/create" className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 px-4 text-sm font-semibold text-white">
            <Plus className="size-4" /> New video
          </Link>
        }
      />
      <RecentVideos />
    </div>
  );
}
