import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";

export const periodRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      start: z.string(),
      end: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.period.create({
        data: {
          name: input.name,
          description: input.description,
          start: input.start,
          end: input.end,
        },
      });
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.period.findMany({
        include: {
          _count: {
            select: {
              ideas: true,
            },
          },
        },
        orderBy: {
          start: "asc",
        },
      });
    }),

  get: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.period.findUnique({
        where: {
          id: input.id,
        },
        include: {
          ideas: {
            include: {
              author: true,
              tags: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: {
              year: "asc",
            },
          },
        },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.period.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description,
          start: input.start,
          end: input.end,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.period.delete({
        where: {
          id: input.id,
        },
      });
    }),
});