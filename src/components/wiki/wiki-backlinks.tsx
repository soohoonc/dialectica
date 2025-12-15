"use client";

import Link from "next/link";
import type { Backlink } from "@/lib/graph";
import { getOntologyUrl } from "./wiki-link";

interface WikiBacklinksProps {
  backlinks: Backlink[];
  className?: string;
}

export function WikiBacklinks({ backlinks, className = "" }: WikiBacklinksProps) {
  if (!backlinks.length) {
    return null;
  }

  return (
    <section className={`backlinks ${className}`}>
      <h2>Pages linking here</h2>
      <ul>
        {backlinks.map((backlink, index) => (
          <li key={`${backlink.sourceId}-${index}`}>
            <Link
              href={getOntologyUrl(backlink.sourceType, backlink.sourceSlug)}
              className="link-internal"
            >
              {backlink.sourceTitle}
            </Link>
            {backlink.context && (
              <p className="backlink-context">...{backlink.context}...</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
