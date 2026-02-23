"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/trpc/client";
import { FilterBuilder } from "@/components/navigation/filter-builder";
import { useUrlFilterRules } from "@/components/navigation/use-url-filter-rules";
import { locationFilterFields } from "@/lib/filter-definitions";

const locationFilterFieldKeys = locationFilterFields.map((field) => field.key);

const WorldMap = dynamic(
  () => import("@/components/illustrations/world-map").then((mod) => mod.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  },
);

export default function LocationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <LocationsPageContent />
    </Suspense>
  );
}

function LocationsPageContent() {
  const { rules, setRules } = useUrlFilterRules({
    queryKey: "l_filters",
    validFieldKeys: locationFilterFieldKeys,
  });
  const { data, isLoading } = trpc.locations.list.useQuery({
    sort: "name",
    order: "asc",
    rules,
  });

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <FilterBuilder
        title="Location Filters"
        fields={locationFilterFields}
        rules={rules}
        onRulesChange={setRules}
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <WorldMap locations={data?.locations ?? []} />
        </div>
      )}
    </div>
  );
}
