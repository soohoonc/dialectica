"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TimeNode {
  id: string;
  slug: string;
  name: string;
  start: number;
  end?: number;
  parent?: string;
}

interface TimelineProps {
  times: TimeNode[];
}

interface HoverPreview {
  time: TimeNode;
  periodEnd: number;
  x: number;
  y: number;
}

// Human history bounds
const HISTORY_START = -3000; // 3000 BCE
const HISTORY_END = new Date().getFullYear();
const CURRENT_YEAR = HISTORY_END;

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year}`;
}

function formatDuration(start: number, end: number): string {
  const years = Math.max(1, end - start);
  if (years >= 1000) {
    const millennia = years / 1000;
    return `${millennia % 1 === 0 ? millennia.toFixed(0) : millennia.toFixed(1)}k years`;
  }
  return `${years} years`;
}

export function Timeline({ times }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  // Start with a view that shows recorded history
  const [viewStart, setViewStart] = useState(-1000);
  const [viewEnd, setViewEnd] = useState(2025);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);

  // Track container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setHoverPreview(null);
    setHoveredPeriod(null);
  }, [viewStart, viewEnd]);

  // Handle wheel with non-passive listener to prevent browser zoom
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const range = viewEnd - viewStart;

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        const newRange = Math.max(50, Math.min(historyRange, range * zoomFactor));
        const center = (viewStart + viewEnd) / 2;
        let newStart = center - newRange / 2;
        let newEnd = center + newRange / 2;
        if (newStart < HISTORY_START) {
          newStart = HISTORY_START;
          newEnd = HISTORY_START + newRange;
        }
        if (newEnd > HISTORY_END) {
          newEnd = HISTORY_END;
          newStart = HISTORY_END - newRange;
        }
        setViewStart(newStart);
        setViewEnd(newEnd);
      } else {
        // Pan
        const panAmount = (e.deltaX + e.deltaY) * (range / containerWidth) * 2;
        let newStart = viewStart + panAmount;
        let newEnd = viewEnd + panAmount;
        if (newStart < HISTORY_START) {
          newStart = HISTORY_START;
          newEnd = HISTORY_START + range;
        }
        if (newEnd > HISTORY_END) {
          newEnd = HISTORY_END;
          newStart = HISTORY_END - range;
        }
        setViewStart(newStart);
        setViewEnd(newEnd);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [viewStart, viewEnd, containerWidth]);

  // Sort periods by start time, then by duration (longer first)
  const sortedTimes = [...times].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const aDuration = (a.end ?? CURRENT_YEAR) - a.start;
    const bDuration = (b.end ?? CURRENT_YEAR) - b.start;
    return bDuration - aDuration;
  });

  // Assign rows (swimlanes) to avoid overlap
  const assignRows = useCallback(() => {
    const rows: { end: number }[] = [];
    const assignments = new Map<string, number>();

    for (const time of sortedTimes) {
      const periodEnd = time.end ?? CURRENT_YEAR;
      let assignedRow = -1;

      // Find first row where this period fits
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].end < time.start - 50) {
          assignedRow = i;
          rows[i].end = periodEnd;
          break;
        }
      }

      // Create new row if needed
      if (assignedRow === -1) {
        assignedRow = rows.length;
        rows.push({ end: periodEnd });
      }

      assignments.set(time.id, assignedRow);
    }

    return { assignments, rowCount: rows.length };
  }, [sortedTimes]);

  const { assignments, rowCount } = assignRows();

  // Conversion helpers for main view
  const yearToX = (year: number): number => {
    const range = viewEnd - viewStart;
    return ((year - viewStart) / range) * containerWidth;
  };

  // Conversion helpers for minimap
  const historyRange = HISTORY_END - HISTORY_START;
  const minimapYearToX = (year: number): number => {
    return ((year - HISTORY_START) / historyRange) * containerWidth;
  };

  // Handle minimap click to navigate
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedYear = HISTORY_START + (x / containerWidth) * historyRange;
    const viewRange = viewEnd - viewStart;
    setViewStart(clickedYear - viewRange / 2);
    setViewEnd(clickedYear + viewRange / 2);
  };

  const ROW_HEIGHT = 40;
  const mainHeight = Math.max(400, rowCount * ROW_HEIGHT + 80);

  return (
    <div ref={containerRef} className="h-full min-h-0 w-full flex flex-col bg-background">
      {/* Main timeline view */}
      <div
        ref={mainRef}
        className="min-h-0 flex-1 relative overflow-hidden"
        style={{ minHeight: mainHeight }}
      >
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {(() => {
            const range = viewEnd - viewStart;
            let interval: number;
            let majorInterval: number;
            if (range > 2000) {
              interval = 500;
              majorInterval = 1000;
            } else if (range > 1000) {
              interval = 200;
              majorInterval = 500;
            } else if (range > 500) {
              interval = 100;
              majorInterval = 500;
            } else if (range > 200) {
              interval = 50;
              majorInterval = 100;
            } else if (range > 100) {
              interval = 20;
              majorInterval = 100;
            } else if (range > 50) {
              interval = 10;
              majorInterval = 50;
            } else {
              interval = 5;
              majorInterval = 10;
            }

            const startYear = Math.ceil(viewStart / interval) * interval;
            const lines = [];
            for (let year = startYear; year <= viewEnd; year += interval) {
              const x = yearToX(year);
              if (x >= 0 && x <= containerWidth) {
                const isMajor = year % majorInterval === 0;
                lines.push(
                  <line
                    key={year}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2="100%"
                    stroke="var(--border)"
                    strokeWidth={1}
                    strokeDasharray={isMajor ? "" : "2,4"}
                    opacity={isMajor ? 0.5 : 0.2}
                  />,
                );
              }
            }
            return lines;
          })()}
        </svg>

        {/* Year labels above minimap */}
        <div className="absolute bottom-6 left-0 right-0 pointer-events-none">
          {(() => {
            const range = viewEnd - viewStart;
            // Choose interval based on zoom level
            let interval: number;
            if (range > 2000) interval = 500;
            else if (range > 1000) interval = 200;
            else if (range > 500) interval = 100;
            else if (range > 200) interval = 50;
            else if (range > 100) interval = 20;
            else if (range > 50) interval = 10;
            else interval = 5;

            const startYear = Math.ceil(viewStart / interval) * interval;
            const labels = [];
            for (let year = startYear; year <= viewEnd; year += interval) {
              const x = yearToX(year);
              if (x >= 0 && x <= containerWidth) {
                labels.push(
                  <span
                    key={year}
                    className="absolute text-[11px] text-muted-foreground/70"
                    style={{ left: x + 4 }}
                  >
                    {formatYear(year)}
                  </span>,
                );
              }
            }
            return labels;
          })()}
        </div>

        {/* Period bars - positioned from top */}
        <div
          className="absolute left-0 right-0 top-0"
          style={{ height: rowCount * ROW_HEIGHT + 16 }}
        >
          {sortedTimes.map((time) => {
            const periodEnd = time.end ?? CURRENT_YEAR;
            const x = yearToX(time.start);
            const width = yearToX(periodEnd) - x;
            const row = assignments.get(time.id) ?? 0;
            const y = row * ROW_HEIGHT + 8;
            const barWidth = Math.max(72, width);
            const left = Math.max(0, x);
            const right = Math.min(containerWidth, x + barWidth);
            const visibleWidth = right - left;
            const showDateRange = visibleWidth >= 190;

            // Skip if completely outside view
            if (x + width < 0 || x > containerWidth) return null;
            if (visibleWidth <= 20) return null;

            const isHovered = hoveredPeriod === time.id;

            return (
              <Link
                key={time.id}
                href={`/t/${time.slug}`}
                title={`${time.name} (${formatYear(time.start)} - ${formatYear(periodEnd)})`}
                className={`absolute h-8 rounded-md flex items-center gap-1.5 px-2 overflow-hidden transition-all border shadow-sm ${
                  isHovered
                    ? "bg-primary/25 border-primary/40"
                    : "bg-muted/75 border-border/80 hover:bg-muted/95"
                }`}
                style={{
                  left,
                  width: visibleWidth,
                  top: y,
                }}
                onMouseEnter={(e) => {
                  const rect = mainRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setHoveredPeriod(time.id);
                  setHoverPreview({
                    time,
                    periodEnd,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseMove={(e) => {
                  const rect = mainRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setHoverPreview((prev) =>
                    prev?.time.id === time.id
                      ? {
                          ...prev,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        }
                      : prev,
                  );
                }}
                onMouseLeave={() => {
                  setHoveredPeriod(null);
                  setHoverPreview((prev) => (prev?.time.id === time.id ? null : prev));
                }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-none">
                  {time.name}
                </span>
                {showDateRange && (
                  <span className="shrink-0 truncate text-[11px] text-muted-foreground/90 leading-none">
                    {formatYear(time.start)} - {formatYear(periodEnd)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {hoverPreview && (() => {
          const PREVIEW_WIDTH = 260;
          const PREVIEW_HEIGHT = 112;
          const viewportHeight = mainRef.current?.clientHeight ?? mainHeight;

          const previewLeft = Math.min(
            Math.max(12, hoverPreview.x + 14),
            Math.max(12, containerWidth - PREVIEW_WIDTH - 12),
          );

          let previewTop = hoverPreview.y - PREVIEW_HEIGHT - 10;
          if (previewTop < 10) {
            previewTop = hoverPreview.y + 14;
          }
          previewTop = Math.min(previewTop, Math.max(10, viewportHeight - PREVIEW_HEIGHT - 8));

          const isOpenEnded = hoverPreview.time.end == null;

          return (
            <div
              className="pointer-events-none absolute z-40 w-[260px] rounded-lg border border-border/90 bg-background/95 p-3 shadow-xl backdrop-blur-sm"
              style={{ left: previewLeft, top: previewTop }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Timeline Period
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                {hoverPreview.time.name}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatYear(hoverPreview.time.start)} - {isOpenEnded ? "Present" : formatYear(hoverPreview.periodEnd)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDuration(hoverPreview.time.start, hoverPreview.periodEnd)}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Minimap - full history at bottom */}
      <div
        className="h-6 flex-shrink-0 border-t border-border relative cursor-pointer"
        onClick={handleMinimapClick}
      >
        {/* Viewport indicator */}
        <div
          className="absolute top-0 bottom-0 border-2 border-primary/60 bg-primary/10 rounded"
          style={{
            left: Math.max(0, minimapYearToX(viewStart)),
            width:
              Math.min(containerWidth, minimapYearToX(viewEnd)) -
              Math.max(0, minimapYearToX(viewStart)),
          }}
        />

        {/* Period bars in minimap */}
        {sortedTimes.map((time) => {
          const periodEnd = time.end ?? CURRENT_YEAR;
          const x = minimapYearToX(time.start);
          const width = Math.max(2, minimapYearToX(periodEnd) - x);
          const row = assignments.get(time.id) ?? 0;
          const rowHeight = 18 / Math.max(rowCount, 1);
          const y = 4 + row * rowHeight;

          return (
            <div
              key={time.id}
              className="absolute rounded-sm bg-muted-foreground/60"
              style={{
                left: x,
                width,
                top: y,
                height: Math.max(3, rowHeight - 1),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
