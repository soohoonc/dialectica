// Markdown file parser with front matter extraction

import matter from 'gray-matter';
import { z } from 'zod';
import type {
  OntologyType,
  GraphNode,
  FigureNode,
  TimeNode,
  LocationNode,
  IdeaNode,
  ArtifactNode,
  PageNode,
} from './types';

// Front matter schemas for each ontology type

const baseSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['figure', 'time', 'location', 'idea', 'artifact', 'page']),
  tags: z.array(z.string()).default([]),
});

const figureSchema = baseSchema.extend({
  type: z.literal('figure'),
  name: z.string(),
  birth: z.number().optional(),
  death: z.number().optional(),
  nationality: z.string().optional(),
  portrait: z.string().optional(),
  locations: z.array(z.string()).default([]),
  periods: z.array(z.string()).default([]),
});

const timeSchema = baseSchema.extend({
  type: z.literal('time'),
  name: z.string(),
  start: z.number(),
  end: z.number().optional(),
  parent: z.string().optional(),
  locations: z.array(z.string()).default([]),
});

const locationSchema = baseSchema.extend({
  type: z.literal('location'),
  name: z.string(),
  country: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  parent: z.string().optional(),
});

const ideaSchema = baseSchema.extend({
  type: z.literal('idea'),
  title: z.string(),
  authors: z.array(z.string()).default([]),
  year: z.number().optional(),
  periods: z.array(z.string()).default([]),
  influences: z.array(z.string()).default([]),
  contradicts: z.array(z.string()).default([]),
  synthesizes: z.array(z.string()).default([]),
});

const artifactSchema = baseSchema.extend({
  type: z.literal('artifact'),
  name: z.string(),
  year: z.number().optional(),
  creator: z.string().optional(),
  location: z.string().optional(),
  image: z.string().optional(),
  medium: z.enum(['book', 'manuscript', 'sculpture', 'painting', 'inscription', 'mosaic', 'relief', 'instrument', 'textile', 'ceramic', 'other']).optional(),
  era: z.string().optional(),
});

const pageSchema = baseSchema.extend({
  type: z.literal('page'),
  title: z.string(),
  authors: z.array(z.string()).default([]),
});

/**
 * Infer ontology type from file path
 */
export function inferTypeFromPath(filePath: string): OntologyType | null {
  const pathParts = filePath.split('/');
  const docsIndex = pathParts.findIndex(p => p === 'docs');

  if (docsIndex === -1 || docsIndex >= pathParts.length - 1) {
    return null;
  }

  const typeDir = pathParts[docsIndex + 1];

  const typeMap: Record<string, OntologyType> = {
    'f': 'figure',
    'figures': 'figure',
    't': 'time',
    'times': 'time',
    'periods': 'time',
    'l': 'location',
    'locations': 'location',
    'i': 'idea',
    'ideas': 'idea',
    'a': 'artifact',
    'artifacts': 'artifact',
    'o': 'artifact',  // Keep 'o' for backwards compatibility
    'objects': 'artifact',
    'p': 'page',
    'pages': 'page',
  };

  return typeMap[typeDir] || null;
}

/**
 * Extract slug from file path
 */
export function extractSlugFromPath(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  return fileName.replace(/\.md$/, '').toLowerCase();
}

/**
 * Parse a markdown file and return a typed node
 */
export function parseMarkdownFile(
  fileContent: string,
  filePath: string
): GraphNode | null {
  try {
    const { data: frontMatter, content } = matter(fileContent);

    // Infer type from path if not specified in front matter
    const inferredType = inferTypeFromPath(filePath);
    const type = frontMatter.type || inferredType;

    if (!type) {
      console.warn(`Could not determine type for file: ${filePath}`);
      return null;
    }

    const slug = extractSlugFromPath(filePath);
    const id = frontMatter.id || slug;

    // Create base node properties
    const baseProps = {
      id,
      slug,
      filePath,
      content: content.trim(),
      tags: frontMatter.tags || [],
      createdAt: frontMatter.created ? new Date(frontMatter.created) : undefined,
      updatedAt: frontMatter.updated ? new Date(frontMatter.updated) : undefined,
    };

    // Parse and validate based on type
    switch (type) {
      case 'figure': {
        const parsed = figureSchema.safeParse({ ...frontMatter, type });
        if (!parsed.success) {
          console.warn(`Invalid figure front matter in ${filePath}:`, parsed.error);
          // Return with defaults
          return {
            ...baseProps,
            type: 'figure',
            title: frontMatter.name || slug,
            name: frontMatter.name || slug,
            birth: frontMatter.birth,
            death: frontMatter.death,
            nationality: frontMatter.nationality,
            portrait: frontMatter.portrait,
            locations: frontMatter.locations || [],
            periods: frontMatter.periods || [],
          } as FigureNode;
        }
        return {
          ...baseProps,
          ...parsed.data,
          title: parsed.data.name,
        } as FigureNode;
      }

      case 'time': {
        const parsed = timeSchema.safeParse({ ...frontMatter, type });
        if (!parsed.success) {
          console.warn(`Invalid time front matter in ${filePath}:`, parsed.error);
          return {
            ...baseProps,
            type: 'time',
            title: frontMatter.name || slug,
            name: frontMatter.name || slug,
            start: frontMatter.start || 0,
            end: frontMatter.end,
            parent: frontMatter.parent,
            locations: frontMatter.locations || [],
          } as TimeNode;
        }
        return {
          ...baseProps,
          ...parsed.data,
          title: parsed.data.name,
        } as TimeNode;
      }

      case 'location': {
        const parsed = locationSchema.safeParse({ ...frontMatter, type });
        if (!parsed.success) {
          console.warn(`Invalid location front matter in ${filePath}:`, parsed.error);
          return {
            ...baseProps,
            type: 'location',
            title: frontMatter.name || slug,
            name: frontMatter.name || slug,
            country: frontMatter.country,
            coordinates: frontMatter.coordinates,
            parent: frontMatter.parent,
          } as LocationNode;
        }
        return {
          ...baseProps,
          ...parsed.data,
          title: parsed.data.name,
        } as LocationNode;
      }

      case 'idea': {
        const parsed = ideaSchema.safeParse({ ...frontMatter, type });
        if (!parsed.success) {
          console.warn(`Invalid idea front matter in ${filePath}:`, parsed.error);
          return {
            ...baseProps,
            type: 'idea',
            title: frontMatter.title || slug,
            authors: frontMatter.authors || [],
            year: frontMatter.year,
            periods: frontMatter.periods || [],
            influences: frontMatter.influences || [],
            influenced: [], // Computed later from backlinks
            contradicts: frontMatter.contradicts || [],
            synthesizes: frontMatter.synthesizes || [],
          } as IdeaNode;
        }
        return {
          ...baseProps,
          ...parsed.data,
          influenced: [], // Computed later
        } as IdeaNode;
      }

      case 'artifact': {
        const parsed = artifactSchema.safeParse({ ...frontMatter, type });
        if (!parsed.success) {
          console.warn(`Invalid artifact front matter in ${filePath}:`, parsed.error);
          return {
            ...baseProps,
            type: 'artifact',
            title: frontMatter.name || slug,
            name: frontMatter.name || slug,
            year: frontMatter.year,
            creator: frontMatter.creator,
            location: frontMatter.location,
            image: frontMatter.image,
            medium: frontMatter.medium,
            era: frontMatter.era,
          } as ArtifactNode;
        }
        return {
          ...baseProps,
          ...parsed.data,
          title: parsed.data.name,
        } as ArtifactNode;
      }

      case 'page': {
        const parsed = pageSchema.safeParse({ ...frontMatter, type });
        if (!parsed.success) {
          console.warn(`Invalid page front matter in ${filePath}:`, parsed.error);
          return {
            ...baseProps,
            type: 'page',
            title: frontMatter.title || slug,
            authors: frontMatter.authors || [],
          } as PageNode;
        }
        return {
          ...baseProps,
          ...parsed.data,
        } as PageNode;
      }

      default:
        console.warn(`Unknown type "${type}" in ${filePath}`);
        return null;
    }
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract title from front matter or first heading
 */
export function extractTitle(content: string, frontMatter: Record<string, unknown>): string {
  // Check front matter
  if (frontMatter.title) return String(frontMatter.title);
  if (frontMatter.name) return String(frontMatter.name);

  // Extract from first # heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  return 'Untitled';
}
