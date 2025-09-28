import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";

export const graphRouter = createTRPCRouter({
  query: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const data = await ctx.graph.query(input);
      return data
    }),
});