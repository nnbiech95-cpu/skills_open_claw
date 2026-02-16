// ============================================================
// observers/memory-observer.ts
// Tracks which memory chunks and skills are actually used vs
// just loaded. Feeds Memory Compactor with relevance signals.
// ============================================================

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { Observer } from "../observer-registry.js";
import type { ObservationEvent } from "../observation-schema.js";

interface MemoryStats {
  total_turns: number;
  total_chunks_loaded: number;
  total_chunks_referenced: number;
  utilization_rate: number; // referenced / loaded
  skill_usage: Record<string, number>; // skill_name → times used
  pressure_counts: { low: number; medium: number; high: number };
}

export class MemoryObserver implements Observer {
  id = "memory";
  name = "Memory Relevance Observer";

  private stats: MemoryStats = {
    total_turns: 0,
    total_chunks_loaded: 0,
    total_chunks_referenced: 0,
    utilization_rate: 0,
    skill_usage: {},
    pressure_counts: { low: 0, medium: 0, high: 0 },
  };
  private dataPath = "";
  private dirty = false;

  async initialize(workspacePath: string): Promise<void> {
    this.dataPath = join(workspacePath, "analytics", "memory-stats.json");
    await mkdir(join(workspacePath, "analytics"), { recursive: true });
    try {
      const raw = await readFile(this.dataPath, "utf-8");
      this.stats = JSON.parse(raw);
    } catch {
      // Fresh stats
    }
  }

  async observe(event: ObservationEvent): Promise<void> {
    const { memory: obs } = event;

    this.stats.total_turns++;
    this.stats.total_chunks_loaded += obs.chunks_in_context;
    this.stats.total_chunks_referenced += obs.chunks_referenced;

    // Update utilization rate
    if (this.stats.total_chunks_loaded > 0) {
      this.stats.utilization_rate =
        this.stats.total_chunks_referenced / this.stats.total_chunks_loaded;
    }

    // Track skill usage
    for (const skill of obs.skills_used) {
      this.stats.skill_usage[skill] = (this.stats.skill_usage[skill] || 0) + 1;
    }

    // Track context pressure
    this.stats.pressure_counts[obs.context_pressure]++;

    this.dirty = true;
  }

  async shutdown(): Promise<void> {
    if (this.dirty) {
      await writeFile(this.dataPath, JSON.stringify(this.stats, null, 2));
      this.dirty = false;
    }
  }

  /** Get utilization rate (for external access) */
  getUtilizationRate(): number {
    return Math.round(this.stats.utilization_rate * 100) / 100;
  }
}
