"use client";

import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WikiLinkProps {
  href: string;
  children: React.ReactNode;
  title?: string;
  summary?: string;
  exists?: boolean;
  isExternal?: boolean;
  className?: string;
}

export function WikiLink({
  href,
  children,
  title,
  summary,
  exists = true,
  isExternal = false,
  className = "",
}: WikiLinkProps) {
  // Determine link class based on type and state
  const linkClass = isExternal
    ? "link-external"
    : !exists
    ? "link-missing"
    : summary
    ? "link-annotated"
    : "link-internal";

  // For external links, open in new tab
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkClass} ${className}`}
        title={title}
      >
        {children}
      </a>
    );
  }

  // For links with summaries, wrap in tooltip
  if (summary && exists) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href} className={`${linkClass} ${className}`}>
              {children}
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs p-3 text-sm"
            sideOffset={5}
          >
            {title && <p className="font-semibold mb-1">{title}</p>}
            <p className="text-muted-foreground">{summary}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Standard internal link
  return (
    <Link href={href} className={`${linkClass} ${className}`} title={title}>
      {children}
    </Link>
  );
}

// Helper to determine URL from ontology type
export function getOntologyUrl(type: string, slug: string): string {
  const typePrefix: Record<string, string> = {
    figure: "f",
    time: "t",
    location: "l",
    idea: "i",
    artifact: "a",
    page: "p",
  };

  const prefix = typePrefix[type] || type.charAt(0);
  return `/${prefix}/${slug}`;
}
