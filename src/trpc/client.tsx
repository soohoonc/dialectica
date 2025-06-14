import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@/trpc/routers';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;