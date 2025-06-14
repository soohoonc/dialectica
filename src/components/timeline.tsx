"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RouterOutput } from "@/trpc/client";

type TimelineIdea = RouterOutput["idea"]["timeline"][number];

function formatYear(year?: number | null): string {
  if (!year) return "Unknown";
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

interface TimelineProps {
  ideas: TimelineIdea[];
}

export function Timeline({ ideas }: TimelineProps) {
  const sortedIdeas = [...ideas].sort((a, b) => {
    const yearA = a.year || 0;
    const yearB = b.year || 0;
    return yearA - yearB;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="text-center gap-2">
        <h1 className="text-4xl font-bold">
          Dialectical Timeline of Human Thought
        </h1>
        <p className="text-muted-foreground">
          Explore the evolution of philosophical ideas through history
        </p>
      </div>
      <div className="space-y-4">
        {sortedIdeas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </div>
  );
}

interface IdeaCardProps {
  idea: TimelineIdea;
}

function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <div className="relative">
      <Card className="p-4 gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{formatYear(idea.year)}</Badge>
          {idea.period && <Badge variant="secondary">{idea.period.name}</Badge>}
        </div>

        <CardTitle className="text-xl">{idea.title}</CardTitle>

        <CardDescription>
          by <span className="font-medium">{idea.author.name}</span>
          {idea.author.nationality && <span> ({idea.author.nationality})</span>}
        </CardDescription>

        {idea.description && (
          <p className="text-muted-foreground line-clamp-2">
            {idea.description}
          </p>
        )}
        {/* 
        {(idea.tags?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-1">
            {idea.tags.slice(0, 3).map((ideaTag, tagIndex) => (
              <Badge key={tagIndex} variant="outline" className="text-xs">
                {ideaTag.tag.name}
              </Badge>
            ))}
            {idea.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{idea.tags.length - 3} more
              </Badge>
            )}
          </div>
        )} */}
        {/* 
        <RelationshipBadges
          outgoingRelations={idea.outgoingRelations}
          incomingRelations={idea.incomingRelations}
        /> */}
      </Card>
    </div>
  );
}