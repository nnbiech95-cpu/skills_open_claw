#!/bin/bash
# Cognitive Skills for OpenClaw — Setup Script
# Usage: bash setup.sh [--with-cron]

set -e

WORKSPACE="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}"
SKILLS_DIR="$WORKSPACE/skills"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🧠 Installing Cognitive Skills for OpenClaw"
echo "   Workspace: $WORKSPACE"
echo ""

# Create skill directories
for skill in memory-compactor scar-registry gradient-tracker sleep-consolidation user-competence-model; do
  echo "  Installing $skill..."
  mkdir -p "$SKILLS_DIR/$skill"
  cp "$SCRIPT_DIR/$skill/SKILL.md" "$SKILLS_DIR/$skill/SKILL.md"
done

# Create data directories
echo ""
echo "  Creating data directories..."
mkdir -p "$WORKSPACE/memory/distilled"
mkdir -p "$WORKSPACE/memory/insights/hypotheses"
mkdir -p "$WORKSPACE/scars/meta"
mkdir -p "$WORKSPACE/analytics/baselines"
mkdir -p "$WORKSPACE/analytics/alerts"
mkdir -p "$WORKSPACE/analytics/competence"

# Initialize files if they don't exist
if [ ! -f "$WORKSPACE/scars/index.md" ]; then
  cat > "$WORKSPACE/scars/index.md" << 'EOF'
# Scar Index

| Scar | Confidence | Category | Triggers On | Last Updated |
|------|-----------|----------|-------------|-------------|

## Meta-Scars
_None yet._

## Strengths
_None yet._
EOF
  echo "  Created scars/index.md"
fi

if [ ! -f "$WORKSPACE/analytics/competence/signals.md" ]; then
  echo "# Competence Signals Log" > "$WORKSPACE/analytics/competence/signals.md"
  echo "  Created analytics/competence/signals.md"
fi

if [ ! -f "$WORKSPACE/memory/insights/hypotheses/active.md" ]; then
  cat > "$WORKSPACE/memory/insights/hypotheses/active.md" << 'EOF'
# Active Hypotheses

| ID | Hypothesis | Generated | Confidence | Last Evidence | Status |
|----|-----------|-----------|-----------|---------------|--------|
EOF
  echo "  Created hypotheses/active.md"
fi

if [ ! -f "$WORKSPACE/COMPETENCE.md" ]; then
  cat > "$WORKSPACE/COMPETENCE.md" << 'EOF'
# User Competence Model

**Last updated:** (auto-updated by user-competence-model skill)
**Data points:** 0
**Model confidence:** low (new)

---

## Strengths (High Confidence)
_Building... need 2+ weeks of interaction data._

## Defers (High Confidence)
_Building..._

## Developing Areas (Low Confidence)
_Building..._

## Contextual Modifiers
_Building..._

## Routing Quick Reference
| Domain | User Competence | My Competence | Action |
|--------|----------------|---------------|--------|
| (auto-populated) | | | |
EOF
  echo "  Created COMPETENCE.md"
fi

echo ""
echo "✅ Skills installed."
echo ""

# Optional: Set up cron jobs
if [ "$1" = "--with-cron" ]; then
  echo "⏰ Setting up cron jobs..."
  echo "   (Requires openclaw CLI to be available)"
  echo ""

  # Memory Compactor
  openclaw cron add --name "memory-compactor-nightly" --cron "0 23 * * *" --session isolated \
    --message "Run the memory-compactor skill: Tier 1 nightly distillation for today." --model "sonnet" 2>/dev/null && \
    echo "  ✓ memory-compactor-nightly" || echo "  ✗ memory-compactor-nightly (failed)"

  openclaw cron add --name "memory-compactor-weekly" --cron "30 23 * * 0" --session isolated \
    --message "Run the memory-compactor skill: Tier 2 weekly compression." --model "sonnet" 2>/dev/null && \
    echo "  ✓ memory-compactor-weekly" || echo "  ✗ memory-compactor-weekly (failed)"

  openclaw cron add --name "memory-compactor-monthly" --cron "0 0 1 * *" --session isolated \
    --message "Run the memory-compactor skill: Tier 3 monthly abstraction." --model "opus" --thinking high 2>/dev/null && \
    echo "  ✓ memory-compactor-monthly" || echo "  ✗ memory-compactor-monthly (failed)"

  # Sleep Consolidation
  openclaw cron add --name "sleep-consolidation-nightly" --cron "0 23 * * *" --session isolated \
    --message "Run sleep-consolidation skill: Full 3-phase nightly consolidation." --model "sonnet" --thinking medium 2>/dev/null && \
    echo "  ✓ sleep-consolidation-nightly" || echo "  ✗ sleep-consolidation-nightly (failed)"

  openclaw cron add --name "sleep-consolidation-weekly" --cron "30 23 * * 0" --session isolated \
    --message "Run sleep-consolidation skill: Weekly deep sleep." --model "opus" --thinking high 2>/dev/null && \
    echo "  ✓ sleep-consolidation-weekly" || echo "  ✗ sleep-consolidation-weekly (failed)"

  openclaw cron add --name "sleep-morning-briefing" --cron "30 7 * * *" --session main \
    --system-event "Check memory/insights/ for last night's sleep consolidation. Share morning briefing if noteworthy." --wake now 2>/dev/null && \
    echo "  ✓ sleep-morning-briefing" || echo "  ✗ sleep-morning-briefing (failed)"

  # Gradient Tracker
  openclaw cron add --name "gradient-tracker-weekly" --cron "0 22 * * 0" --session isolated \
    --message "Run gradient-tracker skill: Update all person baselines and generate alerts." --model "sonnet" 2>/dev/null && \
    echo "  ✓ gradient-tracker-weekly" || echo "  ✗ gradient-tracker-weekly (failed)"

  # Scar Review
  openclaw cron add --name "scar-review-monthly" --cron "0 8 1 * *" --session main \
    --system-event "Run scar-registry monthly review." --wake now 2>/dev/null && \
    echo "  ✓ scar-review-monthly" || echo "  ✗ scar-review-monthly (failed)"

  # Competence Review
  openclaw cron add --name "competence-review-monthly" --cron "0 9 1 * *" --session main \
    --system-event "Run user-competence-model review. Present model to user." --wake now 2>/dev/null && \
    echo "  ✓ competence-review-monthly" || echo "  ✗ competence-review-monthly (failed)"

  echo ""
  echo "✅ Cron jobs configured."
fi

echo ""
echo "📁 Installed to: $SKILLS_DIR"
echo ""
echo "Next steps:"
echo "  1. Restart OpenClaw or start a new session"
echo "  2. Ask your agent: 'What cognitive skills do I have installed?'"
echo "  3. If you didn't use --with-cron, set up cron jobs manually (see each SKILL.md)"
echo ""
echo "Estimated monthly cost: ~\$12 for all cron jobs combined."
