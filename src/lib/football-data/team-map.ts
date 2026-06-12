import { normalizeTeamName } from "@/lib/teams";

/** Map football-data.org (and similar) team names to our fixture names. */
const API_TEAM_ALIASES: Record<string, string> = {
  "czech republic": "Czechia",
  "korea republic": "South Korea",
  "republic of korea": "South Korea",
  "united states": "USA",
  "united states of america": "USA",
  "cote d'ivoire": "Côte d'Ivoire",
  "ivory coast": "Côte d'Ivoire",
  "cape verde": "Cabo Verde",
  "cape verde islands": "Cabo Verde",
  "turkey": "Türkiye",
  "curacao": "Curaçao",
  "congo dr": "DR Congo",
  "dr congo": "DR Congo",
  "democratic republic of the congo": "DR Congo",
  bosnia: "Bosnia and Herzegovina",
  "bosnia-herzegovina": "Bosnia and Herzegovina",
  iran: "Iran",
  "ir iran": "Iran",
};

export function mapApiTeamName(apiName: string): string {
  const trimmed = apiName.trim();
  const alias = API_TEAM_ALIASES[trimmed.toLowerCase()];
  return normalizeTeamName(alias ?? trimmed);
}
