import { PrismaClient } from "@prisma/client";

const KNOCKOUT_ROUND_KEYS = [
  "TOP16",
  "TOP8",
  "TOP4",
  "TOP2",
  "WINNER",
] as const;

const prisma = new PrismaClient();

async function main() {
  for (const round of KNOCKOUT_ROUND_KEYS) {
    await prisma.knockoutRoundResult.upsert({
      where: { round },
      create: {
        round,
        teams: "[]",
        finalized: false,
      },
      update: {},
    });
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
