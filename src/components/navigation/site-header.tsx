"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/navigation/search-input";
import { trpc } from "@/trpc/client";
import { Search } from "lucide-react";

const ontologyLinks = [
  { href: "/f", label: "Figures" },
  { href: "/t", label: "Times" },
  { href: "/l", label: "Locations" },
  { href: "/i", label: "Ideas" },
  { href: "/a", label: "Artifacts" },
];

export function SiteHeader() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const prefetchRoute = (href: string) => {
    router.prefetch(href);

    switch (href) {
      case "/f":
        void utils.figures.list.prefetch({
          sort: "name",
          order: "asc",
          limit: 100,
          rules: [],
        });
        break;
      case "/t":
        void utils.times.list.prefetch({
          sort: "start",
          order: "asc",
          limit: 100,
          rules: [],
        });
        break;
      case "/l":
        void utils.locations.list.prefetch({
          sort: "name",
          order: "asc",
          rules: [],
        });
        break;
      case "/i":
        void utils.ideas.getDialecticalGraph.prefetch({ rules: [] });
        break;
      case "/a":
        void utils.artifacts.getGroupedByMedium.prefetch({ rules: [] });
        break;
    }
  };

  return (
    <header className="w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full max-w-7xl px-4 py-2">
        <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-between">
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:flex-nowrap md:gap-4">
            <Link
              href="/"
              className="link-nav whitespace-nowrap text-2xl font-semibold tracking-tight"
            >
              dialectica
            </Link>

            <div className="w-full md:w-[clamp(18rem,36vw,32rem)]">
              <div className="rounded-md border border-border bg-background/90 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <SearchInput
                    placeholder="Search"
                    autoFocus={false}
                    fixedWidth
                    placeholderMuted
                    className="text-base leading-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto flex w-full justify-end md:w-auto md:flex-none">
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm md:flex-nowrap md:gap-x-6">
              {ontologyLinks.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    prefetch
                    onMouseEnter={() => prefetchRoute(link.href)}
                    onFocus={() => prefetchRoute(link.href)}
                    onTouchStart={() => prefetchRoute(link.href)}
                    className="link-nav text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
