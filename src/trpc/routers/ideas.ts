import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc";
import { TRPCError } from "@trpc/server";
import type { IdeaNode } from "@/lib/graph";

export const ideasRouter = createTRPCRouter({
  // List all ideas with optional filtering
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sort: z.enum(["title", "year"]).default("title"),
        order: z.enum(["asc", "desc"]).default("asc"),
        author: z.string().optional(),
        period: z.string().optional(),
        tags: z.array(z.string()).optional(),
        yearRange: z.object({
          start: z.number(),
          end: z.number(),
        }).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      let ideas = ctx.graph.getNodesByType<IdeaNode>("idea");

      // Filter by author
      if (input?.author) {
        ideas = ideas.filter(i => i.authors.includes(input.author!));
      }

      // Filter by period
      if (input?.period) {
        ideas = ideas.filter(i => i.periods.includes(input.period!));
      }

      // Filter by tags
      if (input?.tags?.length) {
        ideas = ideas.filter(i =>
          input.tags!.some(tag => i.tags.includes(tag))
        );
      }

      // Filter by year range
      if (input?.yearRange) {
        ideas = ideas.filter(i =>
          i.year !== undefined &&
          i.year >= input.yearRange!.start &&
          i.year <= input.yearRange!.end
        );
      }

      // Sort
      const sortKey = input?.sort || "title";
      const sortOrder = input?.order === "desc" ? -1 : 1;

      ideas.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortKey) {
          case "year":
            aVal = a.year ?? Infinity;
            bVal = b.year ?? Infinity;
            break;
          default:
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
        }

        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });

      const total = ideas.length;
      const offset = input?.offset || 0;
      const limit = input?.limit || 50;

      return {
        ideas: ideas.slice(offset, offset + limit),
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get a single idea by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const idea = ctx.graph.getNode(input.id);

      if (!idea || idea.type !== "idea") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Idea not found: ${input.id}`,
        });
      }

      return idea as IdeaNode;
    }),

  // Get idea with all relations
  getWithRelations: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const idea = ctx.graph.getNode(input.id);

      if (!idea || idea.type !== "idea") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Idea not found: ${input.id}`,
        });
      }

      const i = idea as IdeaNode;

      // Get related entities
      const authors = i.authors
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
      const periods = i.periods
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
      const influences = i.influences
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
      const influenced = i.influenced
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
      const contradicts = i.contradicts
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
      const synthesizes = i.synthesizes
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
      const backlinks = ctx.graph.getBacklinks(input.id);

      return {
        idea: i,
        authors,
        periods,
        influences,
        influenced,
        contradicts,
        synthesizes,
        backlinks,
      };
    }),

  // Get dialectical graph for force-directed visualization
  getDialecticalGraph: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        depth: z.number().min(1).max(5).default(2),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.getGraphData({
        type: "idea",
        centerId: input?.id,
        depth: input?.depth,
      });
    }),

  // Get ideas that influence this one
  getInfluences: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const idea = ctx.graph.getNode(input.id) as IdeaNode | undefined;

      if (!idea || idea.type !== "idea") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Idea not found: ${input.id}`,
        });
      }

      return idea.influences
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
    }),

  // Get ideas influenced by this one
  getInfluenced: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const idea = ctx.graph.getNode(input.id) as IdeaNode | undefined;

      if (!idea || idea.type !== "idea") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Idea not found: ${input.id}`,
        });
      }

      return idea.influenced
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);
    }),

  // Search ideas
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.search(input.query, { types: ["idea"] });
    }),
});
