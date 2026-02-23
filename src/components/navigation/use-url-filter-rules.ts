"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FilterRule } from "@/lib/filter-rules";

interface UseUrlFilterRulesOptions {
  queryKey?: string;
  validFieldKeys?: string[];
}

const validOperators = new Set<FilterRule["operator"]>([
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
]);

function hasUsableSerializedValue(rule: FilterRule): boolean {
  const value = rule.value.trim();
  if (!value) return false;
  if (rule.operator === "between" || rule.operator === "overlaps") {
    return (rule.valueTo ?? "").trim().length > 0;
  }
  return true;
}

function sanitizeRules(raw: unknown, validFieldKeySet?: Set<string>): FilterRule[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => {
      const rawOperator = typeof item.operator === "string" ? item.operator : "contains";
      const operator = validOperators.has(rawOperator as FilterRule["operator"])
        ? (rawOperator as FilterRule["operator"])
        : "contains";

      return {
        id: typeof item.id === "string" ? item.id : `rule-url-${index}`,
        fieldKey: typeof item.fieldKey === "string" ? item.fieldKey : "",
        operator,
        value: typeof item.value === "string" ? item.value : "",
        valueTo: typeof item.valueTo === "string" ? item.valueTo : undefined,
      };
    })
    .filter((rule) => rule.fieldKey.length > 0)
    .filter((rule) => !validFieldKeySet || validFieldKeySet.has(rule.fieldKey))
    .filter(hasUsableSerializedValue);
}

function serializeRules(rules: FilterRule[], validFieldKeySet?: Set<string>): string {
  const sanitized = sanitizeRules(rules, validFieldKeySet);
  if (sanitized.length === 0) return "";
  return JSON.stringify(sanitized);
}

export function useUrlFilterRules(options: UseUrlFilterRulesOptions = {}) {
  const queryKey = options.queryKey ?? "filters";
  const validFieldKeySet = useMemo(
    () =>
      options.validFieldKeys && options.validFieldKeys.length > 0
        ? new Set(options.validFieldKeys)
        : undefined,
    [options.validFieldKeys],
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const rules = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    const raw = params.get(queryKey);
    if (!raw) return [];

    try {
      return sanitizeRules(JSON.parse(raw), validFieldKeySet);
    } catch {
      return [];
    }
  }, [queryKey, searchParamsString, validFieldKeySet]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const raw = params.get(queryKey);
    if (!raw) return;

    let canonicalSerialized = "";
    try {
      canonicalSerialized = serializeRules(JSON.parse(raw), validFieldKeySet);
    } catch {
      canonicalSerialized = "";
    }

    if (raw === canonicalSerialized) return;

    if (canonicalSerialized.length === 0) {
      params.delete(queryKey);
    } else {
      params.set(queryKey, canonicalSerialized);
    }

    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  }, [pathname, queryKey, router, searchParamsString, validFieldKeySet]);

  const setRules = useCallback(
    (nextRules: FilterRule[]) => {
      const params = new URLSearchParams(searchParamsString);
      const currentRaw = params.get(queryKey);
      let currentSerialized = "";

      if (currentRaw) {
        try {
          currentSerialized = serializeRules(JSON.parse(currentRaw), validFieldKeySet);
        } catch {
          currentSerialized = "";
        }
      }

      const nextSerialized = serializeRules(nextRules, validFieldKeySet);
      if (nextSerialized === currentSerialized) return;

      if (nextSerialized.length === 0) {
        params.delete(queryKey);
      } else {
        params.set(queryKey, nextSerialized);
      }

      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    },
    [pathname, queryKey, router, searchParamsString, validFieldKeySet],
  );

  return { rules, setRules };
}
