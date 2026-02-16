// ============================================================
// observation-schema.ts
// The structured output every LLM call emits as a side-effect.
// One physical event (LLM call) → multiple observables.
// ============================================================

/**
 * Pattern observation: was this turn repetitive?
 * Feeds: Pattern Cache (habituation)
 */
export interface PatternObservation {
  /** Did this turn match a known pattern? */
  matched: boolean;
  /** Pattern ID if matched, null if new */
  pattern_id: string | null;
  /** What tool was called? */
  tool_used: string | null;
  /** Extraction: key parameters from the action */
  parameters: Record<string, string>;
  /** Intent category (e.g., "create_event", "search", "send_message") */
  intent: string;
  /** How similar was this to the closest known pattern? 0-1 */
  similarity: number;
}

/**
 * Scar observation: did something go wrong?
 * Feeds: Scar Registry (failure learning)
 */
export interface ScarObservation {
  /** Was there a failure, correction, or self-catch? */
  triggered: boolean;
  /** Type of failure event */
  type: "user_correction" | "tool_error" | "self_catch" | "rejection" | null;
  /** What went wrong in one sentence */
  description: string | null;
  /** Root cause category */
  category:
    | "overconfidence"
    | "wrong_framing"
    | "scope_blindness"
    | "assumption"
    | "pattern_mismatch"
    | "communication"
    | null;
}

/**
 * Competence observation: how did the user respond?
 * Feeds: User Competence Model (routing)
 */
export interface CompetenceObservation {
  /** What domain was this interaction in? */
  domain: string;
  /** User signal */
  signal: "accept" | "modify" | "reject" | "defer" | "rework" | null;
  /** Who drove this interaction? */
  initiative: "user" | "agent";
  /** Complexity estimate 1-5 */
  complexity: number;
}

/**
 * Gradient observation: communication pattern data point
 * Feeds: Gradient Tracker (rate-of-change detection)
 */
export interface GradientObservation {
  /** Person involved (if identifiable) */
  person: string | null;
  /** Message length in words (user's message) */
  user_message_length: number;
  /** Response time hint: was user's message quick follow-up or new session? */
  session_continuity: "continuation" | "new_topic" | "new_session";
  /** Sentiment hint: -1 to 1 */
  sentiment: number;
  /** Interaction type */
  interaction_type: "routine" | "creative" | "problem_solving" | "social";
}

/**
 * Memory relevance observation: which context was useful?
 * Feeds: Memory Compactor (what to keep/forget)
 */
export interface MemoryRelevanceObservation {
  /** How many memory chunks were in context? */
  chunks_in_context: number;
  /** How many were actually referenced in the response? */
  chunks_referenced: number;
  /** Were any skills injected? Which? */
  skills_used: string[];
  /** Was the context window feeling tight? */
  context_pressure: "low" | "medium" | "high";
}

/**
 * The complete observation emitted after every LLM call.
 * This is the "spike train" — one event, multiple readouts.
 */
export interface ObservationEvent {
  /** ISO timestamp */
  timestamp: string;
  /** Session ID for grouping */
  session_id: string;
  /** Turn number in session */
  turn_number: number;
  /** The observables */
  pattern: PatternObservation;
  scar: ScarObservation;
  competence: CompetenceObservation;
  gradient: GradientObservation;
  memory: MemoryRelevanceObservation;
}

/**
 * What the LLM actually outputs in its response.
 * Subset of ObservationEvent — only what requires LLM judgment.
 * The rest (timestamp, session_id, turn_number, message_length)
 * is filled in by the parser from context.
 */
export interface LLMObservationOutput {
  pattern: {
    matched: boolean;
    tool_used: string | null;
    parameters: Record<string, string>;
    intent: string;
    similarity: number;
  };
  scar: {
    triggered: boolean;
    type: string | null;
    description: string | null;
    category: string | null;
  };
  competence: {
    domain: string;
    signal: string | null;
    initiative: string;
    complexity: number;
  };
  gradient: {
    person: string | null;
    session_continuity: string;
    sentiment: number;
    interaction_type: string;
  };
  memory: {
    chunks_referenced: number;
    skills_used: string[];
    context_pressure: string;
  };
}
