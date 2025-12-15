import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc";

export const graphRouter = createTRPCRouter({
  // Query graph with options
  query: publicProcedure
    .input(
      z.object({
        type: z.enum(["figure", "time", "location", "idea", "artifact", "page"]).optional(),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sort: z.enum(["title", "date", "year", "name"]).default("title"),
        order: z.enum(["asc", "desc"]).default("asc"),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.query({
        type: input?.type,
        tags: input?.tags,
        search: input?.search,
        limit: input?.limit,
        offset: input?.offset,
        sort: input?.sort,
        order: input?.order,
      });
    }),

  // Get a single node by ID
  getNode: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.getNode(input.id);
    }),

  // Get backlinks for a node
  getBacklinks: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.getBacklinks(input.id);
    }),

  // Get graph data for visualization
  getGraphData: publicProcedure
    .input(
      z.object({
        type: z.enum(["figure", "time", "location", "idea", "artifact", "page"]).optional(),
        centerId: z.string().optional(),
        depth: z.number().min(1).max(5).default(2),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.getGraphData({
        type: input?.type,
        centerId: input?.centerId,
        depth: input?.depth,
      });
    }),

  // Get statistics
  getStats: publicProcedure
    .query(async ({ ctx }) => {
      await ctx.graph.initialize();

      const nodes = ctx.graph.getAllNodes();
      const edges = ctx.graph.getAllEdges();

      const byType = {
        figures: nodes.filter(n => n.type === "figure").length,
        times: nodes.filter(n => n.type === "time").length,
        locations: nodes.filter(n => n.type === "location").length,
        ideas: nodes.filter(n => n.type === "idea").length,
        artifacts: nodes.filter(n => n.type === "artifact").length,
        pages: nodes.filter(n => n.type === "page").length,
      };

      return {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        byType,
      };
    }),

  // Resolve a wiki-link target
  resolveLink: publicProcedure
    .input(z.object({ target: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.resolveLink(input.target);
    }),
});
