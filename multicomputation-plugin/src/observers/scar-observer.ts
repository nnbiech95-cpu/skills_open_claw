// ============================================================
// observers/scar-observer.ts
// Detects failure events from observations and writes scar files.
// ============================================================

import { readFile, writeFile, mkdir, appendFile } from "fs/promises";
import { join } from "path";
import type { Observer } from "../observer-registry.js";
import type { ObservationEvent } from "../observation-schema.js";

interface ScarEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  category: string;
  confidence: number;
  occurrences: number;
  last_triggered: string;
}

export class ScarObserver implements Observer {
  id = "scar";
  name = "Scar Registry Observer";

  private scars: ScarEntry[] = [];
  private scarsDir = "";
  private dirty = false;

  async initialize(workspacePath: string): Promise<void> {
    this.scarsDir = join(workspacePath, "scars");
    await mkdir(this.scarsDir, { recursive: true });
    try {
      const raw = await readFile(join(this.scarsDir, "observations.json"), "utf-8");
      this.scars = JSON.parse(raw);
    } catch {
      this.scars = [];
    }
  }

  async observe(event: ObservationEvent): Promise<void> {
    const { scar: obs } = event;

    // Only process if a failure was observed
    if (!obs.triggered || !obs.description) return;

    const category = obs.category || "unknown";

    // Check if similar scar exists
    const existing = this.scars.find(
      (s) => s.category === category && s.type === obs.type
    );

    if (existing) {
      existing.occurrences++;
      existing.last_triggered = event.timestamp;
      // Confidence increases with repetition
      existing.confidence = Math.min(0.9, 0.3 + existing.occurrences * 0.15);
    } else {
      this.scars.push({
        id: `scar-${category}-${Date.now()}`,
        date: event.timestamp.split("T")[0],
        type: obs.type || "unknown",
        description: obs.description,
        category,
        confidence: 0.3,
        occurrences: 1,
        last_triggered: event.timestamp,
      });
    }

    // Append to human-readable log
    const logLine = `[${event.timestamp}] ${obs.type}: ${obs.description} (${category})\n`;
    try {
      await appendFile(join(this.scarsDir, "observation-log.md"), logLine);
    } catch {
      // Log file doesn't exist yet, create it
      await writeFile(
        join(this.scarsDir, "observation-log.md"),
        `# Scar Observations\n\n${logLine}`
      );
    }

    this.dirty = true;
  }

  async shutdown(): Promise<void> {
    if (this.dirty) {
      await writeFile(
        join(this.scarsDir, "observations.json"),
        JSON.stringify(this.scars, null, 2)
      );
      this.dirty = false;
    }
  }
}
