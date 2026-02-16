// ============================================================
// observers/competence-observer.ts
// Tracks user accept/modify/reject signals per domain.
// ============================================================

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { Observer } from "../observer-registry.js";
import type { ObservationEvent } from "../observation-schema.js";

interface DomainSignals {
  domain: string;
  accept: number;
  modify: number;
  reject: number;
  defer: number;
  rework: number;
  total: number;
  avg_complexity: number;
  last_signal: string;
}

export class CompetenceObserver implements Observer {
  id = "competence";
  name = "User Competence Observer";

  private domains: Map<string, DomainSignals> = new Map();
  private dataPath = "";
  private dirty = false;

  async initialize(workspacePath: string): Promise<void> {
    this.dataPath = join(workspacePath, "analytics", "competence", "signals.json");
    await mkdir(join(workspacePath, "analytics", "competence"), { recursive: true });
    try {
      const raw = await readFile(this.dataPath, "utf-8");
      const arr: DomainSignals[] = JSON.parse(raw);
      arr.forEach((d) => this.domains.set(d.domain, d));
    } catch {
      this.domains = new Map();
    }
  }

  async observe(event: ObservationEvent): Promise<void> {
    const { competence: obs } = event;
    if (!obs.signal || !obs.domain) return;

    let domain = this.domains.get(obs.domain);
    if (!domain) {
      domain = {
        domain: obs.domain,
        accept: 0, modify: 0, reject: 0, defer: 0, rework: 0,
        total: 0, avg_complexity: 0, last_signal: "",
      };
      this.domains.set(obs.domain, domain);
    }

    // Increment signal counter
    const sig = obs.signal as keyof Pick<DomainSignals, "accept" | "modify" | "reject" | "defer" | "rework">;
    if (sig in domain && typeof domain[sig] === "number") {
      (domain[sig] as number)++;
    }
    domain.total++;
    domain.last_signal = event.timestamp;

    // Running average of complexity
    domain.avg_complexity =
      (domain.avg_complexity * (domain.total - 1) + obs.complexity) / domain.total;

    this.dirty = true;
  }

  async shutdown(): Promise<void> {
    if (this.dirty) {
      const arr = Array.from(this.domains.values());
      await writeFile(this.dataPath, JSON.stringify(arr, null, 2));
      this.dirty = false;
    }
  }
}
