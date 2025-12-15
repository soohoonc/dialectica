"use client";

import Link from "next/link";
import { Calendar, User, MapPin, Clock, Tag } from "lucide-react";
import { getOntologyUrl } from "./wiki-link";

interface MetadataItem {
  label: string;
  value: string;
  href?: string;
  type?: string;
}

interface WikiMetadataProps {
  items: MetadataItem[];
  tags?: string[];
  className?: string;
}

export function WikiMetadata({ items, tags, className = "" }: WikiMetadataProps) {
  return (
    <div className={`metadata ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="metadata-item">
          <span className="metadata-label">{item.label}:</span>
          {item.href ? (
            <Link
              href={item.href}
              className="link-internal"
            >
              {item.value}
            </Link>
          ) : (
            <span>{item.value}</span>
          )}
        </div>
      ))}
      {tags && tags.length > 0 && (
        <div className="metadata-item">
          <span className="metadata-label">Tags:</span>
          <div className="tags">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?tag=${encodeURIComponent(tag)}`}
                className="tag"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to format year (handles BCE)
export function formatYear(year: number | undefined): string {
  if (year === undefined) return "Unknown";
  if (year < 0) return `${Math.abs(year)} BCE`;
  return String(year);
}

// Helper to format date range
export function formatDateRange(
  start: number | undefined,
  end: number | undefined
): string {
  const startStr = formatYear(start);
  const endStr = end !== undefined ? formatYear(end) : "present";
  return `${startStr} - ${endStr}`;
}

// Convenience component for Figure metadata
interface FigureMetadataProps {
  name: string;
  birth?: number;
  death?: number;
  nationality?: string;
  periods?: Array<{ id: string; slug: string; name: string }>;
  locations?: Array<{ id: string; slug: string; name: string }>;
  tags?: string[];
  className?: string;
}

export function FigureMetadata({
  name,
  birth,
  death,
  nationality,
  periods,
  locations,
  tags,
  className,
}: FigureMetadataProps) {
  const items: MetadataItem[] = [];

  if (birth !== undefined || death !== undefined) {
    items.push({
      label: "Lived",
      value: formatDateRange(birth, death),
    });
  }

  if (nationality) {
    items.push({ label: "Nationality", value: nationality });
  }

  if (periods?.length) {
    periods.forEach((period) => {
      items.push({
        label: "Period",
        value: period.name,
        href: getOntologyUrl("time", period.slug),
        type: "time",
      });
    });
  }

  if (locations?.length) {
    locations.forEach((loc) => {
      items.push({
        label: "Location",
        value: loc.name,
        href: getOntologyUrl("location", loc.slug),
        type: "location",
      });
    });
  }

  return <WikiMetadata items={items} tags={tags} className={className} />;
}

// Convenience component for Idea metadata
interface IdeaMetadataProps {
  title: string;
  year?: number;
  authors?: Array<{ id: string; slug: string; name: string }>;
  periods?: Array<{ id: string; slug: string; name: string }>;
  tags?: string[];
  className?: string;
}

export function IdeaMetadata({
  title,
  year,
  authors,
  periods,
  tags,
  className,
}: IdeaMetadataProps) {
  const items: MetadataItem[] = [];

  if (authors?.length) {
    authors.forEach((author) => {
      items.push({
        label: "Author",
        value: author.name,
        href: getOntologyUrl("figure", author.slug),
        type: "figure",
      });
    });
  }

  if (year !== undefined) {
    items.push({ label: "Year", value: formatYear(year) });
  }

  if (periods?.length) {
    periods.forEach((period) => {
      items.push({
        label: "Period",
        value: period.name,
        href: getOntologyUrl("time", period.slug),
        type: "time",
      });
    });
  }

  return <WikiMetadata items={items} tags={tags} className={className} />;
}
