import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc";
import type { OntologyType } from "@/lib/graph";

export const searchRouter = createTRPCRouter({
  // Unified search across all ontology types
  all: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        types: z.array(z.enum([
          "figure",
          "time",
          "location",
          "idea",
          "artifact",
          "page",
        ])).optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const types = input.types as OntologyType[] | undefined;
      const results = ctx.graph.search(input.query, { types });

      // Group results by type
      const grouped = {
        figures: results.filter(r => r.type === "figure").slice(0, input.limit),
        times: results.filter(r => r.type === "time").slice(0, input.limit),
        locations: results.filter(r => r.type === "location").slice(0, input.limit),
        ideas: results.filter(r => r.type === "idea").slice(0, input.limit),
        artifacts: results.filter(r => r.type === "artifact").slice(0, input.limit),
        pages: results.filter(r => r.type === "page").slice(0, input.limit),
      };

      return {
        results: results.slice(0, input.limit),
        grouped,
        total: results.length,
      };
    }),

  // Get all unique tags across all content
  getTags: publicProcedure
    .query(async ({ ctx }) => {
      await ctx.graph.initialize();

      const nodes = ctx.graph.getAllNodes();
      const tagCounts = new Map<string, number>();

      for (const node of nodes) {
        for (const tag of node.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }

      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    }),

  // Autocomplete suggestions
  suggest: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
        type: z.enum(["figure", "time", "location", "idea", "artifact", "page"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const query = input.query.toLowerCase();
      const types = input.type ? [input.type] as OntologyType[] : undefined;
      const results = ctx.graph.search(input.query, { types });

      // Prioritize title matches
      const suggestions = results
        .filter(r => r.title.toLowerCase().startsWith(query))
        .slice(0, input.limit)
        .map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          slug: r.slug,
        }));

      // Add partial matches if needed
      if (suggestions.length < input.limit) {
        const partial = results
          .filter(r =>
            !r.title.toLowerCase().startsWith(query) &&
            r.title.toLowerCase().includes(query)
          )
          .slice(0, input.limit - suggestions.length)
          .map(r => ({
            id: r.id,
            title: r.title,
            type: r.type,
            slug: r.slug,
          }));

        suggestions.push(...partial);
      }

      return suggestions;
    }),
});
