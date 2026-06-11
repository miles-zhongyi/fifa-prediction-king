export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { restoreGameDataFromFile } = await import(
      "@/lib/persistence/file-store"
    );
    const restored = await restoreGameDataFromFile();
    if (restored) {
      console.info("Restored game data from data/game-data.json");
    }
  }
}
