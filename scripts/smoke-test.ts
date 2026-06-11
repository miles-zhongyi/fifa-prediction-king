/**
 * Quick smoke test: verifies seeded fixtures and prediction API.
 * Run: npx tsx scripts/smoke-test.ts
 */
import { PrismaClient } from "@prisma/client";
import { submitPrediction } from "../src/lib/predictions/service";

const prisma = new PrismaClient();

async function main() {
  const firstMatch = await prisma.match.findFirst({
    where: { stage: "Group A" },
    orderBy: { startTime: "asc" },
  });

  if (!firstMatch) {
    throw new Error("No Group A matches found — run npm run db:seed");
  }

  if (firstMatch.homeTeam !== "Mexico" || firstMatch.awayTeam !== "South Africa") {
    throw new Error(
      `Unexpected opener: ${firstMatch.homeTeam} vs ${firstMatch.awayTeam}. Re-run npm run db:seed`,
    );
  }

  await prisma.user.upsert({
    where: { username: "smoke_test_user" },
    update: {},
    create: {
      username: "smoke_test_user",
      email: "smoke_test@example.com",
    },
  });

  const futureNow = new Date("2026-06-11T12:00:00.000Z");
  const result = await submitPrediction(
    {
      username: "smoke_test_user",
      matchId: firstMatch.id,
      predictedWinner: "Mexico",
    },
    { now: futureNow },
  );

  if (result.predictedWinner !== "Mexico") {
    throw new Error("Prediction was not saved correctly");
  }

  await prisma.prediction.deleteMany({
    where: { user: { username: "smoke_test_user" } },
  });
  await prisma.user.deleteMany({ where: { username: "smoke_test_user" } });

  console.log("Smoke test passed:", {
    opener: `${firstMatch.homeTeam} vs ${firstMatch.awayTeam}`,
    matchId: firstMatch.id,
  });
}

main()
  .catch((error) => {
    console.error("Smoke test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
