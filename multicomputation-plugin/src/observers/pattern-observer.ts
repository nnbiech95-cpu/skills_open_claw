// ============================================================
// observers/pattern-observer.ts
// Builds the pattern cache from observation events.
// No separate LLM call needed — learns from every turn.
// ============================================================

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { Observer } from "../observer-registry.js";
import type { ObservationEvent } from "../observation-schema.js";

interface PatternEntry {
  id: string;
  intent: string;
  tool: string;
  param_keys: string[];
  examples: string[];
  times_observed: number;
  times_fired: number;
  times_corrected: number;
  confidence: number;
  last_observed: string;
  streak: number;
}

export class PatternObserver implements Observer {
  id = "pattern";
  name = "Pattern Cache Observer";

  private patterns: PatternEntry[] = [];
  private cachePath = "";
  private dirty = false;

  async initialize(workspacePath: string): Promise<void> {
    this.cachePath = join(workspacePath, "patterns", "cache.json");
    await mkdir(join(workspacePath, "patterns"), { recursive: true });
    try {
      const raw = await readFile(this.cachePath, "utf-8");
      this.patterns = JSON.parse(raw);
    } catch {
      this.patterns = [];
    }
  }

  async observe(event: ObservationEvent): Promise<void> {
    const { pattern: obs } = event;

    // Skip if no tool was used (pure text response)
    if (!obs.tool_used) return;

    // Find existing pattern by intent + tool
    const existing = this.patterns.find(
      (p) => p.intent === obs.intent && p.tool === obs.tool_used
    );

    if (existing) {
      existing.times_observed++;
      existing.last_observed = event.timestamp;
      existing.streak++;

      // Update confidence: base = observed / (observed + 10), saturates ~0.9
      const base = existing.times_observed / (existing.times_observed + 10);
      const streakBonus = Math.min(existing.streak, 5) * 0.02;
      existing.confidence = Math.min(0.99, base + 0.05 * streakBonus);

      // Add example if new
      const paramStr = JSON.stringify(obs.parameters);
      if (!existing.examples.includes(paramStr) && existing.examples.length < 10) {
        existing.examples.push(paramStr);
      }
    } else {
      // New pattern
      this.patterns.push({
        id: `${obs.intent}-${obs.tool_used}-${Date.now()}`,
        intent: obs.intent,
        tool: obs.tool_used,
        param_keys: Object.keys(obs.parameters),
        examples: [JSON.stringify(obs.parameters)],
        times_observed: 1,
        times_fired: 0,
        times_corrected: 0,
        confidence: 0.0,
        last_observed: event.timestamp,
        streak: 1,
      });
    }

    this.dirty = true;
  }

  async shutdown(): Promise<void> {
    if (this.dirty) {
      await writeFile(this.cachePath, JSON.stringify(this.patterns, null, 2));
      this.dirty = false;
    }
  }

  /** Get current patterns (for external access) */
  getPatterns(): PatternEntry[] {
    return this.patterns;
  }

  /** Get metrics for reporting */
  getMetrics(): { active: number; highConfidence: number; avgConfidence: number } {
    const active = this.patterns.filter((p) => p.confidence > 0.1);
    const high = active.filter((p) => p.confidence > 0.85);
    const avg =
      active.length > 0
        ? active.reduce((sum, p) => sum + p.confidence, 0) / active.length
        : 0;
    return {
      active: active.length,
      highConfidence: high.length,
      avgConfidence: Math.round(avg * 100) / 100,
    };
  }
}
