---
name: user-competence-model
description: Build and maintain a model of the user's strengths, weaknesses, and preferences to optimize human-AI task routing. Use when deciding how much autonomy to take, when to ask vs act, when the user gives feedback on your output, when routing decisions between asking and doing, or when reviewing competence data.
version: 1.0.0
metadata:
  openclaw:
    emoji: "🤝"
---

# User Competence Model — Know Your Human

You treat every domain equally. You ask experts for confirmation (annoying) and act autonomously where you shouldn't (dangerous). A great assistant knows WHEN to ask and WHEN to act. That requires a model of your human — not just their preferences, but their competencies, their patterns, their rhythms.

## Core Principle

The optimal human-AI split is domain-dependent, person-dependent, and context-dependent. A CTO should be consulted on architecture, not on CSS fixes. A designer should be consulted on visuals, not on deployment scripts. And the same person wants more autonomy on Friday afternoon than Monday morning. Model all of it.

## Architecture

```
COMPETENCE.md                  ← main competence model (workspace root)
analytics/
└── competence/
    ├── signals.md             ← raw interaction signals log
    ├── team-map.md            ← team competence routing (optional)
    └── history.md             ← how the model evolved over time
```

## Signal Collection

Every interaction produces competence signals. Observe them passively — never survey the user.

### Signal Types

| User Behavior | Signal | Competence Implication |
|--------------|--------|----------------------|
| User corrects your output | CORRECTION | User is competent here. You were wrong. Ask more next time. |
| User says "just do it" / "go ahead" | DEFER | User trusts you OR doesn't care. Track which. |
| User reworks your output significantly | REWORK | You're weak here. Less autonomy needed. |
| User accepts without comment | ACCEPT | Either good work or unreviewed. Ambiguous. |
| User asks detailed follow-up questions | ENGAGE | User is competent AND engaged. Discussion mode. |
| User provides additional context unprompted | EXPERT | User knows more than you in this area. |
| User says "good" / "exactly" / "perfect" | PRAISE | Your output matched their expectation. Strength area. |
| User ignores your suggestion | IGNORE | Either irrelevant suggestion or user disagrees silently. |
| User delegates entire task without review | FULL-DEFER | Maximum trust in this domain. |

### How to Log

Append to `analytics/competence/signals.md`:

```markdown
## 2026-02-14

- 09:15 | CORRECTION | domain:python | User fixed list comprehension idiom
- 10:30 | DEFER | domain:devops | "just deploy it" — no review requested
- 11:00 | ENGAGE | domain:strategy | User asked 4 follow-up questions on competitive analysis
- 14:20 | REWORK | domain:writing | User rewrote 60% of the email draft
- 16:00 | PRAISE | domain:code-review | "exactly what I needed"
```

## COMPETENCE.md Format

The main model file. Lives at workspace root so it loads in every session.

```markdown
# User Competence Model

**Last updated:** 2026-02-14
**Data points:** 156 interactions analyzed
**Model confidence:** medium (2 months of data)

---

## Strengths (High Confidence)

### Strategic Thinking
- Evidence: 14 ENGAGE signals, 2 EXPERT signals, 0 CORRECTIONS in strategy discussions
- Pattern: User gives direction, asks probing questions, builds on suggestions
- Routing: Present OPTIONS, let user DECIDE. Don't prescribe.

### Python Development
- Evidence: 8 CORRECTIONS on idiomatic code, 3 EXPERT signals (user wrote better versions)
- Pattern: User knows Python deeply — corrects you on idioms and patterns
- Routing: Suggest code but EXPLICITLY ask for review. User sees things you miss.

---

## Defers (High Confidence)

### DevOps / Infrastructure
- Evidence: 12 DEFER signals, 0 CORRECTIONS, 0 REWORKS
- Pattern: "just do it" consistently. Never reviews deployment configs.
- Routing: Act AUTONOMOUSLY. Only confirm for destructive actions (delete, overwrite).

### Regex / Text Processing
- Evidence: 6 DEFER signals, 0 engagement
- Routing: Act autonomously. User doesn't want to think about regex.

---

## Weaknesses (Handle With Care)

### Email Drafting
- Evidence: 5 REWORK signals — user rewrites 40-70% of drafts
- Pattern: You don't match their tone. Too formal? Too verbose? Unclear.
- Routing: Provide SHORT drafts and ask "does this match your tone?" Iterate.
- Action: Study their sent emails to learn their voice.

---

## Developing Areas (Low Confidence)

### Design Decisions
- Evidence: Mixed signals. 3 ENGAGE, 2 DEFER, 1 CORRECTION
- Pattern: Inconsistent. Sometimes strong opinions, sometimes "whatever you think"
- Routing: Default to ASKING, but don't block. "I'll go with X unless you prefer otherwise."

---

## Contextual Modifiers

### Time-Based
- **Mornings (before 10am):** User is terse, wants speed. Fewer questions.
- **Evenings (after 6pm):** More relaxed, tolerates discussion. More ENGAGE signals.
- **Mondays:** Higher stress. More DEFER signals (wants things done, not discussed).
- **Fridays:** More exploratory. Higher tolerance for options and tangents.

### Situation-Based
- **Under deadline:** Maximum autonomy requested. "Just do it" frequency 3x.
- **New project:** Wants to explore. Discussion mode. More questions welcome.
- **After receiving criticism:** Wants validation. Be more careful with pushback.

---

## Agent Self-Model

### My Strengths (from user's perspective)
- Code review analysis: 12/12 accepted without edits (confidence: 0.85)
- Research synthesis: 9/10 praised (confidence: 0.80)
- Technical explanations: consistent PRAISE signals

### My Weaknesses (from user's perspective)
- Email drafting: 5/8 reworked (confidence: 0.75 that I'm bad at this)
- Brevity: Scar "verbose-responses" active at 0.7
- Understanding implicit requests: 3 CORRECTION signals for "that's not what I meant"

---

## Routing Quick Reference

| Domain | User Competence | My Competence | Action |
|--------|----------------|---------------|--------|
| Strategy | HIGH | MEDIUM | Present options, user decides |
| Python | HIGH | MEDIUM | Suggest + ask for review |
| DevOps | LOW/DEFER | HIGH | Act autonomously |
| Code Review | MEDIUM | HIGH | Act, user accepts |
| Email Writing | HIGH | LOW | Short draft + iterate |
| Design | UNCLEAR | MEDIUM | Ask, but don't block |
```

## Routing Logic

Before every task, check COMPETENCE.md. The routing decision follows this matrix:

```
User HIGH competence + Engaged → DISCUSSION MODE
  Present 2-3 options with tradeoffs. Let user decide.
  "Here are three approaches: A does X, B does Y. What fits better?"

User HIGH competence + Not Engaged → BRIEF CHECK MODE
  Act, but show key decision briefly. Don't block.
  "Going with approach A. Shout if you'd prefer otherwise."

User DEFERS → AUTONOMY MODE
  Act without asking. Only confirm destructive actions.
  Just do it. Report results, not plans.

User competence UNCLEAR → GENTLE PROBE MODE
  Act with default, ask once if it fits.
  "I went with X. Does that work for you?"
  Track response to update model.

My competence LOW (scar active) → DEFER MODE
  Flag uncertainty explicitly.
  "I have a weak track record here. Here's my suggestion, but please review carefully."
```

## Contextual Override

Time and situation can override the base model:

```
IF user_under_deadline AND task_not_destructive:
    increase autonomy one level (Discussion → Brief Check, Brief Check → Autonomy)

IF user_exploring_new_project:
    decrease autonomy one level (Autonomy → Brief Check, Brief Check → Discussion)

IF monday_morning:
    increase autonomy one level (user wants speed)

IF friday_evening:
    decrease autonomy one level (user tolerates discussion)
```

## Team Competence Map (Optional)

If interacting with multiple people (Slack team, email threads), build `analytics/competence/team-map.md`:

```markdown
# Team Competence Map

| Person | Strength | Go-To For |
|--------|----------|-----------|
| Alice | Frontend, Design | UI decisions, CSS issues |
| Bob | Backend, APIs | Architecture questions, API design |
| Charlie | Infra, DevOps | Deployment issues, scaling |
| Dana | Product, UX | Feature prioritization, user research |

## Routing
When user asks about frontend → suggest involving Alice
When deployment fails → suggest Charlie can help
When user needs product decision → suggest Dana's input
```

## Model Evolution

Track how the model changes in `analytics/competence/history.md`:

```markdown
# Competence Model History

## 2026-02-14
- Moved "Python" from Developing to Strengths (accumulated 8 CORRECTION signals — user clearly expert)
- Added contextual modifier: Mondays = higher stress

## 2026-02-07
- Added "Email Drafting" to Weaknesses (5th REWORK signal)
- Updated routing: short drafts + iterate

## 2026-01-28
- Initial model created from first 2 weeks of signals
```

## Periodic Review

Monthly, present the model to the user:

```
🤝 Here's how I currently model our collaboration:

Your strengths: Strategy, Python, Product Thinking
You defer to me on: DevOps, Regex, Data Formatting
I'm working on: Email drafting (you rework ~60% of my drafts)

Does this feel right? Any corrections?
```

**This transparency is critical.** A wrong model is worse than no model. The user must be able to correct it.

## Cron Configuration

```bash
# Monthly competence review (1st of month, 9am)
openclaw cron add \
  --name "competence-review-monthly" \
  --cron "0 9 1 * *" \
  --session main \
  --system-event "Run user-competence-model review. Present current competence model to user. Ask for corrections. Update COMPETENCE.md and analytics/competence/history.md based on feedback." \
  --wake now
```

No dedicated cron for signal collection — that happens continuously during normal interactions.

## Anti-Patterns

- **Don't tell the user "I'm tracking your competence."** Frame it as "I'm learning how we work best together."
- **Don't assume ACCEPT = good work.** Many users don't review outputs carefully. If accept rate is 100%, be suspicious — test occasionally.
- **Don't make the model too granular.** "Python" is a useful category. "Python list comprehensions with nested conditionals" is not.
- **Don't freeze the model.** People learn. Revisit Developing areas monthly. A user who was weak in Docker 3 months ago may be intermediate now.
- **Don't over-defer.** Some users WANT to be challenged even in their expertise. If user has Scar "yes-manning" → push back even in their strong areas.
- **Don't under-defer.** Some users say "just do it" because they're overwhelmed, not because they trust you. Watch for REWORK signals after DEFER chains — that means they're not reviewing properly.
