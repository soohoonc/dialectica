"use client";

import { useMemo } from "react";
import { trpc } from "@/trpc/client";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

interface WikiContentProps {
  content: string;
  className?: string;
  linkResolver?: (target: string) => { href: string; exists: boolean } | null;
}

function normalizeWikiTarget(target: string): string {
  return target
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-/]/g, "");
}

function extractWikiTargets(content: string): string[] {
  const wikiLinkRegex = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    seen.add(normalizeWikiTarget(match[1]));
  }

  return Array.from(seen);
}

// Process wiki-links [[target]] or [[target|alias]]
function processWikiLinks(
  content: string,
  resolver?: (target: string) => { href: string; exists: boolean } | null,
): string {
  const wikiLinkRegex = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

  return content.replace(wikiLinkRegex, (match, target, section, alias) => {
    const displayText = alias || target;
    const normalizedTarget = normalizeWikiTarget(target);

    if (resolver) {
      const resolved = resolver(normalizedTarget);
      if (resolved) {
        const href = section ? `${resolved.href}#${section}` : resolved.href;
        const className = resolved.exists ? "link-internal" : "link-missing";
        return `<a href="${href}" class="${className}">${displayText}</a>`;
      }
    }

    // If unresolved, render explicitly as missing instead of generating a broken link.
    return `<span class="link-missing" title="Unresolved link: ${normalizedTarget}">${displayText}</span>`;
  });
}

export function WikiContent({ content, className = "", linkResolver }: WikiContentProps) {
  const targets = useMemo(() => extractWikiTargets(content), [content]);
  const shouldResolveViaApi = !linkResolver && targets.length > 0;
  const { data: resolvedLinks } = trpc.graph.resolveLinks.useQuery(
    { targets },
    { enabled: shouldResolveViaApi, staleTime: 60_000 },
  );

  const effectiveResolver = useMemo(() => {
    if (linkResolver) {
      return linkResolver;
    }
    if (!resolvedLinks) {
      return undefined;
    }
    return (target: string) => resolvedLinks[target] ?? null;
  }, [linkResolver, resolvedLinks]);

  const htmlContent = useMemo(() => {
    // Process wiki-links first
    const processedContent = processWikiLinks(content, effectiveResolver);

    // Process markdown to HTML
    const result = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(processedContent);

    return String(result);
  }, [content, effectiveResolver]);

  return <div className={`prose ${className}`} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

// Extract headings from markdown content for TOC
export function extractHeadings(
  content: string,
): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Generate slug for ID (matching rehype-slug behavior)
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    headings.push({ level, text, id });
  }

  return headings;
}
