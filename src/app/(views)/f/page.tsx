"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { User } from "lucide-react";
import { SearchInput } from "@/components/navigation/search-input";

export default function FiguresPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = trpc.figures.list.useQuery({
    sort: "name",
    order: "asc",
    limit: 100,
  });

  // Convert vertical scroll to horizontal
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const figures = data?.figures ?? [];

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <header className="fixed top-4 left-4 z-50 text-2xl font-semibold bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg">
        <SearchInput placeholder="Figures" autoFocus={false} searchType="figure" constrainWidth />
      </header>

      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="h-full flex items-center overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex items-center gap-16 px-16">
            {figures.map((figure) => (
              <Link
                key={figure.id}
                href={`/f/${figure.slug}`}
                className="flex flex-col items-center gap-4 flex-shrink-0 group"
              >
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {figure.portrait ? (
                    <img
                      src={figure.portrait}
                      alt={figure.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <span className="text-lg font-medium group-hover:underline whitespace-nowrap">
                  {figure.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
