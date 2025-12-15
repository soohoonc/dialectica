"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trpc } from "@/trpc/client";
import {
  WikiContent,
  WikiTableOfContents,
  WikiBacklinks,
} from "@/components/wiki";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function WikiPage({ params }: PageProps) {
  const { slug } = use(params);

  const { data, isLoading, error } = trpc.pages.getWithBacklinks.useQuery({
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

  const { page, backlinks } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 link-nav"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
          {page.tags.length > 0 && (
            <div className="tags">
              {page.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <WikiTableOfContents content={page.content} minHeadings={2} />

        <WikiContent content={page.content} className="mb-8" />

        <WikiBacklinks backlinks={backlinks} />
      </article>
    </div>
  );
}
