"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trpc } from "@/trpc/client";
import {
  WikiContent,
  WikiTableOfContents,
  WikiBacklinks,
  formatDateRange,
  getOntologyUrl,
} from "@/components/wiki";
import { ArrowLeft, User, Lightbulb, MapPin } from "lucide-react";

interface TimePageProps {
  params: Promise<{ slug: string }>;
}

export default function TimePage({ params }: TimePageProps) {
  const { slug } = use(params);

  const { data, isLoading, error } = trpc.times.getWithRelations.useQuery({
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

  const { time, figures, ideas, locations, backlinks } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/t"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 link-nav"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Times
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{time.name}</h1>
          <div className="metadata">
            <div className="metadata-item">
              <span className="metadata-label">Period:</span>
              <span>{formatDateRange(time.start, time.end)}</span>
            </div>
            {time.tags.length > 0 && (
              <div className="metadata-item">
                <span className="metadata-label">Tags:</span>
                <div className="tags">
                  {time.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <WikiTableOfContents content={time.content} minHeadings={2} />

        <WikiContent content={time.content} className="mb-8" />

        {/* Figures from this period */}
        {figures.length > 0 && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Key Figures
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {figures.map((figure) => (
                <Link
                  key={figure.id}
                  href={getOntologyUrl("figure", figure.slug)}
                  className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-semibold link-internal">
                    {"name" in figure ? (figure.name as string) : figure.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ideas from this period */}
        {ideas.length > 0 && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
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
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Locations */}
        {locations.length > 0 && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locations
            </h2>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <Link
                  key={loc!.id}
                  href={getOntologyUrl("location", loc!.slug)}
                  className="link-internal"
                >
                  {"name" in loc! ? (loc!.name as string) : loc!.title}
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
