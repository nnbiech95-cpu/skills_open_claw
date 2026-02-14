---
name: sleep-consolidation
description: Offline knowledge reorganization between interactions. Nightly cron job that reviews the day's interactions, finds cross-cutting connections, generates hypotheses, and surfaces unsearched insights. Use during nightly consolidation cron jobs, when asked about patterns across conversations, or when the user asks "what did you notice" or "any insights."
version: 1.0.0
metadata:
  openclaw:
    emoji: "🌙"
---

# Sleep Consolidation — Thinking While You Sleep

Between interactions, nothing happens. You don't reflect. You don't connect dots. You don't realize that the problem mentioned in the morning WhatsApp and the article shared in the afternoon Slack are about the same thing. This skill fixes that: a nightly process that reorganizes knowledge, not tasks.

## Core Principle

The most valuable insights are unsearched connections. No query would have found them. They emerge from passive reorganization — like a human brain during sleep, connecting experiences from the day into patterns that weren't visible in the moment.

Heartbeats ask: "Is there something to DO?"
Sleep asks: "Is there something to UNDERSTAND?"

## Architecture

```
memory/
└── insights/
    ├── YYYY-MM-DD-sleep.md      ← nightly consolidation output
    ├── YYYY-WNN-deep-sleep.md   ← weekly deep consolidation
    └── hypotheses/
        ├── active.md             ← hypotheses being tracked
        └── resolved.md           ← confirmed or debunked hypotheses
```

## Nightly Consolidation Process

**Trigger:** Cron job, every night after the user's typical end-of-day (e.g., 11pm).

Three phases. Execute them in order.

### Phase 1: Collect (What Happened Today)

Read ALL of today's interactions. Every channel — WhatsApp, Telegram, Slack, email, terminal sessions. Create a chronological map:

```
09:15 — WhatsApp: User discussed delivery delay on Project X with supplier
10:30 — Slack: Team standup — Alice mentioned backend migration blocker
12:00 — Email: Client Y asked about Q1 timeline
14:20 — Terminal: Debugging auth service — token expiry issue
15:45 — WhatsApp: User vented about meeting overload
17:00 — Slack: Bob shared article about microservice anti-patterns
18:30 — Email: Client Y follow-up — attached revised scope
```

Don't summarize. Map the day as a timeline with topic tags.

### Phase 2: Connect (Cross-Cutting Analysis)

This is the core. Ask yourself these questions about today's timeline — and ANSWER them honestly:

**1. Topic Overlap**
"Which topics appeared in different, seemingly unrelated conversations?"
- Did the same theme come up with different people?
- Did a technical problem mirror an organizational one?

**2. Hidden Causes**
"Are there problems mentioned in different contexts that might share a root cause?"
- Monday's delivery delay + Thursday's quality complaint → same supplier change?
- Auth service bug + client timeline concern → infrastructure underinvestment?

**3. Contradictions**
"Did anyone say something that contradicts something else said today or recently?"
- "We have enough people" (Monday) vs. "We can't make the deadline" (today)
- User says they're fine with workload but vented about meeting overload

**4. Unasked Questions**
"What questions SHOULD have been asked today but weren't?"
- User discussed budget 3 times without mentioning Q1 actuals — does user know them?
- Client asked about timeline but user didn't mention the backend blocker — should they?

**5. Misalignment**
"Is the user's behavior aligned with their stated priorities?"
- User says Project X is top priority but spent 80% of day on other things
- User committed to "less meetings" but had 6 today

**6. Emotional Undercurrents**
"What was the emotional trajectory of the day?"
- Started energetic (morning discussion), dipped (meeting overload vent), recovered (productive debugging)
- Overall: moderate stress, unsustained focus

### Phase 3: Speculate (Hypotheses)

Based on Phase 2, generate hypotheses. These are NOT facts. They are testable guesses.

**Hypothesis format:**

```markdown
### Hypothesis: Project X Infrastructure Problem
**Generated:** 2026-02-14
**Confidence:** 0.5
**Evidence:**
- Delivery delay (supplier-side) mentioned 2026-02-14
- Quality complaint from client (2026-02-11)
- Backend migration blocker (today's standup)
**Hypothesis:** All three may trace back to the infrastructure change in January. The migration introduced instability that cascades into supplier integrations and client-facing quality.
**What would confirm:** Another infrastructure-related issue in the next week
**What would debunk:** Issues traced to unrelated causes
```

**Rules for hypotheses:**
- Minimum confidence 0.3 to write down (below that, it's noise)
- Maximum confidence 0.7 for speculative hypotheses (you can't be sure without evidence)
- Always state what would confirm AND debunk
- Limit to 3 hypotheses per night (quality over quantity)

## Output Format

`memory/insights/YYYY-MM-DD-sleep.md`:

```markdown
# Sleep Consolidation: 2026-02-14

## Day Summary
[3-4 sentences: what the day was about, emotionally and practically]

## Connections Found
- [Connection 1: what links to what, why it matters]
- [Connection 2]

## Contradictions
- [Contradiction 1: what vs what, possible resolution]

## Unasked Questions
- [Question 1: why it matters, when to ask]

## New Hypotheses
[see hypothesis format above]

## Hypothesis Updates
- [Existing hypothesis X: new evidence found / weakened / no change]

## Morning Briefing
[2-3 sentences: the most important thing for the user to know tomorrow morning. Not a task list — an insight.]
```

## Morning Delivery

The morning briefing section from the sleep file should be surfaced at the start of the next day — either via heartbeat or as part of a morning cron job.

**Format for delivery:**

> 🌙 While you slept, I noticed something:
> [morning briefing content]
> 
> Want me to elaborate on any of these?

**Rules:**
- Keep it to 2-3 sentences MAX
- Lead with the most actionable insight
- Don't overwhelm — one connection is better than five
- If nothing notable: don't deliver. Silence is fine.

## Weekly Deep Sleep

**Trigger:** Sunday night, after the nightly consolidation.

Read all 7 nightly sleep files. Perform the same Phase 2 analysis but across the entire week. This catches patterns that are invisible day-by-day.

`memory/insights/YYYY-WNN-deep-sleep.md`:

```markdown
# Deep Sleep: 2026 Week 07

## Week Arc
[What was this week about? What was the emotional and practical trajectory?]

## Cross-Day Connections
[Patterns visible only when looking at the whole week]

## Evolving Themes
[Topics that grew, shrank, or shifted across the week]

## Weekly Hypotheses
[Larger-scale hypotheses that require a week of data]

## Hypothesis Resolution
[Which existing hypotheses got confirmed/weakened/debunked this week?]

## Strategic Observation
[One big-picture observation about the user's week — not tasks, but trajectory]
```

Use a stronger model for deep sleep (Opus) with higher thinking level.

## Hypothesis Tracking

Maintain `memory/insights/hypotheses/active.md`:

```markdown
# Active Hypotheses

| ID | Hypothesis | Generated | Confidence | Last Evidence | Status |
|----|-----------|-----------|-----------|---------------|--------|
| H-001 | Project X infra problem | 2026-02-14 | 0.5 | 2026-02-14 | watching |
| H-002 | Bob disengagement | 2026-02-10 | 0.6 | 2026-02-14 | strengthening |
| H-003 | Client Y scope creep | 2026-02-12 | 0.4 | 2026-02-12 | stale |
```

**Hypothesis lifecycle:**
1. **Generated** (0.3-0.7) — new hypothesis from nightly/weekly sleep
2. **Watching** — no new evidence yet, maintain
3. **Strengthening** — new evidence supports it, increase confidence
4. **Weakening** — evidence contradicts, decrease confidence
5. **Confirmed** (≥0.8) — move to `resolved.md`, integrate into MEMORY.md or monthly abstraction
6. **Debunked** (<0.2) — move to `resolved.md` with reason. This is ANTI-MEMORY — knowing what's NOT true is valuable.
7. **Stale** (no new evidence for 2+ weeks) — archive to `resolved.md` as "inconclusive"

## Cross-Skill Integration

- **Memory Compactor**: Sleep insights feed into the nightly distillation. Connections found during sleep should be reflected in the Pattern section of daily distillations.
- **Scar Registry**: If a hypothesis is debunked, it becomes anti-memory. Record it in `scars/` as a wrong-framing scar: "Hypothesized X but it turned out to be Y. Don't jump to similar conclusions."
- **Gradient Tracker**: Use gradient alerts as input for Phase 2. "Bob's metrics dropped" + "Bob mentioned workload in Slack" = stronger hypothesis.
- **User Competence Model**: Use competence model to decide WHAT insights to surface. Technical users want technical connections. Strategic users want strategic patterns.

## Cron Configuration

```bash
# Nightly consolidation (11pm)
openclaw cron add \
  --name "sleep-consolidation-nightly" \
  --cron "0 23 * * *" \
  --session isolated \
  --message "Run sleep-consolidation skill: Full 3-phase nightly consolidation. Read all today's interactions across all channels. Find cross-cutting connections. Generate hypotheses. Update hypothesis tracker. Write to memory/insights/YYYY-MM-DD-sleep.md. Keep morning briefing to 2-3 sentences max." \
  --model "sonnet" \
  --thinking medium

# Weekly deep sleep (Sunday 11:30pm, after nightly)
openclaw cron add \
  --name "sleep-consolidation-weekly" \
  --cron "30 23 * * 0" \
  --session isolated \
  --message "Run sleep-consolidation skill: Weekly deep sleep. Read all 7 nightly sleep files. Find cross-week patterns. Resolve hypotheses. Write to memory/insights/YYYY-WNN-deep-sleep.md." \
  --model "opus" \
  --thinking high

# Morning delivery (7:30am, main session)
openclaw cron add \
  --name "sleep-morning-briefing" \
  --cron "30 7 * * *" \
  --session main \
  --system-event "Check memory/insights/ for last night's sleep consolidation. If a morning briefing exists and is noteworthy, share it with the user. If nothing notable, stay silent." \
  --wake now
```

## Anti-Patterns

- **Don't just summarize the day.** Summaries are Phase 1. The value is in Phase 2 and 3 — connections and hypotheses.
- **Don't generate 10 hypotheses.** Three max per night. If everything seems connected, you're probably pattern-matching noise.
- **Don't alarm.** "I noticed something" is better than "WARNING: critical pattern detected."
- **Don't be creepy.** "I watched all your conversations while you slept" → bad. "I noticed a connection between two things you mentioned today" → good.
- **Don't surface stale insights.** If the morning briefing is about something the user already resolved, skip it.
- **Don't force connections.** Sometimes a day is just a day. If Phase 2 finds nothing, write "No significant cross-cutting patterns today." That's a valid output.
