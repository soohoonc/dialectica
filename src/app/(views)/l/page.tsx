"use client";

import { trpc } from "@/trpc/client";
import { WorldMap } from "@/components/illustrations/world-map";
import { SearchInput } from "@/components/navigation/search-input";

export default function LocationsPage() {
  const { data, isLoading } = trpc.locations.list.useQuery({
    sort: "name",
    order: "asc",
  });

  return (
    <div className="h-screen w-screen relative">
      <header className="fixed top-4 left-4 z-50 text-2xl font-semibold bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg">
        <SearchInput placeholder="Locations" autoFocus={false} searchType="location" constrainWidth />
      </header>

      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <WorldMap locations={data?.locations ?? []} />
      )}
    </div>
  );
}
