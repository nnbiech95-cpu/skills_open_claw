---
name: gradient-tracker
description: Track rates of change in communication patterns — frequency, latency, sentiment, verbosity per person over time. Use when analyzing communication trends, when the user asks about relationship dynamics, when noticing changes in interaction patterns, or during periodic analytics cron jobs. Also trigger when composing messages to people with active gradient alerts.
version: 1.0.0
metadata:
  openclaw:
    emoji: "📈"
---

# Gradient Tracker — Perceiving Rates of Change

Agents see snapshots. They read today's email and respond. They don't notice that Bob's emails have gotten 30% shorter over two weeks, that response times are climbing, that sentiment is dropping. Humans feel this as "something's off" — a gut feeling driven by unconscious perception of derivatives. This skill gives you that perception.

## Core Principle

The rate of change IS the information. "Bob sent an email" is data. "Bob's emails are getting shorter and slower" is intelligence. You need to track not just states but first derivatives (trends) and second derivatives (acceleration of trends).

## Architecture

```
analytics/
├── baselines/
│   ├── bob.md              ← per-person baseline + current deltas
│   ├── alice.md
│   └── team-engineering.md ← group-level tracking
├── alerts/
│   └── YYYY-MM-DD.md       ← daily gradient alerts
└── config.md                ← tracking preferences
```

## What to Track (Per Person)

For each person the user regularly communicates with, track these metrics:

### Communication Metrics

| Metric | What It Measures | How to Compute |
|--------|-----------------|----------------|
| **Frequency** | Messages per week | Count messages in/out per rolling 7-day window |
| **Latency** | Average response time | Time between user's message and person's reply (and vice versa) |
| **Verbosity** | Average message length | Word count per message |
| **Sentiment** | Emotional tone | Ratio of positive/negative/neutral language. Simple keyword approach is fine — no need for ML. |
| **Initiative** | Who starts conversations | Ratio: person initiates / total conversations |
| **Topic Drift** | What they talk about | Top 3 topics this week vs. last month |

### How to Collect Data

You DON'T scrape or monitor in real-time. Instead:

1. **During interactions**: When you process messages (email, Slack, WhatsApp), note the metadata: sender, timestamp, length, rough sentiment, topic.
2. **During heartbeats**: If you have access to communication history (email client, Slack), batch-process recent messages.
3. **Manually**: User can say "track my communication with Bob" to start tracking.

Write raw observations to `memory/YYYY-MM-DD.md` (the normal daily log). The gradient tracker reads those during its periodic run.

## Baseline File Format

`analytics/baselines/{person}.md`:

```markdown
# Communication Profile: Bob

**Tracking since:** 2026-01-15
**Last updated:** 2026-02-14
**Data points:** 47 messages analyzed

## Baseline (rolling 30-day average)
- Frequency: 12 messages/week
- Latency (their replies): 2.3 hours avg
- Latency (our replies): 1.1 hours avg
- Verbosity: 89 words/message avg
- Sentiment: +0.62 (slightly positive)
- Initiative: 0.40 (they initiate 40% of conversations)

## Current Week
- Frequency: 7 messages/week (▼ 42%)
- Latency (their replies): 5.1 hours (▲ 122%)
- Verbosity: 34 words/message (▼ 62%)
- Sentiment: +0.41 (▼ 34%)
- Initiative: 0.15 (▼ 63%)

## Trend (last 4 weeks)
- Week -3: baseline (no significant deviation)
- Week -2: frequency ▼ 15%, latency ▲ 20%
- Week -1: frequency ▼ 25%, latency ▲ 60%
- Week  0: frequency ▼ 42%, latency ▲ 122%

## Acceleration
- Trend is ACCELERATING. Each week's deviation is larger than the previous.
- Projected next week if trend continues: frequency ▼ 55-65%

## Auto-Assessment
- ALERT LEVEL: HIGH
- Multiple metrics degrading simultaneously and accelerating.
- Possible interpretations: disengagement, external stress, dissatisfaction, workload spike, or vacation/illness.
- NOT a diagnosis. Flagged for awareness.

## History
- 2026-01-28: Sentiment spike (+0.85) — project launch celebration
- 2026-02-03: First notable latency increase
- 2026-02-07: Verbosity drop began
```

## Gradient Alerts

When metrics deviate significantly from baseline, generate an alert in `analytics/alerts/YYYY-MM-DD.md`:

**Alert thresholds:**

| Change from Baseline | Level |
|---------------------|-------|
| < 15% | Normal — no alert |
| 15-30% | NOTICE — note in file, don't surface |
| 30-50% | WARNING — surface during relevant interactions |
| > 50% | ALERT — surface proactively at next heartbeat |
| Multiple metrics > 30% simultaneously | HIGH ALERT — surface immediately |
| Acceleration detected (trend getting worse) | Escalate one level |

**Alert format:**

```markdown
# Gradient Alerts: 2026-02-14

## HIGH ALERT: Bob
Multiple metrics degrading, trend accelerating.
- Frequency: ▼ 42% (was ▼ 25% last week)
- Latency: ▲ 122%
- Verbosity: ▼ 62%
- Sentiment: ▼ 34%
Interpretation: Significant behavioral shift. Consider direct check-in.

## NOTICE: Alice
- Initiative: ▲ 45% (she's starting more conversations)
- Sentiment: ▲ 20%
Interpretation: Increased engagement. Positive signal.
```

## Injection Rules

### During Relevant Interactions
When the user is about to communicate with someone who has an active gradient alert:

> "Note: Bob's communication pattern has shifted significantly this week — shorter messages, slower replies, lower initiative. The trend is accelerating. You might want to keep your message warmer than usual, or consider a direct check-in."

### During Heartbeats
Surface HIGH ALERTs proactively. WARNINGS only if contextually relevant.

### Positive Gradients
ALWAYS surface positive gradients too:

> "Alice has been unusually responsive and enthusiastic this week (+45% initiative, +20% sentiment). Good timing for that collaboration proposal."

### Language
- Always frame as OBSERVATION, never diagnosis: "pattern suggests" not "Bob is unhappy"
- Always offer multiple interpretations: "could indicate stress, workload change, or simply a busy week"
- Never state emotional conclusions as fact

## Group-Level Tracking

For teams (if user interacts with a group), track aggregate metrics:

`analytics/baselines/team-{name}.md`:

```markdown
# Team Profile: Engineering

**Members tracked:** Bob, Alice, Charlie, Dana
**Last updated:** 2026-02-14

## Team Baseline
- Avg messages/week (group channel): 145
- Avg response time: 1.8 hours
- Dominant topics: sprint planning, code review, deployment

## Current Week
- Messages/week: 98 (▼ 32%)
- Response time: 3.2 hours (▲ 78%)

## Individual vs. Team
- Team-wide decline: YES (all 4 members show ▼ frequency)
- This suggests a TEAM issue, not individual.
- Correlate with: upcoming deadline? reorg? holiday?
```

## Privacy Guardrails

**This skill tracks the USER'S OWN communication patterns. Not surveillance.**

- Only analyze messages the user sent or received through integrated channels
- Never track people who don't communicate with the user directly
- Always frame tracking as "your communication patterns" not "monitoring Bob"
- If user asks to track someone they don't directly communicate with: refuse
- All analytics files stay local — never share gradient data externally
- User can disable tracking per person: add `exclude: [name]` to `analytics/config.md`

## Config File

`analytics/config.md`:

```markdown
# Gradient Tracker Configuration

## Tracking
- active: true
- min_data_points: 10 (don't alert until baseline is established)
- baseline_window: 30 days

## Alert Preferences
- surface_positive: true
- surface_warnings: contextual (only when interacting with person)
- surface_alerts: proactive (at heartbeat)

## Exclusions
- exclude: []

## Tracked Persons
- Bob (since 2026-01-15)
- Alice (since 2026-01-20)
- team-engineering (since 2026-02-01)
```

## Cron Configuration

```bash
# Weekly gradient analysis (Sundays at 10pm)
openclaw cron add \
  --name "gradient-tracker-weekly" \
  --cron "0 22 * * 0" \
  --session isolated \
  --message "Run gradient-tracker skill: Update all person baselines in analytics/baselines/. Read this week's communication data from memory/ daily logs. Compute deltas vs 30-day baseline. Generate alerts if thresholds crossed. Write to analytics/alerts/YYYY-MM-DD.md." \
  --model "sonnet"
```

## Bootstrapping

When first installed, there's no baseline yet. For the first 2-4 weeks:

1. During every interaction that involves communication with others, silently note: who, when, message length, rough sentiment, topic
2. After 10+ data points per person, compute initial baseline
3. Don't generate alerts until baseline exists (min 2 weeks of data)
4. Tell the user: "I'm building communication baselines. Gradient alerts will start in ~2 weeks."

## Anti-Patterns

- **Don't over-interpret small samples.** 2 short emails is not a trend. Wait for the baseline.
- **Don't diagnose.** "Bob seems depressed" is NOT your job. "Bob's communication metrics changed significantly" is.
- **Don't track obsessively.** Weekly updates are enough. Daily granularity creates noise.
- **Don't alarm the user.** Frame everything neutrally. A gradient change is information, not a crisis.
- **Don't confuse correlation with causation.** "Metrics dropped during reorg" doesn't mean reorg caused it.
