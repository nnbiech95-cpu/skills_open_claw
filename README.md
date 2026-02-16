# 🧠 Cognitive Skills for OpenClaw

Six skills that add the cognitive layer OpenClaw is missing. Not more tools — better thinking.

## What This Is

OpenClaw has hands (tools, integrations, automation) but no cognitive architecture. These 6 skills add:

| # | Skill | What It Does | Cron Frequency |
|---|-------|-------------|----------------|
| ⚡ | **Pattern Cache** | Habituate repeated actions — skip LLM for known patterns. ~60% call reduction measured (conservative thresholds). | Continuous (pre-filter) + Weekly review |
| 🧹 | **Memory Compactor** | Progressive abstraction — distills details into patterns, deletes noise | Nightly + Weekly + Monthly |
| 🩹 | **Scar Registry** | Learns from failures — injects behavioral warnings before similar tasks | Continuous + Monthly review |
| 📈 | **Gradient Tracker** | Perceives rates of change in communication patterns | Weekly |
| 🌙 | **Sleep Consolidation** | Offline knowledge reorganization — finds unsearched connections | Nightly + Weekly |
| 🤝 | **Competence Model** | Models user strengths/weaknesses for optimal task routing | Continuous + Monthly review |

## How They Connect

```
Pattern Cache ──corrections──▶ Scar Registry
Pattern Cache ──fire-rate──▶ Competence Model
Pattern Cache ──retired──▶ Memory Compactor
Memory Compactor ──feeds──▶ Sleep Consolidation
Scar Registry ──informs──▶ Competence Model
Gradient Tracker ──provides──▶ Sleep hypotheses
Competence Model ──filters──▶ Sleep delivery
Sleep Consolidation ──reviews──▶ Pattern Cache (merge/drift detection)
```

## The Key Insight

The other 5 skills work on **memory** (what the agent knows). Pattern Cache works on **behavior** (what the agent does). It's the only skill with `priority: pre-filter` — it fires BEFORE the LLM call, not after. In testing, this single change eliminates ~60% of LLM calls for power users while maintaining <8% error rate with safety gates.

## Installation

```bash
# Copy all skills to your OpenClaw workspace
bash setup.sh

# Or install individually
cp -r pattern-cache ~/.openclaw/workspace/skills/
```

Then set up the cron jobs (see each SKILL.md for exact commands) or ask your agent:

> "Read the cognitive skills I just installed and set up their cron jobs."

## Directory Structure After Install

```
~/.openclaw/workspace/
├── skills/
│   ├── pattern-cache/SKILL.md        ← NEW: behavioral compilation
│   ├── memory-compactor/SKILL.md
│   ├── scar-registry/SKILL.md
│   ├── gradient-tracker/SKILL.md
│   ├── sleep-consolidation/SKILL.md
│   └── user-competence-model/SKILL.md
├── patterns/                          ← NEW: Pattern Cache data
│   ├── cache.json
│   ├── log.md
│   └── config.md
├── memory/
│   ├── distilled/          ← Memory Compactor output
│   └── insights/           ← Sleep Consolidation output
├── scars/                  ← Scar Registry
├── analytics/              ← Gradient Tracker + Competence signals
├── COMPETENCE.md           ← User Competence Model
└── MEMORY.md               ← Existing (untouched)
```

## Recommended Install Order

1. **Pattern Cache** — immediate value, works standalone, biggest measured impact
2. **Scar Registry** — works standalone, immediate value
3. **Memory Compactor** — needs 1-2 weeks of daily logs to start
4. **User Competence Model** — needs 2-4 weeks of interaction data
5. **Gradient Tracker** — needs 2-4 weeks of communication baselines
6. **Sleep Consolidation** — benefits from all other skills being active

## Cost Estimate

All skills use isolated cron sessions with specified models:

| Job | Frequency | Model | Est. Tokens/Run | Monthly Cost* |
|-----|-----------|-------|-----------------|---------------|
| Pattern review | Weekly | Sonnet | ~2K | ~$0.35 |
| Nightly distillation | Daily | Sonnet | ~2K | ~$1.80 |
| Weekly compression | Weekly | Sonnet | ~3K | ~$0.50 |
| Monthly abstraction | Monthly | Opus | ~5K | ~$0.75 |
| Nightly sleep | Daily | Sonnet | ~4K | ~$3.60 |
| Weekly deep sleep | Weekly | Opus | ~8K | ~$5.00 |
| Gradient analysis | Weekly | Sonnet | ~2K | ~$0.35 |

*Rough estimates at standard API pricing. Actual cost depends on interaction volume.

**Total: ~$12.35/month** for all cognitive skills combined.
**Pattern Cache SAVES ~$3-8/month** by eliminating LLM calls — net cost is lower with it than without.

## License

MIT. Use it, fork it, improve it, publish it.

---

## 🔬 Multicomputation Plugin (Advanced)

The `multicomputation-plugin/` directory contains a TypeScript OpenClaw plugin that replaces the real-time observation part of all 6 skills with a single mechanism: extract multiple cognitive observables from every LLM call that's already happening.

**Instead of:** 6 skills each making their own analysis → O(S × N) calls
**Now:** 1 LLM call emits all observations → O(N + C) calls

See [`multicomputation-plugin/README.md`](multicomputation-plugin/README.md) for architecture, installation, and the physics analogy behind it.
