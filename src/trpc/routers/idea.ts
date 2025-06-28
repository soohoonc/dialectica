import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";
import { MarkdownUtils } from "@/lib/markdown";

export const ideaRouter = createTRPCRouter({
  // DISABLED: Use markdown file creation instead
  // create: publicProcedure
  //   .input(z.object({
  //     title: z.string(),
  //     description: z.string().optional(),
  //     authorId: z.string(),
  //     year: z.number().optional(),
  //     periodId: z.string().optional(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database creation disabled. Use MarkdownTemplates.createIdeaFile() instead.');
  //   }),

  get: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Read from markdown file using slug as ID
      const idea = await MarkdownUtils.getIdeaFromMarkdown(input.id);
      if (!idea) return null;

      // Transform to match expected format
      return {
        id: idea.slug,
        title: idea.title,
        description: idea.description,
        year: idea.year,
        author: {
          id: MarkdownUtils.slugify(idea.author),
          name: idea.author,
        },
        period: idea.period ? {
          id: MarkdownUtils.slugify(idea.period),
          name: idea.period,
        } : null,
        tags: idea.tags.map(tag => ({
          tag: {
            id: MarkdownUtils.slugify(tag),
            name: tag,
          }
        })),
        outgoingRelations: idea.outgoingRelations.map(rel => ({
          id: `${idea.slug}-${MarkdownUtils.slugify(rel.targetTitle)}`,
          type: rel.type,
          description: rel.description,
          targetIdea: {
            id: MarkdownUtils.slugify(rel.targetTitle),
            title: rel.targetTitle,
            author: {
              id: MarkdownUtils.slugify(rel.targetAuthor),
              name: rel.targetAuthor,
            },
          },
        })),
        incomingRelations: idea.incomingRelations.map(rel => ({
          id: `${MarkdownUtils.slugify(rel.sourceTitle)}-${idea.slug}`,
          type: rel.type,
          description: rel.description,
          sourceIdea: {
            id: MarkdownUtils.slugify(rel.sourceTitle),
            title: rel.sourceTitle,
            author: {
              id: MarkdownUtils.slugify(rel.sourceAuthor),
              name: rel.sourceAuthor,
            },
          },
        })),
      };
    }),

  // DISABLED: Edit markdown files directly instead
  // update: publicProcedure
  //   .input(z.object({
  //     id: z.string(),
  //     title: z.string().optional(),
  //     description: z.string().optional(),
  //     authorId: z.string().optional(),
  //     year: z.number().optional(),
  //     periodId: z.string().optional(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database updates disabled. Edit markdown files directly.');
  //   }),

  // DISABLED: Delete markdown files directly instead
  // delete: publicProcedure
  //   .input(z.object({
  //     id: z.string(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database deletion disabled. Delete markdown files directly.');
  //   }),

  list: publicProcedure
    .input(z.object({
      orderBy: z.enum(["year", "created", "title"]).optional().default("year"),
      periodId: z.string().optional(),
      authorId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Read from markdown files instead of database
      let ideas = await MarkdownUtils.getAllIdeasFromMarkdown();

      // Apply filters
      if (input.periodId || input.authorId) {
        // Note: Since we're reading from markdown, we need to filter by name, not ID
        // This is a limitation when transitioning to markdown-first
        console.warn('Filtering by ID not supported in markdown-first mode. Consider filtering by name instead.');
      }

      // Apply sorting
      if (input.orderBy === "year") {
        ideas.sort((a, b) => (a.year || 0) - (b.year || 0));
      } else if (input.orderBy === "title") {
        ideas.sort((a, b) => a.title.localeCompare(b.title));
      }
      // "created" sorting not available from markdown files

      // Transform to match expected format
      return ideas.map(idea => ({
        id: idea.slug, // Using slug as ID
        title: idea.title,
        description: idea.description,
        year: idea.year,
        author: {
          id: MarkdownUtils.slugify(idea.author), // Generate ID from name
          name: idea.author,
        },
        period: idea.period ? {
          id: MarkdownUtils.slugify(idea.period),
          name: idea.period,
        } : null,
        tags: idea.tags.map(tag => ({
          tag: {
            id: MarkdownUtils.slugify(tag),
            name: tag,
          }
        })),
        _count: {
          outgoingRelations: idea.outgoingRelations.length,
          incomingRelations: idea.incomingRelations.length,
        },
      }));
    }),

  timeline: publicProcedure
    .input(z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      // Read from markdown files instead of database
      let ideas = await MarkdownUtils.getAllIdeasFromMarkdown();

      // Apply year filters
      if (input.startYear || input.endYear) {
        ideas = ideas.filter(idea => {
          if (!idea.year) return false;
          if (input.startYear && idea.year < input.startYear) return false;
          if (input.endYear && idea.year > input.endYear) return false;
          return true;
        });
      }

      // Sort by year
      ideas.sort((a, b) => (a.year || 0) - (b.year || 0));

      // Apply limit
      ideas = ideas.slice(0, input.limit);

      // Transform to match expected format
      return ideas.map(idea => ({
        id: idea.slug,
        title: idea.title,
        description: idea.description,
        year: idea.year,
        author: {
          id: MarkdownUtils.slugify(idea.author),
          name: idea.author,
        },
        period: idea.period ? {
          id: MarkdownUtils.slugify(idea.period),
          name: idea.period,
        } : null,
        outgoingRelations: idea.outgoingRelations.map(rel => ({
          id: `${idea.slug}-${MarkdownUtils.slugify(rel.targetTitle)}`,
          type: rel.type,
          description: rel.description,
          targetIdea: {
            id: MarkdownUtils.slugify(rel.targetTitle),
            title: rel.targetTitle,
            author: {
              id: MarkdownUtils.slugify(rel.targetAuthor),
              name: rel.targetAuthor,
            },
          },
        })),
      }));
    }),

  exportToMarkdown: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const idea = await ctx.db.idea.findUnique({
        where: { id: input.id },
        include: {
          author: true,
          period: true,
          tags: {
            include: {
              tag: true
            }
          },
          outgoingRelations: {
            include: {
              targetIdea: {
                include: {
                  author: true
                }
              }
            }
          },
          incomingRelations: {
            include: {
              sourceIdea: {
                include: {
                  author: true
                }
              }
            }
          }
        }
      });

      if (!idea) {
        throw new Error('Idea not found');
      }

      const frontmatter = {
        id: idea.id,
        title: idea.title,
        author: idea.author.name,
        authorId: idea.authorId,
        year: idea.year,
        period: idea.period?.name,
        periodId: idea.periodId,
        tags: idea.tags.map(t => t.tag.name),
        createdAt: idea.createdAt.toISOString(),
        updatedAt: idea.updatedAt.toISOString(),
        relationshipCount: {
          incoming: idea.incomingRelations.length,
          outgoing: idea.outgoingRelations.length
        }
      };

      let content = `# ${idea.title}\n\n`;
      
      content += `**Author**: ${MarkdownUtils.createWikilink(idea.author.name, 'philosophers')}\n\n`;
      
      if (idea.year) {
        content += `**Year**: ${idea.year}\n\n`;
      }
      
      if (idea.period) {
        content += `**Historical Period**: ${MarkdownUtils.createWikilink(idea.period.name, 'periods')}\n\n`;
      }
      
      if (idea.tags.length > 0) {
        content += `**Tags**: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n\n`;
      }

      if (idea.description) {
        content += `## Description\n\n${idea.description}\n\n`;
      }

      if (idea.incomingRelations.length > 0) {
        content += `## Influenced By\n\n`;
        for (const rel of idea.incomingRelations) {
          content += `- **${rel.type}**: ${MarkdownUtils.createWikilink(rel.sourceIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.sourceIdea.author.name, 'philosophers')}`;
          if (rel.description) {
            content += ` - ${rel.description}`;
          }
          content += '\n';
        }
        content += '\n';
      }
      
      if (idea.outgoingRelations.length > 0) {
        content += `## Influences\n\n`;
        for (const rel of idea.outgoingRelations) {
          content += `- **${rel.type}**: ${MarkdownUtils.createWikilink(rel.targetIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.targetIdea.author.name, 'philosophers')}`;
          if (rel.description) {
            content += ` - ${rel.description}`;
          }
          content += '\n';
        }
        content += '\n';
      }

      content += `## Notes\n\n<!-- Add your research notes, quotes, and analysis here -->\n\n`;
      content += `## Related Concepts\n\n<!-- Link to related philosophical concepts -->\n\n`;

      const filename = MarkdownUtils.slugify(idea.title);
      await MarkdownUtils.writeMarkdown('ideas', filename, frontmatter, content);

      return {
        filename: `${filename}.md`,
        path: `docs/ideas/${filename}.md`
      };
    }),

  exportAllToMarkdown: publicProcedure
    .mutation(async ({ ctx }) => {
      const ideas = await ctx.db.idea.findMany({
        include: {
          author: true,
          period: true,
          tags: {
            include: {
              tag: true
            }
          },
          outgoingRelations: {
            include: {
              targetIdea: {
                include: {
                  author: true
                }
              }
            }
          },
          incomingRelations: {
            include: {
              sourceIdea: {
                include: {
                  author: true
                }
              }
            }
          }
        },
        orderBy: {
          year: 'asc'
        }
      });

      const results = [];
      for (const idea of ideas) {
        const frontmatter = {
          id: idea.id,
          title: idea.title,
          author: idea.author.name,
          authorId: idea.authorId,
          year: idea.year,
          period: idea.period?.name,
          periodId: idea.periodId,
          tags: idea.tags.map(t => t.tag.name),
          createdAt: idea.createdAt.toISOString(),
          updatedAt: idea.updatedAt.toISOString(),
          relationshipCount: {
            incoming: idea.incomingRelations.length,
            outgoing: idea.outgoingRelations.length
          }
        };

        let content = `# ${idea.title}\n\n`;
        
        content += `**Author**: ${MarkdownUtils.createWikilink(idea.author.name, 'philosophers')}\n\n`;
        
        if (idea.year) {
          content += `**Year**: ${idea.year}\n\n`;
        }
        
        if (idea.period) {
          content += `**Historical Period**: ${MarkdownUtils.createWikilink(idea.period.name, 'periods')}\n\n`;
        }
        
        if (idea.tags.length > 0) {
          content += `**Tags**: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n\n`;
        }

        if (idea.description) {
          content += `## Description\n\n${idea.description}\n\n`;
        }

        if (idea.incomingRelations.length > 0) {
          content += `## Influenced By\n\n`;
          for (const rel of idea.incomingRelations) {
            content += `- **${rel.type}**: ${MarkdownUtils.createWikilink(rel.sourceIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.sourceIdea.author.name, 'philosophers')}`;
            if (rel.description) {
              content += ` - ${rel.description}`;
            }
            content += '\n';
          }
          content += '\n';
        }
        
        if (idea.outgoingRelations.length > 0) {
          content += `## Influences\n\n`;
          for (const rel of idea.outgoingRelations) {
            content += `- **${rel.type}**: ${MarkdownUtils.createWikilink(rel.targetIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.targetIdea.author.name, 'philosophers')}`;
            if (rel.description) {
              content += ` - ${rel.description}`;
            }
            content += '\n';
          }
          content += '\n';
        }

        content += `## Notes\n\n<!-- Add your research notes, quotes, and analysis here -->\n\n`;
        content += `## Related Concepts\n\n<!-- Link to related philosophical concepts -->\n\n`;

        const filename = MarkdownUtils.slugify(idea.title);
        await MarkdownUtils.writeMarkdown('ideas', filename, frontmatter, content);

        results.push({
          filename: `${filename}.md`,
          path: `docs/ideas/${filename}.md`
        });
      }

      return results;
    }),
});