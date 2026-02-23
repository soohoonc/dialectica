"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/trpc/client";
import { FilterBuilder } from "@/components/navigation/filter-builder";
import { useUrlFilterRules } from "@/components/navigation/use-url-filter-rules";
import { timeFilterFields } from "@/lib/filter-definitions";

const timeFilterFieldKeys = timeFilterFields.map((field) => field.key);

const Timeline = dynamic(() => import("@/components/timeline").then((mod) => mod.Timeline), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-muted-foreground">Loading timeline...</p>
    </div>
  ),
});

export default function TimesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <TimesPageContent />
    </Suspense>
  );
}

function TimesPageContent() {
  const { rules, setRules } = useUrlFilterRules({
    queryKey: "t_filters",
    validFieldKeys: timeFilterFieldKeys,
  });
  const { data, isLoading } = trpc.times.list.useQuery({
    sort: "start",
    order: "asc",
    limit: 100,
    rules,
  });

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <FilterBuilder
        title="Time Filters"
        fields={timeFilterFields}
        rules={rules}
        onRulesChange={setRules}
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <Timeline times={data?.times ?? []} />
        </div>
      )}
    </div>
  );
}
