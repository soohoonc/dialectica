import { caller } from "@/trpc/server";
import { Timeline } from "@/components/timeline";

export default async function Home() {
  const ideas = await caller.graph.query({
    id: 'root'
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col items-center justify-center text-center gap-4 h-screen">
        <h1 className="text-9xl font">
          Dialectica
        </h1>
      </div>
      <Timeline ideas={ideas || []} />
    </div >
  );
}