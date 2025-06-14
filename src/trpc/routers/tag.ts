import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";

export const tagRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.create({
        data: {
          name: input.name,
        },
      });
    }),

  get: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tag.findUnique({
        where: {
          id: input.id,
        },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      tag: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.delete({
        where: {
          id: input.id,
        },
      });
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.tag.findMany({
        orderBy: {
          name: "asc",
        },
      });
    }),
});