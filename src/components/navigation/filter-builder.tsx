"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  hasUsableFilterRuleValue,
  type FilterFieldDefinition,
  type FilterFieldType,
  type FilterOperator,
  type FilterRule,
} from "@/lib/filter-rules";
import { Filter, Plus, RotateCcw, X } from "lucide-react";

interface FilterBuilderProps<T> {
  title?: string;
  fields: FilterFieldDefinition<T>[];
  rules: FilterRule[];
  onRulesChange: (rules: FilterRule[]) => void;
  className?: string;
}

const operatorsByType: Record<FilterFieldType, Array<{ value: FilterOperator; label: string }>> = {
  text: [
    { value: "contains", label: "contains" },
    { value: "starts_with", label: "starts with" },
    { value: "equals", label: "equals" },
  ],
  number: [
    { value: "equals", label: "=" },
    { value: "gte", label: ">=" },
    { value: "lte", label: "<=" },
    { value: "between", label: "between" },
    { value: "gt", label: ">" },
    { value: "lt", label: "<" },
  ],
  tags: [
    { value: "includes", label: "includes tag" },
    { value: "equals", label: "exact tag" },
  ],
  interval: [{ value: "overlaps", label: "overlaps interval" }],
};

function getDefaultOperator(type: FilterFieldType): FilterOperator {
  return operatorsByType[type][0].value;
}

function getNewRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function FilterBuilder<T>({
  title = "Filters",
  fields,
  rules,
  onRulesChange,
  className,
}: FilterBuilderProps<T>) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [draftRules, setDraftRules] = React.useState<FilterRule[]>(rules);

  if (fields.length === 0) return null;

  const fieldMap = React.useMemo(
    () => new Map(fields.map((field) => [field.key, field])),
    [fields],
  );
  const activeRuleCount = rules.filter((rule) =>
    hasUsableFilterRuleValue(rule, fieldMap.get(rule.fieldKey)?.type),
  ).length;

  const sanitizeDraftRules = React.useCallback(
    (nextRules: FilterRule[]) => nextRules.filter((rule) => fieldMap.has(rule.fieldKey)),
    [fieldMap],
  );

  React.useEffect(() => {
    if (!isOpen) {
      setDraftRules(sanitizeDraftRules(rules));
    }
  }, [isOpen, rules, sanitizeDraftRules]);

  const openPanel = () => {
    setDraftRules(sanitizeDraftRules(rules));
    setIsOpen(true);
  };

  const closePanel = () => {
    setDraftRules(sanitizeDraftRules(rules));
    setIsOpen(false);
  };

  const applyDraft = () => {
    const activeRules = draftRules.filter((rule) => {
      const fieldDef = fieldMap.get(rule.fieldKey);
      if (!fieldDef) return false;
      return hasUsableFilterRuleValue(rule, fieldDef.type);
    });

    onRulesChange(activeRules);
    setIsOpen(false);
  };

  const handleValueKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    applyDraft();
  };

  const addRule = () => {
    const defaultField = fields[0];
    setDraftRules((currentRules) => [
      ...currentRules,
      {
        id: getNewRuleId(),
        fieldKey: defaultField.key,
        operator: getDefaultOperator(defaultField.type),
        value: "",
        valueTo: "",
      },
    ]);
  };

  const updateRule = (id: string | undefined, patch: Partial<FilterRule>) => {
    setDraftRules((currentRules) =>
      currentRules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  };

  const removeRule = (id: string | undefined) => {
    setDraftRules((currentRules) => currentRules.filter((rule) => rule.id !== id));
  };

  const clearDraftRules = () => setDraftRules([]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      closePanel();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className={cn("absolute right-4 top-3 z-30 w-[min(460px,calc(100vw-2rem))]", className)}
    >
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="bg-background/90 backdrop-blur-sm"
          onClick={() => (isOpen ? closePanel() : openPanel())}
        >
          <Filter className="h-3.5 w-3.5" />
          {title}
          {activeRuleCount > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
              {activeRuleCount}
            </span>
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-2 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm">
          <p className="mb-2 text-xs text-muted-foreground">
            Add filters below. All active filters must match. Press Enter to apply.
          </p>

          {draftRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No filters yet.</p>
          ) : (
            <div className="space-y-2">
              {draftRules.map((rule, index) => {
                const fieldDef = fieldMap.get(rule.fieldKey) ?? fields[0];
                const operators = operatorsByType[fieldDef.type];
                const needsRange = fieldDef.type === "interval" || rule.operator === "between";
                const inputType =
                  fieldDef.type === "number" || fieldDef.type === "interval" ? "number" : "text";
                const stableId = rule.id ?? `rule-${index}`;

                return (
                  <div
                    key={stableId}
                    className="rounded-md border border-border/70 bg-background/60 p-2.5"
                  >
                    <div className="mb-2 flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Remove filter ${index + 1}`}
                        onClick={() => removeRule(rule.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-muted-foreground">
                          Field
                        </label>
                        <select
                          value={rule.fieldKey}
                          onChange={(e) => {
                            const nextField =
                              fields.find((field) => field.key === e.target.value) ?? fields[0];
                            updateRule(rule.id, {
                              fieldKey: nextField.key,
                              operator: getDefaultOperator(nextField.type),
                              value: "",
                              valueTo: "",
                            });
                          }}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                          {fields.map((field) => (
                            <option key={field.key} value={field.key}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] text-muted-foreground">
                          Match
                        </label>
                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            updateRule(rule.id, { operator: e.target.value as FilterOperator })
                          }
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                          {operators.map((operator) => (
                            <option key={operator.value} value={operator.value}>
                              {operator.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div
                      className={cn("mt-2 grid gap-2", needsRange ? "grid-cols-2" : "grid-cols-1")}
                    >
                      <Input
                        type={inputType}
                        value={rule.value}
                        placeholder={fieldDef.placeholder ?? "Value"}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        onKeyDown={handleValueKeyDown}
                        className="h-8 text-sm"
                      />
                      {needsRange && (
                        <Input
                          type={inputType}
                          value={rule.valueTo || ""}
                          placeholder={fieldDef.type === "interval" ? "End year" : "And"}
                          onChange={(e) => updateRule(rule.id, { valueTo: e.target.value })}
                          onKeyDown={handleValueKeyDown}
                          className="h-8 text-sm"
                        />
                      )}
                    </div>

                    {needsRange && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Uses inclusive bounds.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full border-dashed text-sm"
            onClick={addRule}
          >
            <Plus className="h-3.5 w-3.5" />
            Add filter
          </Button>

          <div className="mt-3 flex items-center justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={clearDraftRules}>
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={closePanel}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={applyDraft}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { FilterRule };
