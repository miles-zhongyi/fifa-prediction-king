import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("npx prisma migrate deploy");
run("npx tsx scripts/repair-db-schema.ts");
run("npx tsx scripts/ensure-group-results.ts");
run("npx tsx prisma/seed-if-empty.ts");
