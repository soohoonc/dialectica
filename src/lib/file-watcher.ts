import * as chokidar from 'chokidar';
import path from 'path';
import { MarkdownUtils } from './markdown';
import { PrismaClient } from '../app/generated/prisma';

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private db: PrismaClient;
  private isWatching = false;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  start(): void {
    if (this.isWatching) {
      console.log('File watcher is already running');
      return;
    }

    const docsPath = path.join(process.cwd(), 'docs');
    console.log(`Starting file watcher for: ${docsPath}`);

    this.watcher = chokidar.watch([
      path.join(docsPath, 'philosophers/*.md'),
      path.join(docsPath, 'ideas/*.md'),
      path.join(docsPath, 'periods/*.md')
    ], {
      ignored: /index\.md$/,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false
    });

    this.watcher
      .on('change', async (filePath: string) => {
        console.log(`File changed: ${filePath}`);
        await this.handleFileChange(filePath);
      })
      .on('add', async (filePath: string) => {
        console.log(`File added: ${filePath}`);
        await this.handleFileChange(filePath);
      })
      .on('unlink', async (filePath: string) => {
        console.log(`File deleted: ${filePath}`);
        await this.handleFileDelete(filePath);
      })
      .on('error', (error: Error) => {
        console.error(`Watcher error: ${error}`);
      });

    this.isWatching = true;
    console.log('File watcher started successfully');
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.isWatching = false;
      console.log('File watcher stopped');
    }
  }

  private async handleFileChange(filePath: string): Promise<void> {
    try {
      const relativePath = path.relative(path.join(process.cwd(), 'docs'), filePath);
      const parts = relativePath.split(path.sep);
      
      if (parts.length !== 2) return;
      
      const [type, filename] = parts;
      const slug = filename.replace('.md', '');

      if (!['philosophers', 'ideas', 'periods'].includes(type)) {
        return;
      }

      await this.syncSingleFile(type as 'philosophers' | 'ideas' | 'periods', slug);
    } catch (error) {
      console.error(`Error handling file change for ${filePath}:`, error);
    }
  }

  private async handleFileDelete(filePath: string): Promise<void> {
    try {
      const relativePath = path.relative(path.join(process.cwd(), 'docs'), filePath);
      const parts = relativePath.split(path.sep);
      
      if (parts.length !== 2) return;
      
      const [type, filename] = parts;
      const slug = filename.replace('.md', '');

      // Note: You might want to implement soft deletion or ask for confirmation
      // before deleting from database, as this is destructive
      console.log(`File deleted: ${type}/${slug} - Manual cleanup required`);
      
    } catch (error) {
      console.error(`Error handling file deletion for ${filePath}:`, error);
    }
  }

  private async syncSingleFile(type: 'philosophers' | 'ideas' | 'periods', slug: string): Promise<void> {
    try {
      const data = await MarkdownUtils.readMarkdown(type, slug);
      if (!data) {
        console.error(`Could not read file: ${type}/${slug}.md`);
        return;
      }

      if (type === 'philosophers') {
        await this.syncPhilosopher(slug, data);
      } else if (type === 'ideas') {
        await this.syncIdea(slug, data);
      } else if (type === 'periods') {
        await this.syncPeriod(slug, data);
      }

      console.log(`Successfully synced: ${type}/${slug}`);
    } catch (error) {
      console.error(`Error syncing ${type}/${slug}:`, error);
    }
  }

  private async syncPhilosopher(slug: string, data: { content: string; data: Record<string, unknown> }): Promise<void> {
    const validation = MarkdownUtils.validatePhilosopherData(data.data);
    if (!validation.valid) {
      console.error(`Invalid philosopher data for ${slug}:`, validation.errors);
      return;
    }

    const philosopherData = validation.parsed!;
    
    const existing = await this.db.author.findFirst({
      where: { name: philosopherData.name }
    });

    if (existing) {
      await this.db.author.update({
        where: { id: existing.id },
        data: {
          name: philosopherData.name,
          birth: philosopherData.birth || null,
          death: philosopherData.death || null,
          nationality: philosopherData.nationality || null
        }
      });
    } else {
      await this.db.author.create({
        data: {
          name: philosopherData.name,
          birth: philosopherData.birth || null,
          death: philosopherData.death || null,
          nationality: philosopherData.nationality || null
        }
      });
    }
  }

  private async syncIdea(slug: string, data: { content: string; data: Record<string, unknown> }): Promise<void> {
    const validation = MarkdownUtils.validateIdeaData(data.data);
    if (!validation.valid) {
      console.error(`Invalid idea data for ${slug}:`, validation.errors);
      return;
    }

    const ideaData = validation.parsed!;

    // Find the author
    const author = await this.db.author.findFirst({
      where: { name: ideaData.author }
    });

    if (!author) {
      console.error(`Author "${ideaData.author}" not found for idea ${slug}`);
      return;
    }

    // Find the period if specified
    let period = null;
    if (ideaData.period) {
      period = await this.db.period.findFirst({
        where: { name: ideaData.period }
      });
    }

    // Extract description from content
    const description = this.extractDescription(data.content);

    const existing = await this.db.idea.findFirst({
      where: { 
        title: ideaData.title,
        authorId: author.id
      }
    });

    let ideaId: string;
    if (existing) {
      await this.db.idea.update({
        where: { id: existing.id },
        data: {
          title: ideaData.title,
          year: ideaData.year || null,
          periodId: period?.id || null,
          description
        }
      });
      ideaId = existing.id;
    } else {
      const newIdea = await this.db.idea.create({
        data: {
          title: ideaData.title,
          authorId: author.id,
          year: ideaData.year || null,
          periodId: period?.id || null,
          description
        }
      });
      ideaId = newIdea.id;
    }

    // Sync tags
    await this.syncIdeaTags(ideaId, data.content);

    // Sync relationships
    await this.syncIdeaRelationships(ideaId, ideaData.title, data.content);
  }

  private async syncPeriod(slug: string, data: { content: string; data: Record<string, unknown> }): Promise<void> {
    const validation = MarkdownUtils.validatePeriodData(data.data);
    if (!validation.valid) {
      console.error(`Invalid period data for ${slug}:`, validation.errors);
      return;
    }

    const periodData = validation.parsed!;

    const existing = await this.db.period.findFirst({
      where: { name: periodData.name }
    });

    if (existing) {
      await this.db.period.update({
        where: { id: existing.id },
        data: {
          name: periodData.name,
          start: periodData.start,
          end: periodData.end || null,
          description: periodData.description || null
        }
      });
    } else {
      await this.db.period.create({
        data: {
          name: periodData.name,
          start: periodData.start,
          end: periodData.end || null,
          description: periodData.description || null
        }
      });
    }
  }

  private async syncIdeaTags(ideaId: string, content: string): Promise<void> {
    const tags = MarkdownUtils.parseTags(content);

    // Remove existing tag associations
    await this.db.ideaTag.deleteMany({
      where: { ideaId }
    });

    // Create tags if they don't exist and associate them
    for (const tagName of tags) {
      let tag = await this.db.tag.findFirst({
        where: { name: tagName }
      });

      if (!tag) {
        tag = await this.db.tag.create({
          data: { name: tagName }
        });
      }

      await this.db.ideaTag.create({
        data: {
          ideaId,
          tagId: tag.id
        }
      });
    }
  }

  private async syncIdeaRelationships(sourceIdeaId: string, sourceTitle: string, content: string): Promise<void> {
    const relationships = MarkdownUtils.extractRelationships(content);

    // Note: This is a simplified version. In a production system, you might want
    // to be more careful about relationship management to avoid duplicates
    // and handle relationship deletion properly.

    for (const rel of relationships) {
      try {
        // Find target idea and author
        const targetAuthor = await this.db.author.findFirst({
          where: { name: rel.targetAuthor }
        });

        if (!targetAuthor) continue;

        const targetIdea = await this.db.idea.findFirst({
          where: { 
            title: rel.targetTitle,
            authorId: targetAuthor.id
          }
        });

        if (!targetIdea) continue;

        // Create relationship based on direction
        if (rel.type === 'influences') {
          // Source influences target
          const existing = await this.db.ideaRelationship.findFirst({
            where: {
              sourceIdeaId,
              targetIdeaId: targetIdea.id,
              type: rel.relationshipType
            }
          });

          if (!existing) {
            await this.db.ideaRelationship.create({
              data: {
                sourceIdeaId,
                targetIdeaId: targetIdea.id,
                type: rel.relationshipType,
                description: rel.description || null
              }
            });
          }
        } else if (rel.type === 'influenced_by') {
          // Target influences source
          const existing = await this.db.ideaRelationship.findFirst({
            where: {
              sourceIdeaId: targetIdea.id,
              targetIdeaId: sourceIdeaId,
              type: rel.relationshipType
            }
          });

          if (!existing) {
            await this.db.ideaRelationship.create({
              data: {
                sourceIdeaId: targetIdea.id,
                targetIdeaId: sourceIdeaId,
                type: rel.relationshipType,
                description: rel.description || null
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error syncing relationship ${sourceTitle} -> ${rel.targetTitle}:`, error);
      }
    }
  }

  private extractDescription(content: string): string | null {
    const descriptionMatch = content.match(/## Description\n\n([^#]+)/);
    return descriptionMatch ? descriptionMatch[1].trim() : null;
  }

  isRunning(): boolean {
    return this.isWatching;
  }
}

// Singleton instance
let fileWatcherInstance: FileWatcher | null = null;
let autoStartAttempted = false;

export function getFileWatcher(db: PrismaClient): FileWatcher {
  if (!fileWatcherInstance) {
    fileWatcherInstance = new FileWatcher(db);
    
    // Auto-start the watcher on first access (server startup)
    if (!autoStartAttempted) {
      autoStartAttempted = true;
      try {
        fileWatcherInstance.start();
        console.log('🔄 File watcher auto-started for markdown-first architecture');
      } catch (error) {
        console.error('⚠️ Failed to auto-start file watcher:', error);
      }
    }
  }
  return fileWatcherInstance;
}