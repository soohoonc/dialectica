"use client";

import { trpc } from "@/trpc/client";
import { ForceGraph } from "@/components/graph";
import { SearchInput } from "@/components/navigation/search-input";

export default function IdeasPage() {
  const { data: graphData, isLoading } = trpc.ideas.getDialecticalGraph.useQuery();

  return (
    <div className="h-screen w-screen relative">
      <header className="fixed top-4 left-4 z-50 text-2xl font-semibold bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg">
        <SearchInput placeholder="Ideas" autoFocus={false} searchType="idea" constrainWidth />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : graphData ? (
        <ForceGraph data={graphData} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No ideas found</p>
        </div>
      )}
    </div>
  );
}
