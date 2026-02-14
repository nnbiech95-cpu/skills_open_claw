# 🧠 Cognitive Skills for OpenClaw

Five skills that add the cognitive layer OpenClaw is missing. Not more tools — better thinking.

## What This Is

OpenClaw has hands (tools, integrations, automation) but no cognitive architecture. These 5 skills add:

| # | Skill | What It Does | Cron Frequency |
|---|-------|-------------|----------------|
| 🧹 | **Memory Compactor** | Progressive abstraction — distills details into patterns, deletes noise | Nightly + Weekly + Monthly |
| 🩹 | **Scar Registry** | Learns from failures — injects behavioral warnings before similar tasks | Continuous + Monthly review |
| 📈 | **Gradient Tracker** | Perceives rates of change in communication patterns | Weekly |
| 🌙 | **Sleep Consolidation** | Offline knowledge reorganization — finds unsearched connections | Nightly + Weekly |
| 🤝 | **Competence Model** | Models user strengths/weaknesses for optimal task routing | Continuous + Monthly review |

## How They Connect

```
Memory Compactor ──feeds──▶ Sleep Consolidation
Scar Registry ──informs──▶ Competence Model
Gradient Tracker ──provides──▶ Sleep hypotheses
Competence Model ──filters──▶ Sleep delivery
Scars + Competence = Calibrated self-awareness
```

## Installation

```bash
# Copy all skills to your OpenClaw workspace
cp -r cognitive-skills/* ~/.openclaw/workspace/skills/

# Or install individually
cp -r cognitive-skills/memory-compactor ~/.openclaw/workspace/skills/
```

Then set up the cron jobs (see each SKILL.md for exact commands) or ask your agent:

> "Read the cognitive skills I just installed and set up their cron jobs."

## Directory Structure After Install

```
~/.openclaw/workspace/
├── skills/
│   ├── memory-compactor/SKILL.md
│   ├── scar-registry/SKILL.md
│   ├── gradient-tracker/SKILL.md
│   ├── sleep-consolidation/SKILL.md
│   └── user-competence-model/SKILL.md
├── memory/
│   ├── distilled/          ← Memory Compactor output
│   └── insights/           ← Sleep Consolidation output
├── scars/                  ← Scar Registry
├── analytics/              ← Gradient Tracker + Competence signals
├── COMPETENCE.md           ← User Competence Model
└── MEMORY.md               ← Existing (untouched)
```

## Recommended Install Order

1. **Scar Registry** — works standalone, immediate value
2. **Memory Compactor** — needs 1-2 weeks of daily logs to start
3. **User Competence Model** — needs 2-4 weeks of interaction data
4. **Gradient Tracker** — needs 2-4 weeks of communication baselines
5. **Sleep Consolidation** — benefits from all other skills being active

## Cost Estimate

All skills use isolated cron sessions with specified models:

| Job | Frequency | Model | Est. Tokens/Run | Monthly Cost* |
|-----|-----------|-------|-----------------|---------------|
| Nightly distillation | Daily | Sonnet | ~2K | ~$1.80 |
| Weekly compression | Weekly | Sonnet | ~3K | ~$0.50 |
| Monthly abstraction | Monthly | Opus | ~5K | ~$0.75 |
| Nightly sleep | Daily | Sonnet | ~4K | ~$3.60 |
| Weekly deep sleep | Weekly | Opus | ~8K | ~$5.00 |
| Gradient analysis | Weekly | Sonnet | ~2K | ~$0.35 |

*Rough estimates at standard API pricing. Actual cost depends on interaction volume.

**Total: ~$12/month** for all cognitive skills combined.

## License

MIT. Use it, fork it, improve it, publish it.
