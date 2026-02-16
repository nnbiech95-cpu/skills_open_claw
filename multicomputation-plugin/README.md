# ⚡ Multicomputation Plugin for OpenClaw

**One LLM call. Five cognitive observables. Zero extra cost.**

Every time your agent responds, it already "knows" whether the turn was routine, whether something failed, which domain you're in, how the conversation feels, and which memory was useful. Today, that knowledge is discarded. This plugin captures it.

## The Problem

OpenClaw's cognitive skills (Pattern Cache, Scar Registry, Competence Model, Gradient Tracker, Memory Compactor) each need data from every turn. Naively, each skill makes its own LLM call to analyze the turn:

```
Complexity: O(S × N)  — S skills × N turns/day
Cost:       S separate LLM calls per turn
Latency:    S × 2-5 seconds additional per turn
```

At 6 skills and 15 turns/day, that's 90 extra LLM calls. Expensive, slow, doesn't scale.

## The Solution

Inspired by [multicomputation in physics](https://en.wikipedia.org/wiki/Multicomputation) — where a single physical event (e.g., an sMTJ race) produces multiple measurable quantities simultaneously — this plugin extracts multiple cognitive observables from the single LLM call that's already happening.

```
Complexity: O(N + C)  — N turns + C cron jobs (constant)
Cost:       ~50 extra tokens per turn (the <obs> block)
Latency:    0 additional (observation is in the response)
```

Adding more observers doesn't increase LLM calls. Ever.

## Architecture

```
                    ┌─────────────────────────────┐
                    │     LLM Call (THE EVENT)     │
                    │                              │
                    │  Response + <obs>{...}</obs> │
                    └──────────────┬───────────────┘
                                   │
                          ┌────────┴────────┐
                          │  Obs Parser     │ ← strips <obs>, parses JSON
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
              │  Pattern   │ │   Scar    │ │Competence │ ...
              │  Observer  │ │  Observer │ │ Observer  │
              └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                    │              │              │
              patterns/      scars/        analytics/
              cache.json     obs.json      competence/
```

One event → parse once → distribute to N observers → each writes its own data store.

## How It Works

### 1. Prompt Injection (`before_agent_start`)

The plugin injects a small system prompt (~300 tokens) that instructs the LLM to append an `<obs>` JSON block to every response. The block uses short keys to minimize token overhead:

```json
<obs>
{
  "p": {"m":true,"t":"calendar.create","pa":{"person":"Alice","time":"Monday 10:00"},"i":"create_event","s":0.85},
  "s": {"t":false,"ty":null,"d":null,"c":null},
  "co": {"d":"calendar","si":"accept","in":"user","cx":1},
  "g": {"pe":"Alice","sc":"continuation","se":0.2,"it":"routine"},
  "me": {"cr":2,"su":["pattern-cache"],"cp":"low"}
}
</obs>
```

### 2. Observation Parsing (`agent_end`)

After the LLM responds, the parser:
1. Extracts the `<obs>` block
2. Strips it from the user-visible response
3. Parses JSON (with fallbacks for malformed output)
4. Enriches with metadata (timestamp, session ID, turn number)
5. Distributes to all registered observers

### 3. Observers Write Data

Each observer receives the typed `ObservationEvent` and writes to its own data store:

| Observer | Writes To | What It Tracks |
|----------|-----------|---------------|
| PatternObserver | `patterns/cache.json` | Tool+intent repetition, confidence scores |
| ScarObserver | `scars/observations.json` | Failure events, categories, confidence |
| CompetenceObserver | `analytics/competence/signals.json` | Accept/reject rates per domain |
| GradientObserver | `analytics/gradient-signals.jsonl` | Communication data points (append-only) |
| MemoryObserver | `analytics/memory-stats.json` | Chunk utilization, skill usage, pressure |

## Installation

```bash
# In your OpenClaw workspace
npm install openclaw-plugin-multicomputation

# Or clone and link locally
git clone https://github.com/nnbiech95-cpu/openclaw-plugin-multicomputation
cd openclaw-plugin-multicomputation
npm install && npm run build
npm link
cd ~/.openclaw && npm link openclaw-plugin-multicomputation
```

Add to your OpenClaw config:

```json
{
  "plugins": [
    {
      "id": "multicomputation",
      "package": "openclaw-plugin-multicomputation",
      "config": {
        "minimal_prompt": false
      }
    }
  ]
}
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `minimal_prompt` | `false` | Use shorter prompt injection (~100 tokens instead of ~300) |

## Writing Custom Observers

```typescript
import type { Observer } from "openclaw-plugin-multicomputation";
import type { ObservationEvent } from "openclaw-plugin-multicomputation";

class MyObserver implements Observer {
  id = "my-observer";
  name = "My Custom Observer";

  async initialize(workspacePath: string) {
    // Load state from disk
  }

  async observe(event: ObservationEvent) {
    // React to observation
    console.log(`Turn ${event.turn_number}: intent=${event.pattern.intent}`);
  }

  async shutdown() {
    // Flush state to disk
  }
}
```

Register it by forking the plugin and adding to the `register()` function, or (future) via a plugin extension point.

## Metrics

Run `openclaw multicomp-stats` to see:
- Number of active observers
- Total turns observed
- Observer health

Each observer also writes its own metrics accessible to the cognitive skills (Scar Registry, Competence Model, etc.) during their cron reviews.

## Complexity Analysis

| Metric | Without Plugin | With Plugin | At 10 Observers |
|--------|---------------|------------|-----------------|
| LLM calls/turn | 1 + S (skills) | 1 | 1 |
| Extra tokens/turn | S × 16K | ~50 | ~80 |
| Scaling | O(S × N) | O(N + C) | O(N + C) |
| New observer cost | +N calls/day | +10 tokens/turn | +10 tokens/turn |

## Relationship to Cognitive Skills

This plugin replaces the **real-time observation** part of the 6 cognitive skills. The skills themselves still exist as Markdown instructions for:
- Pattern Cache: deciding when to bypass LLM (Phase 2/3)
- Scar Registry: injecting warnings before tasks
- Competence Model: routing decisions
- Gradient Tracker: weekly analysis and alerts
- Memory Compactor: nightly/weekly/monthly distillation
- Sleep Consolidation: offline cross-cutting analysis

The plugin feeds them data. The skills decide what to do with it.

## The Physics Analogy

An sMTJ race event produces: softmax sample (winner), partition function (min time), rankings (spike order), entropy (intervals), Fisher information (variance), gradients (perturbation response). Nine operations from one event. Zero additional hardware.

An LLM call produces: the response (winner), plus pattern signals, failure signals, competence signals, gradient signals, memory signals. Five observables from one event. Zero additional LLM calls.

The design principle is the same: **don't ask what operation to compute. Ask what observables to extract from the computation that's already happening.**

## License

MIT
