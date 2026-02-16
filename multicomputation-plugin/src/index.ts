// ============================================================
// index.ts
// OpenClaw Plugin: Multicomputation
//
// One LLM call → multiple cognitive observables.
// Like an sMTJ race producing 9 operations from 1 event.
//
// Hooks:
//   before_agent_start → inject observation prompt
//   agent_end → parse observations, distribute to observers
//
// Zero extra LLM calls. O(N+C) instead of O(S×N).
// ============================================================

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { getObservationPrompt, getObservationPromptMinimal } from "./prompt-injection.js";
import { parseObservation, stripObsBlock } from "./observation-parser.js";
import { ObserverRegistry } from "./observer-registry.js";
import { PatternObserver } from "./observers/pattern-observer.js";
import { ScarObserver } from "./observers/scar-observer.js";
import { CompetenceObserver } from "./observers/competence-observer.js";
import { GradientObserver } from "./observers/gradient-observer.js";
import { MemoryObserver } from "./observers/memory-observer.js";
import type { TurnContext } from "./observation-parser.js";

const multicomputationPlugin = {
  id: "multicomputation",
  name: "Cognitive Multicomputation",
  kind: "memory" as const,

  register(api: OpenClawPluginApi) {
    const config = api.pluginConfig || {};
    const minimal = config.minimal_prompt === true;

    // Will be initialized on first agent start
    let registry: ObserverRegistry | null = null;
    let turnCounter = 0;
    let initialized = false;

    // ─── HOOK 1: before_agent_start ────────────────────────
    // Inject the observation prompt into the system context.
    // This tells the LLM to emit <obs> blocks.
    api.on("before_agent_start", async (event, ctx) => {
      // Initialize registry on first run
      if (!initialized) {
        const workspace = ctx.workspacePath || process.env.OPENCLAW_WORKSPACE || `${process.env.HOME}/.openclaw/workspace`;
        registry = new ObserverRegistry(workspace);

        // Register all cognitive observers
        registry.register(new PatternObserver());
        registry.register(new ScarObserver());
        registry.register(new CompetenceObserver());
        registry.register(new GradientObserver());
        registry.register(new MemoryObserver());

        await registry.initializeAll();
        initialized = true;
        console.log(`[multicomp] Initialized ${registry.count} observers: ${registry.ids.join(", ")}`);
      }

      turnCounter++;

      // Inject observation prompt
      const prompt = minimal
        ? getObservationPromptMinimal()
        : getObservationPrompt();

      return {
        prependContext: prompt,
      };
    });

    // ─── HOOK 2: agent_end ─────────────────────────────────
    // Parse observations from the response. Distribute to observers.
    // Strip <obs> block so user never sees it.
    api.on("agent_end", async (event, ctx) => {
      if (!registry || !event.success) return;

      // Extract the last assistant message
      const messages = event.messages || [];
      const lastAssistant = messages
        .filter((m: { role: string }) => m.role === "assistant")
        .pop();
      if (!lastAssistant?.content) return;

      const assistantText =
        typeof lastAssistant.content === "string"
          ? lastAssistant.content
          : lastAssistant.content
              .filter((b: { type: string }) => b.type === "text")
              .map((b: { text: string }) => b.text)
              .join("");

      // Find the user message
      const lastUser = messages
        .filter((m: { role: string }) => m.role === "user")
        .pop();
      const userText =
        typeof lastUser?.content === "string"
          ? lastUser.content
          : lastUser?.content
              ?.filter((b: { type: string }) => b.type === "text")
              .map((b: { text: string }) => b.text)
              .join("") || "";

      // Build turn context
      const turnCtx: TurnContext = {
        session_id: ctx.sessionId || "unknown",
        turn_number: turnCounter,
        user_message: userText,
        assistant_response: assistantText,
        chunks_in_context: countChunksInContext(messages),
      };

      // Parse observations
      const observation = parseObservation(turnCtx);

      if (observation) {
        // Distribute to all observers — parallel, non-blocking
        await registry.emit(observation);

        // Flush observers (write to disk)
        await registry.shutdownAll();

        // Re-initialize for next turn (reload state)
        // This is safe because observers handle idempotent init
        await registry.initializeAll();
      }
    });

    // ─── CLI: stats command ────────────────────────────────
    api.registerCli(
      (ctx) => {
        ctx.program
          .command("multicomp-stats")
          .description("Show multicomputation observation statistics")
          .action(async () => {
            if (!registry) {
              console.log("[multicomp] Not initialized yet. Run an agent first.");
              return;
            }
            console.log(`[multicomp] Observers: ${registry.count}`);
            console.log(`[multicomp] Turns observed: ${turnCounter}`);
            console.log(`[multicomp] Observer IDs: ${registry.ids.join(", ")}`);
          });
      },
      { commands: ["multicomp-stats"] }
    );

    // ─── SERVICE: shutdown handler ─────────────────────────
    api.registerService({
      id: "multicomp-lifecycle",
      async start() {
        console.log("[multicomp] Multicomputation plugin active.");
      },
      async stop() {
        if (registry) {
          await registry.shutdownAll();
          console.log("[multicomp] All observers flushed to disk.");
        }
      },
    });
  },
};

/**
 * Estimate how many memory chunks are in the context.
 * Heuristic: count system messages with memory-like content.
 */
function countChunksInContext(messages: Array<{ role: string; content: unknown }>): number {
  const systemMsgs = messages.filter((m) => m.role === "system");
  // Rough estimate: each chunk is ~200-500 tokens
  let totalLength = 0;
  for (const msg of systemMsgs) {
    const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    totalLength += text.length;
  }
  // Estimate ~4 chars per token, ~300 tokens per chunk
  return Math.round(totalLength / (4 * 300));
}

export default multicomputationPlugin;

// Also export individual components for testing / extension
export { ObserverRegistry } from "./observer-registry.js";
export { parseObservation, stripObsBlock } from "./observation-parser.js";
export { getObservationPrompt, getObservationPromptMinimal } from "./prompt-injection.js";
export { PatternObserver } from "./observers/pattern-observer.js";
export { ScarObserver } from "./observers/scar-observer.js";
export { CompetenceObserver } from "./observers/competence-observer.js";
export { GradientObserver } from "./observers/gradient-observer.js";
export { MemoryObserver } from "./observers/memory-observer.js";
export type { Observer } from "./observer-registry.js";
export type { ObservationEvent } from "./observation-schema.js";
