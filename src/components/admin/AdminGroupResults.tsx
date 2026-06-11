"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";
import { getGroupRosters } from "@/lib/groups";

type GroupResult = {
  groupKey: string;
  advancer1: string | null;
  advancer2: string | null;
  thirdPlaceTeam: string | null;
  thirdAdvances: boolean;
  finalized: boolean;
};

const ROSTERS = getGroupRosters();

export function AdminGroupResults() {
  const [results, setResults] = useState<GroupResult[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const response = await adminFetch("/api/admin/group-results");
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? "Failed to load group results");
    }

    setResults((await response.json()) as GroupResult[]);
  }, []);

  useEffect(() => {
    void load().catch((loadError) => {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load",
      );
    });
  }, [load]);

  function getResult(groupKey: string) {
    return results.find((result) => result.groupKey === groupKey);
  }

  async function saveGroup(groupKey: string, form: HTMLFormElement) {
    setSaving(groupKey);
    setError(null);

    const formData = new FormData(form);

    try {
      const response = await adminFetch(`/api/admin/group-results/${groupKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advancer1: String(formData.get("advancer1") || "") || null,
          advancer2: String(formData.get("advancer2") || "") || null,
          thirdPlaceTeam: String(formData.get("thirdPlaceTeam") || "") || null,
          thirdAdvances: formData.get("thirdAdvances") === "on",
          finalized: formData.get("finalized") === "on",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to save group result");
      }

      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save",
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-lg font-semibold">Group Results</h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Set the two advancers and third-place team for each group to score picks.
      </p>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {ROSTERS.map(({ groupKey, teams }) => {
          const result = getResult(groupKey);

          return (
            <form
              key={groupKey}
              className="card space-y-3 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void saveGroup(groupKey, event.currentTarget);
              }}
            >
              <h3 className="font-medium">Group {groupKey}</h3>

              <label className="block text-sm">
                <span className="text-[var(--muted)]">Advancer 1</span>
                <select
                  name="advancer1"
                  defaultValue={result?.advancer1 ?? ""}
                  className="input mt-1 w-full"
                >
                  <option value="">—</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-[var(--muted)]">Advancer 2</span>
                <select
                  name="advancer2"
                  defaultValue={result?.advancer2 ?? ""}
                  className="input mt-1 w-full"
                >
                  <option value="">—</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-[var(--muted)]">3rd place team</span>
                <select
                  name="thirdPlaceTeam"
                  defaultValue={result?.thirdPlaceTeam ?? ""}
                  className="input mt-1 w-full"
                >
                  <option value="">—</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="thirdAdvances"
                  defaultChecked={result?.thirdAdvances ?? false}
                />
                Third-place team advances
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="finalized"
                  defaultChecked={result?.finalized ?? false}
                />
                Finalize group (enables scoring)
              </label>

              <button
                type="submit"
                disabled={saving === groupKey}
                className="btn-primary text-sm"
              >
                {saving === groupKey ? "Saving..." : "Save group"}
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
