---
name: scar-registry
description: Persistent failure tracking that modifies agent behavior. Detects failures, analyzes root causes, and injects warnings before similar tasks. Use when a task fails, when the user corrects you, when code errors occur, when reviewing past performance, or when starting tasks that match known failure patterns. Also triggers on cron jobs tagged scar-registry.
version: 1.0.0
metadata:
  openclaw:
    emoji: "🩹"
---

# Scar Registry — Learning From Failure

A scar is not memory. Memory tells you WHAT happened. A scar changes HOW YOU BEHAVE. After this skill, you don't just remember that you forgot to check port availability — you automatically check it before every Docker task because the scar fires a warning.

## Core Principle

A surgeon who lost a patient doesn't have more knowledge afterward. They have different priors. Their perception, caution, and timing are permanently altered. That behavioral deformation is what this skill creates.

## Architecture

```
scars/
├── index.md                    ← summary of all active scars with confidence scores
├── 2026-02-14-docker-port.md   ← individual scar files
├── 2026-02-10-env-vars.md
├── meta/
│   ├── clusters.md             ← meta-scars (grouped patterns)
│   └── strengths.md            ← positive scars (consistent successes)
```

## When to Create a Scar

Trigger scar creation when ANY of these occur:

1. **User explicitly corrects you**: "No, that's wrong" / "That's not what I meant" / user rewrites your output
2. **User rejects output**: Thumbs down, "try again", "that's not it"
3. **Code execution fails**: Error, exception, test failure
4. **Tool call returns error**: API error, timeout, permission denied
5. **You catch your own mistake**: Self-correction mid-response
6. **User provides the same correction twice**: This is a STRONG signal — the first scar didn't prevent recurrence

Do NOT create scars for:
- User changing their mind (not your failure)
- Ambiguous requests where multiple interpretations were valid
- External failures (API down, network issues)

## Scar File Format

When triggered, create `scars/YYYY-MM-DD-{slug}.md`:

```markdown
# Scar: {slug}

**Date:** YYYY-MM-DD
**Trigger:** [what happened — user correction / code error / self-catch]
**Confidence:** 0.3

## What Happened
[2-3 sentences: the concrete failure]

## Why It Happened
[Root cause analysis — not "I made a mistake" but WHY specifically]

## Cognitive Category
[One of: overconfidence | wrong-framing | scope-blindness | assumption-without-validation | pattern-mismatch | communication-failure]

## Behavioral Change
[Specific, actionable change: "Before any Docker task, check port availability with `lsof -i :{port}` FIRST"]

## Trigger Conditions
[When should this scar fire? Be specific]
- task_type: [docker, deployment, api-integration, ...]
- tools: [docker, ssh, curl, ...]
- keywords: [port, container, deploy, ...]

## Related Scars
- [links to related scars if they exist]
```

## Confidence Evolution

Scars have a confidence score that evolves:

| Event | Confidence Change |
|-------|------------------|
| First occurrence | Set to 0.3 |
| Second similar failure | Increase to 0.5 |
| Third similar failure | Increase to 0.7 |
| Fourth+ similar failure | Increase to 0.9 |
| Success despite warning (scar fired, task succeeded) | Decrease by 0.1 |
| Success without warning (similar task, no scar fired) | No change |
| User marks scar as irrelevant | Decrease to 0.1 |

**Scars never reach 0.0.** Minimum confidence is 0.1. A scar at 0.1 still exists but doesn't inject warnings — it only logs silently.

**Scars never reach 1.0.** Maximum is 0.9. Always leave room for the possibility that the pattern has changed.

Update confidence in the scar file AND in `scars/index.md` whenever it changes.

## Pre-Task Injection (The Critical Part)

**Before beginning ANY task**, scan `scars/index.md` for matching scars. Match on:
- `task_type` overlap
- `tools` that will be used
- `keywords` in the user's request

If a match is found with confidence ≥ 0.3, inject a warning into your own reasoning:

```
⚠️ SCAR ALERT [confidence: 0.7]
Scar: docker-port (2026-02-14)
On similar tasks you have a documented tendency to skip precondition checks.
Behavioral change: Check port availability with `lsof -i :{port}` BEFORE starting containers.
Related: env-vars (2026-02-10) — also a precondition skip.
```

**Rules for injection:**
- Confidence ≥ 0.7: ALWAYS mention the scar to yourself before starting. Follow the behavioral change strictly.
- Confidence 0.4-0.6: Note the scar internally. Be extra careful in that area.
- Confidence 0.3: Awareness only. No behavior change required.
- Below 0.3: No injection.

## Scar Clustering (Meta-Scars)

When 3+ individual scars share a cognitive category, create a meta-scar in `scars/meta/clusters.md`:

```markdown
## Meta-Scar: Insufficient Precondition Checking
**Confidence:** 0.8
**Members:** docker-port, env-vars, dependency-check, api-auth
**Pattern:** Systematic tendency to skip validation steps before executing. 
             Appears across Docker, deployment, and API integration tasks.
**Universal Behavioral Change:** Before ANY multi-step technical task, 
             explicitly list and verify preconditions before step 1.
```

Meta-scars trigger MORE broadly than individual scars. The meta-scar above fires on ALL technical tasks, not just Docker.

## Positive Scars (Strengths)

Track consistent successes in `scars/meta/strengths.md`:

```markdown
## Strength: Code Review Analysis
**Evidence:** User accepted code review output 12/12 times without edits
**Confidence:** 0.85
**Implication:** Can act more autonomously on code review tasks

## Strength: Strategic Framing
**Evidence:** User said "exactly" or "perfect" on 8/10 strategy discussions
**Confidence:** 0.75
**Implication:** Strategy suggestions can be more assertive
```

Positive scars connect to the User Competence Model skill: areas where you're strong are areas where you can defer less to the user.

## Manual Scars

The user can create scars directly by saying things like:
- "You tend to write too long" → Create scar: verbosity, broad trigger
- "When I say 'quick' I still mean thorough" → Create scar: communication-failure, keyword trigger "quick"
- "Always test your code before showing it to me" → Create scar: overconfidence, all code tasks

Manual scars start at confidence 0.6 (user is explicitly telling you, so it's more reliable than self-detection).

## Monthly Scar Review

On the 1st of each month (or when asked), present the user with a scar summary:

```
🩹 Scar Review — February 2026

Active scars: 7 (3 high confidence, 2 medium, 2 low)

Top 3 by confidence:
1. [0.9] Insufficient precondition checking (meta-scar, 4 members)
2. [0.7] Verbose responses when user wants brevity
3. [0.7] Assumes Python when user prefers TypeScript

Healing: 
- "API timeout handling" dropped from 0.5 to 0.2 (3 successes in a row)

Do any of these feel wrong or outdated? Reply with the scar name to adjust.
```

## Cron Configuration

```bash
# Monthly scar review (1st of month, morning)
openclaw cron add \
  --name "scar-review-monthly" \
  --cron "0 8 1 * *" \
  --session main \
  --system-event "Run scar-registry monthly review. Present top scars, healing scars, and ask if any need adjustment." \
  --wake now
```

## Index File Format

Maintain `scars/index.md` as a quick-lookup table:

```markdown
# Scar Index

| Scar | Confidence | Category | Triggers On | Last Updated |
|------|-----------|----------|-------------|-------------|
| docker-port | 0.7 | assumption-without-validation | docker, port, container | 2026-02-14 |
| env-vars | 0.5 | assumption-without-validation | deploy, env, config | 2026-02-10 |
| verbose-responses | 0.7 | communication-failure | * (all tasks) | 2026-02-12 |

## Meta-Scars
| Meta-Scar | Confidence | Members | Triggers On |
|-----------|-----------|---------|-------------|
| precondition-checking | 0.8 | docker-port, env-vars, dep-check, api-auth | all technical tasks |

## Strengths
| Strength | Confidence | Domain |
|----------|-----------|--------|
| code-review | 0.85 | code review |
| strategic-framing | 0.75 | strategy, planning |
```

## Anti-Patterns

- **Don't create scars for everything.** A scar for every minor issue creates noise. Only scar on things that should change behavior.
- **Don't make scars too specific.** "Forgot to add semicolon in line 42 of auth.ts" is not a scar. "Tends to produce syntactically incomplete code blocks" is.
- **Don't make scars too broad.** "Makes mistakes" is not a scar. It needs to be actionable.
- **Don't ignore low-confidence scars.** They're healing, not dead. If they re-trigger, confidence jumps back.
- **Don't apologize when a scar fires.** Just follow the behavioral change silently. The user doesn't need to know a scar activated unless they ask.
