import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";
import { MarkdownUtils } from "@/lib/markdown";
import { getFileWatcher } from "@/lib/file-watcher";
import { z } from "zod";

export const importRouter = createTRPCRouter({
  syncFromMarkdown: publicProcedure
    .mutation(async ({ ctx }) => {
      const results = {
        created: { philosophers: 0, ideas: 0, periods: 0, tags: 0, relationships: 0 },
        updated: { philosophers: 0, ideas: 0, periods: 0, tags: 0, relationships: 0 },
        errors: [] as string[]
      };

      try {
        // Read all markdown files
        const markdownFiles = await MarkdownUtils.getAllMarkdownFiles();

        // First pass: sync periods (they're referenced by ideas)
        for (const { slug, data } of markdownFiles.periods) {
          try {
            const validation = MarkdownUtils.validatePeriodData(data.data);
            if (!validation.valid) {
              results.errors.push(`Period ${slug}: ${validation.errors.join(', ')}`);
              continue;
            }

            const periodData = validation.parsed!;

            // Check if period exists
            const existingPeriod = await ctx.db.period.findFirst({
              where: { name: periodData.name }
            });

            if (existingPeriod) {
              // Update existing period
              await ctx.db.period.update({
                where: { id: existingPeriod.id },
                data: {
                  name: periodData.name,
                  start: periodData.start,
                  end: periodData.end || null,
                  description: periodData.description || null
                }
              });
              results.updated.periods++;
            } else {
              // Create new period
              await ctx.db.period.create({
                data: {
                  name: periodData.name,
                  start: periodData.start,
                  end: periodData.end || null,
                  description: periodData.description || null
                }
              });
              results.created.periods++;
            }
          } catch (error) {
            results.errors.push(`Period ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Second pass: sync philosophers (they're referenced by ideas)
        for (const { slug, data } of markdownFiles.philosophers) {
          try {
            const validation = MarkdownUtils.validatePhilosopherData(data.data);
            if (!validation.valid) {
              results.errors.push(`Philosopher ${slug}: ${validation.errors.join(', ')}`);
              continue;
            }

            const philosopherData = validation.parsed!;

            // Check if philosopher exists
            const existingPhilosopher = await ctx.db.author.findFirst({
              where: { name: philosopherData.name }
            });

            if (existingPhilosopher) {
              // Update existing philosopher
              await ctx.db.author.update({
                where: { id: existingPhilosopher.id },
                data: {
                  name: philosopherData.name,
                  birth: philosopherData.birth || null,
                  death: philosopherData.death || null,
                  nationality: philosopherData.nationality || null
                }
              });
              results.updated.philosophers++;
            } else {
              // Create new philosopher
              await ctx.db.author.create({
                data: {
                  name: philosopherData.name,
                  birth: philosopherData.birth || null,
                  death: philosopherData.death || null,
                  nationality: philosopherData.nationality || null
                }
              });
              results.created.philosophers++;
            }
          } catch (error) {
            results.errors.push(`Philosopher ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Third pass: extract and sync tags from all content
        const allTags = new Set<string>();
        for (const { data } of markdownFiles.ideas) {
          const tags = MarkdownUtils.parseTags(data.content);
          tags.forEach(tag => allTags.add(tag));
        }

        for (const tagName of allTags) {
          try {
            const existingTag = await ctx.db.tag.findFirst({
              where: { name: tagName }
            });

            if (!existingTag) {
              await ctx.db.tag.create({
                data: { name: tagName }
              });
              results.created.tags++;
            }
          } catch (error) {
            results.errors.push(`Tag ${tagName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Fourth pass: sync ideas
        for (const { slug, data } of markdownFiles.ideas) {
          try {
            const validation = MarkdownUtils.validateIdeaData(data.data);
            if (!validation.valid) {
              results.errors.push(`Idea ${slug}: ${validation.errors.join(', ')}`);
              continue;
            }

            const ideaData = validation.parsed!;

            // Find the author
            const author = await ctx.db.author.findFirst({
              where: { name: ideaData.author }
            });

            if (!author) {
              results.errors.push(`Idea ${slug}: Author "${ideaData.author}" not found`);
              continue;
            }

            // Find the period if specified
            let period = null;
            if (ideaData.period) {
              period = await ctx.db.period.findFirst({
                where: { name: ideaData.period }
              });
            }

            // Check if idea exists
            const existingIdea = await ctx.db.idea.findFirst({
              where: { 
                title: ideaData.title,
                authorId: author.id
              }
            });

            let ideaId: string;
            if (existingIdea) {
              // Update existing idea
              await ctx.db.idea.update({
                where: { id: existingIdea.id },
                data: {
                  title: ideaData.title,
                  year: ideaData.year || null,
                  periodId: period?.id || null,
                  description: extractDescription(data.content)
                }
              });
              ideaId = existingIdea.id;
              results.updated.ideas++;
            } else {
              // Create new idea
              const newIdea = await ctx.db.idea.create({
                data: {
                  title: ideaData.title,
                  authorId: author.id,
                  year: ideaData.year || null,
                  periodId: period?.id || null,
                  description: extractDescription(data.content)
                }
              });
              ideaId = newIdea.id;
              results.created.ideas++;
            }

            // Sync tags for this idea
            const ideaTags = MarkdownUtils.parseTags(data.content);
            
            // Remove existing tag associations
            await ctx.db.ideaTag.deleteMany({
              where: { ideaId }
            });

            // Add new tag associations
            for (const tagName of ideaTags) {
              const tag = await ctx.db.tag.findFirst({
                where: { name: tagName }
              });

              if (tag) {
                await ctx.db.ideaTag.create({
                  data: {
                    ideaId,
                    tagId: tag.id
                  }
                });
              }
            }

          } catch (error) {
            results.errors.push(`Idea ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Fifth pass: sync relationships
        for (const { slug, data } of markdownFiles.ideas) {
          try {
            const validation = MarkdownUtils.validateIdeaData(data.data);
            if (!validation.valid) continue;

            const ideaData = validation.parsed!;
            const relationships = MarkdownUtils.extractRelationships(data.content);

            // Find the source idea
            const sourceIdea = await ctx.db.idea.findFirst({
              where: { title: ideaData.title },
              include: { author: true }
            });

            if (!sourceIdea) continue;

            for (const rel of relationships) {
              try {
                // Find target idea and author
                const targetAuthor = await ctx.db.author.findFirst({
                  where: { name: rel.targetAuthor }
                });

                if (!targetAuthor) continue;

                const targetIdea = await ctx.db.idea.findFirst({
                  where: { 
                    title: rel.targetTitle,
                    authorId: targetAuthor.id
                  }
                });

                if (!targetIdea) continue;

                // Create relationship based on direction
                if (rel.type === 'influences') {
                  // Source influences target
                  const existingRel = await ctx.db.ideaRelationship.findFirst({
                    where: {
                      sourceIdeaId: sourceIdea.id,
                      targetIdeaId: targetIdea.id,
                      type: rel.relationshipType
                    }
                  });

                  if (!existingRel) {
                    await ctx.db.ideaRelationship.create({
                      data: {
                        sourceIdeaId: sourceIdea.id,
                        targetIdeaId: targetIdea.id,
                        type: rel.relationshipType,
                        description: rel.description || null
                      }
                    });
                    results.created.relationships++;
                  }
                } else if (rel.type === 'influenced_by') {
                  // Target influences source
                  const existingRel = await ctx.db.ideaRelationship.findFirst({
                    where: {
                      sourceIdeaId: targetIdea.id,
                      targetIdeaId: sourceIdea.id,
                      type: rel.relationshipType
                    }
                  });

                  if (!existingRel) {
                    await ctx.db.ideaRelationship.create({
                      data: {
                        sourceIdeaId: targetIdea.id,
                        targetIdeaId: sourceIdea.id,
                        type: rel.relationshipType,
                        description: rel.description || null
                      }
                    });
                    results.created.relationships++;
                  }
                }
              } catch (error) {
                results.errors.push(`Relationship ${slug} -> ${rel.targetTitle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          } catch (error) {
            results.errors.push(`Relationships for ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        return results;
      } catch (error) {
        results.errors.push(`Global error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return results;
      }
    }),

  validateMarkdownFiles: publicProcedure
    .query(async () => {
      const validationResults = {
        philosophers: [] as Array<{ slug: string; valid: boolean; errors: string[] }>,
        ideas: [] as Array<{ slug: string; valid: boolean; errors: string[] }>,
        periods: [] as Array<{ slug: string; valid: boolean; errors: string[] }>
      };

      try {
        const markdownFiles = await MarkdownUtils.getAllMarkdownFiles();

        // Validate philosophers
        for (const { slug, data } of markdownFiles.philosophers) {
          const validation = MarkdownUtils.validatePhilosopherData(data.data);
          validationResults.philosophers.push({
            slug,
            valid: validation.valid,
            errors: validation.errors
          });
        }

        // Validate ideas
        for (const { slug, data } of markdownFiles.ideas) {
          const validation = MarkdownUtils.validateIdeaData(data.data);
          validationResults.ideas.push({
            slug,
            valid: validation.valid,
            errors: validation.errors
          });
        }

        // Validate periods
        for (const { slug, data } of markdownFiles.periods) {
          const validation = MarkdownUtils.validatePeriodData(data.data);
          validationResults.periods.push({
            slug,
            valid: validation.valid,
            errors: validation.errors
          });
        }

        return validationResults;
      } catch (error) {
        throw new Error(`Failed to validate markdown files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  syncSingleFile: publicProcedure
    .input(z.object({
      type: z.enum(['philosophers', 'ideas', 'periods']),
      slug: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = {
        success: false,
        action: '' as 'created' | 'updated' | 'failed',
        errors: [] as string[]
      };

      try {
        const data = await MarkdownUtils.readMarkdown(input.type, input.slug);
        if (!data) {
          result.errors.push('File not found');
          return result;
        }

        if (input.type === 'philosophers') {
          const validation = MarkdownUtils.validatePhilosopherData(data.data);
          if (!validation.valid) {
            result.errors = validation.errors;
            return result;
          }

          const philosopherData = validation.parsed!;
          const existing = await ctx.db.author.findFirst({
            where: { name: philosopherData.name }
          });

          if (existing) {
            await ctx.db.author.update({
              where: { id: existing.id },
              data: {
                name: philosopherData.name,
                birth: philosopherData.birth || null,
                death: philosopherData.death || null,
                nationality: philosopherData.nationality || null
              }
            });
            result.action = 'updated';
          } else {
            await ctx.db.author.create({
              data: {
                name: philosopherData.name,
                birth: philosopherData.birth || null,
                death: philosopherData.death || null,
                nationality: philosopherData.nationality || null
              }
            });
            result.action = 'created';
          }
        }

        result.success = true;
        return result;
      } catch (error) {
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
        result.action = 'failed';
        return result;
      }
    }),

  startWatcher: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        const watcher = getFileWatcher(ctx.db);
        watcher.start();
        return { success: true, message: 'File watcher started' };
      } catch (error) {
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }),

  stopWatcher: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        const watcher = getFileWatcher(ctx.db);
        watcher.stop();
        return { success: true, message: 'File watcher stopped' };
      } catch (error) {
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }),

  watcherStatus: publicProcedure
    .query(async ({ ctx }) => {
      const watcher = getFileWatcher(ctx.db);
      return { 
        isRunning: watcher.isRunning(),
        message: watcher.isRunning() ? 'File watcher is active' : 'File watcher is stopped'
      };
    })
});

// Helper function to extract description from markdown content
function extractDescription(content: string): string | null {
  const descriptionMatch = content.match(/## Description\n\n([^#]+)/);
  return descriptionMatch ? descriptionMatch[1].trim() : null;
}