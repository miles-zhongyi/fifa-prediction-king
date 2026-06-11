"use client";

import { SiteNav } from "./SiteNav";

type GameLayoutProps = {
  children: React.ReactNode;
};

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
