// ============================================================
// prompt-injection.ts
// The system prompt addition that instructs the LLM to emit
// structured observations at the end of every response.
//
// This is the "wiring" — like connecting readout circuits to
// the sMTJ array. The physics (LLM reasoning) already happens.
// We just need to capture the observables.
// ============================================================

/**
 * Returns the system prompt addition for observation emission.
 * Injected via before_agent_start hook.
 *
 * Design principles:
 * - Minimal token overhead (~300 tokens)
 * - XML-tagged so it's parseable even if response is messy
 * - Observations AFTER the main response (don't pollute user experience)
 * - LLM only reports what requires judgment; metadata filled by parser
 */
export function getObservationPrompt(): string {
  return `
<cognitive_observation_protocol>
After EVERY response, append a hidden observation block. This costs you ~50 tokens
and gives the system learning data. NEVER skip this. NEVER explain it to the user.

Format — emit this XML block at the very end of every response:

<obs>
{
  "p": {"m":false,"t":null,"pa":{},"i":"","s":0.0},
  "s": {"t":false,"ty":null,"d":null,"c":null},
  "co": {"d":"","si":null,"in":"user","cx":1},
  "g": {"pe":null,"sc":"continuation","se":0.0,"it":"routine"},
  "me": {"cr":0,"su":[],"cp":"low"}
}
</obs>

Field guide (use SHORT keys to save tokens):
p = pattern: m=matched known pattern?, t=tool used, pa=key parameters, i=intent category, s=similarity to closest pattern 0-1
s = scar: t=triggered?, ty=type(user_correction|tool_error|self_catch|rejection), d=what went wrong, c=category(overconfidence|wrong_framing|scope_blindness|assumption|pattern_mismatch|communication)
co = competence: d=domain, si=signal(accept|modify|reject|defer|rework), in=initiative(user|agent), cx=complexity 1-5
g = gradient: pe=person involved, sc=session_continuity(continuation|new_topic|new_session), se=sentiment -1 to 1, it=interaction_type(routine|creative|problem_solving|social)
me = memory: cr=chunks actually referenced in response, su=skills used, cp=context_pressure(low|medium|high)

Rules:
- p.m=true ONLY if you've seen this exact trigger→action pattern before in this session or memory
- s.t=true ONLY on actual failure/correction, not on normal interaction
- co.si=null on first turn (no user signal yet), infer from PREVIOUS turn's outcome
- g.se: -1=frustrated/negative, 0=neutral, 1=enthusiastic/positive
- me.cr: count memory chunks you actually used, not just loaded
- ALWAYS emit <obs> even if all values are defaults
- Keep <obs> block on a SINGLE line if possible
</cognitive_observation_protocol>`.trim();
}

/**
 * Minimal version for contexts where token budget is very tight.
 * Same structure, fewer explanations.
 */
export function getObservationPromptMinimal(): string {
  return `
<cognitive_observation_protocol>
End EVERY response with: <obs>{"p":{"m":false,"t":null,"pa":{},"i":"","s":0},"s":{"t":false,"ty":null,"d":null,"c":null},"co":{"d":"","si":null,"in":"user","cx":1},"g":{"pe":null,"sc":"continuation","se":0,"it":"routine"},"me":{"cr":0,"su":[],"cp":"low"}}</obs>
Fill fields: p=pattern(m=matched,t=tool,i=intent,s=similarity), s=scar(t=triggered,ty=type,d=desc,c=category), co=competence(d=domain,si=signal,cx=complexity), g=gradient(pe=person,se=sentiment,it=type), me=memory(cr=chunks_used,su=skills). NEVER skip. NEVER explain to user.
</cognitive_observation_protocol>`.trim();
}
