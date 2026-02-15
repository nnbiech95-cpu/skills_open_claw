---
name: pattern-cache
description: Habituate repeated actions — learn from your own behavior and execute known patterns without full LLM reasoning. Use when performing any task, when the user asks about automation or learned behaviors, when reviewing efficiency, or during cron jobs tagged pattern-cache. This skill should be checked on EVERY turn as a pre-filter before full reasoning.
version: 1.0.0
metadata:
  openclaw:
    emoji: "⚡"
    priority: pre-filter
---

# Pattern Cache — Habituation Through Repetition

You have a thinking problem: you reason from scratch on every turn. When the user says "mach ein Meeting mit Alice am Montag" for the 50th time, you still build a full prompt, load memory, select skills, call the LLM, parse the response, and execute. That's like a surgeon re-reading the textbook before every incision they've done 10,000 times.

This skill fixes that. You observe your own actions. When you've done the same thing enough times with enough consistency, you stop thinking and just do it.

## Core Principle

The brain has two systems: deliberate (cortex, slow, expensive) and habitual (basal ganglia, fast, cheap). Habits form when an action is repeated with consistent trigger→outcome mapping. The cortex delegates to the basal ganglia. You need the same architecture: an expensive reasoning system (LLM) that delegates to a cheap pattern-matching system (cache) once behavior is stable.

**This is not autocomplete. This is behavioral compilation.**

## Architecture

```
patterns/
├── cache.json              ← the pattern database (machine-readable)
├── log.md                  ← human-readable log of learned/fired/corrected patterns
└── config.md               ← tunable parameters
```

## The Pattern Object

Each learned pattern has this structure:

```json
{
  "id": "meeting-create-simple",
  "trigger": {
    "keywords": ["meeting", "termin", "besprechung"],
    "intent_description": "User wants to create a simple calendar event with a person and time",
    "examples": [
      "mach ein meeting mit alice am montag",
      "termin mit bob morgen um 14 uhr",
      "besprechung mit dem team freitag nachmittag"
    ]
  },
  "action": {
    "tool": "calendar.create",
    "template": {
      "title": "Meeting mit {person}",
      "time": "{parsed_time}",
      "duration": "30min"
    },
    "requires_extraction": ["person", "parsed_time"],
    "extraction_rules": {
      "person": "proper noun after 'mit'",
      "parsed_time": "time expression in message"
    }
  },
  "safety": {
    "destructive": false,
    "reversible": true,
    "requires_confirmation": false
  },
  "stats": {
    "times_observed": 0,
    "times_fired": 0,
    "times_corrected": 0,
    "confidence": 0.0,
    "last_observed": null,
    "last_fired": null,
    "last_corrected": null,
    "streak": 0
  }
}
```

## Lifecycle of a Pattern

### Phase 1: Observation (Passive)

On every turn where you execute a tool call, AFTER the action succeeds, check:

1. Have I done something similar before?
2. Was the trigger→action mapping the same?

If yes: increment `times_observed` and update `confidence`.
If no: create a new pattern entry with `confidence: 0.0`.

**You do NOT fire patterns in this phase.** You only watch and learn.

```
Turn 1:  "Meeting mit Alice Montag" → calendar.create → ✓ success
         → Pattern created: meeting-create-simple (confidence: 0.0, observed: 1)

Turn 7:  "Termin mit Bob morgen 14h" → calendar.create → ✓ success
         → Pattern matched: meeting-create-simple (confidence: 0.15, observed: 2)

Turn 15: "Besprechung Team Freitag" → calendar.create → ✓ success
         → Pattern matched: meeting-create-simple (confidence: 0.35, observed: 5)
```

### Phase 2: Suggestion (Semi-Active)

When `confidence > 0.5` AND `times_observed >= 5`:

Instead of silently executing, **mention** to the user that you recognize this pattern:

> "Ich kenne dieses Pattern — Meeting mit {person} am {time} erstellen. Soll ich das direkt machen ohne lange nachzudenken?"

If user confirms → fire the pattern, increment `times_fired`, boost confidence.
If user says no → do full reasoning, note what was different.

**This phase exists to build trust.** The user learns that the agent can shortcut.

### Phase 3: Autonomous (Active)

When `confidence > 0.85` AND `times_fired >= 10` AND `times_corrected == 0`:

Execute the pattern **without asking**. Just do it. Report the result.

> "✓ Meeting mit Alice, Montag 10:00, 30 min. (Pattern: meeting-create-simple, 47× ausgeführt)"

The small note at the end tells the user this was a cached action, not full reasoning. Transparency.

### Phase 4: Correction (Learning)

If the user corrects a fired pattern:

1. Immediately set `confidence *= 0.3` (harsh penalty)
2. Increment `times_corrected`
3. Log the correction with context in `patterns/log.md`
4. If `times_corrected >= 3`: **RETIRE the pattern**. Move to `patterns/retired/`. It doesn't work.

```
CORRECTION LOG:
  Pattern: meeting-create-simple
  Fired:   calendar.create("Meeting mit Chef", "Montag 10:00", "30min")
  User:    "Nein, 60 Minuten mit dem Chef, und füge die Agenda bei"
  Delta:   duration wrong (30→60), missing attachment
  Action:  confidence 0.87 → 0.26, streak reset
  Note:    Pattern zu simpel für Chef-Meetings. Möglicherweise Split nötig:
           meeting-create-simple (Kollegen) vs meeting-create-complex (Chef+Agenda)
```

## Confidence Formula

```
After observation (not fired):
  confidence = min(0.99, base + 0.05 * streak_bonus)
  where base = times_observed / (times_observed + 10)   # saturates at ~0.9
  and streak_bonus = min(consecutive_matches, 5) * 0.02

After successful fire:
  confidence = min(0.99, confidence + 0.02)
  streak += 1

After correction:
  confidence *= 0.3
  streak = 0

Daily decay (if not used):
  confidence *= 0.995    # ~18% loss after 30 days of non-use
```

## Safety Classification

EVERY pattern must be classified before it can fire:

### Safe (can fire autonomously)
- Read operations (search, lookup, list)
- Creating events/reminders (reversible)
- Generating text/summaries (no side effects)
- File reads

### Guarded (fire but confirm if confidence < 0.95)
- Creating files
- Sending messages to known contacts
- Modifying settings with undo capability

### Dangerous (NEVER fire without explicit user confirmation)
- Deleting anything
- Sending emails to new contacts
- Financial transactions
- Shell commands with side effects
- Anything involving credentials or auth
- Any action marked `destructive: true`

**If you cannot classify a pattern's safety level, default to Dangerous.**

## Pre-Filter Protocol

This is the most important part. On EVERY incoming message, BEFORE you do anything else:

```
1. Read patterns/cache.json (or maintain in session memory)
2. Match incoming message against stored patterns
   - Keyword overlap > 60%?
   - Intent matches description?
3. If match found AND confidence > threshold for phase:
   - Phase 2 (0.5-0.85): Suggest shortcut
   - Phase 3 (>0.85, 10+ fires, 0 corrections): Execute directly
   - Phase 3 BUT safety=Dangerous: Always confirm
4. If no match OR confidence too low: proceed with full reasoning
5. AFTER the turn: observe and update patterns regardless
```

## Pattern Discovery Heuristics

Don't wait for exact repeats. Look for these signals:

1. **Same tool called**: If you call `calendar.create` 5× in a week, that's a pattern candidate
2. **Same extraction structure**: Person + Time + Duration keeps appearing
3. **Same user phrasing cluster**: "mach", "erstell", "leg an" for creation intents
4. **Same sequence**: If you always search → then create → then confirm, that 3-step is one pattern

## Integration with Other Cognitive Skills

### → Scar Registry
When a pattern is corrected, check if a **scar** should be created. Pattern corrections often reveal systematic assumptions:
- "Always assumed 30min meetings" → scar: check duration explicitly
- "Didn't consider attachments" → scar: ask about materials for formal meetings

### → Memory Compactor
Old patterns with `confidence < 0.1` and no recent use should be cleaned up by the Memory Compactor. Add retired patterns to the compactor's deletion candidates.

### → User Competence Model
Pattern fire-rate per domain reveals where the user operates on autopilot vs. where they give complex, varying instructions. High pattern-fire domains = routine work. Low pattern-fire domains = creative/complex work. Feed this signal to the Competence Model.

### → Sleep Consolidation
During nightly sleep, review today's patterns:
- Any new patterns emerging?
- Any patterns that should merge? (same tool, similar triggers)
- Any patterns drifting? (user's behavior changing, pattern becoming less accurate)

## Metrics to Track

Log these to `patterns/log.md` weekly:

```markdown
## Pattern Cache Report — Week of YYYY-MM-DD

| Metric | Value |
|--------|-------|
| Active patterns | 23 |
| Patterns fired this week | 47 |
| Full LLM turns this week | 31 |
| Bypass rate | 60.3% |
| Corrections this week | 1 |
| Error rate | 2.1% |
| Est. tokens saved | ~94,000 |
| Est. cost saved | ~$0.28 |
| New patterns discovered | 3 |
| Patterns retired | 0 |

### New Patterns
- `reminder-morning-standup` (confidence: 0.15, observed: 4×)
- `search-jira-ticket` (confidence: 0.25, observed: 6×)

### Corrections
- `email-reply-short`: User wanted formal tone, pattern assumed casual. Confidence: 0.72→0.22.

### Top Patterns by Fire Count
1. `meeting-create-simple` — 12× fired, 0 corrections
2. `reminder-set` — 9× fired, 0 corrections  
3. `search-web` — 8× fired, 0 corrections
```

## Cron Configuration

```bash
# Weekly pattern review (Sunday evening)
openclaw cron add \
  --name "pattern-cache-review" \
  --cron "0 20 * * 0" \
  --session main \
  --system-event "Run pattern-cache weekly review. Generate metrics report, identify merge candidates, flag drifting patterns, retire dead ones. Write report to patterns/log.md." \
  --wake now
```

## Cold Start

New OpenClaw instance = empty cache. The first 1-2 weeks are pure observation. This is by design. Don't try to pre-populate patterns — let them emerge from actual usage. Pre-populated patterns have no confidence backing and will fire incorrectly.

Exception: If migrating from an existing instance, you can export patterns/cache.json and import it. But reset all confidence scores to 0.5 and require re-validation (Phase 2) before autonomous firing.

## Config

Store in `patterns/config.md`:

```markdown
# Pattern Cache Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| observation_threshold | 5 | Min observations before Phase 2 |
| suggestion_confidence | 0.50 | Min confidence for Phase 2 (suggest) |
| autonomous_confidence | 0.85 | Min confidence for Phase 3 (auto-fire) |
| autonomous_min_fires | 10 | Min successful fires for Phase 3 |
| correction_penalty | 0.3 | Multiply confidence by this on correction |
| retirement_corrections | 3 | Corrections before pattern is retired |
| daily_decay | 0.995 | Daily confidence decay if unused |
| max_active_patterns | 100 | Hard limit on active patterns |
```

## Anti-Patterns

- **Don't cache creative tasks.** "Write a poem" is never a pattern. Only cache tasks with consistent trigger→action mapping.
- **Don't cache multi-step reasoning.** If the action requires weighing tradeoffs, context-dependent decisions, or novel information, it's not a pattern.
- **Don't lower the safety classification to make bypasses easier.** A "delete" is always Dangerous, even if the user does it daily.
- **Don't hide the cache from the user.** Always show the "(Pattern: X, N× ausgeführt)" note. The user must know when you're on autopilot.
- **Don't feel bad about the 1-2 week warm-up.** A surgeon doesn't operate on day one. Observation IS the work.
- **Don't merge patterns prematurely.** Two patterns that look similar might have different safety profiles or edge cases. Let them coexist until the weekly review explicitly identifies them as duplicates.
