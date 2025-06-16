import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";

export const authorRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      birth: z.string().optional(),
      death: z.string().optional(),
      nationality: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.author.create({
        data: {
          name: input.name,
          birth: input.birth,
          death: input.death,
          nationality: input.nationality,
        },
      });
    }),

  get: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.author.findUnique({
        where: {
          id: input.id,
        },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      birth: z.string().optional(),
      death: z.string().optional(),
      nationality: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.author.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          birth: input.birth,
          death: input.death,
          nationality: input.nationality,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.author.delete({
        where: {
          id: input.id,
        },
      });
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.author.findMany({
        orderBy: {
          name: "asc",
        },
      });
    }),
});