"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/trpc/client";

interface SearchInputProps {
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
  showShortcutHint?: boolean;
  searchType?: "figure" | "time" | "location" | "idea" | "artifact" | "page";
  constrainWidth?: boolean;
  fixedWidth?: boolean;
}

const typePrefix: Record<string, string> = {
  figure: "f",
  time: "t",
  location: "l",
  idea: "i",
  artifact: "a",
  page: "p",
};

const typeLabel: Record<string, string> = {
  figure: "Figure",
  time: "Time",
  location: "Location",
  idea: "Idea",
  artifact: "Artifact",
  page: "Page",
};

export function SearchInput({ placeholder, className = "", autoFocus = true, showShortcutHint = false, searchType, constrainWidth = false, fixedWidth = false }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();

  const { data } = trpc.search.suggest.useQuery(
    { query, limit: 8, type: searchType },
    { enabled: query.length > 0, placeholderData: (prev) => prev }
  );

  const displayText = query || placeholder;
  const showResults = query.length > 0 && data && data.length > 0 && isFocused;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Global keyboard shortcut: Option+L to focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "l") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Measure text width from hidden span (skip for fixedWidth)
  useLayoutEffect(() => {
    if (fixedWidth) return;
    if (measureRef.current) {
      const width = measureRef.current.offsetWidth;
      setInputWidth(width + 2); // Add small buffer for cursor
    }
  }, [displayText, fixedWidth]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && data?.length) {
      const first = data[0];
      router.push(`/${typePrefix[first.type]}/${first.slug}`);
      setQuery("");
    }
    if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative flex items-center gap-3 ${fixedWidth ? "w-full" : ""} ${className}`} style={constrainWidth ? { maxWidth: "25vw" } : undefined}>
      {/* Hidden span to measure text width */}
      <span
        ref={measureRef}
        className="invisible absolute whitespace-pre"
        style={{ font: "inherit" }}
        aria-hidden="true"
      >
        {displayText}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`bg-transparent border-none outline-none placeholder:text-foreground text-foreground caret-primary min-w-0 ${fixedWidth ? "w-full" : ""}`}
        style={{ font: "inherit", width: fixedWidth ? "100%" : (inputWidth ? `${inputWidth}px` : "auto") }}
      />

      {showShortcutHint && !isFocused && !query && (
        <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">
          ⌥L
        </kbd>
      )}

      {showResults && (
        <div className={`absolute top-full mt-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 text-base font-normal ${fixedWidth ? "left-0 right-0" : "left-0 w-72"}`}>
          {data.map((result) => (
            <Link
              key={result.id}
              href={`/${typePrefix[result.type]}/${result.slug}`}
              onClick={() => setQuery("")}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
            >
              <span className="font-medium truncate">{result.title}</span>
              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{typeLabel[result.type]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
