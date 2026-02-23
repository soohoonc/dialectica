"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import {
  BookOpen,
  Scroll,
  Box,
  Frame,
  FileText,
  Grid3X3,
  Layers,
  Compass,
  Shirt,
  Coffee,
} from "lucide-react";
import { FilterBuilder } from "@/components/navigation/filter-builder";
import { artifactFilterFields } from "@/lib/filter-definitions";
import { useUrlFilterRules } from "@/components/navigation/use-url-filter-rules";

const artifactFilterFieldKeys = artifactFilterFields.map((field) => field.key);

// Icons for each medium type
const mediumIcons: Record<string, React.ElementType> = {
  book: BookOpen,
  manuscript: Scroll,
  sculpture: Box,
  painting: Frame,
  inscription: FileText,
  mosaic: Grid3X3,
  relief: Layers,
  instrument: Compass,
  textile: Shirt,
  ceramic: Coffee,
  other: Box,
};

export default function ArtifactsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ArtifactsPageContent />
    </Suspense>
  );
}

function ArtifactsPageContent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentMediumIndex, setCurrentMediumIndex] = useState(0);
  const [isMediumMenuOpen, setIsMediumMenuOpen] = useState(false);
  const { rules, setRules } = useUrlFilterRules({
    queryKey: "a_filters",
    validFieldKeys: artifactFilterFieldKeys,
  });

  const { data, isLoading } = trpc.artifacts.getGroupedByMedium.useQuery({ rules });

  const mediums = data?.mediums ?? [];
  const currentMedium = mediums[currentMediumIndex];
  const artifacts = currentMedium ? (data?.grouped[currentMedium.id] ?? []) : [];

  const formatYear = (year: number) => {
    return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  };

  useEffect(() => {
    let lastJumpTime = 0;

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey && mediums.length > 0) {
        e.preventDefault();

        const now = Date.now();
        if (now - lastJumpTime < 400) return;
        lastJumpTime = now;

        if (e.deltaY > 0 || e.deltaX > 0) {
          setCurrentMediumIndex((i) => Math.min(i + 1, mediums.length - 1));
        } else if (e.deltaY < 0 || e.deltaX < 0) {
          setCurrentMediumIndex((i) => Math.max(i - 1, 0));
        }

        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [mediums.length]);

  useEffect(() => {
    if (currentMediumIndex >= mediums.length) {
      setCurrentMediumIndex(Math.max(mediums.length - 1, 0));
    }
  }, [currentMediumIndex, mediums.length]);

  const Icon = currentMedium ? mediumIcons[currentMedium.id] || Box : Box;

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      <FilterBuilder
        title="Artifact Filters"
        fields={artifactFilterFields}
        rules={rules}
        onRulesChange={setRules}
      />

      <div className="absolute top-3 left-4 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMediumMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background/90 px-3 py-1.5 text-sm text-foreground shadow-sm backdrop-blur-sm hover:bg-muted/50"
          >
            <span className="text-muted-foreground">Section:</span>
            <span className="font-medium">{currentMedium?.name ?? "No matches"}</span>
          </button>

          {isMediumMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-md border border-border bg-background/95 p-2 shadow-lg backdrop-blur-sm">
              <div className="max-h-64 overflow-y-auto">
                {mediums.map((medium, index) => (
                  <button
                    key={medium.id}
                    type="button"
                    onClick={() => {
                      setCurrentMediumIndex(index);
                      setIsMediumMenuOpen(false);
                      if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted/60 ${
                      index === currentMediumIndex
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span>{medium.name}</span>
                    {index === currentMediumIndex && <span className="text-xs">Current</span>}
                  </button>
                ))}
              </div>
              <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                Hint: hold <span className="font-medium">Shift</span> and scroll to switch sections.
              </p>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div ref={contentRef} className="flex-1 overflow-y-auto pt-12 pb-8 px-8">
          <div className="max-w-5xl mx-auto">
            {artifacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artifacts.map((art) => (
                  <Link
                    key={art.id}
                    href={`/a/${art.slug}`}
                    className="group block p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {art.name}
                        </h3>
                        {art.year && (
                          <p className="text-sm text-muted-foreground">{formatYear(art.year)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>No artifacts in this category</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
