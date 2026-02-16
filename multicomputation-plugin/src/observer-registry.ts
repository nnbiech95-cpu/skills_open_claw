// ============================================================
// observer-registry.ts
// Registry pattern for observation listeners.
// Any observer can register to receive ObservationEvents.
// Distribution is sync and non-blocking (observers handle
// their own persistence).
//
// Analogy: the readout circuit. The sMTJ race happened.
// Now each measurement instrument reads its observable.
// ============================================================

import type { ObservationEvent } from "./observation-schema.js";

/** Base interface for all observers */
export interface Observer {
  /** Unique ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Called on every observation event */
  observe(event: ObservationEvent): Promise<void>;
  /** Called on plugin startup — load state from disk */
  initialize?(workspacePath: string): Promise<void>;
  /** Called on plugin shutdown — flush state to disk */
  shutdown?(): Promise<void>;
}

/** The registry */
export class ObserverRegistry {
  private observers: Map<string, Observer> = new Map();
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  /** Register an observer */
  register(observer: Observer): void {
    if (this.observers.has(observer.id)) {
      console.warn(`[multicomp] Observer ${observer.id} already registered, replacing.`);
    }
    this.observers.set(observer.id, observer);
  }

  /** Unregister an observer */
  unregister(id: string): void {
    this.observers.delete(id);
  }

  /** Initialize all observers */
  async initializeAll(): Promise<void> {
    for (const obs of this.observers.values()) {
      try {
        await obs.initialize?.(this.workspacePath);
      } catch (err) {
        console.error(`[multicomp] Failed to initialize observer ${obs.id}:`, err);
      }
    }
  }

  /** Distribute an observation to all registered observers */
  async emit(event: ObservationEvent): Promise<void> {
    const promises = Array.from(this.observers.values()).map(async (obs) => {
      try {
        await obs.observe(event);
      } catch (err) {
        console.error(`[multicomp] Observer ${obs.id} failed:`, err);
        // Never crash the pipeline because an observer fails
      }
    });
    await Promise.allSettled(promises);
  }

  /** Shutdown all observers */
  async shutdownAll(): Promise<void> {
    for (const obs of this.observers.values()) {
      try {
        await obs.shutdown?.();
      } catch (err) {
        console.error(`[multicomp] Failed to shutdown observer ${obs.id}:`, err);
      }
    }
  }

  /** Get registered observer count */
  get count(): number {
    return this.observers.size;
  }

  /** Get all observer IDs */
  get ids(): string[] {
    return Array.from(this.observers.keys());
  }
}
