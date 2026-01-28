import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ENV_FILES = [".env.local", ".env"];

export function loadEnv(): void {
  for (const file of ENV_FILES) {
    const fullPath = resolve(process.cwd(), file);
    if (!existsSync(fullPath)) {
      continue;
    }

    const contents = readFileSync(fullPath, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const normalized = line.startsWith("export ") ? line.slice(7) : line;
      const index = normalized.indexOf("=");
      if (index === -1) {
        continue;
      }

      const key = normalized.slice(0, index).trim();
      let value = normalized.slice(index + 1).trim();

      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}
