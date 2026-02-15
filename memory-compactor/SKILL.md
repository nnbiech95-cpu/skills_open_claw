---
name: memory-compactor
description: Strategic forgetting through progressive abstraction. Distills daily logs into patterns, compresses weekly into principles, and deletes obsolete details. Use when managing long-term memory, when memory files grow too large, when asked about memory maintenance, or during nightly/weekly/monthly cron jobs tagged with memory-compactor.
version: 1.0.0
metadata:
  openclaw:
    emoji: "🧹"
---

# Memory Compactor — Strategic Forgetting

You have a memory problem: everything is append-only. After months of operation, daily logs pile up with no distinction between noise ("meeting at 3pm Tuesday") and signal ("Bob blocks when uncertain"). This skill fixes that by progressively abstracting memories — preserving wisdom while deleting details.

## Core Principle

Information has a half-life. A meeting time matters today, not in a month. But the *pattern* revealed by many meetings persists forever. Your job is to distill details into patterns, and patterns into principles, then let the details go.

## Memory Architecture

You maintain three layers under `memory/distilled/`:

```
memory/
├── YYYY-MM-DD.md              ← raw daily logs (existing, untouched)
├── MEMORY.md                   ← existing long-term memory (untouched)
└── distilled/
    ├── day-YYYY-MM-DD.md       ← nightly distillation
    ├── week-YYYY-WNN.md        ← weekly compression
    └── month-YYYY-MM.md        ← monthly abstraction
```

## Tier 1: Nightly Distillation

**Trigger:** Run every night (cron or heartbeat). Process yesterday's `memory/YYYY-MM-DD.md`.

**Process:** Read the raw daily log. Extract exactly three categories — nothing else:

### Facts
Concrete new information: names, decisions, numbers, commitments, deadlines.
- "Project X deadline moved to March 15"
- "New team member: Sarah, backend engineer"
- "Budget approved: €50K for Q2"

### Patterns
Recurring behaviors — confirmed or newly observed:
- "Bob pushed back on timeline again (3rd time this month)"
- "User prefers bullet points over prose in reports"
- "Deployment issues consistently happen on Fridays"

### Anomalies
Things that broke expectations and deserve attention:
- "Alice volunteered for a presentation (never done before)"
- "Client responded within 5 minutes (usual: 2 days)"
- "No standup happened — first skip in 6 weeks"

**Output format** for `memory/distilled/day-YYYY-MM-DD.md`:

```markdown
# Daily Distillation: YYYY-MM-DD

## Facts
- [fact 1]
- [fact 2]

## Patterns
- [pattern 1 — new/confirmed/strengthened]
- [pattern 2]

## Anomalies
- [anomaly 1 — why unexpected, possible interpretation]
```

**Rules:**
- Be ruthless. A 500-word daily log should compress to 50-100 words.
- Tag patterns as `new`, `confirmed`, or `strengthened`.
- For anomalies, always note WHY it was unexpected and one possible interpretation.
- If nothing noteworthy happened, write: "No significant facts, patterns, or anomalies."

## Tier 2: Weekly Compression

**Trigger:** Run every Sunday night. Process all 7 daily distillations of the past week.

**Process:** Read `day-YYYY-MM-DD.md` files for the past 7 days. Merge them:

1. **Facts that didn't change** → keep as-is
2. **Facts that contradict earlier facts** → mark as "Updated: [old] → [new]"
3. **Patterns confirmed across multiple days** → strengthen with count: "Pattern (confirmed 4x this week)"
4. **Anomalies that turned out to be normal** → delete
5. **Anomalies that recurred** → promote to Pattern
6. **One-off facts with no lasting relevance** → delete

**Output format** for `memory/distilled/week-YYYY-WNN.md`:

```markdown
# Weekly Compression: YYYY Week NN

## Durable Facts
- [facts that matter beyond this week]

## Confirmed Patterns
- [pattern — Nx this week, trend: strengthening/stable/weakening]

## Emerging Patterns (promoted from anomalies)
- [former anomaly now looking systematic]

## Open Questions
- [things that remain unresolved and need watching]
```

## Tier 3: Monthly Abstraction

**Trigger:** Run on the 1st of each month. Process 4 weekly compressions.

**Process:** This is the critical jump — from facts to principles.

Transform specific observations into general operating knowledge:

- "Bob pushed back on timeline 12 times" → "Bob has a systematic commitment avoidance pattern with deadlines. Mitigation: set deadlines 20% earlier with him."
- "Infra had 8 blockers across 4 projects" → "Infrastructure is the systemic bottleneck. Any project touching infra needs 2x buffer."
- "User complained every Monday" → "User has a Monday stress pattern. Be more diplomatic in Monday communications."

**Output format** for `memory/distilled/month-YYYY-MM.md`:

```markdown
# Monthly Abstraction: YYYY-MM

## Principles Learned
- [principle 1 — derived from what observations]
- [principle 2]

## Relationship Dynamics
- [person/team dynamics that crystallized this month]

## Operational Insights
- [what works, what doesn't, what to change]

## Updated Priors
- [beliefs that changed based on this month's evidence]
```

## Deletion Schedule

After distillation, older layers become redundant. Delete them:

| Layer | Delete after | Reason |
|-------|-------------|--------|
| Raw daily logs (`memory/YYYY-MM-DD.md`) | 14 days | Daily distillation exists |
| Daily distillations (`distilled/day-*.md`) | 8 weeks | Weekly compression exists |
| Weekly compressions (`distilled/week-*.md`) | 6 months | Monthly abstraction exists |
| Monthly abstractions (`distilled/month-*.md`) | Never | Permanent operating knowledge |
| `MEMORY.md` | Never | User-curated, never auto-delete |

**Before deleting any file**, check if the corresponding higher-level distillation exists. Never delete a daily log if no weekly compression covers it yet.

## Forgetting Veto (Optional)

Before batch-deleting old files, generate a brief list:

```
📋 Memory Cleanup: These details will be forgotten tomorrow:
- 2026-01-15: Meeting notes with Sarah about API migration
- 2026-01-16: Debugging session for auth token issue
- 2026-01-17: Discussion about office relocation

The patterns from these have been captured in week-2026-W03.md.
Reply "keep [date]" to preserve any specific day.
```

Only show this if the user has opted in via `MEMORY.md` containing `memory-compactor: verbose`.

## Cross-Reference with Other Cognitive Skills

- When writing **Anomalies**, check `scars/` directory (Scar Registry skill) for related failure patterns.
- When writing **Patterns about people**, feed into `analytics/` (Gradient Tracker skill) if it exists.
- Monthly abstractions should be available to the Sleep Consolidation skill for cross-cutting analysis.

## Cron Configuration

Add to `openclaw.json` or create via CLI:

```bash
# Nightly distillation (runs at 11pm)
openclaw cron add \
  --name "memory-compactor-nightly" \
  --cron "0 23 * * *" \
  --session isolated \
  --message "Run the memory-compactor skill: Tier 1 nightly distillation for today. Read today's memory/YYYY-MM-DD.md, create the distilled/day-YYYY-MM-DD.md file. Then check if any daily logs older than 14 days can be deleted (only if their weekly compression exists)." \
  --model "sonnet"

# Weekly compression (Sundays at 11:30pm)
openclaw cron add \
  --name "memory-compactor-weekly" \
  --cron "30 23 * * 0" \
  --session isolated \
  --message "Run the memory-compactor skill: Tier 2 weekly compression. Read all distilled/day-*.md files from this week, create distilled/week-YYYY-WNN.md. Then check if any daily distillations older than 8 weeks can be deleted." \
  --model "sonnet"

# Monthly abstraction (1st of month at midnight)
openclaw cron add \
  --name "memory-compactor-monthly" \
  --cron "0 0 1 * *" \
  --session isolated \
  --message "Run the memory-compactor skill: Tier 3 monthly abstraction. Read all distilled/week-*.md files from last month, create distilled/month-YYYY-MM.md. Use a stronger model and deeper thinking. Then check if weekly compressions older than 6 months can be deleted." \
  --model "opus" \
  --thinking high
```

## Integration with Pattern Cache

Retired patterns from the Pattern Cache skill (confidence < 0.1, moved to `patterns/retired/`) are deletion candidates. During weekly compression, check `patterns/retired/` and delete entries older than 30 days.

## Anti-Patterns (Don't Do This)

- **Don't summarize** — Summaries are shorter versions of the same thing. Distillation extracts DIFFERENT things (patterns, not content).
- **Don't keep everything** — The point is deletion. If you can't bring yourself to delete, the skill isn't working.
- **Don't distill MEMORY.md** — That file is user-curated. Never touch it automatically.
- **Don't create empty files** — If a day had nothing worth distilling, don't create a day file. Absence of a file IS information.
