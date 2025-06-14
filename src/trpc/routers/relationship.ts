import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";

export const relationshipRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      sourceIdeaId: z.string(),
      targetIdeaId: z.string(),
      type: z.enum(["influences", "contradicts", "synthesizes", "builds_upon", "refutes"]),
      description: z.string().optional(),
      strength: z.number().min(1).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ideaRelationship.create({
        data: {
          sourceIdeaId: input.sourceIdeaId,
          targetIdeaId: input.targetIdeaId,
          type: input.type,
          description: input.description,
        },
        include: {
          sourceIdea: {
            include: {
              author: true,
            },
          },
          targetIdea: {
            include: {
              author: true,
            },
          },
        },
      });
    }),

  list: publicProcedure
    .input(z.object({
      ideaId: z.string().optional(),
      type: z.enum(["influences", "contradicts", "synthesizes", "builds_upon", "refutes"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ideaRelationship.findMany({
        where: {
          ...(input.ideaId && {
            OR: [
              { sourceIdeaId: input.ideaId },
              { targetIdeaId: input.ideaId },
            ],
          }),
          ...(input.type && { type: input.type }),
        },
        include: {
          sourceIdea: {
            include: {
              author: true,
            },
          },
          targetIdea: {
            include: {
              author: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ideaRelationship.delete({
        where: {
          id: input.id,
        },
      });
    }),

  dialecticalChain: publicProcedure
    .input(z.object({
      ideaId: z.string(),
      depth: z.number().min(1).max(5).optional().default(3),
    }))
    .query(async ({ ctx, input }) => {
      // Find dialectical chains starting from this idea
      const relationships = await ctx.db.ideaRelationship.findMany({
        where: {
          sourceIdeaId: input.ideaId,
          type: {
            in: ["synthesizes", "contradicts", "influences"],
          },
        },
        include: {
          sourceIdea: {
            include: {
              author: true,
            },
          },
          targetIdea: {
            include: {
              author: true,
              outgoingRelations: {
                where: {
                  type: {
                    in: ["synthesizes", "contradicts", "influences"],
                  },
                },
                include: {
                  targetIdea: {
                    include: {
                      author: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return relationships;
    }),
});