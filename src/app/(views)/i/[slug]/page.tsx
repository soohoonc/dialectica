"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trpc } from "@/trpc/client";
import {
  WikiContent,
  WikiTableOfContents,
  WikiBacklinks,
  IdeaMetadata,
  getOntologyUrl,
} from "@/components/wiki";
import { ForceGraph } from "@/components/graph";
import { ArrowLeft, Network } from "lucide-react";

interface IdeaPageProps {
  params: Promise<{ slug: string }>;
}

export default function IdeaPage({ params }: IdeaPageProps) {
  const { slug } = use(params);

  const { data, isLoading, error } = trpc.ideas.getWithRelations.useQuery({
    id: slug,
  });

  const { data: graphData } = trpc.ideas.getDialecticalGraph.useQuery({
    id: slug,
    depth: 2,
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

  const { idea, authors, periods, influences, influenced, contradicts, synthesizes, backlinks } =
    data;

  // Prepare metadata items - filter out undefined values
  const authorItems = authors.filter((a): a is NonNullable<typeof a> => a != null).map((a) => ({
    id: a.id,
    slug: a.slug,
    name: "name" in a ? (a.name as string) : a.title,
  }));

  const periodItems = periods.filter((p): p is NonNullable<typeof p> => p != null).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: "name" in p ? (p.name as string) : p.title,
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/i"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 link-nav"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Ideas
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{idea.title}</h1>
          <IdeaMetadata
            title={idea.title}
            year={idea.year}
            authors={authorItems}
            periods={periodItems}
            tags={idea.tags}
          />
        </header>

        <WikiTableOfContents content={idea.content} minHeadings={2} />

        <WikiContent content={idea.content} className="mb-8" />

        {/* Relationships Section */}
        {(influences.length > 0 ||
          influenced.length > 0 ||
          contradicts.length > 0 ||
          synthesizes.length > 0) && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4">
              Relationships
            </h2>

            {influences.filter(Boolean).length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Influenced by
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {influences.filter((i): i is NonNullable<typeof i> => i != null).map((i) => (
                    <li key={i.id}>
                      <Link
                        href={getOntologyUrl("idea", i.slug)}
                        className="link-internal"
                      >
                        {i.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {influenced.filter(Boolean).length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Influenced
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {influenced.filter((i): i is NonNullable<typeof i> => i != null).map((i) => (
                    <li key={i.id}>
                      <Link
                        href={getOntologyUrl("idea", i.slug)}
                        className="link-internal"
                      >
                        {i.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {contradicts.filter(Boolean).length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Contradicts
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {contradicts.filter((i): i is NonNullable<typeof i> => i != null).map((i) => (
                    <li key={i.id}>
                      <Link
                        href={getOntologyUrl("idea", i.slug)}
                        className="link-internal"
                      >
                        {i.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {synthesizes.filter(Boolean).length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Synthesizes
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {synthesizes.filter((i): i is NonNullable<typeof i> => i != null).map((i) => (
                    <li key={i.id}>
                      <Link
                        href={getOntologyUrl("idea", i.slug)}
                        className="link-internal"
                      >
                        {i.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Mini Graph */}
        {graphData && graphData.nodes.length > 1 && (
          <section className="border-t border-border pt-8 mb-8">
            <h2 className="text-xl font-semibold smallcaps mb-4 flex items-center gap-2">
              <Network className="h-5 w-5" />
              Relationship Graph
            </h2>
            <ForceGraph data={graphData} width={800} height={400} />
            <p className="text-sm text-muted-foreground mt-2">
              Showing ideas within 2 degrees of connection
            </p>
          </section>
        )}

        <WikiBacklinks backlinks={backlinks} />
      </article>
    </div>
  );
}
