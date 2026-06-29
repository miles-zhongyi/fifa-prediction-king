import { handleApiError, jsonResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Official 2026 World Cup knockout bracket structure
// Prediction round keys: TOP16=who survives R32, TOP8=who survives R16, etc.

export type BracketTeam = {
  name: string;
  flag: string;
  pickCount: number;
  pct: number;
  isWinner: boolean;
};

export type BracketMatch = {
  id: string;
  home: BracketTeam;
  away: BracketTeam;
  date: string;
  finalized: boolean;
  round: string;
};

export type BracketHalf = {
  r32: BracketMatch[];
  r16: BracketMatch[];
  qf: BracketMatch[];
  sf: BracketMatch;
};

export type BracketResponse = {
  left: BracketHalf;
  right: BracketHalf;
  final: BracketMatch;
  champion: string | null;
  totalUsers: number;
};

const FLAGS: Record<string, string> = {
  "South Africa": "🇿🇦", "Canada": "🇨🇦", "Germany": "🇩🇪", "Paraguay": "🇵🇾",
  "Netherlands": "🇳🇱", "Morocco": "🇲🇦", "Brazil": "🇧🇷", "Japan": "🇯🇵",
  "France": "🇫🇷", "Sweden": "🇸🇪", "Ivory Coast": "🇨🇮", "Norway": "🇳🇴",
  "Mexico": "🇲🇽", "Ecuador": "🇪🇨", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "DR Congo": "🇨🇩",
  "United States": "🇺🇸", "Bosnia and Herzegovina": "🇧🇦", "Belgium": "🇧🇪",
  "Senegal": "🇸🇳", "Portugal": "🇵🇹", "Croatia": "🇭🇷", "Spain": "🇪🇸",
  "Austria": "🇦🇹", "Switzerland": "🇨🇭", "Algeria": "🇩🇿", "Argentina": "🇦🇷",
  "Cape Verde": "🇨🇻", "Colombia": "🇨🇴", "Ghana": "🇬🇭", "Australia": "🇦🇺", "Egypt": "🇪🇬",
};

function getFlag(team: string): string { return FLAGS[team] ?? "🏳️"; }

// R32 hardcoded matchups
const LEFT_R32_DEF = [
  { id: "M74", home: "Germany", away: "Paraguay", date: "Jun 29" },
  { id: "M77", home: "France", away: "Sweden", date: "Jun 30" },
  { id: "M73", home: "South Africa", away: "Canada", date: "Jun 28" },
  { id: "M75", home: "Netherlands", away: "Morocco", date: "Jun 29" },
  { id: "M81", home: "United States", away: "Bosnia and Herzegovina", date: "Jul 1" },
  { id: "M82", home: "Belgium", away: "Senegal", date: "Jul 1" },
  { id: "M83", home: "Portugal", away: "Croatia", date: "Jul 2" },
  { id: "M84", home: "Spain", away: "Austria", date: "Jul 2" },
];

const RIGHT_R32_DEF = [
  { id: "M76", home: "Brazil", away: "Japan", date: "Jun 29" },
  { id: "M78", home: "Ivory Coast", away: "Norway", date: "Jun 30" },
  { id: "M79", home: "Mexico", away: "Ecuador", date: "Jun 30" },
  { id: "M80", home: "England", away: "DR Congo", date: "Jul 1" },
  { id: "M86", home: "Argentina", away: "Cape Verde", date: "Jul 3" },
  { id: "M88", home: "Australia", away: "Egypt", date: "Jul 3" },
  { id: "M85", home: "Switzerland", away: "Algeria", date: "Jul 2" },
  { id: "M87", home: "Colombia", away: "Ghana", date: "Jul 3" },
];

// R16 match definitions: which R32 winners play each other
const LEFT_R16_DEF = [
  { id: "M89", homeFrom: "M74", awayFrom: "M77", date: "Jul 4" },
  { id: "M90", homeFrom: "M73", awayFrom: "M75", date: "Jul 4" },
  { id: "M94", homeFrom: "M81", awayFrom: "M82", date: "Jul 6" },
  { id: "M93", homeFrom: "M83", awayFrom: "M84", date: "Jul 6" },
];

const RIGHT_R16_DEF = [
  { id: "M91", homeFrom: "M76", awayFrom: "M78", date: "Jul 5" },
  { id: "M92", homeFrom: "M79", awayFrom: "M80", date: "Jul 5" },
  { id: "M95", homeFrom: "M86", awayFrom: "M88", date: "Jul 7" },
  { id: "M96", homeFrom: "M85", awayFrom: "M87", date: "Jul 7" },
];

const LEFT_QF_DEF = [
  { id: "QF1", homeFrom: "M89", awayFrom: "M90", date: "Jul 9" },
  { id: "QF2", homeFrom: "M93", awayFrom: "M94", date: "Jul 10" },
];

const RIGHT_QF_DEF = [
  { id: "QF3", homeFrom: "M91", awayFrom: "M92", date: "Jul 11" },
  { id: "QF4", homeFrom: "M95", awayFrom: "M96", date: "Jul 11" },
];

export async function GET() {
  try {
    const [allPicks, knockoutResults, totalUsers] = await Promise.all([
      prisma.knockoutRoundPick.findMany({ select: { round: true, team: true, userId: true } }),
      prisma.knockoutRoundResult.findMany(),
      prisma.user.count(),
    ]);

    // Build pick counts: { round -> { team -> count } }
    const pickCountMap = new Map<string, Map<string, number>>();
    const pickerCountMap = new Map<string, number>();
    for (const pick of allPicks) {
      if (!pickCountMap.has(pick.round)) pickCountMap.set(pick.round, new Map());
      const rm = pickCountMap.get(pick.round)!;
      rm.set(pick.team, (rm.get(pick.team) ?? 0) + 1);
    }
    // Count distinct pickers per round
    const pickerSets = new Map<string, Set<string>>();
    for (const pick of allPicks) {
      if (!pickerSets.has(pick.round)) pickerSets.set(pick.round, new Set());
      pickerSets.get(pick.round)!.add(pick.userId);
    }
    for (const [round, s] of pickerSets) pickerCountMap.set(round, s.size);

    // Result lookup: round -> teams set + finalized
    const resultTeams = new Map<string, Set<string>>();
    const finalizedRounds = new Set<string>();
    for (const r of knockoutResults) {
      const teams = JSON.parse(r.teams as string) as string[];
      resultTeams.set(r.round, new Set(teams));
      if (r.finalized) finalizedRounds.add(r.round);
    }

    function pickInfo(team: string, roundKey: string): { pickCount: number; pct: number } {
      const total = pickerCountMap.get(roundKey) ?? 0;
      const count = pickCountMap.get(roundKey)?.get(team) ?? 0;
      return { pickCount: count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    }

    function teamSlot(name: string | null, pickRound: string, winnerSet: Set<string>): BracketTeam {
      if (!name) return { name: "TBD", flag: "❓", pickCount: 0, pct: 0, isWinner: false };
      return { name, flag: getFlag(name), ...pickInfo(name, pickRound), isWinner: winnerSet.has(name) };
    }

    // R32 winners come from TOP16 result (who survived R32 to reach R16)
    const top16Teams = resultTeams.get("TOP16") ?? new Set<string>();
    const top16Finalized = finalizedRounds.has("TOP16");
    const r32WinnerOf = new Map<string, string | null>();
    // Use teams even when not yet finalized — partial results show individual match winners
    for (const m of [...LEFT_R32_DEF, ...RIGHT_R32_DEF]) {
      if (top16Teams.has(m.home)) r32WinnerOf.set(m.id, m.home);
      else if (top16Teams.has(m.away)) r32WinnerOf.set(m.id, m.away);
      else r32WinnerOf.set(m.id, null);
    }

    // Track match winner propagation for derived rounds
    const matchWinner = new Map<string, string | null>();
    for (const [id, w] of r32WinnerOf) matchWinner.set(id, w);

    function buildR32Match(m: { id: string; home: string; away: string; date: string }): BracketMatch {
      const winner = r32WinnerOf.get(m.id) ?? null;
      const ws = new Set(winner ? [winner] : []);
      return {
        id: m.id,
        home: { name: m.home, flag: getFlag(m.home), ...pickInfo(m.home, "TOP16"), isWinner: ws.has(m.home) },
        away: { name: m.away, flag: getFlag(m.away), ...pickInfo(m.away, "TOP16"), isWinner: ws.has(m.away) },
        date: m.date, finalized: top16Finalized, round: "R32",
      };
    }

    function buildDerivedMatch(
      def: { id: string; homeFrom: string; awayFrom: string; date: string },
      pickRound: string,
      resultRound: string,
    ): BracketMatch {
      const homeTeam = matchWinner.get(def.homeFrom) ?? null;
      const awayTeam = matchWinner.get(def.awayFrom) ?? null;
      const finalized = finalizedRounds.has(resultRound);
      // Use partial results even when not finalized
      const winners = resultTeams.get(resultRound) ?? new Set<string>();
      const home = teamSlot(homeTeam, pickRound, winners);
      const away = teamSlot(awayTeam, pickRound, winners);
      const w = homeTeam && winners.has(homeTeam) ? homeTeam
              : awayTeam && winners.has(awayTeam) ? awayTeam : null;
      matchWinner.set(def.id, w);
      return { id: def.id, home, away, date: def.date, finalized, round: def.id.startsWith("QF") ? "QF" : def.id.startsWith("SF") || def.id === "FINAL" ? def.id : "R16" };
    }

    const leftR32 = LEFT_R32_DEF.map(buildR32Match);
    const rightR32 = RIGHT_R32_DEF.map(buildR32Match);

    const leftR16 = LEFT_R16_DEF.map((d) => buildDerivedMatch(d, "TOP8", "TOP8"));
    const rightR16 = RIGHT_R16_DEF.map((d) => buildDerivedMatch(d, "TOP8", "TOP8"));

    const leftQF = LEFT_QF_DEF.map((d) => buildDerivedMatch(d, "TOP4", "TOP4"));
    const rightQF = RIGHT_QF_DEF.map((d) => buildDerivedMatch(d, "TOP4", "TOP4"));

    const leftSF = buildDerivedMatch({ id: "SF1", homeFrom: "QF1", awayFrom: "QF2", date: "Jul 14" }, "TOP2", "TOP2");
    const rightSF = buildDerivedMatch({ id: "SF2", homeFrom: "QF3", awayFrom: "QF4", date: "Jul 15" }, "TOP2", "TOP2");
    const final = buildDerivedMatch({ id: "FINAL", homeFrom: "SF1", awayFrom: "SF2", date: "Jul 19" }, "WINNER", "WINNER");

    const champion = final.finalized
      ? (final.home.isWinner ? final.home.name : final.away.isWinner ? final.away.name : null)
      : null;

    const response: BracketResponse = {
      left: { r32: leftR32, r16: leftR16, qf: leftQF, sf: leftSF },
      right: { r32: rightR32, r16: rightR16, qf: rightQF, sf: rightSF },
      final,
      champion,
      totalUsers,
    };

    return jsonResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
}
