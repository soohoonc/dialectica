import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc";
import { TRPCError } from "@trpc/server";
import type { PageNode } from "@/lib/graph";

export const pagesRouter = createTRPCRouter({
  // List all wiki pages
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sort: z.enum(["title", "created", "updated"]).default("title"),
        order: z.enum(["asc", "desc"]).default("asc"),
        tags: z.array(z.string()).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      let pages = ctx.graph.getNodesByType<PageNode>("page");

      // Filter by tags
      if (input?.tags?.length) {
        pages = pages.filter(p =>
          input.tags!.some(tag => p.tags.includes(tag))
        );
      }

      // Sort
      const sortKey = input?.sort || "title";
      const sortOrder = input?.order === "desc" ? -1 : 1;

      pages.sort((a, b) => {
        let aVal: string | number | Date;
        let bVal: string | number | Date;

        switch (sortKey) {
          case "created":
            aVal = a.createdAt?.getTime() ?? 0;
            bVal = b.createdAt?.getTime() ?? 0;
            break;
          case "updated":
            aVal = a.updatedAt?.getTime() ?? 0;
            bVal = b.updatedAt?.getTime() ?? 0;
            break;
          default:
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
        }

        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });

      const total = pages.length;
      const offset = input?.offset || 0;
      const limit = input?.limit || 50;

      return {
        pages: pages.slice(offset, offset + limit),
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get a single page by ID/slug
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const page = ctx.graph.getNode(input.id);

      if (!page || page.type !== "page") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Page not found: ${input.id}`,
        });
      }

      return page as PageNode;
    }),

  // Get page with backlinks
  getWithBacklinks: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const page = ctx.graph.getNode(input.id);

      if (!page || page.type !== "page") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Page not found: ${input.id}`,
        });
      }

      const backlinks = ctx.graph.getBacklinks(input.id);

      return {
        page: page as PageNode,
        backlinks,
      };
    }),

  // Search pages
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.search(input.query, { types: ["page"] });
    }),
});
