"use client";

import { GroupPickCard } from "@/components/picks/GroupPickCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { useGroupPicksContext } from "@/contexts/GroupPicksContext";
import { MAX_GROUP_ADVANCERS } from "@/lib/groups";

export function Dashboard() {
  const { boards, loading, error, reload, togglePick, getUserPicksForGroup } =
    useGroupPicksContext();

  if (loading && boards.length === 0) {
    return <LoadingState message="Loading group picks..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={() => void reload()} />;
  }

  return (
    <>
      <PageHeader
        title="Group Stage"
        description={`Pick ${MAX_GROUP_ADVANCERS} teams to advance from each group. Picks lock after June 19, 2026.`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {boards.map((board) => (
          <GroupPickCard
            key={board.groupKey}
            board={board}
            userPicks={getUserPicksForGroup(board.groupKey)}
            onToggle={(team) => togglePick(board.groupKey, team)}
          />
        ))}
      </div>
    </>
  );
}
