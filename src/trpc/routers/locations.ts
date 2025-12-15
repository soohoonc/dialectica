import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc";
import { TRPCError } from "@trpc/server";
import type { LocationNode } from "@/lib/graph";

export const locationsRouter = createTRPCRouter({
  // List all locations
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sort: z.enum(["name", "country"]).default("name"),
        order: z.enum(["asc", "desc"]).default("asc"),
        country: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      let locations = ctx.graph.getNodesByType<LocationNode>("location");

      // Filter by country
      if (input?.country) {
        locations = locations.filter(l => l.country === input.country);
      }

      // Filter by tags
      if (input?.tags?.length) {
        locations = locations.filter(l =>
          input.tags!.some(tag => l.tags.includes(tag))
        );
      }

      // Sort
      const sortKey = input?.sort || "name";
      const sortOrder = input?.order === "desc" ? -1 : 1;

      locations.sort((a, b) => {
        const aVal = sortKey === "country"
          ? (a.country || "").toLowerCase()
          : a.name.toLowerCase();
        const bVal = sortKey === "country"
          ? (b.country || "").toLowerCase()
          : b.name.toLowerCase();

        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });

      const total = locations.length;
      const offset = input?.offset || 0;
      const limit = input?.limit || 50;

      return {
        locations: locations.slice(offset, offset + limit),
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get a single location by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const location = ctx.graph.getNode(input.id);

      if (!location || location.type !== "location") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Location not found: ${input.id}`,
        });
      }

      return location as LocationNode;
    }),

  // Get location with related content
  getWithRelations: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const location = ctx.graph.getNode(input.id);

      if (!location || location.type !== "location") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Location not found: ${input.id}`,
        });
      }

      const loc = location as LocationNode;

      // Get figures from this location
      const figures = ctx.graph.getNodesByType("figure")
        .filter(f => "locations" in f && (f.locations as string[]).includes(input.id));

      // Get time periods associated with this location
      const periods = ctx.graph.getNodesByType("time")
        .filter(t => "locations" in t && (t.locations as string[]).includes(input.id));

      // Get artifacts at this location
      const artifacts = ctx.graph.getNodesByType("artifact")
        .filter(o => "location" in o && o.location === input.id);

      const backlinks = ctx.graph.getBacklinks(input.id);

      return {
        location: loc,
        figures,
        periods,
        artifacts,
        backlinks,
      };
    }),

  // Get all unique countries
  getCountries: publicProcedure
    .query(async ({ ctx }) => {
      await ctx.graph.initialize();

      const locations = ctx.graph.getNodesByType<LocationNode>("location");
      const countries = new Set<string>();

      for (const loc of locations) {
        if (loc.country) {
          countries.add(loc.country);
        }
      }

      return Array.from(countries).sort();
    }),

  // Search locations
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.search(input.query, { types: ["location"] });
    }),
});
