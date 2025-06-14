import { createCallerFactory, createTRPCRouter } from "@/trpc";
import { authorRouter } from "@/trpc/routers/author";
import { ideaRouter } from "@/trpc/routers/idea";
import { tagRouter } from "@/trpc/routers/tag";
import { relationshipRouter } from "@/trpc/routers/relationship";
import { periodRouter } from "@/trpc/routers/period";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  author: authorRouter,
  idea: ideaRouter,
  tag: tagRouter,
  relationship: relationshipRouter,
  period: periodRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);