import { PrismaClient } from "@prisma/client";
import { GROUP_KEYS } from "../src/lib/groups";

const prisma = new PrismaClient();

async function main() {
  for (const groupKey of GROUP_KEYS) {
    await prisma.groupResult.upsert({
      where: { groupKey },
      create: { groupKey },
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
