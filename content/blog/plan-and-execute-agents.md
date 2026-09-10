---
title: "Plan-and-execute agents"
date: "2026-09-10T13:20"
category: "AI"
tags: ["agents", "planning", "execution", "replanning", "orchestration"]
summary: "Instead of deciding one step at a time, the agent writes the whole plan first and then works through it. Cheaper and steadier when the path is knowable, and useless when it is not."
draft: false
cover: "/blog/plan-and-execute-agents.svg"
---

Some agents decide what to do next after every result. A plan-and-execute agent decides everything up front: it writes a numbered plan, then works down it.

Reconsidering only happens when something comes back other than what the plan assumed.

## The parts

A **planner** reads the task and produces the steps. This is the expensive call and the one that determines whether anything else works.

An **executor** runs the steps one at a time. Each step is narrow — call this tool with these inputs — so this is usually a smaller, cheaper model than the planner.

**Tools**, **memory** holding the task and the plan and everything produced so far, and a **re-planner** that looks at what actually happened and decides whether the remaining plan still makes sense.

The re-planner is technically optional and practically essential. Without it the agent will follow a plan that stopped being correct three steps ago.

## The shape

<figure>
<svg viewBox="0 0 600 240" width="600" role="img" aria-label="A plan of four numbered steps on the left, feeding an execution column on the right where steps are carried out in order, with a dashed arrow returning from execution to the plan to rewrite the remaining steps." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.p{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="pe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="30" y="24">PLAN ONCE, THEN WORK DOWN IT</text>
<rect x="30" y="40" width="200" height="140" rx="8" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="p" x="48" y="68">1 · read the lockfile</text>
<text class="p" x="48" y="96">2 · look up advisories</text>
<text class="p" x="48" y="124">3 · find fixed versions</text>
<text class="p" x="48" y="152">4 · write the table</text>
<rect x="300" y="40" width="180" height="28" rx="5" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="p" x="316" y="59">step 1 · done</text>
<rect x="300" y="76" width="180" height="28" rx="5" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="p" x="316" y="95">step 2 · done</text>
<rect x="300" y="112" width="180" height="28" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="l" x="316" y="131">step 3 · running</text>
<rect x="300" y="148" width="180" height="28" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 8%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="316" y="167">step 4</text>
<path d="M232 110 H294" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pe)"/>
<path d="M390 182 V206 H130 V186" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#pe)"/>
<text class="l" x="260" y="224" text-anchor="middle">only when something surprises it</text>
</svg>
<figcaption>The plan is written once. The dashed path is the exception, not the loop.</figcaption>
</figure>

## One running

*List every dependency with a known vulnerability, and the version that fixes it.*

The planner writes four steps: read the lockfile, look up advisories for each package, find the fixed version for anything that matches, and write the table.

| step | what happened |
| --- | --- |
| 1 | read the lockfile — 214 packages. Also found a **second** lockfile in another workspace |
| — | **re-plan**: the original plan assumed one lockfile. Steps rewritten to cover both |
| 1b | read the second lockfile — 96 more packages, 310 in total |
| 2 | advisory lookup across all 310 — 4 matches |
| 3 | fixed versions found for 3; the fourth has no released fix |
| 4 | table written, with the unfixed one flagged |

The re-plan is the interesting row. Nothing failed at step 1 — it ran, it returned a valid result, and it returned *more* than the plan expected. A planner that never revisits its plan would have finished confidently and reported on 214 of 310 packages, which is a wrong answer that looks exactly like a right one.

Step 3 is worth noting too: it found no fix for one package and said so, rather than treating a missing result as an error.

## Against deciding step by step

The alternative is to think again after every observation. The two are not ranked; they suit different tasks.

| | one step at a time | plan first |
| --- | --- | --- |
| when it thinks | every turn | once, then on surprises |
| model calls | one per step, all on the big model | one big call plus cheap ones |
| adapting | immediate | only at a re-plan |
| long tasks | drifts, and costs grow with the transcript | steadier and cheaper |
| open-ended tasks | good | poor — the plan is guesswork |
| visibility | you see each thought as it happens | you see the whole intent up front |

Planning first is cheaper because the expensive reasoning happens once. It is steadier because the goal is written down rather than reconstructed from a growing transcript at every turn.

It fails when the path genuinely cannot be known in advance. If step two depends on what step one returns, a plan written before step one ran is a guess.

There is also a real benefit that has nothing to do with the model: a plan is legible. You can read the four steps before any of them run, and stop it if they are wrong. An agent that decides as it goes only shows you the decision after it has acted on it.

## What goes wrong

**The plan is bad.** Everything downstream inherits it, and the executor will faithfully carry out a wrong plan. Give the planner the real tool list and demand concrete steps — a step reading "gather the relevant data" cannot be executed, only reinterpreted.

**The executor drifts.** It does something defensible that was not what the step meant. Steps should name the tool and the inputs, not describe an intention.

**It never re-plans.** A step returns something unexpected and the agent carries on regardless. This is the failure in the trace above, and it produces confident wrong answers rather than visible errors.

**It over-plans.** Thirty steps for a three-step job. Ask for the shortest plan that does the work.

**It re-plans forever.** Each rewrite produces a slightly different plan and no progress. Cap the re-plans, and stop when two consecutive rewrites come out substantially the same.

## The short version

- The planner writes all the steps up front; the executor works down them.
- The executor can be a smaller model, because each step is narrow.
- A re-planner checks after each step whether the rest of the plan still holds.
- Re-planning matters most when a step *succeeds* but returns something the plan did not expect.
- Cheaper and steadier than re-deciding every turn, when the path is knowable.
- Useless when each step depends on what the last one returned.
- A written plan can be read and stopped before anything runs.
