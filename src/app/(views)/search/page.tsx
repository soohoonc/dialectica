"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

export default function SearchPage() {
  const params = useSearchParams();
  const tag = params.get("tag")?.trim() ?? "";
  const query = params.get("q")?.trim() ?? "";

  const isTagSearch = tag.length > 0;
  const hasQuery = query.length > 0;

  const { data: tagData, isLoading: isTagLoading } = trpc.search.byTag.useQuery(
    { tag, limit: 200 },
    { enabled: isTagSearch },
  );

  const { data: textData, isLoading: isTextLoading } = trpc.search.all.useQuery(
    { query, limit: 200 },
    { enabled: !isTagSearch && hasQuery },
  );

  const { data: tagsData } = trpc.search.getTags.useQuery(undefined, {
    enabled: !isTagSearch && !hasQuery,
  });

  const isLoading = isTagSearch ? isTagLoading : isTextLoading;
  const results = isTagSearch ? (tagData?.results ?? []) : (textData?.results ?? []);
  const title = isTagSearch ? `Tag: ${tag}` : hasQuery ? `Search: ${query}` : "Browse Tags";

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {isTagSearch && (
          <p className="text-muted-foreground mt-2">
            {tagData?.total ?? 0} result{(tagData?.total ?? 0) === 1 ? "" : "s"}
          </p>
        )}
        {!isTagSearch && hasQuery && (
          <p className="text-muted-foreground mt-2">
            {textData?.total ?? 0} result{(textData?.total ?? 0) === 1 ? "" : "s"}
          </p>
        )}
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : isTagSearch || hasQuery ? (
        results.length > 0 ? (
          <div className="grid gap-3">
            {results.map((result) => (
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
        )
      ) : (
        <div className="flex flex-wrap gap-2">
          {(tagsData ?? []).map((item) => (
            <Link key={item.tag} href={`/tags/${encodeURIComponent(item.tag)}`} className="tag">
              {item.tag} ({item.count})
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
