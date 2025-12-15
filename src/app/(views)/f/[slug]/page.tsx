"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trpc } from "@/trpc/client";
import {
  WikiContent,
  WikiTableOfContents,
  WikiBacklinks,
  FigureMetadata,
  getOntologyUrl,
} from "@/components/wiki";
import { ArrowLeft, User, BookOpen } from "lucide-react";

interface FigurePageProps {
  params: Promise<{ slug: string }>;
}

export default function FigurePage({ params }: FigurePageProps) {
  const { slug } = use(params);

  const { data, isLoading, error } = trpc.figures.getWithRelations.useQuery({
    id: slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    notFound();
  }

  const { figure, ideas, locations, periods, backlinks } = data;

  // Prepare metadata items
  const locationItems = locations
    .filter((l): l is NonNullable<typeof l> => l !== null && l !== undefined)
    .map((l) => ({
      id: l.id,
      slug: l.slug,
      name: "name" in l ? (l.name as string) : l.title,
    }));

  const periodItems = periods
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: "name" in p ? (p.name as string) : p.title,
    }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/f"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 link-nav"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Figures
      </Link>

      <article>
        <header className="mb-8 flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {figure.portrait ? (
              <img
                src={figure.portrait}
                alt={figure.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4">{figure.name}</h1>
            <FigureMetadata
              name={figure.name}
              birth={figure.birth}
              death={figure.death}
              nationality={figure.nationality}
              locations={locationItems}
              periods={periodItems}
              tags={figure.tags}
            />
          </div>
        </header>

        <WikiTableOfContents content={figure.content} minHeadings={2} />

        <WikiContent content={figure.content} className="mb-8" />

        {/* Ideas by this figure */}
        {ideas.length > 0 && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Ideas
            </h2>
            <div className="grid gap-3">
              {ideas.map((idea) => (
                <Link
                  key={idea.id}
                  href={getOntologyUrl("idea", idea.slug)}
                  className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-semibold link-internal">{idea.title}</h3>
                  {idea.year && (
                    <p className="text-sm text-muted-foreground">
                      {idea.year < 0
                        ? `${Math.abs(idea.year)} BCE`
                        : idea.year}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <WikiBacklinks backlinks={backlinks} />
      </article>
    </div>
  );
}
