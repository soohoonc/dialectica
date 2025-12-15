// Wiki-link parser for Obsidian-style [[links]]

export interface WikiLink {
  target: string;       // The page/node ID being linked to
  section?: string;     // Optional #anchor
  alias?: string;       // Optional display text
  raw: string;          // Original matched string
  startIndex: number;   // Position in content
  endIndex: number;
}

// Regex for [[target#section|alias]] pattern
// Matches: [[page]], [[page|alias]], [[page#section]], [[page#section|alias]]
const WIKI_LINK_REGEX = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

/**
 * Parse all wiki-links from markdown content
 */
export function parseWikiLinks(content: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  WIKI_LINK_REGEX.lastIndex = 0;

  while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
    links.push({
      target: normalizeTarget(match[1]),
      section: match[2] || undefined,
      alias: match[3] || undefined,
      raw: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return links;
}

/**
 * Normalize a link target to a consistent slug format
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 */
export function normalizeTarget(target: string): string {
  return target
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-/]/g, '');
}

/**
 * Extract context around a wiki-link (for backlink previews)
 */
export function extractLinkContext(content: string, link: WikiLink, contextLength = 100): string {
  const before = content.slice(Math.max(0, link.startIndex - contextLength), link.startIndex);
  const after = content.slice(link.endIndex, link.endIndex + contextLength);

  // Find sentence boundaries (using [\s\S] instead of /s flag for compatibility)
  const beforeTrimmed = before.replace(/^[\s\S]*?[.!?]\s*/, '');
  const afterTrimmed = after.replace(/[.!?]\s[\s\S]*$/, match => match[0]);

  return `${beforeTrimmed}${link.alias || link.target}${afterTrimmed}`.trim();
}

/**
 * Replace wiki-links with rendered HTML links
 */
export function renderWikiLinks(
  content: string,
  resolver: (target: string) => { href: string; exists: boolean } | null
): string {
  return content.replace(WIKI_LINK_REGEX, (match, target, section, alias) => {
    const normalizedTarget = normalizeTarget(target);
    const resolved = resolver(normalizedTarget);

    if (!resolved) {
      // Link target doesn't exist - render as broken link
      return `<span class="link-broken" title="Page not found: ${target}">${alias || target}</span>`;
    }

    const href = section ? `${resolved.href}#${section}` : resolved.href;
    const displayText = alias || target;
    const className = resolved.exists ? 'link-internal' : 'link-missing';

    return `<a href="${href}" class="${className}">${displayText}</a>`;
  });
}

/**
 * Get all unique link targets from content
 */
export function getUniqueTargets(content: string): string[] {
  const links = parseWikiLinks(content);
  return [...new Set(links.map(l => l.target))];
}

/**
 * Check if a string contains any wiki-links
 */
export function hasWikiLinks(content: string): boolean {
  WIKI_LINK_REGEX.lastIndex = 0;
  return WIKI_LINK_REGEX.test(content);
}
