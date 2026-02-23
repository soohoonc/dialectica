export type FilterFieldType = "text" | "number" | "tags" | "interval";

export type FilterOperator =
  | "contains"
  | "equals"
  | "starts_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "includes"
  | "overlaps";

export interface IntervalValue {
  start?: number;
  end?: number;
}

export interface FilterFieldDefinition<T> {
  key: string;
  label: string;
  type: FilterFieldType;
  getValue: (item: T) => string | number | string[] | IntervalValue | undefined | null;
  placeholder?: string;
}

export interface FilterRule {
  id?: string;
  fieldKey: string;
  operator: FilterOperator;
  value: string;
  valueTo?: string;
}

export function hasUsableFilterRuleValue(rule: FilterRule, fieldType?: FilterFieldType): boolean {
  if (fieldType === "interval" || rule.operator === "between") {
    return rule.value.trim().length > 0 && (rule.valueTo || "").trim().length > 0;
  }
  return rule.value.trim().length > 0;
}

function normalizedText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function parseNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesRule<T>(item: T, rule: FilterRule, fieldDef: FilterFieldDefinition<T>): boolean {
  const fieldValue = fieldDef.getValue(item);
  const query = rule.value.trim();

  if (fieldDef.type === "text") {
    const haystack = normalizedText(fieldValue);
    const needle = normalizedText(query);
    if (!needle) return true;

    switch (rule.operator) {
      case "equals":
        return haystack === needle;
      case "starts_with":
        return haystack.startsWith(needle);
      case "contains":
      default:
        return haystack.includes(needle);
    }
  }

  if (fieldDef.type === "tags") {
    const tags = Array.isArray(fieldValue) ? fieldValue.map((t) => normalizedText(t)) : [];
    const needle = normalizedText(query);
    if (!needle) return true;

    if (rule.operator === "equals") {
      return tags.some((tag) => tag === needle);
    }

    return tags.some((tag) => tag.includes(needle));
  }

  if (fieldDef.type === "number") {
    const numericValue = typeof fieldValue === "number" ? fieldValue : parseNumber(String(fieldValue));
    if (numericValue == null) return false;

    const a = parseNumber(rule.value);
    if (a == null) return true;

    if (rule.operator === "between") {
      const b = parseNumber(rule.valueTo || "");
      if (b == null) return true;
      const low = Math.min(a, b);
      const high = Math.max(a, b);
      return numericValue >= low && numericValue <= high;
    }

    switch (rule.operator) {
      case "equals":
        return numericValue === a;
      case "gt":
        return numericValue > a;
      case "gte":
        return numericValue >= a;
      case "lt":
        return numericValue < a;
      case "lte":
        return numericValue <= a;
      default:
        return true;
    }
  }

  if (fieldDef.type === "interval") {
    const interval = (fieldValue as IntervalValue | undefined) || {};
    const queryStart = parseNumber(rule.value);
    const queryEnd = parseNumber(rule.valueTo || "");
    if (queryStart == null || queryEnd == null) return true;

    const currentYear = new Date().getFullYear();
    const itemStart = interval.start;
    const itemEnd = interval.end ?? currentYear;
    if (itemStart == null) return false;

    const low = Math.min(queryStart, queryEnd);
    const high = Math.max(queryStart, queryEnd);
    return itemStart <= high && itemEnd >= low;
  }

  return true;
}

export function applyFilterRules<T>(
  items: T[],
  fields: FilterFieldDefinition<T>[],
  rules: FilterRule[] = [],
): T[] {
  if (rules.length === 0 || fields.length === 0) return items;

  const fieldMap = new Map(fields.map((field) => [field.key, field]));
  const activeRules = rules.filter((rule) =>
    hasUsableFilterRuleValue(rule, fieldMap.get(rule.fieldKey)?.type),
  );

  if (activeRules.length === 0) return items;

  return items.filter((item) =>
    activeRules.every((rule) => {
      const fieldDef = fieldMap.get(rule.fieldKey);
      if (!fieldDef) return true;
      return matchesRule(item, rule, fieldDef);
    }),
  );
}
