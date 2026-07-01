/**
 * Import AI bot bracket picks from spreadsheet CSVs into SQLite.
 *
 * Usage:
 *   npx tsx scripts/import-ai-bot-picks.ts
 */

import { copyFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { buildAvatarPublicPath, getAvatarUploadDir } from "../src/lib/paths";
import { GROUP_KEYS, getTeamsInGroup, type GroupKey } from "../src/lib/groups";
import { mapApiTeamName } from "../src/lib/football-data/team-map";

const prisma = new PrismaClient();

type BotConfig = {
  csvPath: string;
  csvColumn: string;
  username: string;
  email: string;
  iconFile: string;
};

const BOTS: BotConfig[] = [
  {
    csvPath: "data/ai-bot-picks.csv",
    csvColumn: "Gemini 3.1 Pro",
    username: "Gemini31Pro",
    email: "gemini31pro@dodonadata.ai",
    iconFile: "data/bot-icons/GeminiIcon.png",
  },
  {
    csvPath: "data/ai-bot-picks.csv",
    csvColumn: "Claude Sonnet 5",
    username: "ClaudeSonnet5",
    email: "claudesonnet5@dodonadata.ai",
    iconFile: "data/bot-icons/ClaudeIcon.png",
  },
  {
    csvPath: "data/ai-bot-picks.csv",
    csvColumn: "GPT 5.5",
    username: "GPT55",
    email: "gpt55@dodonadata.ai",
    iconFile: "data/bot-icons/GPTIcon.png",
  },
  {
    csvPath: "data/fifabot-picks.csv",
    csvColumn: "FIFAbot",
    username: "FIFAbot",
    email: "fifabot@dodonadata.ai",
    iconFile: "data/bot-icons/FIFABotIcon.png",
  },
];

const SECTION_GROUP = "group #1&2";
const SECTION_THIRD = "#3 advanced";
const SECTION_R16 = "round of 16";
const SECTION_QF = "quarterfinals";
const SECTION_SF = "semifinals";
const SECTION_FINAL = "final";
const SECTION_CHAMPION = "champion";

type ParsedBotPicks = {
  groupAdvancers: string[];
  thirdPlace: string[];
  top16: string[];
  top8: string[];
  top4: string[];
  top2: string[];
  winner: string;
};

function normalizePickTeam(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const typoFixes: Record<string, string> = {
    agentina: "Argentina",
    turkiye: "Türkiye",
  };

  const lower = trimmed.toLowerCase();
  if (typoFixes[lower]) {
    return typoFixes[lower];
  }

  return mapApiTeamName(trimmed);
}

function parseCsvRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (char === "," && !inQuotes) {
          cells.push(current);
          current = "";
          continue;
        }
        current += char;
      }
      cells.push(current);
      return cells;
    })
    .filter((row) => row.some((cell) => cell.trim().length > 0));
}

function findColumnIndex(header: string[], label: string): number {
  const normalized = label.trim().toLowerCase();
  const index = header.findIndex((cell) => cell.trim().toLowerCase() === normalized);
  if (index === -1) {
    throw new Error(`CSV column not found: ${label}`);
  }
  return index;
}

function collectSectionTeams(
  rows: string[][],
  columnIndex: number,
  sectionRow: number,
  sectionEnd: number,
): string[] {
  const teams: string[] = [];

  for (let i = sectionRow; i < sectionEnd; i += 1) {
    const value = rows[i]?.[columnIndex] ?? "";
    const team = normalizePickTeam(value);
    if (team) {
      teams.push(team);
    }
  }

  return teams;
}

function parseBotColumn(rows: string[][], columnIndex: number): ParsedBotPicks {
  const sectionRows: Record<string, number> = {};
  for (let i = 0; i < rows.length; i += 1) {
    const label = (rows[i][0] ?? "").trim().toLowerCase();
    if (label) {
      sectionRows[label] = i;
    }
  }

  const groupRow = sectionRows[SECTION_GROUP];
  const thirdRow = sectionRows[SECTION_THIRD];
  const r16Row = sectionRows[SECTION_R16];
  const qfRow = sectionRows[SECTION_QF];
  const sfRow = sectionRows[SECTION_SF];
  const finalRow = sectionRows[SECTION_FINAL];
  const championRow = sectionRows[SECTION_CHAMPION];

  if (
    groupRow === undefined ||
    thirdRow === undefined ||
    r16Row === undefined ||
    qfRow === undefined ||
    sfRow === undefined ||
    finalRow === undefined ||
    championRow === undefined
  ) {
    throw new Error("CSV is missing one or more required sections");
  }

  const groupAdvancers = collectSectionTeams(rows, columnIndex, groupRow, thirdRow);
  const thirdPlace = collectSectionTeams(rows, columnIndex, thirdRow, r16Row);
  const top16 = collectSectionTeams(rows, columnIndex, r16Row, qfRow);
  const top8 = collectSectionTeams(rows, columnIndex, qfRow, sfRow);
  const top4 = collectSectionTeams(rows, columnIndex, sfRow, finalRow);
  const top2 = collectSectionTeams(rows, columnIndex, finalRow, championRow);
  const winner = collectSectionTeams(rows, columnIndex, championRow, rows.length)[0];

  if (groupAdvancers.length !== 24) {
    throw new Error(`Expected 24 group advancers, got ${groupAdvancers.length}`);
  }
  if (thirdPlace.length !== 8) {
    throw new Error(`Expected 8 third-place picks, got ${thirdPlace.length}`);
  }
  if (top16.length !== 16) {
    throw new Error(`Expected 16 TOP16 picks, got ${top16.length}`);
  }
  if (top8.length !== 8) {
    throw new Error(`Expected 8 TOP8 picks, got ${top8.length}`);
  }
  if (top4.length !== 4) {
    throw new Error(`Expected 4 TOP4 picks, got ${top4.length}`);
  }
  if (top2.length !== 2) {
    throw new Error(`Expected 2 TOP2 picks, got ${top2.length}`);
  }
  if (!winner) {
    throw new Error("Missing champion pick");
  }

  return {
    groupAdvancers,
    thirdPlace,
    top16,
    top8,
    top4,
    top2,
    winner,
  };
}

function groupAdvancePicksFromList(teams: string[]): Array<{ groupKey: GroupKey; team: string }> {
  const picks: Array<{ groupKey: GroupKey; team: string }> = [];

  for (let i = 0; i < GROUP_KEYS.length; i += 1) {
    const groupKey = GROUP_KEYS[i];
    const first = teams[i];
    const second = teams[i + GROUP_KEYS.length];
    const roster = new Set(getTeamsInGroup(groupKey));

    for (const team of [first, second]) {
      if (!roster.has(team)) {
        throw new Error(`Team "${team}" is not in Group ${groupKey}`);
      }
      picks.push({ groupKey, team });
    }
  }

  return picks;
}

async function installBotAvatar(userId: string, iconFile: string): Promise<string> {
  const uploadsDir = getAvatarUploadDir();
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${userId}-bot.png`;
  await copyFile(path.join(process.cwd(), iconFile), path.join(uploadsDir, filename));

  return buildAvatarPublicPath(filename);
}

async function upsertBotUser(username: string, email: string, avatarUrl: string) {
  return prisma.user.upsert({
    where: { username },
    create: {
      username,
      email,
      avatarUrl,
      hidden: false,
    },
    update: {
      email,
      avatarUrl,
      hidden: false,
    },
  });
}

async function replaceBotPicks(userId: string, picks: ParsedBotPicks) {
  await prisma.$transaction([
    prisma.groupAdvancePick.deleteMany({ where: { userId } }),
    prisma.thirdPlacePick.deleteMany({ where: { userId } }),
    prisma.knockoutRoundPick.deleteMany({ where: { userId } }),
  ]);

  const groupPicks = groupAdvancePicksFromList(picks.groupAdvancers);

  await prisma.groupAdvancePick.createMany({
    data: groupPicks.map((pick) => ({
      userId,
      groupKey: pick.groupKey,
      team: pick.team,
    })),
  });

  await prisma.thirdPlacePick.createMany({
    data: picks.thirdPlace.map((team) => ({ userId, team })),
  });

  const knockoutRows = [
    ...picks.top16.map((team) => ({ round: "TOP16", team })),
    ...picks.top8.map((team) => ({ round: "TOP8", team })),
    ...picks.top4.map((team) => ({ round: "TOP4", team })),
    ...picks.top2.map((team) => ({ round: "TOP2", team })),
    { round: "WINNER", team: picks.winner },
  ];

  await prisma.knockoutRoundPick.createMany({
    data: knockoutRows.map((pick) => ({
      userId,
      round: pick.round,
      team: pick.team,
    })),
  });
}

async function importBot(bot: BotConfig) {
  const csvPath = path.join(process.cwd(), bot.csvPath);
  const text = await readFile(csvPath, "utf-8");
  const rows = parseCsvRows(text);
  const header = rows[0];
  const columnIndex = findColumnIndex(header, bot.csvColumn);
  const picks = parseBotColumn(rows, columnIndex);

  let user = await prisma.user.findUnique({ where: { username: bot.username } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: bot.username,
        email: bot.email,
        avatarUrl: `/api/avatar/${bot.username}`,
        hidden: false,
      },
    });
  }

  const avatarUrl = await installBotAvatar(user.id, bot.iconFile);
  user = await upsertBotUser(bot.username, bot.email, avatarUrl);
  await replaceBotPicks(user.id, picks);

  console.log(
    `Imported ${bot.username}: 24 group + 8 third + 31 knockout picks (champion: ${picks.winner})`,
  );
}

async function main() {
  for (const bot of BOTS) {
    await importBot(bot);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
