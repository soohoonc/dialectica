"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/trpc/client";
import { FilterBuilder } from "@/components/navigation/filter-builder";
import { useUrlFilterRules } from "@/components/navigation/use-url-filter-rules";
import { ideaFilterFields } from "@/lib/filter-definitions";

const ideaFilterFieldKeys = ideaFilterFields.map((field) => field.key);

const ForceGraph = dynamic(() => import("@/components/graph").then((mod) => mod.ForceGraph), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Loading graph...</p>
    </div>
  ),
});

export default function IdeasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <IdeasPageContent />
    </Suspense>
  );
}

function IdeasPageContent() {
  const { rules, setRules } = useUrlFilterRules({
    queryKey: "i_filters",
    validFieldKeys: ideaFilterFieldKeys,
  });
  const { data: graphData, isLoading } = trpc.ideas.getDialecticalGraph.useQuery({ rules });

  return (
    <div className="h-full w-full relative">
      <FilterBuilder
        title="Idea Filters"
        fields={ideaFilterFields}
        rules={rules}
        onRulesChange={setRules}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : graphData && graphData.nodes.length > 0 ? (
        <ForceGraph data={graphData} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">
            {rules.length > 0 ? "No ideas match current filters" : "No ideas found"}
          </p>
        </div>
      )}
    </div>
  );
}
