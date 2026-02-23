# Dialectica Agent Guide

## Scope
- This file applies to the whole repository.
- If a deeper directory adds its own `AGENTS.md`, that file overrides this one for its subtree.

## Non-Negotiable Invariants
- The ontology has **5 strict views**: `figure`, `time`, `location`, `idea`, `artifact`.
- Allowed ontology directories are: `docs/f`, `docs/t`, `docs/l`, `docs/i`, `docs/a`.
- Do **not** introduce new ontology prefixes or directories without explicit user approval.
- Do **not** add `docs/p` content unless explicitly requested by the user.

## Architecture Map
- Markdown content source: `docs/*/*.md`.
- Graph parsing/indexing/link resolution: `src/lib/graph/*`.
- API surface: `src/trpc/routers/*`.
- View routes: `src/app/(views)/*`.
- UI components: `src/components/*`.

## Content Authoring Rules
- Keep front matter valid for each ontology type.
- Use wiki-links (`[[slug]]`) for cross-item linking.
- Prefer existing slugs and concepts over duplicates.
- If adding many entries, ensure link consistency across ontologies.

## Workflow Expectations
- Before finishing changes, run:
- `bun run lint`
- `bun run build`
- If build fails, report exact error and file/route location.

## Performance Guardrails
- Keep React Query caching sensible for mostly-static docs data.
- Use route/data prefetch for high-intent navigation.
- Lazy-load heavy visual components where appropriate (graph/map/timeline).
- Avoid unnecessary refetch loops caused by URL state churn.

## Tooling
- Use OXC tooling:
- `bun run lint` (`oxlint`)
- `bun run format` (`oxfmt`)
- Do not add ESLint/Prettier unless explicitly requested.

## Known Pitfalls
- `useSearchParams()` in page-level client components must be wrapped with a `Suspense` boundary when required by Next.js.
- `next/font/google` can fail in network-restricted build environments.
- Wiki-links should resolve through graph link resolution; avoid hardcoded fallback routes.
