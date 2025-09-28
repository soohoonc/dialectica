"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatYear(year?: number | null): string {
  if (!year) return "Unknown";
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export function Timeline({ ideas }: any) {
  const sortedIdeas = [...ideas].sort((a, b) => {
    const yearA = a.year || 0;
    const yearB = b.year || 0;
    return yearA - yearB;
  });

  return (
    <div className="space-y-4">
      {sortedIdeas.map((idea) => (
        <Card key={idea.id} className="hover:shadow-lg transition-shadow">
          <div className="relative">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{formatYear(idea.year)}</Badge>
              {idea.period && <Badge variant="secondary">{idea.period.name}</Badge>}
            </div>

            <CardTitle className="text-xl">{idea.title}</CardTitle>

            <CardDescription>
              by <span className="font-medium">{idea.author.name}</span>
            </CardDescription>

            {idea.description && (
              <p className="text-muted-foreground line-clamp-2">
                {idea.description}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
