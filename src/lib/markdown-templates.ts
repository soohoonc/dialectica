import { MarkdownUtils } from './markdown';
import { promises as fs } from 'fs';
import path from 'path';

export interface PhilosopherTemplate {
  name: string;
  birth?: string;
  death?: string;
  nationality?: string;
}

export interface IdeaTemplate {
  title: string;
  author: string;
  year?: number;
  period?: string;
  description?: string;
  tags?: string[];
}

export interface PeriodTemplate {
  name: string;
  start: string;
  end?: string;
  description?: string;
}

export class MarkdownTemplates {
  private static readonly DOCS_DIR = path.join(process.cwd(), 'docs');

  static async createPhilosopherFile(data: PhilosopherTemplate): Promise<{ filename: string; path: string }> {
    await MarkdownUtils.ensureDocsDirectory();

    const frontmatter = {
      name: data.name,
      birth: data.birth || null,
      death: data.death || null,
      nationality: data.nationality || null
    };

    let content = `# ${data.name}\n\n`;
    
    if (data.birth || data.death) {
      content += `**Lifespan**: ${data.birth || '?'} - ${data.death || 'present'}\n\n`;
    }
    
    if (data.nationality) {
      content += `**Nationality**: ${data.nationality}\n\n`;
    }

    content += `## Ideas\n\n<!-- Add ideas by this philosopher -->\n\n`;
    content += `## Biography\n\n<!-- Add biographical information -->\n\n`;
    content += `## Major Works\n\n<!-- List major works and publications -->\n\n`;
    content += `## Influences\n\n<!-- Describe who influenced this philosopher -->\n\n`;
    content += `## Legacy\n\n<!-- Describe this philosopher's influence on later thought -->\n\n`;

    const filename = MarkdownUtils.slugify(data.name);
    await MarkdownUtils.writeMarkdown('philosophers', filename, frontmatter, content);

    return {
      filename: `${filename}.md`,
      path: `docs/philosophers/${filename}.md`
    };
  }

  static async createIdeaFile(data: IdeaTemplate): Promise<{ filename: string; path: string }> {
    await MarkdownUtils.ensureDocsDirectory();

    const frontmatter = {
      title: data.title,
      author: data.author,
      year: data.year || null,
      period: data.period || null,
      tags: data.tags || []
    };

    let content = `# ${data.title}\n\n`;
    
    content += `**Author**: [[philosophers/${MarkdownUtils.slugify(data.author)}|${data.author}]]\n\n`;
    
    if (data.year) {
      content += `**Year**: ${data.year}\n\n`;
    }
    
    if (data.period) {
      content += `**Historical Period**: [[periods/${MarkdownUtils.slugify(data.period)}|${data.period}]]\n\n`;
    }
    
    if (data.tags && data.tags.length > 0) {
      content += `**Tags**: ${data.tags.map(tag => `#${tag}`).join(', ')}\n\n`;
    }

    content += `## Description\n\n${data.description || 'Add a description of this philosophical concept...'}\n\n`;
    content += `## Historical Context\n\n<!-- Add historical background and context -->\n\n`;
    content += `## Key Arguments\n\n<!-- Outline the main arguments or components -->\n\n`;
    content += `## Influenced By\n\n<!-- Add relationships to earlier ideas -->\n\n`;
    content += `## Influences\n\n<!-- Add relationships to later ideas -->\n\n`;
    content += `## Criticisms\n\n<!-- Add major criticisms or counter-arguments -->\n\n`;
    content += `## Notes\n\n<!-- Add your research notes, quotes, and analysis here -->\n\n`;
    content += `## Related Concepts\n\n<!-- Link to related philosophical concepts -->\n\n`;

    const filename = MarkdownUtils.slugify(data.title);
    await MarkdownUtils.writeMarkdown('ideas', filename, frontmatter, content);

    return {
      filename: `${filename}.md`,
      path: `docs/ideas/${filename}.md`
    };
  }

  static async createPeriodFile(data: PeriodTemplate): Promise<{ filename: string; path: string }> {
    await MarkdownUtils.ensureDocsDirectory();

    const frontmatter = {
      name: data.name,
      start: data.start,
      end: data.end || null,
      description: data.description || null
    };

    let content = `# ${data.name}\n\n`;
    
    content += `**Time Period**: ${data.start}${data.end ? ` - ${data.end}` : ' - present'}\n\n`;
    
    if (data.description) {
      content += `## Overview\n\n${data.description}\n\n`;
    }

    content += `## Historical Context\n\n<!-- Add political, social, and cultural context -->\n\n`;
    content += `## Key Philosophers\n\n<!-- List major philosophers from this period -->\n\n`;
    content += `## Major Ideas\n\n<!-- Describe the dominant philosophical themes -->\n\n`;
    content += `## Intellectual Networks\n\n<!-- Describe philosophical schools and movements -->\n\n`;
    content += `## Timeline\n\n<!-- Add a chronological timeline of major events and ideas -->\n\n`;
    content += `## Legacy\n\n<!-- Discuss how this period influenced later philosophical thought -->\n\n`;

    const filename = MarkdownUtils.slugify(data.name);
    await MarkdownUtils.writeMarkdown('periods', filename, frontmatter, content);

    return {
      filename: `${filename}.md`,
      path: `docs/periods/${filename}.md`
    };
  }

  static async createTagFile(tagName: string): Promise<{ filename: string; path: string }> {
    await MarkdownUtils.ensureDocsDirectory();

    // Create a relationships file to track this tag
    const frontmatter = {
      tag: tagName,
      type: 'philosophical_category'
    };

    let content = `# ${tagName}\n\n`;
    content += `**Type**: Philosophical Category\n\n`;
    content += `## Description\n\n<!-- Describe this philosophical category or theme -->\n\n`;
    content += `## Related Ideas\n\n<!-- Ideas tagged with #${tagName} will be automatically linked here by the system -->\n\n`;
    content += `## Historical Development\n\n<!-- How this concept developed over time -->\n\n`;
    content += `## Key Debates\n\n<!-- Major debates within this area of philosophy -->\n\n`;

    const filename = MarkdownUtils.slugify(tagName);
    await MarkdownUtils.writeMarkdown('relationships', filename, frontmatter, content);

    return {
      filename: `${filename}.md`,
      path: `docs/relationships/${filename}.md`
    };
  }

  static async deleteMarkdownFile(type: 'philosophers' | 'ideas' | 'periods' | 'relationships', slug: string): Promise<boolean> {
    try {
      const filePath = path.join(this.DOCS_DIR, type, `${slug}.md`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting ${type}/${slug}.md:`, error);
      return false;
    }
  }

  static async listMarkdownFiles(type: 'philosophers' | 'ideas' | 'periods' | 'relationships'): Promise<Array<{ slug: string; name: string; lastModified: Date }>> {
    try {
      const dirPath = path.join(this.DOCS_DIR, type);
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      const markdownFiles = files
        .filter(file => file.isFile() && file.name.endsWith('.md'))
        .map(async file => {
          const filePath = path.join(dirPath, file.name);
          const stats = await fs.stat(filePath);
          const data = await MarkdownUtils.readMarkdown(type, file.name.replace('.md', ''));
          
          return {
            slug: file.name.replace('.md', ''),
            name: data?.data.name || data?.data.title || file.name.replace('.md', ''),
            lastModified: stats.mtime
          };
        });

      return await Promise.all(markdownFiles);
    } catch (error) {
      console.error(`Error listing ${type} files:`, error);
      return [];
    }
  }
}