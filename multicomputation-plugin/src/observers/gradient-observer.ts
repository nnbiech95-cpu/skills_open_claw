// ============================================================
// observers/gradient-observer.ts
// Tracks communication pattern data points for rate-of-change
// detection. Stores raw signals; gradient calculation happens
// in weekly cron.
// ============================================================

import { readFile, writeFile, mkdir, appendFile } from "fs/promises";
import { join } from "path";
import type { Observer } from "../observer-registry.js";
import type { ObservationEvent } from "../observation-schema.js";

interface GradientDataPoint {
  timestamp: string;
  person: string | null;
  message_length: number;
  sentiment: number;
  interaction_type: string;
  session_continuity: string;
}

export class GradientObserver implements Observer {
  id = "gradient";
  name = "Gradient Tracker Observer";

  private dataPoints: GradientDataPoint[] = [];
  private dataPath = "";
  private dirty = false;

  async initialize(workspacePath: string): Promise<void> {
    this.dataPath = join(workspacePath, "analytics", "gradient-signals.jsonl");
    await mkdir(join(workspacePath, "analytics"), { recursive: true });
    // Don't load full history into memory — append-only
    this.dataPoints = [];
  }

  async observe(event: ObservationEvent): Promise<void> {
    const { gradient: obs } = event;

    const dp: GradientDataPoint = {
      timestamp: event.timestamp,
      person: obs.person,
      message_length: obs.user_message_length,
      sentiment: obs.sentiment,
      interaction_type: obs.interaction_type,
      session_continuity: obs.session_continuity,
    };

    // Append to JSONL (one line per data point — efficient, greppable)
    try {
      await appendFile(this.dataPath, JSON.stringify(dp) + "\n");
    } catch {
      await writeFile(this.dataPath, JSON.stringify(dp) + "\n");
    }
  }

  async shutdown(): Promise<void> {
    // Nothing to flush — we append on every observe
  }
}
