import matter from 'gray-matter';
import { promises as fs } from 'fs';
import path from 'path';

export interface MarkdownData {
  content: string;
  data: Record<string, unknown>;
}

export class MarkdownUtils {
  private static readonly DOCS_DIR = path.join(process.cwd(), 'docs');
  
  static async ensureDocsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.DOCS_DIR, { recursive: true });
      await fs.mkdir(path.join(this.DOCS_DIR, 'philosophers'), { recursive: true });
      await fs.mkdir(path.join(this.DOCS_DIR, 'ideas'), { recursive: true });
      await fs.mkdir(path.join(this.DOCS_DIR, 'periods'), { recursive: true });
      await fs.mkdir(path.join(this.DOCS_DIR, 'relationships'), { recursive: true });
    } catch {
      // Ignore directory creation errors
    }
  }

  static async writeMarkdown(
    type: 'philosophers' | 'ideas' | 'periods' | 'relationships' | '.' | '.obsidian',
    filename: string,
    frontmatter: Record<string, unknown>,
    content: string
  ): Promise<void> {
    await this.ensureDocsDirectory();
    
    const fileContent = matter.stringify(content, frontmatter);
    const filePath = type === '.' ? 
      path.join(this.DOCS_DIR, `${filename}.md`) :
      type === '.obsidian' ?
      path.join(this.DOCS_DIR, '.obsidian', `${filename}.json`) :
      path.join(this.DOCS_DIR, type, `${filename}.md`);
    
    await fs.writeFile(filePath, fileContent, 'utf8');
  }

  static async readMarkdown(
    type: 'philosophers' | 'ideas' | 'periods' | 'relationships',
    filename: string
  ): Promise<MarkdownData | null> {
    try {
      const filePath = path.join(this.DOCS_DIR, type, `${filename}.md`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsed = matter(fileContent);
      
      return {
        content: parsed.content,
        data: parsed.data
      };
    } catch {
      return null;
    }
  }

  static async listMarkdownFiles(
    type: 'philosophers' | 'ideas' | 'periods' | 'relationships'
  ): Promise<string[]> {
    try {
      const dirPath = path.join(this.DOCS_DIR, type);
      const files = await fs.readdir(dirPath);
      return files.filter(file => file.endsWith('.md')).map(file => file.replace('.md', ''));
    } catch {
      return [];
    }
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static createWikilink(text: string, type?: string): string {
    const slug = this.slugify(text);
    return type ? `[[${type}/${slug}|${text}]]` : `[[${slug}|${text}]]`;
  }

  static parseWikilinks(content: string): Array<{ link: string; display: string; type?: string }> {
    const wikilinkRegex = /\[\[(?:([^/]+)\/)?([^|]+)(?:\|([^\]]+))?\]\]/g;
    const links: Array<{ link: string; display: string; type?: string }> = [];
    let match;

    while ((match = wikilinkRegex.exec(content)) !== null) {
      const [, type, link, display] = match;
      links.push({
        link,
        display: display || link,
        type
      });
    }

    return links;
  }

  static async getAllMarkdownFiles(): Promise<{
    philosophers: Array<{ slug: string; data: MarkdownData }>;
    ideas: Array<{ slug: string; data: MarkdownData }>;
    periods: Array<{ slug: string; data: MarkdownData }>;
  }> {
    const result = {
      philosophers: [] as Array<{ slug: string; data: MarkdownData }>,
      ideas: [] as Array<{ slug: string; data: MarkdownData }>,
      periods: [] as Array<{ slug: string; data: MarkdownData }>
    };

    for (const type of ['philosophers', 'ideas', 'periods'] as const) {
      const files = await this.listMarkdownFiles(type);
      for (const slug of files) {
        const data = await this.readMarkdown(type, slug);
        if (data) {
          result[type].push({ slug, data });
        }
      }
    }

    return result;
  }

  static extractDescription(content: string): string | null {
    const descriptionMatch = content.match(/## Description\n\n([^#]+)/);
    return descriptionMatch ? descriptionMatch[1].trim() : null;
  }

  static extractRelationships(content: string): Array<{
    type: 'influenced_by' | 'influences';
    relationshipType: string;
    targetTitle: string;
    targetAuthor: string;
    description?: string;
  }> {
    const relationships: Array<{
      type: 'influenced_by' | 'influences';
      relationshipType: string;
      targetTitle: string;
      targetAuthor: string;
      description?: string;
    }> = [];

    // Parse "Influenced By" section
    const influencedByRegex = /## Influenced By\n\n((?:- \*\*[^*]+\*\*:[^\n]+\n?)*)/g;
    const influencedByMatch = influencedByRegex.exec(content);
    if (influencedByMatch) {
      const influencedBySection = influencedByMatch[1];
      const relationRegex = /- \*\*([^*]+)\*\*: \[\[ideas\/([^|]+)\|([^\]]+)\]\] by \[\[philosophers\/[^|]+\|([^\]]+)\]\](?: - ([^\n]+))?/g;
      let relationMatch;
      while ((relationMatch = relationRegex.exec(influencedBySection)) !== null) {
        const [, relationshipType, , targetTitle, targetAuthor, description] = relationMatch;
        relationships.push({
          type: 'influenced_by',
          relationshipType,
          targetTitle,
          targetAuthor,
          description
        });
      }
    }

    // Parse "Influences" section
    const influencesRegex = /## Influences\n\n((?:- \*\*[^*]+\*\*:[^\n]+\n?)*)/g;
    const influencesMatch = influencesRegex.exec(content);
    if (influencesMatch) {
      const influencesSection = influencesMatch[1];
      const relationRegex = /- \*\*([^*]+)\*\*: \[\[ideas\/([^|]+)\|([^\]]+)\]\] by \[\[philosophers\/[^|]+\|([^\]]+)\]\](?: - ([^\n]+))?/g;
      let relationMatch;
      while ((relationMatch = relationRegex.exec(influencesSection)) !== null) {
        const [, relationshipType, , targetTitle, targetAuthor, description] = relationMatch;
        relationships.push({
          type: 'influences',
          relationshipType,
          targetTitle,
          targetAuthor,
          description
        });
      }
    }

    return relationships;
  }

  static parseTags(content: string): string[] {
    const tagRegex = /#([a-zA-Z][a-zA-Z0-9\s]*)/g;
    const tags: string[] = [];
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      const tag = match[1].trim();
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  static validatePhilosopherData(data: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
    parsed?: {
      name: string;
      birth?: string;
      death?: string;
      nationality?: string;
    };
  } {
    const errors: string[] = [];
    
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Missing or invalid name');
    }

    if (data.birth && typeof data.birth !== 'string') {
      errors.push('Invalid birth date format');
    }

    if (data.death && typeof data.death !== 'string') {
      errors.push('Invalid death date format');
    }

    if (data.nationality && typeof data.nationality !== 'string') {
      errors.push('Invalid nationality format');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      parsed: {
        name: data.name as string,
        birth: data.birth as string | undefined,
        death: data.death as string | undefined,
        nationality: data.nationality as string | undefined
      }
    };
  }

  static validateIdeaData(data: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
    parsed?: {
      title: string;
      author: string;
      year?: number;
      period?: string;
      tags?: string[];
    };
  } {
    const errors: string[] = [];
    
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Missing or invalid title');
    }

    if (!data.author || typeof data.author !== 'string') {
      errors.push('Missing or invalid author');
    }

    if (data.year && (typeof data.year !== 'number' && typeof data.year !== 'string')) {
      errors.push('Invalid year format');
    }

    if (data.period && typeof data.period !== 'string') {
      errors.push('Invalid period format');
    }

    if (data.tags && !Array.isArray(data.tags)) {
      errors.push('Invalid tags format');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    let yearValue: number | undefined = undefined;
    if (data.year) {
      if (typeof data.year === 'string') {
        const parsed = parseInt(data.year, 10);
        yearValue = isNaN(parsed) ? undefined : parsed;
      } else if (typeof data.year === 'number') {
        yearValue = data.year;
      }
    }

    return {
      valid: true,
      errors: [],
      parsed: {
        title: data.title as string,
        author: data.author as string,
        year: yearValue,
        period: data.period as string | undefined,
        tags: data.tags as string[] | undefined
      }
    };
  }

  static validatePeriodData(data: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
    parsed?: {
      name: string;
      start: string;
      end?: string;
      description?: string;
    };
  } {
    const errors: string[] = [];
    
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Missing or invalid name');
    }

    if (!data.start || typeof data.start !== 'string') {
      errors.push('Missing or invalid start date');
    }

    if (data.end && typeof data.end !== 'string') {
      errors.push('Invalid end date format');
    }

    if (data.description && typeof data.description !== 'string') {
      errors.push('Invalid description format');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      parsed: {
        name: data.name as string,
        start: data.start as string,
        end: data.end as string | undefined,
        description: data.description as string | undefined
      }
    };
  }

  // New methods for providing structured data from markdown
  static async getAllIdeasFromMarkdown(): Promise<Array<{
    slug: string;
    title: string;
    author: string;
    year?: number;
    period?: string;
    description?: string;
    tags: string[];
    incomingRelations: Array<{
      type: string;
      sourceTitle: string;
      sourceAuthor: string;
      description?: string;
    }>;
    outgoingRelations: Array<{
      type: string;
      targetTitle: string;
      targetAuthor: string;
      description?: string;
    }>;
  }>> {
    const files = await this.listMarkdownFiles('ideas');
    const ideas = [];
    const allRelations = new Map<string, Array<any>>();

    // First pass: collect all ideas and their outgoing relationships
    for (const slug of files) {
      const data = await this.readMarkdown('ideas', slug);
      if (!data) continue;

      const validation = this.validateIdeaData(data.data);
      if (!validation.valid) continue;

      const parsed = validation.parsed!;
      const description = this.extractDescription(data.content);
      const tags = this.parseTags(data.content);
      const relationships = this.extractRelationships(data.content);

      const outgoingRelations = relationships
        .filter(rel => rel.type === 'influences')
        .map(rel => ({
          type: rel.relationshipType,
          targetTitle: rel.targetTitle,
          targetAuthor: rel.targetAuthor,
          description: rel.description
        }));

      const ideaKey = `${parsed.title}|${parsed.author}`;
      allRelations.set(ideaKey, relationships);

      ideas.push({
        slug,
        title: parsed.title,
        author: parsed.author,
        year: parsed.year,
        period: parsed.period,
        description: description || undefined,
        tags,
        incomingRelations: [] as any[], // Will be populated in second pass
        outgoingRelations
      });
    }

    // Second pass: populate incoming relationships
    for (const idea of ideas) {
      const ideaKey = `${idea.title}|${idea.author}`;
      
      // Find all relationships where this idea is the target
      for (const [sourceKey, relationships] of allRelations.entries()) {
        const [sourceTitle, sourceAuthor] = sourceKey.split('|');
        
        for (const rel of relationships) {
          if (rel.targetTitle === idea.title && rel.targetAuthor === idea.author) {
            idea.incomingRelations.push({
              type: rel.relationshipType,
              sourceTitle,
              sourceAuthor,
              description: rel.description
            });
          }
        }
      }
    }

    return ideas;
  }

  static async getAllPhilosophersFromMarkdown(): Promise<Array<{
    slug: string;
    name: string;
    birth?: string;
    death?: string;
    nationality?: string;
  }>> {
    const files = await this.listMarkdownFiles('philosophers');
    const philosophers = [];

    for (const slug of files) {
      const data = await this.readMarkdown('philosophers', slug);
      if (!data) continue;

      const validation = this.validatePhilosopherData(data.data);
      if (!validation.valid) continue;

      const parsed = validation.parsed!;
      philosophers.push({
        slug,
        name: parsed.name,
        birth: parsed.birth,
        death: parsed.death,
        nationality: parsed.nationality
      });
    }

    return philosophers;
  }

  static async getAllPeriodsFromMarkdown(): Promise<Array<{
    slug: string;
    name: string;
    start: string;
    end?: string;
    description?: string;
  }>> {
    const files = await this.listMarkdownFiles('periods');
    const periods = [];

    for (const slug of files) {
      const data = await this.readMarkdown('periods', slug);
      if (!data) continue;

      const validation = this.validatePeriodData(data.data);
      if (!validation.valid) continue;

      const parsed = validation.parsed!;
      periods.push({
        slug,
        name: parsed.name,
        start: parsed.start,
        end: parsed.end,
        description: parsed.description
      });
    }

    return periods;
  }

  static async getAllTagsFromMarkdown(): Promise<Array<{
    name: string;
    count: number;
  }>> {
    const files = await this.listMarkdownFiles('ideas');
    const tagCounts = new Map<string, number>();

    for (const slug of files) {
      const data = await this.readMarkdown('ideas', slug);
      if (!data) continue;

      const tags = this.parseTags(data.content);
      for (const tag of tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries()).map(([name, count]) => ({ name, count }));
  }

  static async getIdeaFromMarkdown(slug: string): Promise<{
    slug: string;
    title: string;
    author: string;
    year?: number;
    period?: string;
    description?: string;
    tags: string[];
    incomingRelations: Array<{
      type: string;
      sourceTitle: string;
      sourceAuthor: string;
      description?: string;
    }>;
    outgoingRelations: Array<{
      type: string;
      targetTitle: string;
      targetAuthor: string;
      description?: string;
    }>;
  } | null> {
    const data = await this.readMarkdown('ideas', slug);
    if (!data) return null;

    const validation = this.validateIdeaData(data.data);
    if (!validation.valid) return null;

    const parsed = validation.parsed!;
    const description = this.extractDescription(data.content);
    const tags = this.parseTags(data.content);
    const relationships = this.extractRelationships(data.content);

    const outgoingRelations = relationships
      .filter(rel => rel.type === 'influences')
      .map(rel => ({
        type: rel.relationshipType,
        targetTitle: rel.targetTitle,
        targetAuthor: rel.targetAuthor,
        description: rel.description
      }));

    // Find incoming relationships by checking all other idea files
    const incomingRelations = [];
    const allFiles = await this.listMarkdownFiles('ideas');
    
    for (const otherSlug of allFiles) {
      if (otherSlug === slug) continue;
      
      const otherData = await this.readMarkdown('ideas', otherSlug);
      if (!otherData) continue;

      const otherValidation = this.validateIdeaData(otherData.data);
      if (!otherValidation.valid) continue;

      const otherRelationships = this.extractRelationships(otherData.content);
      for (const rel of otherRelationships) {
        if (rel.targetTitle === parsed.title && rel.targetAuthor === parsed.author) {
          incomingRelations.push({
            type: rel.relationshipType,
            sourceTitle: otherValidation.parsed!.title,
            sourceAuthor: otherValidation.parsed!.author,
            description: rel.description
          });
        }
      }
    }

    return {
      slug,
      title: parsed.title,
      author: parsed.author,
      year: parsed.year,
      period: parsed.period,
      description: description || undefined,
      tags,
      incomingRelations,
      outgoingRelations
    };
  }
}