"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trpc } from "@/trpc/client";
import {
  WikiContent,
  WikiTableOfContents,
  WikiBacklinks,
  getOntologyUrl,
} from "@/components/wiki";
import { ArrowLeft, User, Clock, Box } from "lucide-react";

interface LocationPageProps {
  params: Promise<{ slug: string }>;
}

export default function LocationPage({ params }: LocationPageProps) {
  const { slug } = use(params);

  const { data, isLoading, error } = trpc.locations.getWithRelations.useQuery({
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

  const { location, figures, periods, artifacts, backlinks } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/l"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 link-nav"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Locations
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{location.name}</h1>
          <div className="metadata">
            {location.country && (
              <div className="metadata-item">
                <span className="metadata-label">Country:</span>
                <span>{location.country}</span>
              </div>
            )}
            {location.coordinates && (
              <div className="metadata-item">
                <span className="metadata-label">Coordinates:</span>
                <span>
                  {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                </span>
              </div>
            )}
            {location.tags.length > 0 && (
              <div className="metadata-item">
                <span className="metadata-label">Tags:</span>
                <div className="tags">
                  {location.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <WikiTableOfContents content={location.content} minHeadings={2} />

        <WikiContent content={location.content} className="mb-8" />

        {/* Figures associated with this location */}
        {figures.length > 0 && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Associated Figures
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

        {/* Time periods */}
        {periods.length > 0 && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historical Periods
            </h2>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <Link
                  key={period.id}
                  href={getOntologyUrl("time", period.slug)}
                  className="link-internal"
                >
                  {"name" in period ? (period.name as string) : period.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Artifacts at this location */}
        {artifacts.length > 0 && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4 flex items-center gap-2">
              <Box className="h-5 w-5" />
              Artifacts
            </h2>
            <div className="grid gap-3">
              {artifacts.map((obj) => (
                <Link
                  key={obj.id}
                  href={getOntologyUrl("artifact", obj.slug)}
                  className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-semibold link-internal">
                    {"name" in obj ? (obj.name as string) : obj.title}
                  </h3>
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
