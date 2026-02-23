"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { User } from "lucide-react";
import { FilterBuilder } from "@/components/navigation/filter-builder";
import { useUrlFilterRules } from "@/components/navigation/use-url-filter-rules";
import { figureFilterFields } from "@/lib/filter-definitions";

const figureFilterFieldKeys = figureFilterFields.map((field) => field.key);

export default function FiguresPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <FiguresPageContent />
    </Suspense>
  );
}

function FiguresPageContent() {
  const router = useRouter();
  const { rules, setRules } = useUrlFilterRules({
    queryKey: "f_filters",
    validFieldKeys: figureFilterFieldKeys,
  });

  const { data, isLoading } = trpc.figures.list.useQuery({
    sort: "name",
    order: "asc",
    limit: 100,
    rules,
  });

  const figures = data?.figures ?? [];
  const formatYear = (year: number) => {
    return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  };

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      <FilterBuilder
        title="Figure Filters"
        fields={figureFilterFields}
        rules={rules}
        onRulesChange={setRules}
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pt-12 pb-8 px-8">
          <div className="max-w-6xl mx-auto">
            {figures.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {figures.map((figure) => (
                  <Link
                    key={figure.id}
                    href={`/f/${figure.slug}`}
                    prefetch
                    onMouseEnter={() => router.prefetch(`/f/${figure.slug}`)}
                    onFocus={() => router.prefetch(`/f/${figure.slug}`)}
                    onTouchStart={() => router.prefetch(`/f/${figure.slug}`)}
                    className="group block p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {figure.portrait ? (
                          <img
                            src={figure.portrait}
                            alt={figure.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-7 w-7 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                          {figure.name}
                        </h3>

                        {(figure.birth || figure.death) && (
                          <p className="text-sm text-muted-foreground">
                            {figure.birth ? formatYear(figure.birth) : "?"} -{" "}
                            {figure.death ? formatYear(figure.death) : "?"}
                          </p>
                        )}

                        {figure.nationality && (
                          <p className="text-sm text-muted-foreground">{figure.nationality}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No figures match current filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
