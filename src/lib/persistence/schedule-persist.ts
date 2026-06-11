import { after } from "next/server";
import { persistGameData } from "./file-store";

export function schedulePersistGameData(): void {
  try {
    after(async () => {
      await persistGameData();
    });
  } catch {
    void persistGameData();
  }
}
