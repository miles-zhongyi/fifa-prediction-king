import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function repairUserAvatarColumn() {
  const columns = await prisma.$queryRaw<Array<{ name: string }>>`
    PRAGMA table_info("User");
  `;

  const hasAvatarUrl = columns.some((column) => column.name === "avatarUrl");
  if (!hasAvatarUrl) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT`);
    console.log("Repaired database: added User.avatarUrl column.");
  }
}

repairUserAvatarColumn()
  .catch((error) => {
    console.error("Database repair failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
