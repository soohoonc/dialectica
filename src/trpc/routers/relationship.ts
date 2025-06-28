import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";
import { MarkdownUtils } from "@/lib/markdown";

export const relationshipRouter = createTRPCRouter({
  // DISABLED: Edit idea markdown files directly to add relationships
  // create: publicProcedure
  //   .input(z.object({
  //     sourceIdeaId: z.string(),
  //     targetIdeaId: z.string(),
  //     type: z.enum(["influences", "contradicts", "synthesizes", "builds_upon", "refutes"]),
  //     description: z.string().optional(),
  //     strength: z.number().min(1).max(10).optional(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database creation disabled. Edit idea markdown files directly to add relationships.');
  //   }),

  list: publicProcedure
    .input(z.object({
      ideaId: z.string().optional(),
      type: z.enum(["influences", "contradicts", "synthesizes", "builds_upon", "refutes"]).optional(),
    }))
    .query(async ({ input }) => {
      // Read relationships from markdown files
      const ideas = await MarkdownUtils.getAllIdeasFromMarkdown();
      const relationships = [];
      
      // Collect all relationships from all ideas
      for (const idea of ideas) {
        // Add outgoing relationships
        for (const rel of idea.outgoingRelations) {
          if (input.type && rel.type !== input.type) continue;
          if (input.ideaId && idea.slug !== input.ideaId) continue;
          
          relationships.push({
            id: `${idea.slug}-${MarkdownUtils.slugify(rel.targetTitle)}`,
            type: rel.type,
            description: rel.description || null,
            sourceIdea: {
              id: idea.slug,
              title: idea.title,
              author: {
                id: MarkdownUtils.slugify(idea.author),
                name: idea.author,
              },
            },
            targetIdea: {
              id: MarkdownUtils.slugify(rel.targetTitle),
              title: rel.targetTitle,
              author: {
                id: MarkdownUtils.slugify(rel.targetAuthor),
                name: rel.targetAuthor,
              },
            },
          });
        }
        
        // Add incoming relationships
        for (const rel of idea.incomingRelations) {
          if (input.type && rel.type !== input.type) continue;
          if (input.ideaId && idea.slug !== input.ideaId) continue;
          
          relationships.push({
            id: `${MarkdownUtils.slugify(rel.sourceTitle)}-${idea.slug}`,
            type: rel.type,
            description: rel.description || null,
            sourceIdea: {
              id: MarkdownUtils.slugify(rel.sourceTitle),
              title: rel.sourceTitle,
              author: {
                id: MarkdownUtils.slugify(rel.sourceAuthor),
                name: rel.sourceAuthor,
              },
            },
            targetIdea: {
              id: idea.slug,
              title: idea.title,
              author: {
                id: MarkdownUtils.slugify(idea.author),
                name: idea.author,
              },
            },
          });
        }
      }
      
      return relationships;
    }),

  // DISABLED: Edit idea markdown files directly to remove relationships
  // delete: publicProcedure
  //   .input(z.object({
  //     id: z.string(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new Error('Database deletion disabled. Edit idea markdown files directly to remove relationships.');
  //   }),

  dialecticalChain: publicProcedure
    .input(z.object({
      ideaId: z.string(),
      depth: z.number().min(1).max(5).optional().default(3),
    }))
    .query(async ({ input }) => {
      // Find dialectical chains starting from this idea by reading from markdown
      const idea = await MarkdownUtils.getIdeaFromMarkdown(input.ideaId);
      if (!idea) return [];
      
      // Filter for dialectical relationship types
      const dialecticalTypes = ["synthesizes", "contradicts", "influences"];
      const dialecticalRelations = idea.outgoingRelations.filter(rel => 
        dialecticalTypes.includes(rel.type)
      );
      
      // Transform to match expected format
      const relationships = [];
      for (const rel of dialecticalRelations) {
        relationships.push({
          id: `${idea.slug}-${MarkdownUtils.slugify(rel.targetTitle)}`,
          type: rel.type,
          description: rel.description || null,
          sourceIdea: {
            id: idea.slug,
            title: idea.title,
            author: {
              id: MarkdownUtils.slugify(idea.author),
              name: idea.author,
            },
          },
          targetIdea: {
            id: MarkdownUtils.slugify(rel.targetTitle),
            title: rel.targetTitle,
            author: {
              id: MarkdownUtils.slugify(rel.targetAuthor),
              name: rel.targetAuthor,
            },
            // Note: Nested relationships would require recursive loading
            // This is simplified for the markdown-first implementation
            outgoingRelations: [],
          },
        });
      }
      
      return relationships;
    }),
});