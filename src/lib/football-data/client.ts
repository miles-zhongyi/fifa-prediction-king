import { mapApiTeamName } from "@/lib/football-data/team-map";

export type ExternalMatchResult = {
  externalId: number;
  utcDate: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED";
};

type FootballDataTeam = {
  name?: string;
  shortName?: string;
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    fullTime?: {
      home: number | null;
      away: number | null;
    };
  };
};

type FootballDataResponse = {
  matches?: FootballDataMatch[];
};

function mapStatus(status: string): ExternalMatchResult["status"] {
  const key = status.toUpperCase();
  if (key === "FINISHED") {
    return "FINISHED";
  }

  if (
    key === "IN_PLAY" ||
    key === "PAUSED" ||
    key === "LIVE" ||
    key === "HALFTIME"
  ) {
    return "LIVE";
  }

  return "SCHEDULED";
}

function resolveWinner(
  homeTeam: string,
  awayTeam: string,
  homeScore: number | null,
  awayScore: number | null,
): string | null {
  if (homeScore === null || awayScore === null) {
    return null;
  }

  if (homeScore > awayScore) {
    return homeTeam;
  }

  if (awayScore > homeScore) {
    return awayTeam;
  }

  return null;
}

export async function fetchWorldCupMatches(
  season = 2026,
): Promise<ExternalMatchResult[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return [];
  }

  const response = await fetch(
    `https://api.football-data.org/v4/competitions/WC/matches?season=${season}`,
    {
      headers: {
        "X-Auth-Token": apiKey,
      },
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    console.error(
      `football-data.org sync failed: ${response.status} ${response.statusText}`,
    );
    return [];
  }

  const payload = (await response.json()) as FootballDataResponse;
  const matches = payload.matches ?? [];

  return matches.map((match) => {
    const homeTeam = mapApiTeamName(match.homeTeam.name ?? "");
    const awayTeam = mapApiTeamName(match.awayTeam.name ?? "");
    const homeScore = match.score?.fullTime?.home ?? null;
    const awayScore = match.score?.fullTime?.away ?? null;
    const status = mapStatus(match.status);

    return {
      externalId: match.id,
      utcDate: new Date(match.utcDate),
      homeTeam,
      awayTeam,
      homeScore: status === "FINISHED" ? homeScore : null,
      awayScore: status === "FINISHED" ? awayScore : null,
      winner:
        status === "FINISHED"
          ? resolveWinner(homeTeam, awayTeam, homeScore, awayScore)
          : null,
      status,
    };
  });
}
