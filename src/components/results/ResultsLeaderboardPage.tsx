"use client";

import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { MatchResultsBoard } from "@/components/matches/MatchResultsBoard";
import { PageHeader } from "@/components/layout/PageHeader";

export function ResultsLeaderboardPage() {
  return (
    <>
      <PageHeader
        title="Results & Leaderboard"
        description="Live match scores and rankings. Group advancers & 3rd place: 1 pt each · Knockout round picks: 0.5 pt each."
      />

      <div className="space-y-12">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Leaderboard</h2>
          <LeaderboardTable embedded />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Match Results</h2>
          <MatchResultsBoard embedded />
        </section>
      </div>
    </>
  );
}
