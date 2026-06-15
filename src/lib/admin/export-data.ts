import { spawn } from "child_process";
import { access, readFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { getDataDir } from "@/lib/paths";

const EXPORT_ENTRIES = ["prod.db", "game-data.json", "uploads"] as const;

export type ExportArchive = {
  stream: Readable;
  filename: string;
  contentType: string;
};

async function getExportableEntries(dataDir: string): Promise<string[]> {
  const existing: string[] = [];

  for (const entry of EXPORT_ENTRIES) {
    try {
      await access(path.join(dataDir, entry));
      existing.push(entry);
    } catch {
      // Entry missing — skip.
    }
  }

  return existing;
}

function tarIsAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("tar", ["--version"]);
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

function spawnTarArchive(dataDir: string, entries: string[]): Readable {
  const proc = spawn("tar", ["-czf", "-", ...entries], {
    cwd: dataDir,
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (!proc.stdout) {
    throw new Error("Failed to start archive export");
  }

  proc.stderr?.on("data", (chunk: Buffer) => {
    console.error("export-data tar:", chunk.toString());
  });

  proc.on("error", (error) => {
    proc.stdout?.destroy(error);
  });

  return proc.stdout;
}

async function createDatabaseOnlyExport(dataDir: string): Promise<ExportArchive> {
  const buffer = await readFile(path.join(dataDir, "prod.db"));

  return {
    stream: Readable.from(buffer),
    filename: "prod.db",
    contentType: "application/octet-stream",
  };
}

export async function createExportArchive(): Promise<ExportArchive> {
  const dataDir = getDataDir();
  const entries = await getExportableEntries(dataDir);

  if (entries.length === 0) {
    throw new Error("No exportable data found in data directory");
  }

  if (!(await tarIsAvailable())) {
    if (!entries.includes("prod.db")) {
      throw new Error("tar is unavailable and prod.db was not found");
    }

    return createDatabaseOnlyExport(dataDir);
  }

  return {
    stream: spawnTarArchive(dataDir, entries),
    filename: "fifa-export.tar.gz",
    contentType: "application/gzip",
  };
}
