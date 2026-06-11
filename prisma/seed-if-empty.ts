import { PrismaClient, MatchStatus } from "@prisma/client";
import { generateGroupStageMatches } from "./group-stage-data";

const prisma = new PrismaClient();

const knockoutMatches = [
  {
    homeTeam: "TBD",
    awayTeam: "TBD",
    stage: "Round of 16",
    startTime: new Date("2026-07-01T18:00:00.000Z"),
    status: MatchStatus.SCHEDULED,
  },
  {
    homeTeam: "TBD",
    awayTeam: "TBD",
    stage: "Quarter Final",
    startTime: new Date("2026-07-05T19:00:00.000Z"),
    status: MatchStatus.SCHEDULED,
  },
  {
    homeTeam: "TBD",
    awayTeam: "TBD",
    stage: "Semi Final",
    startTime: new Date("2026-07-10T20:00:00.000Z"),
    status: MatchStatus.SCHEDULED,
  },
  {
    homeTeam: "TBD",
    awayTeam: "TBD",
    stage: "Final",
    startTime: new Date("2026-07-19T18:00:00.000Z"),
    status: MatchStatus.SCHEDULED,
  },
];

async function main() {
  const matchCount = await prisma.match.count();
  if (matchCount > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const groupMatches = generateGroupStageMatches();
  await prisma.match.createMany({ data: [...groupMatches, ...knockoutMatches] });

  console.log(
    `Seeded ${groupMatches.length} group stage matches and ${knockoutMatches.length} knockout placeholders.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
