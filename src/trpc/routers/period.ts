import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";
import { MarkdownUtils } from "@/lib/markdown";

export const periodRouter = createTRPCRouter({
  // DISABLED: Use markdown file creation instead
  // create: publicProcedure
  //   .input(z.object({
  //     name: z.string(),
  //     description: z.string().optional(),
  //     start: z.string(),
  //     end: z.string().optional(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database creation disabled. Use MarkdownTemplates.createPeriodFile() instead.');
  //   }),

  list: publicProcedure
    .query(async () => {
      // Read from markdown files instead of database
      const periods = await MarkdownUtils.getAllPeriodsFromMarkdown();
      
      // Sort by start date
      periods.sort((a, b) => a.start.localeCompare(b.start));
      
      // Get idea counts for each period by checking all ideas
      const ideas = await MarkdownUtils.getAllIdeasFromMarkdown();
      
      // Transform to match expected format
      return periods.map(period => {
        const ideaCount = ideas.filter(idea => idea.period === period.name).length;
        
        return {
          id: period.slug, // Using slug as ID
          name: period.name,
          description: period.description || null,
          start: period.start,
          end: period.end || null,
          _count: {
            ideas: ideaCount,
          },
        };
      });
    }),

  get: publicProcedure
    .input(z.object({
      id: z.string(), // Using slug as ID
    }))
    .query(async ({ input }) => {
      // Read from markdown file using slug as ID
      const data = await MarkdownUtils.readMarkdown('periods', input.id);
      if (!data) return null;

      const validation = MarkdownUtils.validatePeriodData(data.data);
      if (!validation.valid) return null;

      const parsed = validation.parsed!;
      
      // Get all ideas for this period
      const allIdeas = await MarkdownUtils.getAllIdeasFromMarkdown();
      const periodIdeas = allIdeas.filter(idea => idea.period === parsed.name);
      
      // Sort ideas by year
      periodIdeas.sort((a, b) => (a.year || 0) - (b.year || 0));
      
      return {
        id: input.id,
        name: parsed.name,
        description: parsed.description || null,
        start: parsed.start,
        end: parsed.end || null,
        ideas: periodIdeas.map(idea => ({
          id: idea.slug,
          title: idea.title,
          description: idea.description || null,
          year: idea.year || null,
          author: {
            id: MarkdownUtils.slugify(idea.author),
            name: idea.author,
          },
          tags: idea.tags.map(tag => ({
            tag: {
              id: MarkdownUtils.slugify(tag),
              name: tag,
            }
          })),
        })),
      };
    }),

  // DISABLED: Edit markdown files directly instead
  // update: publicProcedure
  //   .input(z.object({
  //     id: z.string(),
  //     name: z.string().optional(),
  //     description: z.string().optional(),
  //     start: z.string().optional(),
  //     end: z.string().optional(),
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

  exportToMarkdown: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const period = await ctx.db.period.findUnique({
        where: { id: input.id },
        include: {
          ideas: {
            include: {
              author: true,
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
          }
        }
      });

      if (!period) {
        throw new Error('Period not found');
      }

      const frontmatter = {
        id: period.id,
        name: period.name,
        start: period.start,
        end: period.end,
        description: period.description,
        createdAt: period.createdAt.toISOString(),
        updatedAt: period.updatedAt.toISOString(),
        ideaCount: period.ideas.length,
        authors: [...new Set(period.ideas.map(i => i.author.name))].sort()
      };

      let content = `# ${period.name}\n\n`;
      
      content += `**Time Period**: ${period.start}${period.end ? ` - ${period.end}` : ' - present'}\n\n`;
      
      if (period.description) {
        content += `## Overview\n\n${period.description}\n\n`;
      }

      if (period.ideas.length > 0) {
        content += `## Key Ideas (${period.ideas.length})\n\n`;
        
        const ideasByAuthor = period.ideas.reduce((acc, idea) => {
          const authorName = idea.author.name;
          if (!acc[authorName]) {
            acc[authorName] = [];
          }
          acc[authorName].push(idea);
          return acc;
        }, {} as Record<string, typeof period.ideas>);

        for (const [authorName, ideas] of Object.entries(ideasByAuthor)) {
          content += `### ${MarkdownUtils.createWikilink(authorName, 'philosophers')}\n\n`;
          
          for (const idea of ideas) {
            content += `- **${MarkdownUtils.createWikilink(idea.title, 'ideas')}**`;
            if (idea.year) {
              content += ` (${idea.year})`;
            }
            if (idea.description) {
              content += `: ${idea.description.substring(0, 150)}${idea.description.length > 150 ? '...' : ''}`;
            }
            content += '\n';
            
            if (idea.tags.length > 0) {
              content += `  - Tags: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n`;
            }
          }
          content += '\n';
        }

        const totalInfluences = period.ideas.reduce((acc, idea) => 
          acc + idea.outgoingRelations.length + idea.incomingRelations.length, 0
        );

        if (totalInfluences > 0) {
          content += `## Intellectual Networks\n\n`;
          content += `This period contains ${totalInfluences} documented relationships between ideas, showing the rich intellectual discourse of the time.\n\n`;

          const majorInfluences = period.ideas
            .filter(idea => idea.outgoingRelations.length > 0)
            .sort((a, b) => b.outgoingRelations.length - a.outgoingRelations.length)
            .slice(0, 5);

          if (majorInfluences.length > 0) {
            content += `### Most Influential Ideas\n\n`;
            for (const idea of majorInfluences) {
              content += `- ${MarkdownUtils.createWikilink(idea.title, 'ideas')} by ${MarkdownUtils.createWikilink(idea.author.name, 'philosophers')} (${idea.outgoingRelations.length} influences)\n`;
            }
            content += '\n';
          }
        }
      }

      content += `## Timeline\n\n`;
      content += `<!-- Add a chronological timeline of major events and ideas from this period -->\n\n`;
      
      content += `## Context\n\n`;
      content += `<!-- Add historical, cultural, and political context for this period -->\n\n`;

      content += `## Legacy\n\n`;
      content += `<!-- Discuss how this period influenced later philosophical thought -->\n\n`;

      const filename = MarkdownUtils.slugify(period.name);
      await MarkdownUtils.writeMarkdown('periods', filename, frontmatter, content);

      return {
        filename: `${filename}.md`,
        path: `docs/periods/${filename}.md`
      };
    }),

  exportAllToMarkdown: publicProcedure
    .mutation(async ({ ctx }) => {
      const periods = await ctx.db.period.findMany({
        include: {
          ideas: {
            include: {
              author: true,
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
          }
        },
        orderBy: {
          start: 'asc'
        }
      });

      const results = [];
      for (const period of periods) {
        const frontmatter = {
          id: period.id,
          name: period.name,
          start: period.start,
          end: period.end,
          description: period.description,
          createdAt: period.createdAt.toISOString(),
          updatedAt: period.updatedAt.toISOString(),
          ideaCount: period.ideas.length,
          authors: [...new Set(period.ideas.map(i => i.author.name))].sort()
        };

        let content = `# ${period.name}\n\n`;
        
        content += `**Time Period**: ${period.start}${period.end ? ` - ${period.end}` : ' - present'}\n\n`;
        
        if (period.description) {
          content += `## Overview\n\n${period.description}\n\n`;
        }

        if (period.ideas.length > 0) {
          content += `## Key Ideas (${period.ideas.length})\n\n`;
          
          const ideasByAuthor = period.ideas.reduce((acc, idea) => {
            const authorName = idea.author.name;
            if (!acc[authorName]) {
              acc[authorName] = [];
            }
            acc[authorName].push(idea);
            return acc;
          }, {} as Record<string, typeof period.ideas>);

          for (const [authorName, ideas] of Object.entries(ideasByAuthor)) {
            content += `### ${MarkdownUtils.createWikilink(authorName, 'philosophers')}\n\n`;
            
            for (const idea of ideas) {
              content += `- **${MarkdownUtils.createWikilink(idea.title, 'ideas')}**`;
              if (idea.year) {
                content += ` (${idea.year})`;
              }
              if (idea.description) {
                content += `: ${idea.description.substring(0, 150)}${idea.description.length > 150 ? '...' : ''}`;
              }
              content += '\n';
              
              if (idea.tags.length > 0) {
                content += `  - Tags: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n`;
              }
            }
            content += '\n';
          }

          const totalInfluences = period.ideas.reduce((acc, idea) => 
            acc + idea.outgoingRelations.length + idea.incomingRelations.length, 0
          );

          if (totalInfluences > 0) {
            content += `## Intellectual Networks\n\n`;
            content += `This period contains ${totalInfluences} documented relationships between ideas, showing the rich intellectual discourse of the time.\n\n`;

            const majorInfluences = period.ideas
              .filter(idea => idea.outgoingRelations.length > 0)
              .sort((a, b) => b.outgoingRelations.length - a.outgoingRelations.length)
              .slice(0, 5);

            if (majorInfluences.length > 0) {
              content += `### Most Influential Ideas\n\n`;
              for (const idea of majorInfluences) {
                content += `- ${MarkdownUtils.createWikilink(idea.title, 'ideas')} by ${MarkdownUtils.createWikilink(idea.author.name, 'philosophers')} (${idea.outgoingRelations.length} influences)\n`;
              }
              content += '\n';
            }
          }
        }

        content += `## Timeline\n\n`;
        content += `<!-- Add a chronological timeline of major events and ideas from this period -->\n\n`;
        
        content += `## Context\n\n`;
        content += `<!-- Add historical, cultural, and political context for this period -->\n\n`;

        content += `## Legacy\n\n`;
        content += `<!-- Discuss how this period influenced later philosophical thought -->\n\n`;

        const filename = MarkdownUtils.slugify(period.name);
        await MarkdownUtils.writeMarkdown('periods', filename, frontmatter, content);

        results.push({
          filename: `${filename}.md`,
          path: `docs/periods/${filename}.md`
        });
      }

      return results;
    }),
});