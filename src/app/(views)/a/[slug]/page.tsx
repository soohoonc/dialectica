"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trpc } from "@/trpc/client";
import {
  WikiContent,
  WikiTableOfContents,
  WikiBacklinks,
  formatYear,
  getOntologyUrl,
} from "@/components/wiki";
import { ArrowLeft } from "lucide-react";

interface ArtifactPageProps {
  params: Promise<{ slug: string }>;
}

export default function ArtifactPage({ params }: ArtifactPageProps) {
  const { slug } = use(params);

  const { data, isLoading, error } = trpc.artifacts.getWithRelations.useQuery({
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

  const { artifact, creator, location, era, backlinks } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/a"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 link-nav"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Artifacts
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{artifact.name}</h1>
          <div className="metadata">
            {artifact.year !== undefined && (
              <div className="metadata-item">
                <span className="metadata-label">Year:</span>
                <span>{formatYear(artifact.year)}</span>
              </div>
            )}
            {creator && (
              <div className="metadata-item">
                <span className="metadata-label">Creator:</span>
                <Link
                  href={getOntologyUrl("figure", creator.slug)}
                  className="link-internal"
                >
                  {"name" in creator ? (creator.name as string) : creator.title}
                </Link>
              </div>
            )}
            {location && (
              <div className="metadata-item">
                <span className="metadata-label">Location:</span>
                <Link
                  href={getOntologyUrl("location", location.slug)}
                  className="link-internal"
                >
                  {"name" in location ? (location.name as string) : location.title}
                </Link>
              </div>
            )}
            {artifact.medium && (
              <div className="metadata-item">
                <span className="metadata-label">Medium:</span>
                <span className="capitalize">{artifact.medium}</span>
              </div>
            )}
            {era && (
              <div className="metadata-item">
                <span className="metadata-label">Era:</span>
                <Link
                  href={getOntologyUrl("time", era.slug)}
                  className="link-internal"
                >
                  {"name" in era ? (era.name as string) : era.title}
                </Link>
              </div>
            )}
            {artifact.tags.length > 0 && (
              <div className="metadata-item">
                <span className="metadata-label">Tags:</span>
                <div className="tags">
                  {artifact.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <WikiTableOfContents content={artifact.content} minHeadings={2} />

        <WikiContent content={artifact.content} className="mb-8" />

        <WikiBacklinks backlinks={backlinks} />
      </article>
    </div>
  );
}
