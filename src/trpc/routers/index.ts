import { createCallerFactory, createTRPCRouter } from "@/trpc";
import { graphRouter } from "@/trpc/routers/graph";
import { figuresRouter } from "@/trpc/routers/figures";
import { timesRouter } from "@/trpc/routers/times";
import { locationsRouter } from "@/trpc/routers/locations";
import { ideasRouter } from "@/trpc/routers/ideas";
import { artifactsRouter } from "@/trpc/routers/artifacts";
import { pagesRouter } from "@/trpc/routers/pages";
import { searchRouter } from "@/trpc/routers/search";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  graph: graphRouter,
  figures: figuresRouter,
  times: timesRouter,
  locations: locationsRouter,
  ideas: ideasRouter,
  artifacts: artifactsRouter,
  pages: pagesRouter,
  search: searchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
