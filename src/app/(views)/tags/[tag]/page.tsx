"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";

const typePrefix: Record<string, string> = {
  figure: "f",
  time: "t",
  location: "l",
  idea: "i",
  artifact: "a",
  page: "p",
};

const typeLabel: Record<string, string> = {
  figure: "Figure",
  time: "Time",
  location: "Location",
  idea: "Idea",
  artifact: "Artifact",
  page: "Page",
};

function decodeTagParam(rawParam: string | string[] | undefined): string {
  const raw = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  if (!raw) return "";

  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export default function TagPage() {
  const params = useParams<{ tag: string | string[] }>();
  const tag = decodeTagParam(params?.tag);

  const { data: tagData, isLoading } = trpc.search.byTag.useQuery(
    { tag, limit: 200 },
    { enabled: tag.length > 0 },
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 pt-4 pb-8">
      <header className="mb-6">
        <div className="mb-2">
          <Link
            href="/tags"
            className="link-nav text-sm text-muted-foreground hover:text-foreground"
          >
            All tags
          </Link>
        </div>
        <h1 className="text-3xl font-bold">{tag.length > 0 ? `Tag: ${tag}` : "Tag not found"}</h1>
        <p className="mt-2 text-muted-foreground">
          {tag.length > 0
            ? `${tagData?.total ?? 0} result${(tagData?.total ?? 0) === 1 ? "" : "s"}`
            : "Invalid tag."}
        </p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tag.length === 0 ? (
        <p className="text-muted-foreground">No results found.</p>
      ) : (tagData?.results.length ?? 0) > 0 ? (
        <div className="grid gap-3">
          {(tagData?.results ?? []).map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/${typePrefix[result.type]}/${result.slug}`}
                  className="text-lg font-semibold hover:underline"
                >
                  {result.title}
                </Link>
                <span className="text-xs text-muted-foreground">{typeLabel[result.type]}</span>
              </div>
              {result.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.tags.map((itemTag) => (
                    <Link
                      key={`${result.id}-${itemTag}`}
                      href={`/tags/${encodeURIComponent(itemTag)}`}
                      className="tag"
                    >
                      {itemTag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No results found.</p>
      )}
    </div>
  );
}
