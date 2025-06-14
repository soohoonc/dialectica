import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";

export const ideaRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      authorId: z.string(),
      year: z.number().optional(),
      periodId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.idea.create({
        data: {
          title: input.title,
          description: input.description,
          authorId: input.authorId,
          year: input.year,
          periodId: input.periodId,
        },
        include: {
          author: true,
          period: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    }),

  get: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.idea.findUnique({
        where: {
          id: input.id,
        },
        include: {
          author: true,
          period: true,
          tags: {
            include: {
              tag: true,
            },
          },
          outgoingRelations: {
            include: {
              targetIdea: {
                include: {
                  author: true,
                },
              },
            },
          },
          incomingRelations: {
            include: {
              sourceIdea: {
                include: {
                  author: true,
                },
              },
            },
          },
        },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      authorId: z.string().optional(),
      year: z.number().optional(),
      periodId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.idea.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
          description: input.description,
          authorId: input.authorId,
          year: input.year,
          periodId: input.periodId,
        },
        include: {
          author: true,
          period: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.idea.delete({
        where: {
          id: input.id,
        },
      });
    }),

  list: publicProcedure
    .input(z.object({
      orderBy: z.enum(["year", "created", "title"]).optional().default("year"),
      periodId: z.string().optional(),
      authorId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const orderBy = input.orderBy === "year"
        ? { year: "asc" as const }
        : input.orderBy === "title"
          ? { title: "asc" as const }
          : { createdAt: "asc" as const };

      return ctx.db.idea.findMany({
        where: {
          ...(input.periodId && { periodId: input.periodId }),
          ...(input.authorId && { authorId: input.authorId }),
        },
        include: {
          author: true,
          period: true,
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              outgoingRelations: true,
              incomingRelations: true,
            },
          },
        },
        orderBy,
      });
    }),

  timeline: publicProcedure
    .input(z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.idea.findMany({
        where: {
          year: {
            ...(input.startYear && { gte: input.startYear }),
            ...(input.endYear && { lte: input.endYear }),
          },
        },
        include: {
          author: true,
          period: true,
          outgoingRelations: {
            include: {
              targetIdea: {
                include: {
                  author: true,
                },
              },
            },
          },
        },
        orderBy: {
          year: "asc",
        },
        take: input.limit,
      });
    }),
});