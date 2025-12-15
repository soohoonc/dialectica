"use client";

import { SearchInput } from "@/components/navigation/search-input";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-6xl md:text-8xl w-[500px]">
        <SearchInput placeholder="Dialectica" fixedWidth />
      </div>
    </div>
  );
}
