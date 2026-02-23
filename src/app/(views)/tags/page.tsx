"use client";

import Link from "next/link";
import { trpc } from "@/trpc/client";

export default function TagsPage() {
  const { data: tagsData, isLoading } = trpc.search.getTags.useQuery();

  return (
    <div className="container mx-auto max-w-5xl px-4 pt-4 pb-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Tags</h1>
        <p className="mt-2 text-muted-foreground">Browse all tags across the ontology graph.</p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (tagsData?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-2">
          {(tagsData ?? []).map((item) => (
            <Link key={item.tag} href={`/tags/${encodeURIComponent(item.tag)}`} className="tag">
              {item.tag} ({item.count})
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No tags found.</p>
      )}
    </div>
  );
}
