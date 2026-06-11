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
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();

  const groupMatches = generateGroupStageMatches();
  await prisma.match.createMany({ data: [...groupMatches, ...knockoutMatches] });

  const alice = await prisma.user.create({
    data: { username: "alice", email: "alice@example.com" },
  });

  const bob = await prisma.user.create({
    data: { username: "bob", email: "bob@example.com" },
  });

  const sampleMatches = await prisma.match.findMany({
    where: { stage: { startsWith: "Group" } },
    orderBy: { startTime: "asc" },
    take: 3,
  });

  if (sampleMatches.length >= 2) {
    await prisma.prediction.createMany({
      data: [
        {
          userId: alice.id,
          matchId: sampleMatches[0].id,
          predictedWinner: sampleMatches[0].homeTeam,
        },
        {
          userId: bob.id,
          matchId: sampleMatches[0].id,
          predictedWinner: sampleMatches[0].awayTeam,
        },
        {
          userId: alice.id,
          matchId: sampleMatches[1].id,
          predictedWinner: sampleMatches[1].homeTeam,
        },
      ],
    });
  }

  console.log(
    `Seed completed: ${groupMatches.length} group stage matches + ${knockoutMatches.length} knockout placeholders.`,
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
