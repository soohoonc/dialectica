"use client";

import { trpc } from "@/trpc/client";
import { Timeline } from "@/components/timeline";
import { SearchInput } from "@/components/navigation/search-input";

export default function TimesPage() {
  const { data, isLoading } = trpc.times.list.useQuery({
    sort: "start",
    order: "asc",
    limit: 100,
  });

  return (
    <div className="h-screen w-screen relative">
      <header className="fixed top-4 left-4 z-50 text-2xl font-semibold bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg">
        <SearchInput placeholder="Times" autoFocus={false} searchType="time" constrainWidth />
      </header>

      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <Timeline times={data?.times ?? []} />
      )}
    </div>
  );
}
