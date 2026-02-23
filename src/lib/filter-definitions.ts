import type { ArtifactNode, FigureNode, IdeaNode, LocationNode, TimeNode } from "@/lib/graph";
import type { FilterFieldDefinition } from "@/lib/filter-rules";

export const figureFilterFields: FilterFieldDefinition<FigureNode>[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    getValue: (figure) => figure.name,
    placeholder: "Aristotle",
  },
  {
    key: "tags",
    label: "Tags",
    type: "tags",
    getValue: (figure) => figure.tags,
    placeholder: "ethics",
  },
  {
    key: "nationality",
    label: "Nationality",
    type: "text",
    getValue: (figure) => figure.nationality ?? "",
    placeholder: "Greek",
  },
  {
    key: "lifespan",
    label: "Lifespan",
    type: "interval",
    getValue: (figure) => ({
      start: figure.birth,
      end: figure.death ?? new Date().getFullYear(),
    }),
  },
];

export const timeFilterFields: FilterFieldDefinition<TimeNode>[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    getValue: (time) => time.name,
    placeholder: "Renaissance",
  },
  {
    key: "tags",
    label: "Tags",
    type: "tags",
    getValue: (time) => time.tags,
    placeholder: "modernity",
  },
  {
    key: "start",
    label: "Start Year",
    type: "number",
    getValue: (time) => time.start,
    placeholder: "-500",
  },
  {
    key: "period",
    label: "Time Interval",
    type: "interval",
    getValue: (time) => ({ start: time.start, end: time.end ?? new Date().getFullYear() }),
  },
];

export const locationFilterFields: FilterFieldDefinition<LocationNode>[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    getValue: (location) => location.name,
    placeholder: "Athens",
  },
  {
    key: "tags",
    label: "Tags",
    type: "tags",
    getValue: (location) => location.tags,
    placeholder: "city-state",
  },
  {
    key: "country",
    label: "Country",
    type: "text",
    getValue: (location) => location.country ?? "",
    placeholder: "Greece",
  },
];

export const artifactFilterFields: FilterFieldDefinition<ArtifactNode>[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    getValue: (artifact) => artifact.name,
    placeholder: "Rosetta Stone",
  },
  {
    key: "tags",
    label: "Tags",
    type: "tags",
    getValue: (artifact) => artifact.tags,
    placeholder: "ancient",
  },
  {
    key: "medium",
    label: "Medium",
    type: "text",
    getValue: (artifact) => artifact.medium ?? "other",
    placeholder: "manuscript",
  },
  {
    key: "year",
    label: "Year",
    type: "number",
    getValue: (artifact) => artifact.year,
    placeholder: "-500",
  },
  {
    key: "period",
    label: "Time Interval",
    type: "interval",
    getValue: (artifact) =>
      artifact.year !== undefined ? { start: artifact.year, end: artifact.year } : undefined,
  },
];

export const ideaFilterFields: FilterFieldDefinition<IdeaNode>[] = [
  {
    key: "title",
    label: "Title",
    type: "text",
    getValue: (idea) => idea.title,
    placeholder: "virtue",
  },
  {
    key: "tags",
    label: "Tags",
    type: "tags",
    getValue: (idea) => idea.tags,
    placeholder: "ethics",
  },
  {
    key: "year",
    label: "Year",
    type: "number",
    getValue: (idea) => idea.year,
    placeholder: "-300",
  },
  {
    key: "period",
    label: "Time Interval",
    type: "interval",
    getValue: (idea) =>
      idea.year !== undefined ? { start: idea.year, end: idea.year } : undefined,
  },
];
