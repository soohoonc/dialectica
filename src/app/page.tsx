import { caller } from "@/trpc/server";

export default async function Home() {
  const ideas = await caller.idea.timeline({
    limit: 20,
  });

  return (
    <div>
      <h1>Dialectical Timeline of Human Thought</h1>

      {ideas?.map((idea) => (
        <div key={idea.id}>
          <div>
            <span>{idea.year || "Unknown"}</span>
            <span>{idea.author.name}</span>
          </div>

          <h3>{idea.title}</h3>

          {idea.description && <p>{idea.description}</p>}

          {idea.period && (
            <div>Period: {idea.period.name}</div>
          )}

          {idea.outgoingRelations.length > 0 && (
            <div>
              <h4>Influences:</h4>
              {idea.outgoingRelations.map((relation) => (
                <div key={relation.id}>
                  <strong>{relation.type}</strong>{" "}
                  "{relation.targetIdea.title}" by {relation.targetIdea.author.name}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}