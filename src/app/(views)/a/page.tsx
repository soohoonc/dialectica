"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { SearchInput } from "@/components/navigation/search-input";
import { ArrowLeft, BookOpen, Scroll, Box, Frame, FileText, Grid3X3, Layers, Compass, Shirt, Coffee } from "lucide-react";

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentMediumIndex, setCurrentMediumIndex] = useState(0);

  const { data, isLoading } = trpc.artifacts.getGroupedByMedium.useQuery();

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
          setCurrentMediumIndex(i => Math.min(i + 1, mediums.length - 1));
        } else if (e.deltaY < 0 || e.deltaX < 0) {
          setCurrentMediumIndex(i => Math.max(i - 1, 0));
        }

        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [mediums.length]);

  const Icon = currentMedium ? (mediumIcons[currentMedium.id] || Box) : Box;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <header className="fixed top-4 left-4 z-50 flex items-center gap-4">
        <Link
          href="/"
          className="p-2 bg-background/95 backdrop-blur-sm rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg">
          <SearchInput placeholder="Artifacts" autoFocus={false} searchType="artifact" constrainWidth />
        </div>
      </header>

      <div className="fixed top-4 right-4 z-50 text-right">
        <span className="text-sm text-muted-foreground">{currentMedium?.name}</span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto pt-20 pb-8 px-8"
        >
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
                          <p className="text-sm text-muted-foreground">
                            {formatYear(art.year)}
                          </p>
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
