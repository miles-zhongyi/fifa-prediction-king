"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import type { BracketResponse, BracketMatch, BracketTeam } from "@/app/api/bracket/route";

function TeamRow({ team, isTop }: { team: BracketTeam; isTop: boolean }) {
  const isTbd = team.name === "TBD";
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 ${isTop ? "border-b border-white/10" : ""} ${
        team.isWinner ? "bg-green-500/15" : ""
      } ${isTbd ? "opacity-40" : ""}`}
    >
      <span className="text-sm leading-none">{team.flag}</span>
      <span
        className={`flex-1 truncate text-[11px] font-medium leading-tight ${
          team.isWinner ? "text-green-300" : isTbd ? "text-[var(--muted)]" : "text-white"
        }`}
        title={team.name}
      >
        {team.isWinner && <span className="mr-0.5 text-green-400">✓</span>}
        {team.name}
      </span>
      {!isTbd && team.pct > 0 && (
        <span className="shrink-0 text-[9px] text-[var(--muted)]">{team.pct}%</span>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  return (
    <div
      className="overflow-hidden rounded border border-white/15 bg-[var(--card)] text-left"
      style={{ width: 148 }}
    >
      <div className="border-b border-white/10 px-2 py-0.5 text-[9px] text-[var(--muted)]">
        {match.date}
      </div>
      <TeamRow team={match.home} isTop={true} />
      <TeamRow team={match.away} isTop={false} />
    </div>
  );
}

function RoundColumn({ matches }: { matches: BracketMatch[] }) {
  return (
    <div className="flex flex-col justify-around" style={{ flex: 1 }}>
      {matches.map((m) => (
        <div key={m.id} className="flex items-center justify-center">
          <MatchCard match={m} />
        </div>
      ))}
    </div>
  );
}

// Connector lines going rightward (left half)
function ConnectorRight({ count }: { count: number }) {
  return (
    <div className="flex flex-col" style={{ width: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1 }} className="flex flex-col">
          <div className="flex-1 border-b border-r border-white/20" />
          <div className="flex-1 border-r border-white/20" />
        </div>
      ))}
    </div>
  );
}

// Connector lines going leftward (right half)
function ConnectorLeft({ count }: { count: number }) {
  return (
    <div className="flex flex-col" style={{ width: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1 }} className="flex flex-col">
          <div className="flex-1 border-b border-l border-white/20" />
          <div className="flex-1 border-l border-white/20" />
        </div>
      ))}
    </div>
  );
}

// Horizontal line connecting SF to Final center
function HLine() {
  return <div style={{ width: 18, height: 1 }} className="shrink-0 self-center bg-white/20" />;
}

function LeftHalf({ r32, r16, qf, sf }: { r32: BracketMatch[]; r16: BracketMatch[]; qf: BracketMatch[]; sf: BracketMatch }) {
  return (
    <div className="flex h-full">
      <RoundColumn matches={r32} />
      <ConnectorRight count={4} />
      <RoundColumn matches={r16} />
      <ConnectorRight count={2} />
      <RoundColumn matches={qf} />
      <ConnectorRight count={1} />
      <RoundColumn matches={[sf]} />
      <HLine />
    </div>
  );
}

function RightHalf({ sf, qf, r16, r32 }: { sf: BracketMatch; qf: BracketMatch[]; r16: BracketMatch[]; r32: BracketMatch[] }) {
  return (
    <div className="flex h-full">
      <HLine />
      <RoundColumn matches={[sf]} />
      <ConnectorLeft count={1} />
      <RoundColumn matches={qf} />
      <ConnectorLeft count={2} />
      <RoundColumn matches={r16} />
      <ConnectorLeft count={4} />
      <RoundColumn matches={r32} />
    </div>
  );
}

function RoundLabels() {
  const cls = "flex-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]";
  const gap = <div style={{ width: 18 }} />;
  return (
    <div className="mb-2 flex">
      {/* Left half — mirrors LeftHalf structure */}
      <div style={{ flex: 1 }} className="flex">
        <div className={cls}>Round of 32</div>
        {gap}
        <div className={cls}>Round of 16</div>
        {gap}
        <div className={cls}>QF</div>
        {gap}
        <div className={cls}>SF</div>
        {gap}
      </div>
      {/* Final center */}
      <div
        style={{ width: 200, flexShrink: 0 }}
        className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]"
      >
        Final
      </div>
      {/* Right half — mirrors RightHalf structure */}
      <div style={{ flex: 1 }} className="flex">
        {gap}
        <div className={cls}>SF</div>
        {gap}
        <div className={cls}>QF</div>
        {gap}
        <div className={cls}>Round of 16</div>
        {gap}
        <div className={cls}>Round of 32</div>
      </div>
    </div>
  );
}

export function BracketView() {
  const [data, setData] = useState<BracketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bracket")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load bracket");
        return r.json() as Promise<BracketResponse>;
      })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading bracket..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return null;

  return (
    <>
      <PageHeader
        title="Bracket"
        description={`2026 FIFA World Cup knockout bracket · ${data.totalUsers} players · % = prediction ratio`}
      />

      {data.champion && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-yellow-300/70">World Champion</p>
            <p className="font-bold text-yellow-300">{data.champion}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div style={{ minWidth: 1300 }}>
          <RoundLabels />
          <div style={{ height: 680 }} className="flex">
            <div style={{ flex: 1 }} className="flex">
              <LeftHalf r32={data.left.r32} r16={data.left.r16} qf={data.left.qf} sf={data.left.sf} />
            </div>
            <div style={{ width: 200, flexShrink: 0 }} className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                  Final · {data.final.date}
                </span>
                <MatchCard match={data.final} />
              </div>
            </div>
            <div style={{ flex: 1 }} className="flex">
              <RightHalf sf={data.right.sf} qf={data.right.qf} r16={data.right.r16} r32={data.right.r32} />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-[var(--muted)]">
        % shows prediction ratio from player picks. Green ✓ = confirmed match winner.
      </p>
    </>
  );
}
