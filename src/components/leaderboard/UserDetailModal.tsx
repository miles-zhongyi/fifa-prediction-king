"use client";

import { useEffect, useState } from "react";
import { formatPoints } from "@/lib/leaderboard/scoring";

type GroupPick = {
  groupKey: string;
  team: string;
  correct: boolean;
  finalized: boolean;
  points: number;
};

type ThirdPlacePick = {
  team: string;
  correct: boolean;
  finalized: boolean;
  points: number;
};

type KnockoutPick = {
  round: string;
  team: string;
  correct: boolean;
  finalized: boolean;
  roundStarted: boolean;
  points: number;
};

type UserDetail = {
  userId: string;
  username: string;
  totalPoints: number;
  groupPicks: GroupPick[];
  thirdPlacePicks: ThirdPlacePick[];
  knockoutPicks: KnockoutPick[];
};

const ROUND_LABELS: Record<string, string> = {
  TOP16: "Round of 16",
  TOP8: "Quarterfinals",
  TOP4: "Semifinals",
  TOP2: "Finalists",
  WINNER: "Champion",
};

function PickBadge({ correct, finalized }: { correct: boolean; finalized: boolean }) {
  if (!finalized) {
    return <span className="text-xs text-[var(--muted)]">Pending</span>;
  }
  return correct ? (
    <span className="text-xs font-semibold text-green-400">✓ +{correct ? "" : "0"}</span>
  ) : (
    <span className="text-xs text-red-400">✗</span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function UserDetailModal({
  userId,
  username,
  onClose,
}: {
  userId: string;
  username: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/leaderboard/${userId}`)
      .then((r) => r.json())
      .then((d) => setDetail(d as UserDetail))
      .finally(() => setLoading(false));
  }, [userId]);

  // Group picks by groupKey
  const groupedPicks = detail?.groupPicks.reduce<Record<string, GroupPick[]>>(
    (acc, pick) => {
      acc[pick.groupKey] = [...(acc[pick.groupKey] ?? []), pick];
      return acc;
    },
    {},
  );

  // Knockout picks by round
  const knockoutByRound = detail?.knockoutPicks.reduce<Record<string, KnockoutPick[]>>(
    (acc, pick) => {
      acc[pick.round] = [...(acc[pick.round] ?? []), pick];
      return acc;
    },
    {},
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">{username}</h2>
            {detail && (
              <p className="text-sm text-[var(--muted)]">
                {formatPoints(detail.totalPoints)} pts total
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            </div>
          )}

          {detail && (
            <>
              {/* Group Advance Picks */}
              {detail.groupPicks.length > 0 && (
                <Section title="Group Advance Picks (1 pt each)">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(groupedPicks ?? {})
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([groupKey, picks]) =>
                        picks.map((pick) => (
                          <div
                            key={`${groupKey}-${pick.team}`}
                            className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                              !pick.finalized
                                ? "text-[var(--muted)]"
                                : pick.correct
                                ? "text-green-300"
                                : "text-red-400"
                            }`}
                          >
                            <span>
                              <span className="font-mono text-xs text-[var(--muted)] mr-1">
                                {groupKey}
                              </span>
                              {pick.team}
                            </span>
                            {pick.finalized ? (
                              pick.correct ? (
                                <span className="text-xs font-bold text-green-400">✓ +1</span>
                              ) : (
                                <span className="text-xs text-red-400">✗</span>
                              )
                            ) : (
                              <span className="text-xs text-[var(--muted)]">–</span>
                            )}
                          </div>
                        )),
                      )}
                  </div>
                  <p className="mt-2 text-right text-sm font-semibold">
                    {formatPoints(detail.groupPicks.reduce((s, p) => s + p.points, 0))} pts
                  </p>
                </Section>
              )}

              {/* Third Place Picks */}
              {detail.thirdPlacePicks.length > 0 && (
                <Section title="3rd Place Advance Picks (1 pt each)">
                  <div className="space-y-1">
                    {detail.thirdPlacePicks.map((pick) => (
                      <div
                        key={pick.team}
                        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                          !pick.finalized
                            ? "text-[var(--muted)]"
                            : pick.correct
                            ? "text-green-300"
                            : "text-red-400"
                        }`}
                      >
                        <span>{pick.team}</span>
                        {pick.finalized ? (
                          pick.correct ? (
                            <span className="text-xs font-bold text-green-400">✓ +1</span>
                          ) : (
                            <span className="text-xs text-red-400">✗</span>
                          )
                        ) : (
                          <span className="text-xs text-[var(--muted)]">–</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-right text-sm font-semibold">
                    {formatPoints(detail.thirdPlacePicks.reduce((s, p) => s + p.points, 0))} pts
                  </p>
                </Section>
              )}

              {/* Knockout Picks */}
              {detail.knockoutPicks.length > 0 && (
                <Section title="Knockout Picks">
                  {Object.entries(knockoutByRound ?? {})
                    .filter(([, picks]) => picks.some((p) => p.roundStarted))
                    .sort(([a], [b]) => {
                      const order = ["TOP16", "TOP8", "TOP4", "TOP2", "WINNER"];
                      return order.indexOf(a) - order.indexOf(b);
                    })
                    .map(([round, picks]) => (
                      <div key={round} className="mb-3">
                        <p className="mb-1 text-xs text-[var(--muted)]">
                          {ROUND_LABELS[round] ?? round}
                          {round === "WINNER" ? " (2 pts)" : " (0.5 pts each)"}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {picks.map((pick) => (
                            <div
                              key={pick.team}
                              className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                                pick.correct
                                  ? "text-green-300"
                                  : pick.finalized
                                  ? "text-red-400"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              <span>{pick.team}</span>
                              {pick.correct ? (
                                <span className="text-xs font-bold text-green-400">
                                  ✓ +{formatPoints(pick.points)}
                                </span>
                              ) : pick.finalized ? (
                                <span className="text-xs text-red-400">✗</span>
                              ) : (
                                <span className="text-xs text-[var(--muted)]">–</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  <p className="mt-2 text-right text-sm font-semibold">
                    {formatPoints(detail.knockoutPicks.reduce((s, p) => s + p.points, 0))} pts
                  </p>
                </Section>
              )}

              {/* Total */}
              <div className="border-t border-[var(--border)] pt-4 text-right">
                <span className="text-lg font-bold">
                  Total: {formatPoints(detail.totalPoints)} pts
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
