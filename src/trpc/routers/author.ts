import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";
import { MarkdownUtils } from "@/lib/markdown";

export const authorRouter = createTRPCRouter({
  // DISABLED: Use markdown file creation instead
  // create: publicProcedure
  //   .input(z.object({
  //     name: z.string(),
  //     birth: z.string().optional(),
  //     death: z.string().optional(),
  //     nationality: z.string().optional(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database creation disabled. Use MarkdownTemplates.createPhilosopherFile() instead.');
  //   }),

  get: publicProcedure
    .input(z.object({
      id: z.string(), // Using slug as ID
    }))
    .query(async ({ input }) => {
      // Read from markdown file using slug as ID
      const data = await MarkdownUtils.readMarkdown('philosophers', input.id);
      if (!data) return null;

      const validation = MarkdownUtils.validatePhilosopherData(data.data);
      if (!validation.valid) return null;

      const parsed = validation.parsed!;
      return {
        id: input.id,
        name: parsed.name,
        birth: parsed.birth || null,
        death: parsed.death || null,
        nationality: parsed.nationality || null,
      };
    }),

  // DISABLED: Edit markdown files directly instead
  // update: publicProcedure
  //   .input(z.object({
  //     id: z.string(),
  //     name: z.string().optional(),
  //     birth: z.string().optional(),
  //     death: z.string().optional(),
  //     nationality: z.string().optional(),
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
    .query(async () => {
      // Read from markdown files instead of database
      const philosophers = await MarkdownUtils.getAllPhilosophersFromMarkdown();
      
      // Sort by name
      philosophers.sort((a, b) => a.name.localeCompare(b.name));
      
      // Transform to match expected format
      return philosophers.map(philosopher => ({
        id: philosopher.slug, // Using slug as ID
        name: philosopher.name,
        birth: philosopher.birth || null,
        death: philosopher.death || null,
        nationality: philosopher.nationality || null,
      }));
    }),

  exportToMarkdown: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const author = await ctx.db.author.findUnique({
        where: { id: input.id },
        include: {
          ideas: {
            include: {
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
          }
        }
      });

      if (!author) {
        throw new Error('Author not found');
      }

      const frontmatter = {
        id: author.id,
        name: author.name,
        birth: author.birth,
        death: author.death,
        nationality: author.nationality,
        createdAt: author.createdAt.toISOString(),
        updatedAt: author.updatedAt.toISOString(),
        ideaCount: author.ideas.length
      };

      let content = `# ${author.name}\n\n`;
      
      if (author.birth || author.death) {
        content += `**Lifespan**: ${author.birth || '?'} - ${author.death || 'present'}\n\n`;
      }
      
      if (author.nationality) {
        content += `**Nationality**: ${author.nationality}\n\n`;
      }

      if (author.ideas.length > 0) {
        content += `## Ideas (${author.ideas.length})\n\n`;
        
        for (const idea of author.ideas) {
          content += `### ${MarkdownUtils.createWikilink(idea.title, 'ideas')}\n\n`;
          
          if (idea.year) {
            content += `**Year**: ${idea.year}\n\n`;
          }
          
          if (idea.period) {
            content += `**Period**: ${MarkdownUtils.createWikilink(idea.period.name, 'periods')}\n\n`;
          }
          
          if (idea.description) {
            content += `${idea.description}\n\n`;
          }
          
          if (idea.tags.length > 0) {
            content += `**Tags**: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n\n`;
          }
          
          if (idea.outgoingRelations.length > 0) {
            content += `**Influences**:\n`;
            for (const rel of idea.outgoingRelations) {
              content += `- ${rel.type}: ${MarkdownUtils.createWikilink(rel.targetIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.targetIdea.author.name, 'philosophers')}\n`;
            }
            content += '\n';
          }
          
          if (idea.incomingRelations.length > 0) {
            content += `**Influenced by**:\n`;
            for (const rel of idea.incomingRelations) {
              content += `- ${rel.type}: ${MarkdownUtils.createWikilink(rel.sourceIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.sourceIdea.author.name, 'philosophers')}\n`;
            }
            content += '\n';
          }
          
          content += '---\n\n';
        }
      }

      const filename = MarkdownUtils.slugify(author.name);
      await MarkdownUtils.writeMarkdown('philosophers', filename, frontmatter, content);

      return {
        filename: `${filename}.md`,
        path: `docs/philosophers/${filename}.md`
      };
    }),

  exportAllToMarkdown: publicProcedure
    .mutation(async ({ ctx }) => {
      const authors = await ctx.db.author.findMany({
        orderBy: { name: 'asc' }
      });

      const results = [];
      for (const author of authors) {
        const result = await ctx.db.author.findUnique({
          where: { id: author.id },
          include: {
            ideas: {
              include: {
                period: true,
                tags: { include: { tag: true } },
                outgoingRelations: {
                  include: {
                    targetIdea: { include: { author: true } }
                  }
                },
                incomingRelations: {
                  include: {
                    sourceIdea: { include: { author: true } }
                  }
                }
              },
              orderBy: { year: 'asc' }
            }
          }
        });

        if (result) {
          const frontmatter = {
            id: result.id,
            name: result.name,
            birth: result.birth,
            death: result.death,
            nationality: result.nationality,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
            ideaCount: result.ideas.length
          };

          let content = `# ${result.name}\n\n`;
          
          if (result.birth || result.death) {
            content += `**Lifespan**: ${result.birth || '?'} - ${result.death || 'present'}\n\n`;
          }
          
          if (result.nationality) {
            content += `**Nationality**: ${result.nationality}\n\n`;
          }

          if (result.ideas.length > 0) {
            content += `## Ideas (${result.ideas.length})\n\n`;
            
            for (const idea of result.ideas) {
              content += `### ${MarkdownUtils.createWikilink(idea.title, 'ideas')}\n\n`;
              
              if (idea.year) {
                content += `**Year**: ${idea.year}\n\n`;
              }
              
              if (idea.period) {
                content += `**Period**: ${MarkdownUtils.createWikilink(idea.period.name, 'periods')}\n\n`;
              }
              
              if (idea.description) {
                content += `${idea.description}\n\n`;
              }
              
              if (idea.tags.length > 0) {
                content += `**Tags**: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n\n`;
              }
              
              if (idea.outgoingRelations.length > 0) {
                content += `**Influences**:\n`;
                for (const rel of idea.outgoingRelations) {
                  content += `- ${rel.type}: ${MarkdownUtils.createWikilink(rel.targetIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.targetIdea.author.name, 'philosophers')}\n`;
                }
                content += '\n';
              }
              
              if (idea.incomingRelations.length > 0) {
                content += `**Influenced by**:\n`;
                for (const rel of idea.incomingRelations) {
                  content += `- ${rel.type}: ${MarkdownUtils.createWikilink(rel.sourceIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.sourceIdea.author.name, 'philosophers')}\n`;
                }
                content += '\n';
              }
              
              content += '---\n\n';
            }
          }

          const filename = MarkdownUtils.slugify(result.name);
          await MarkdownUtils.writeMarkdown('philosophers', filename, frontmatter, content);
          
          results.push({
            filename: `${filename}.md`,
            path: `docs/philosophers/${filename}.md`
          });
        }
      }

      return results;
    }),
});