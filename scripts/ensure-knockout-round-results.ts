import { ensureKnockoutRoundResults } from "../src/lib/admin/knockout-round-results";

async function main() {
  await ensureKnockoutRoundResults();
}

main()
  .then(() => {
    console.log("Knockout round results ensured.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
