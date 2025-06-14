import { caller } from "@/trpc/server";
import { Timeline } from "@/components/timeline";

export default async function Home() {
  const ideas = await caller.idea.timeline({
    limit: 50,
  });

  return <Timeline ideas={ideas || []} />;
}