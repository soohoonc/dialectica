# Docs Subtree Guide

## Scope
- Applies to everything under `docs/`.

## Ontology Boundaries
- Only use these ontology directories:
- `docs/f` for figures
- `docs/t` for times
- `docs/l` for locations
- `docs/i` for ideas
- `docs/a` for artifacts
- Do not create `docs/p` or any new ontology directory unless explicitly requested.

## Front Matter Rules
- Every document must include `type` and the type must match the directory.
- Keep IDs/slugs stable:
- Filename is the canonical slug.
- Prefer using existing slugs in links and relationships.
- Use valid relationship fields per ontology (for example `locations`, `periods`, `authors`, `influences`, `creator`, `location`, `era`) and keep values as existing node IDs/slugs.

## Linking Rules
- Use wiki-links `[[slug]]` for internal references.
- Link across ontologies intentionally (not random keyword stuffing).
- Prefer direct concept links that already exist in the corpus.
- Avoid hardcoding route paths in markdown content.

## Editing Guidelines
- Preserve current tone and structure in existing docs.
- Keep changes additive and consistent with existing ontology semantics.
- When adding many items, ensure each new item has meaningful inbound/outbound links.

## Validation Expectations
- After major doc additions, verify there are no unresolved wiki-links.
- If link resolution issues are found, fix slugs or references at the source markdown level.
