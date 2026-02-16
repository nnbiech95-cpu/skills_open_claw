// ============================================================
// observation-parser.ts
// Extracts the <obs> block from LLM response, parses it,
// enriches with context metadata, returns full ObservationEvent.
//
// Robust: handles malformed JSON, missing fields, no <obs> block.
// Never crashes. Returns null if unparseable.
// ============================================================

import type {
  ObservationEvent,
  LLMObservationOutput,
  PatternObservation,
  ScarObservation,
  CompetenceObservation,
  GradientObservation,
  MemoryRelevanceObservation,
} from "./observation-schema.js";

/** Context passed in from the plugin hook */
export interface TurnContext {
  session_id: string;
  turn_number: number;
  user_message: string;
  assistant_response: string;
  chunks_in_context: number;
}

/**
 * Extract the <obs>...</obs> block from assistant response.
 * Returns the JSON string or null.
 */
function extractObsBlock(response: string): string | null {
  // Try exact XML tags first
  const xmlMatch = response.match(/<obs>\s*([\s\S]*?)\s*<\/obs>/);
  if (xmlMatch) return xmlMatch[1].trim();

  // Try without closing tag (LLM sometimes forgets)
  const openMatch = response.match(/<obs>\s*([\s\S]*?)$/);
  if (openMatch) return openMatch[1].trim();

  return null;
}

/**
 * Strip the <obs> block from the response so the user never sees it.
 */
export function stripObsBlock(response: string): string {
  return response.replace(/<obs>[\s\S]*?(<\/obs>|$)/, "").trimEnd();
}

/**
 * Safely parse JSON with fallbacks for common LLM mistakes.
 */
function safeParseJSON(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw);
  } catch {
    // Try fixing common issues
    try {
      // Remove trailing comma before }
      const fixed = raw.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      return JSON.parse(fixed);
    } catch {
      // Try wrapping in braces if missing
      try {
        return JSON.parse(`{${raw}}`);
      } catch {
        return null;
      }
    }
  }
}

/** Safe field access with type coercion */
function str(obj: unknown, key: string, fallback: string | null = null): string | null {
  if (!obj || typeof obj !== "object") return fallback;
  const val = (obj as Record<string, unknown>)[key];
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function num(obj: unknown, key: string, fallback: number = 0): number {
  if (!obj || typeof obj !== "object") return fallback;
  const val = (obj as Record<string, unknown>)[key];
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function bool(obj: unknown, key: string, fallback: boolean = false): boolean {
  if (!obj || typeof obj !== "object") return fallback;
  const val = (obj as Record<string, unknown>)[key];
  if (val === null || val === undefined) return fallback;
  return Boolean(val);
}

function arr(obj: unknown, key: string): string[] {
  if (!obj || typeof obj !== "object") return [];
  const val = (obj as Record<string, unknown>)[key];
  if (!Array.isArray(val)) return [];
  return val.map(String);
}

function rec(obj: unknown, key: string): Record<string, string> {
  if (!obj || typeof obj !== "object") return {};
  const val = (obj as Record<string, unknown>)[key];
  if (!val || typeof val !== "object" || Array.isArray(val)) return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    result[k] = String(v);
  }
  return result;
}

/**
 * Parse raw LLM observation output into typed ObservationEvent.
 * Fills in metadata from TurnContext.
 * Returns null only if <obs> block is completely absent or unparseable.
 */
export function parseObservation(ctx: TurnContext): ObservationEvent | null {
  const raw = extractObsBlock(ctx.assistant_response);
  if (!raw) return null;

  const parsed = safeParseJSON(raw);
  if (!parsed) return null;

  // Extract sub-objects (short keys from prompt)
  const p = parsed.p || parsed.pattern || {};
  const s = parsed.s || parsed.scar || {};
  const co = parsed.co || parsed.competence || {};
  const g = parsed.g || parsed.gradient || {};
  const me = parsed.me || parsed.memory || {};

  const pattern: PatternObservation = {
    matched: bool(p, "m") || bool(p, "matched"),
    pattern_id: str(p, "pid") || str(p, "pattern_id"),
    tool_used: str(p, "t") || str(p, "tool_used"),
    parameters: rec(p, "pa") || rec(p, "parameters"),
    intent: str(p, "i") || str(p, "intent") || "unknown",
    similarity: num(p, "s") || num(p, "similarity"),
  };

  const scar: ScarObservation = {
    triggered: bool(s, "t") || bool(s, "triggered"),
    type: (str(s, "ty") || str(s, "type")) as ScarObservation["type"],
    description: str(s, "d") || str(s, "description"),
    category: (str(s, "c") || str(s, "category")) as ScarObservation["category"],
  };

  const competence: CompetenceObservation = {
    domain: str(co, "d") || str(co, "domain") || "general",
    signal: (str(co, "si") || str(co, "signal")) as CompetenceObservation["signal"],
    initiative: ((str(co, "in") || str(co, "initiative")) as "user" | "agent") || "user",
    complexity: Math.max(1, Math.min(5, num(co, "cx") || num(co, "complexity") || 1)),
  };

  const gradient: GradientObservation = {
    person: str(g, "pe") || str(g, "person"),
    user_message_length: ctx.user_message.split(/\s+/).length,
    session_continuity:
      ((str(g, "sc") || str(g, "session_continuity")) as GradientObservation["session_continuity"]) ||
      "continuation",
    sentiment: Math.max(-1, Math.min(1, num(g, "se") || num(g, "sentiment"))),
    interaction_type:
      ((str(g, "it") || str(g, "interaction_type")) as GradientObservation["interaction_type"]) ||
      "routine",
  };

  const memory: MemoryRelevanceObservation = {
    chunks_in_context: ctx.chunks_in_context,
    chunks_referenced: num(me, "cr") || num(me, "chunks_referenced"),
    skills_used: arr(me, "su").length > 0 ? arr(me, "su") : arr(me, "skills_used"),
    context_pressure:
      ((str(me, "cp") || str(me, "context_pressure")) as MemoryRelevanceObservation["context_pressure"]) ||
      "low",
  };

  return {
    timestamp: new Date().toISOString(),
    session_id: ctx.session_id,
    turn_number: ctx.turn_number,
    pattern,
    scar,
    competence,
    gradient,
    memory,
  };
}
