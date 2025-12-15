import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc";
import { TRPCError } from "@trpc/server";
import type { FigureNode } from "@/lib/graph";

export const figuresRouter = createTRPCRouter({
  // List all figures with optional filtering
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sort: z.enum(["name", "birth", "death"]).default("name"),
        order: z.enum(["asc", "desc"]).default("asc"),
        nationality: z.string().optional(),
        period: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      let figures = ctx.graph.getNodesByType<FigureNode>("figure");

      // Filter by nationality
      if (input?.nationality) {
        figures = figures.filter(f => f.nationality === input.nationality);
      }

      // Filter by period
      if (input?.period) {
        figures = figures.filter(f => f.periods.includes(input.period!));
      }

      // Filter by tags
      if (input?.tags?.length) {
        figures = figures.filter(f =>
          input.tags!.some(tag => f.tags.includes(tag))
        );
      }

      // Sort
      const sortKey = input?.sort || "name";
      const sortOrder = input?.order === "desc" ? -1 : 1;

      figures.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortKey) {
          case "birth":
            aVal = a.birth ?? Infinity;
            bVal = b.birth ?? Infinity;
            break;
          case "death":
            aVal = a.death ?? Infinity;
            bVal = b.death ?? Infinity;
            break;
          default:
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
        }

        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });

      const total = figures.length;
      const offset = input?.offset || 0;
      const limit = input?.limit || 50;

      return {
        figures: figures.slice(offset, offset + limit),
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get a single figure by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const figure = ctx.graph.getNode(input.id);

      if (!figure || figure.type !== "figure") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Figure not found: ${input.id}`,
        });
      }

      return figure as FigureNode;
    }),

  // Get figure with all relations
  getWithRelations: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const figure = ctx.graph.getNode(input.id);

      if (!figure || figure.type !== "figure") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Figure not found: ${input.id}`,
        });
      }

      const fig = figure as FigureNode;

      // Get related entities
      const ideas = ctx.graph.getIdeasByAuthor(input.id);
      const backlinks = ctx.graph.getBacklinks(input.id);
      const locations = fig.locations
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
      const periods = fig.periods
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);

      return {
        figure: fig,
        ideas,
        backlinks,
        locations,
        periods,
      };
    }),

  // Search figures
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.search(input.query, { types: ["figure"] });
    }),
});
