import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc";
import { TRPCError } from "@trpc/server";
import type { TimeNode } from "@/lib/graph";

export const timesRouter = createTRPCRouter({
  // List all time periods
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sort: z.enum(["name", "start", "end"]).default("start"),
        order: z.enum(["asc", "desc"]).default("asc"),
        tags: z.array(z.string()).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      let times = ctx.graph.getNodesByType<TimeNode>("time");

      // Filter by tags
      if (input?.tags?.length) {
        times = times.filter(t =>
          input.tags!.some(tag => t.tags.includes(tag))
        );
      }

      // Sort
      const sortKey = input?.sort || "start";
      const sortOrder = input?.order === "desc" ? -1 : 1;

      times.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortKey) {
          case "start":
            aVal = a.start;
            bVal = b.start;
            break;
          case "end":
            aVal = a.end ?? Infinity;
            bVal = b.end ?? Infinity;
            break;
          default:
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
        }

        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });

      const total = times.length;
      const offset = input?.offset || 0;
      const limit = input?.limit || 50;

      return {
        times: times.slice(offset, offset + limit),
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get a single time period by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const time = ctx.graph.getNode(input.id);

      if (!time || time.type !== "time") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Time period not found: ${input.id}`,
        });
      }

      return time as TimeNode;
    }),

  // Get time period with related content
  getWithRelations: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const time = ctx.graph.getNode(input.id);

      if (!time || time.type !== "time") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Time period not found: ${input.id}`,
        });
      }

      const t = time as TimeNode;

      // Get figures from this period
      const figures = ctx.graph.getNodesByType("figure")
        .filter(f => "periods" in f && (f.periods as string[]).includes(input.id));

      // Get ideas from this period
      const ideas = ctx.graph.getNodesByType("idea")
        .filter(i => "periods" in i && (i.periods as string[]).includes(input.id));

      // Get locations
      const locations = t.locations
        .map(id => ctx.graph.getNode(id))
        .filter(Boolean);

      const backlinks = ctx.graph.getBacklinks(input.id);

      return {
        time: t,
        figures,
        ideas,
        locations,
        backlinks,
      };
    }),

  // Get periods that overlap with a year range
  getByRange: publicProcedure
    .input(
      z.object({
        start: z.number(),
        end: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const times = ctx.graph.getNodesByType<TimeNode>("time");

      return times.filter(t => {
        const periodEnd = t.end ?? Infinity;
        // Check for overlap
        return t.start <= input.end && periodEnd >= input.start;
      });
    }),

  // Search time periods
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.search(input.query, { types: ["time"] });
    }),
});
