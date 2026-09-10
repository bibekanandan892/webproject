---
title: "Multi-agent systems"
date: "2026-09-10T12:20"
category: "AI"
tags: ["agents", "multi-agent", "orchestration", "coordination", "critic"]
summary: "Splitting a job across several specialised agents buys parallelism and focus, and costs latency, tokens and the ability to debug easily. It is worth it less often than it looks."
draft: false
cover: "/blog/multi-agent-systems.svg"
---

One agent with twelve tools and a two-page system prompt starts making worse choices than one with three tools and a paragraph. Splitting the job across several agents is a response to that.

A multi-agent system is two or more agents working on a shared task, each with its own instructions and its own tools, plus something deciding who runs when.

## Three things it needs

**Specialisation.** Each agent has a narrow role, a short prompt, and only the tools that role needs. This is the entire point — if every agent has every tool, nothing has been gained.

**Communication.** Agents pass work to each other. What passes between them should be structured — named fields with known meanings — rather than prose. Free text between agents is where misreadings creep in, and they are hard to spot because the output still looks reasonable.

**Coordination.** Something decides the order and decides when the whole thing is finished. Without it there are several agents, but not a system.

## The roles that keep appearing

An **orchestrator** takes the request, hands out subtasks, and assembles the result. A **worker** does one kind of job well. A **router** looks at the request and picks who should handle it. A **planner** turns a goal into steps. A **critic** checks work against something independent.

Most real systems are a small combination of these, not all of them.

## One running

A system that keeps API documentation in step with the code. A release has just changed some endpoints.

<figure>
<svg viewBox="0 0 620 260" width="620" role="img" aria-label="A scanner agent fans out to three writer agents working in parallel, all feeding into a single reviewer, which either approves the work or sends it back to a writer for revision." xmlns="http://www.w3.org/2000/svg">
<style>.b{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}</style>
<defs><marker id="ms" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="30" y="16">FAN OUT, THEN CHECK</text>
<rect x="30" y="96" width="110" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 52%, transparent)"/>
<text class="b" x="85" y="123" text-anchor="middle">scanner</text>
<rect x="180" y="26" width="110" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="235" y="53" text-anchor="middle">writer</text>
<rect x="180" y="96" width="110" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="235" y="123" text-anchor="middle">writer</text>
<rect x="180" y="166" width="110" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="235" y="193" text-anchor="middle">writer</text>
<rect x="350" y="96" width="110" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 52%, transparent)"/>
<text class="b" x="405" y="123" text-anchor="middle">reviewer</text>
<rect x="500" y="96" width="110" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-dasharray="5 4"/>
<text class="b" x="555" y="123" text-anchor="middle">merged</text>
<path d="M140 112 L174 50" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ms)"/>
<path d="M140 118 H174" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ms)"/>
<path d="M140 124 L174 186" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ms)"/>
<path d="M290 50 L344 112" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ms)"/>
<path d="M290 118 H344" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ms)"/>
<path d="M290 186 L344 124" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ms)"/>
<path d="M460 118 H494" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ms)"/>
<path d="M440 140 V232 H235 V216" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#ms)"/>
<text class="l" x="348" y="248" text-anchor="middle">revise</text>
</svg>
<figcaption>Three writers run at once because their work does not overlap. The reviewer is the only thing that sees all of it.</figcaption>
</figure>

| round | who runs | what comes out |
| --- | --- | --- |
| 1 | scanner | three endpoints changed in this release |
| 2 | three writers, in parallel | a draft section for each |
| 3 | reviewer | two approved; one sent back — the documented error code does not match the code |
| 4 | that writer again | corrected draft |
| 5 | reviewer | approved |

Two things are doing real work here.

The writers run **in parallel** because the endpoints are independent. Three sequential calls became one round, and that is the clearest win a multi-agent system offers.

The reviewer is **grounded in something other than the writer's opinion** — it reads the actual code, not just the draft. A critic that only re-reads the draft it is checking will approve confident nonsense, because confident nonsense reads well.

## How they talk

**Message passing** sends a task and its context directly to one agent. **Shared state** gives every agent a common scratchpad to read and write. **Handoffs** pass the work *and* the control — the sender stops, the receiver continues.

Whichever you use, define the shape. `{"endpoint": "...", "verb": "...", "changed": [...]}` survives being read by a different model with a different prompt. A paragraph describing the same thing does not, reliably.

How much memory to share is a real dial. Sharing everything gives each agent full context and costs tokens on every call. Sharing summaries is cheaper and loses detail. Sharing nothing is cheapest and means agents repeat each other's work.

## What it costs

| | one agent | several |
| --- | --- | --- |
| prompt | one, long | several, each short |
| tools | all on one | split by role |
| parallel work | tool calls only | natural |
| debugging | one transcript | many, plus the handoffs |
| latency | lower | higher, unless parallelism wins it back |
| tokens | lower | higher — every handoff re-sends context |

The debugging line is the one that gets underestimated. When a single agent goes wrong there is one transcript to read. When a system of five goes wrong, the visible failure is often three handoffs downstream of the actual mistake, and each agent along the way made a locally sensible decision.

## What goes wrong

**They talk instead of working.** Agents exchange messages, each adding little, and the token count climbs while nothing progresses. Cap total turns.

**Nobody owns a step.** Two agents both write the summary, or neither does. Scope each role explicitly, and keep the orchestrator to routing rather than letting it also do the work.

**One mistake gets amplified.** The researcher retrieves the wrong figure, the writer builds a confident paragraph on it, and the reviewer checks whether the paragraph is well written. Errors need catching where they are made, which means a critic with independent grounding.

**The critic never accepts.** Each round it finds something new, and the loop does not end. Cap the revisions, and accept when two consecutive rounds raise substantially the same point — that is a critic with no more to say, not a draft with more to fix.

**Coordination costs more than the work.** For a task with three short steps, the messages describing the steps can outweigh doing them.

## When not to

Start with one agent. Move only when it is clearly failing.

The good reasons to split are real ones: the prompt has grown unmanageable, the parts genuinely need different tools or different models, several subtasks are independent and can run at once, or a review step measurably improves the result.

The bad reason is that more agents feel more capable. Each one you add is another prompt to tune, another failure mode, and another hop where context gets dropped. If the work is tightly coupled — every step needing everything the previous step saw — splitting it just means paying to re-send that context at each boundary.

## The short version

- A multi-agent system is specialised agents, structured communication, and something coordinating them.
- The recurring roles are orchestrator, worker, router, planner and critic.
- Parallelism on independent subtasks is the clearest benefit.
- A critic only helps if it checks against something other than the draft.
- Messages between agents should be structured, not prose.
- The costs are tokens, latency and debugging — and debugging is the one people underestimate.
- Start with one agent; add a second only when the first is visibly failing.
