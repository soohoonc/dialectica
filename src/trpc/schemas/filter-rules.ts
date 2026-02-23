import { z } from "zod";

export const filterOperatorValues = [
  "contains",
  "equals",
  "starts_with",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "includes",
  "overlaps",
] as const;

export const filterRuleSchema = z.object({
  id: z.string().optional(),
  fieldKey: z.string().min(1),
  operator: z.enum(filterOperatorValues),
  value: z.string(),
  valueTo: z.string().optional(),
});

export const filterRulesSchema = z.array(filterRuleSchema);
