"use client";

import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/navigation/site-header";

interface ViewsShellProps {
  children: React.ReactNode;
}

export function ViewsShell({ children }: ViewsShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!headerRef.current) return;

    const updateHeight = () => {
      if (!headerRef.current) return;
      setHeaderHeight(headerRef.current.offsetHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(headerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    let lastScrollTop = el.scrollTop;
    let rafId: number | null = null;
    let downDistance = 0;
    let upDistance = 0;

    const onScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        const currentScrollTop = el.scrollTop;
        const delta = currentScrollTop - lastScrollTop;

        if (currentScrollTop <= 8) {
          setIsHeaderHidden(false);
          downDistance = 0;
          upDistance = 0;
        } else if (delta > 0) {
          downDistance += delta;
          upDistance = 0;
          if (downDistance > 24) {
            setIsHeaderHidden(true);
            downDistance = 0;
          }
        } else if (delta < 0) {
          upDistance += -delta;
          downDistance = 0;
          if (upDistance > 32) {
            setIsHeaderHidden(false);
            upDistance = 0;
          }
        }

        lastScrollTop = currentScrollTop;
        rafId = null;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <div
        className="shrink-0 overflow-hidden transition-[height] duration-500 ease-in-out"
        style={{ height: isHeaderHidden ? 0 : (headerHeight ?? undefined) }}
      >
        <div
          ref={headerRef}
          className={`transition-all duration-500 ${isHeaderHidden ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"} ease-in-out`}
        >
          <SiteHeader />
        </div>
      </div>
      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
