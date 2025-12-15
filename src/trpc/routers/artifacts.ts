import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc";
import { TRPCError } from "@trpc/server";
import type { ArtifactNode, ArtifactMedium } from "@/lib/graph";

// Medium definitions with display names
const MEDIUMS: { id: ArtifactMedium; name: string }[] = [
  { id: "book", name: "Books" },
  { id: "manuscript", name: "Manuscripts" },
  { id: "sculpture", name: "Sculptures" },
  { id: "painting", name: "Paintings" },
  { id: "inscription", name: "Inscriptions" },
  { id: "mosaic", name: "Mosaics" },
  { id: "relief", name: "Reliefs" },
  { id: "instrument", name: "Instruments" },
  { id: "textile", name: "Textiles" },
  { id: "ceramic", name: "Ceramics" },
  { id: "other", name: "Other" },
];

export const artifactsRouter = createTRPCRouter({
  // List all artifacts with optional filters
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sort: z.enum(["name", "year"]).default("name"),
        order: z.enum(["asc", "desc"]).default("asc"),
        creator: z.string().optional(),
        location: z.string().optional(),
        medium: z.string().optional(),
        era: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      let artifacts = ctx.graph.getNodesByType<ArtifactNode>("artifact");

      // Filter by creator
      if (input?.creator) {
        artifacts = artifacts.filter(a => a.creator === input.creator);
      }

      // Filter by location
      if (input?.location) {
        artifacts = artifacts.filter(a => a.location === input.location);
      }

      // Filter by medium
      if (input?.medium) {
        artifacts = artifacts.filter(a => a.medium === input.medium);
      }

      // Filter by era
      if (input?.era) {
        artifacts = artifacts.filter(a => a.era === input.era);
      }

      // Filter by tags
      if (input?.tags?.length) {
        artifacts = artifacts.filter(a =>
          input.tags!.some(tag => a.tags.includes(tag))
        );
      }

      // Sort
      const sortKey = input?.sort || "name";
      const sortOrder = input?.order === "desc" ? -1 : 1;

      artifacts.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortKey) {
          case "year":
            aVal = a.year ?? Infinity;
            bVal = b.year ?? Infinity;
            break;
          default:
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
        }

        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });

      const total = artifacts.length;
      const offset = input?.offset || 0;
      const limit = input?.limit || 50;

      return {
        artifacts: artifacts.slice(offset, offset + limit),
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get a single artifact by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const artifact = ctx.graph.getNode(input.id);

      if (!artifact || artifact.type !== "artifact") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Artifact not found: ${input.id}`,
        });
      }

      return artifact as ArtifactNode;
    }),

  // Get artifact with related content
  getWithRelations: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      const artifact = ctx.graph.getNode(input.id);

      if (!artifact || artifact.type !== "artifact") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Artifact not found: ${input.id}`,
        });
      }

      const art = artifact as ArtifactNode;

      // Get creator
      const creator = art.creator
        ? ctx.graph.getNode(art.creator)
        : undefined;

      // Get location
      const location = art.location
        ? ctx.graph.getNode(art.location)
        : undefined;

      // Get era/time period
      const era = art.era
        ? ctx.graph.getNode(art.era)
        : undefined;

      const backlinks = ctx.graph.getBacklinks(input.id);

      return {
        artifact: art,
        creator,
        location,
        era,
        backlinks,
      };
    }),

  // Search artifacts
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      await ctx.graph.initialize();

      return ctx.graph.search(input.query, { types: ["artifact"] });
    }),

  // Get constants for UI
  getConstants: publicProcedure.query(() => ({
    mediums: MEDIUMS,
  })),

  // Get all artifacts grouped by medium (for 2D scroll)
  getGroupedByMedium: publicProcedure.query(async ({ ctx }) => {
    await ctx.graph.initialize();

    const artifacts = ctx.graph.getNodesByType<ArtifactNode>("artifact");

    // Group by medium
    const grouped: Record<string, ArtifactNode[]> = {};

    for (const medium of MEDIUMS) {
      grouped[medium.id] = [];
    }

    for (const art of artifacts) {
      const medium = art.medium || "other";
      if (grouped[medium]) {
        grouped[medium].push(art);
      } else {
        grouped["other"].push(art);
      }
    }

    // Sort artifacts within each medium by year, then name
    for (const medium of MEDIUMS) {
      grouped[medium.id].sort((a, b) => {
        // Sort by year first (oldest first), then by name
        const yearA = a.year ?? Infinity;
        const yearB = b.year ?? Infinity;
        if (yearA !== yearB) return yearA - yearB;
        return a.name.localeCompare(b.name);
      });
    }

    // Filter out empty mediums for the response
    const activeMedias = MEDIUMS.filter(m => grouped[m.id].length > 0);

    return {
      mediums: activeMedias,
      grouped,
      total: artifacts.length,
    };
  }),
});
