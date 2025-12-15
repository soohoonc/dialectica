"use client";

import Link from "next/link";
import { extractHeadings } from "./wiki-content";

interface WikiTableOfContentsProps {
  content: string;
  minHeadings?: number; // Minimum headings to show TOC
  className?: string;
}

export function WikiTableOfContents({
  content,
  minHeadings = 3,
  className = "",
}: WikiTableOfContentsProps) {
  const headings = extractHeadings(content);

  // Filter to only h2 and h3 for cleaner TOC
  const tocHeadings = headings.filter((h) => h.level >= 2 && h.level <= 3);

  // Don't show TOC if not enough headings
  if (tocHeadings.length < minHeadings) {
    return null;
  }

  return (
    <nav className={`toc ${className}`}>
      <h2>Contents</h2>
      <ul>
        {tocHeadings.map((heading, index) => (
          <li
            key={`${heading.id}-${index}`}
            className={heading.level === 3 ? "toc-h3" : ""}
          >
            <Link href={`#${heading.id}`}>{heading.text}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
