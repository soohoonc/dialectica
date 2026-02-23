# Src Subtree Guide

## Scope
- Applies to everything under `src/`.

## Architectural Rules
- Keep the app markdown-first:
- Content source is `docs/*/*.md`.
- Graph and link resolution logic belongs in `src/lib/graph/*`.
- API access goes through `src/trpc/routers/*`.
- UI in `src/app/(views)/*` and `src/components/*` should consume tRPC/graph APIs, not bypass them.

## Ontology and Routing Invariants
- Treat the ontology as 5 strict views: `figure`, `time`, `location`, `idea`, `artifact`.
- Keep route prefixes aligned with those views: `/f`, `/t`, `/l`, `/i`, `/a`.
- Do not introduce new ontology prefixes or route families without explicit approval.

## Navigation and Search Param Rules
- If a page-level client component uses `useSearchParams()`, ensure it is covered by a `Suspense` boundary as required by Next.js.
- Preserve URL-based filter behavior and canonicalization in `use-url-filter-rules`.

## Performance Rules
- Prefer prefetching for high-intent navigation paths.
- Keep React Query defaults tuned for mostly-static docs content.
- Lazy-load heavy visualization components (graph/map/timeline) when it improves route-switch latency.
- Avoid introducing unnecessary refetch-on-focus/reconnect churn.

## Link Resolution Rules
- Internal wiki-link resolution should go through graph resolution APIs (`resolveLink` / `resolveLinks`).
- Do not add hardcoded fallback routes for unresolved wiki-links.

## Tooling Rules
- Use OXC-based tooling only:
- `bun run lint` (oxlint)
- `bun run format` (oxfmt)
- Do not reintroduce ESLint/Prettier unless explicitly requested.
