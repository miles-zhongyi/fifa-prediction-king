import { MatchStatus } from "@prisma/client";

/**
 * Official FIFA World Cup 2026 group stage fixtures.
 * Teams and kickoff times (UTC) sourced from the published tournament schedule.
 */
type Fixture = {
  homeTeam: string;
  awayTeam: string;
  stage: string;
  startTime: string;
};

export const WORLD_CUP_2026_GROUP_FIXTURES: Fixture[] = [
  // Thu 11 Jun
  { homeTeam: "Mexico", awayTeam: "South Africa", stage: "Group A", startTime: "2026-06-11T19:00:00.000Z" },
  { homeTeam: "South Korea", awayTeam: "Czechia", stage: "Group A", startTime: "2026-06-12T02:00:00.000Z" },
  // Fri 12 Jun
  { homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", stage: "Group B", startTime: "2026-06-12T19:00:00.000Z" },
  { homeTeam: "USA", awayTeam: "Paraguay", stage: "Group D", startTime: "2026-06-13T01:00:00.000Z" },
  // Sat 13 Jun
  { homeTeam: "Qatar", awayTeam: "Switzerland", stage: "Group B", startTime: "2026-06-13T19:00:00.000Z" },
  { homeTeam: "Brazil", awayTeam: "Morocco", stage: "Group C", startTime: "2026-06-13T22:00:00.000Z" },
  { homeTeam: "Haiti", awayTeam: "Scotland", stage: "Group C", startTime: "2026-06-14T01:00:00.000Z" },
  { homeTeam: "Australia", awayTeam: "Türkiye", stage: "Group D", startTime: "2026-06-14T04:00:00.000Z" },
  // Sun 14 Jun
  { homeTeam: "Germany", awayTeam: "Curaçao", stage: "Group E", startTime: "2026-06-14T17:00:00.000Z" },
  { homeTeam: "Netherlands", awayTeam: "Japan", stage: "Group F", startTime: "2026-06-14T20:00:00.000Z" },
  { homeTeam: "Côte d'Ivoire", awayTeam: "Ecuador", stage: "Group E", startTime: "2026-06-14T23:00:00.000Z" },
  { homeTeam: "Sweden", awayTeam: "Tunisia", stage: "Group F", startTime: "2026-06-15T02:00:00.000Z" },
  // Mon 15 Jun
  { homeTeam: "Spain", awayTeam: "Cabo Verde", stage: "Group H", startTime: "2026-06-15T16:00:00.000Z" },
  { homeTeam: "Belgium", awayTeam: "Egypt", stage: "Group G", startTime: "2026-06-15T19:00:00.000Z" },
  { homeTeam: "Saudi Arabia", awayTeam: "Uruguay", stage: "Group H", startTime: "2026-06-15T22:00:00.000Z" },
  { homeTeam: "Iran", awayTeam: "New Zealand", stage: "Group G", startTime: "2026-06-16T01:00:00.000Z" },
  // Tue 16 Jun
  { homeTeam: "France", awayTeam: "Senegal", stage: "Group I", startTime: "2026-06-16T19:00:00.000Z" },
  { homeTeam: "Iraq", awayTeam: "Norway", stage: "Group I", startTime: "2026-06-16T22:00:00.000Z" },
  { homeTeam: "Argentina", awayTeam: "Algeria", stage: "Group J", startTime: "2026-06-17T01:00:00.000Z" },
  { homeTeam: "Austria", awayTeam: "Jordan", stage: "Group J", startTime: "2026-06-17T04:00:00.000Z" },
  // Wed 17 Jun
  { homeTeam: "Portugal", awayTeam: "DR Congo", stage: "Group K", startTime: "2026-06-17T17:00:00.000Z" },
  { homeTeam: "England", awayTeam: "Croatia", stage: "Group L", startTime: "2026-06-17T20:00:00.000Z" },
  { homeTeam: "Ghana", awayTeam: "Panama", stage: "Group L", startTime: "2026-06-17T23:00:00.000Z" },
  { homeTeam: "Uzbekistan", awayTeam: "Colombia", stage: "Group K", startTime: "2026-06-18T02:00:00.000Z" },
  // Thu 18 Jun
  { homeTeam: "Czechia", awayTeam: "South Africa", stage: "Group A", startTime: "2026-06-18T16:00:00.000Z" },
  { homeTeam: "Switzerland", awayTeam: "Bosnia and Herzegovina", stage: "Group B", startTime: "2026-06-18T19:00:00.000Z" },
  { homeTeam: "Canada", awayTeam: "Qatar", stage: "Group B", startTime: "2026-06-18T22:00:00.000Z" },
  { homeTeam: "Mexico", awayTeam: "South Korea", stage: "Group A", startTime: "2026-06-19T01:00:00.000Z" },
  // Fri 19 Jun
  { homeTeam: "Scotland", awayTeam: "Morocco", stage: "Group C", startTime: "2026-06-19T22:00:00.000Z" },
  { homeTeam: "USA", awayTeam: "Australia", stage: "Group D", startTime: "2026-06-19T19:00:00.000Z" },
  { homeTeam: "Brazil", awayTeam: "Haiti", stage: "Group C", startTime: "2026-06-20T00:30:00.000Z" },
  { homeTeam: "Türkiye", awayTeam: "Paraguay", stage: "Group D", startTime: "2026-06-20T03:00:00.000Z" },
  // Sat 20 Jun
  { homeTeam: "Netherlands", awayTeam: "Sweden", stage: "Group F", startTime: "2026-06-20T17:00:00.000Z" },
  { homeTeam: "Germany", awayTeam: "Côte d'Ivoire", stage: "Group E", startTime: "2026-06-20T20:00:00.000Z" },
  { homeTeam: "Ecuador", awayTeam: "Curaçao", stage: "Group E", startTime: "2026-06-21T03:00:00.000Z" },
  { homeTeam: "Tunisia", awayTeam: "Japan", stage: "Group F", startTime: "2026-06-21T04:00:00.000Z" },
  // Sun 21 Jun
  { homeTeam: "Spain", awayTeam: "Saudi Arabia", stage: "Group H", startTime: "2026-06-21T16:00:00.000Z" },
  { homeTeam: "Belgium", awayTeam: "Iran", stage: "Group G", startTime: "2026-06-21T19:00:00.000Z" },
  { homeTeam: "Uruguay", awayTeam: "Cabo Verde", stage: "Group H", startTime: "2026-06-21T22:00:00.000Z" },
  { homeTeam: "New Zealand", awayTeam: "Egypt", stage: "Group G", startTime: "2026-06-22T01:00:00.000Z" },
  // Mon 22 Jun
  { homeTeam: "Argentina", awayTeam: "Austria", stage: "Group J", startTime: "2026-06-22T17:00:00.000Z" },
  { homeTeam: "France", awayTeam: "Iraq", stage: "Group I", startTime: "2026-06-22T21:00:00.000Z" },
  { homeTeam: "Norway", awayTeam: "Senegal", stage: "Group I", startTime: "2026-06-23T00:00:00.000Z" },
  { homeTeam: "Jordan", awayTeam: "Algeria", stage: "Group J", startTime: "2026-06-23T03:00:00.000Z" },
  // Tue 23 Jun
  { homeTeam: "Portugal", awayTeam: "Uzbekistan", stage: "Group K", startTime: "2026-06-23T17:00:00.000Z" },
  { homeTeam: "England", awayTeam: "Ghana", stage: "Group L", startTime: "2026-06-23T20:00:00.000Z" },
  { homeTeam: "Panama", awayTeam: "Croatia", stage: "Group L", startTime: "2026-06-23T23:00:00.000Z" },
  { homeTeam: "Colombia", awayTeam: "DR Congo", stage: "Group K", startTime: "2026-06-24T02:00:00.000Z" },
  // Wed 24 Jun
  { homeTeam: "Switzerland", awayTeam: "Canada", stage: "Group B", startTime: "2026-06-24T19:00:00.000Z" },
  { homeTeam: "Bosnia and Herzegovina", awayTeam: "Qatar", stage: "Group B", startTime: "2026-06-24T19:00:00.000Z" },
  { homeTeam: "Scotland", awayTeam: "Brazil", stage: "Group C", startTime: "2026-06-24T22:00:00.000Z" },
  { homeTeam: "Morocco", awayTeam: "Haiti", stage: "Group C", startTime: "2026-06-24T22:00:00.000Z" },
  { homeTeam: "Czechia", awayTeam: "Mexico", stage: "Group A", startTime: "2026-06-25T01:00:00.000Z" },
  { homeTeam: "South Africa", awayTeam: "South Korea", stage: "Group A", startTime: "2026-06-25T01:00:00.000Z" },
  // Thu 25 Jun
  { homeTeam: "Ecuador", awayTeam: "Germany", stage: "Group E", startTime: "2026-06-25T20:00:00.000Z" },
  { homeTeam: "Curaçao", awayTeam: "Côte d'Ivoire", stage: "Group E", startTime: "2026-06-25T20:00:00.000Z" },
  { homeTeam: "Japan", awayTeam: "Sweden", stage: "Group F", startTime: "2026-06-25T23:00:00.000Z" },
  { homeTeam: "Tunisia", awayTeam: "Netherlands", stage: "Group F", startTime: "2026-06-25T23:00:00.000Z" },
  { homeTeam: "Türkiye", awayTeam: "USA", stage: "Group D", startTime: "2026-06-26T02:00:00.000Z" },
  { homeTeam: "Paraguay", awayTeam: "Australia", stage: "Group D", startTime: "2026-06-26T02:00:00.000Z" },
  // Fri 26 Jun
  { homeTeam: "Norway", awayTeam: "France", stage: "Group I", startTime: "2026-06-26T19:00:00.000Z" },
  { homeTeam: "Senegal", awayTeam: "Iraq", stage: "Group I", startTime: "2026-06-26T19:00:00.000Z" },
  { homeTeam: "Cabo Verde", awayTeam: "Saudi Arabia", stage: "Group H", startTime: "2026-06-27T00:00:00.000Z" },
  { homeTeam: "Uruguay", awayTeam: "Spain", stage: "Group H", startTime: "2026-06-27T00:00:00.000Z" },
  { homeTeam: "Egypt", awayTeam: "Iran", stage: "Group G", startTime: "2026-06-27T03:00:00.000Z" },
  { homeTeam: "New Zealand", awayTeam: "Belgium", stage: "Group G", startTime: "2026-06-27T03:00:00.000Z" },
  // Sat 27 Jun
  { homeTeam: "Panama", awayTeam: "England", stage: "Group L", startTime: "2026-06-27T21:00:00.000Z" },
  { homeTeam: "Croatia", awayTeam: "Ghana", stage: "Group L", startTime: "2026-06-27T21:00:00.000Z" },
  { homeTeam: "Colombia", awayTeam: "Portugal", stage: "Group K", startTime: "2026-06-27T23:30:00.000Z" },
  { homeTeam: "DR Congo", awayTeam: "Uzbekistan", stage: "Group K", startTime: "2026-06-27T23:30:00.000Z" },
  { homeTeam: "Algeria", awayTeam: "Austria", stage: "Group J", startTime: "2026-06-28T02:00:00.000Z" },
  { homeTeam: "Jordan", awayTeam: "Argentina", stage: "Group J", startTime: "2026-06-28T02:00:00.000Z" },
];

export function generateGroupStageMatches() {
  return WORLD_CUP_2026_GROUP_FIXTURES.map((fixture) => ({
    ...fixture,
    startTime: new Date(fixture.startTime),
    status: MatchStatus.SCHEDULED,
  }));
}
