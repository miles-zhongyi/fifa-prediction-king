import { exportGameDataToFile, getGameDataFilePath } from "../src/lib/persistence/file-store";

async function main() {
  await exportGameDataToFile();
  console.log(`Game data exported to ${getGameDataFilePath()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
