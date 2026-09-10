---
title: "AI subagents"
date: "2026-09-10T21:00"
category: "AI"
tags: ["agents", "subagents", "context", "delegation", "cost"]
summary: "A subagent is an agent called like a function: it runs its own loop, returns a value, and throws its working away. That discarded working is the entire point."
draft: false
cover: "/blog/ai-subagents.svg"
---

A subagent is an agent invoked by another agent. The parent hands it a narrow task, it runs its own loop with its own tools, and it returns a result.

The useful way to think about it is as a **function call**. It has a signature — what goes in, what comes out — it has its own local state, and when it returns, that local state is gone.

That last part is not a detail. It is what subagents are for.

## What the parent does not have to see

An agent's context accumulates everything it did: every tool call, every result, every intermediate step. A subagent's context accumulates all of that too — and then throws it away, returning only its answer.

Say a subagent takes twelve turns to do its job, building up around 9,600 tokens of transcript, and reports back in 200.

| parent delegates to | if it did the work itself | what it actually sees |
| --- | --- | --- |
| 3 subagents | 28,800 tokens | 600 |
| 5 subagents | 48,000 tokens | 1,000 |
| 8 subagents | 76,800 tokens | **1,600** |

<figure>
<svg viewBox="0 0 560 240" width="560" role="img" aria-label="A parent agent with a small context, and beneath it three subagents each with a large working transcript that is discarded, returning only a short summary upward." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.g{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="sa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">THE WORKING IS THROWN AWAY</text>
<rect x="200" y="34" width="160" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="b" x="280" y="57" text-anchor="middle">parent · 600 tokens</text>
<path d="M240 76 L110 108" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.3" marker-end="url(#sa)"/>
<path d="M280 76 V108" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.3" marker-end="url(#sa)"/>
<path d="M320 76 L450 108" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.3" marker-end="url(#sa)"/>
<rect x="30" y="112" width="160" height="88" rx="7" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke-dasharray="4 3"/>
<text class="g" x="110" y="134" text-anchor="middle">12 turns</text>
<text class="g" x="110" y="152" text-anchor="middle">9,600 tokens</text>
<text class="b" x="110" y="180" text-anchor="middle">returns 200</text>
<rect x="200" y="112" width="160" height="88" rx="7" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke-dasharray="4 3"/>
<text class="g" x="280" y="134" text-anchor="middle">12 turns</text>
<text class="g" x="280" y="152" text-anchor="middle">9,600 tokens</text>
<text class="b" x="280" y="180" text-anchor="middle">returns 200</text>
<rect x="370" y="112" width="160" height="88" rx="7" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke-dasharray="4 3"/>
<text class="g" x="450" y="134" text-anchor="middle">12 turns</text>
<text class="g" x="450" y="152" text-anchor="middle">9,600 tokens</text>
<text class="b" x="450" y="180" text-anchor="middle">returns 200</text>
<text class="g" x="20" y="226">dashed boxes exist only while that subagent is running</text>
</svg>
<figcaption>The parent's context holds three summaries, not three transcripts.</figcaption>
</figure>

Around 98% of what happened never reaches the parent. It stays inside the subagent, is used there, and is discarded when it returns.

Compare that to one agent doing everything: by the time it has finished the third subtask, the first subtask's tool output is still sitting in its context, competing for attention with the work in front of it.

## The other thing narrowness buys

A subagent gets a short prompt and a few tools, because it does one thing.

That matters more than it sounds. An agent choosing between four well-described tools makes better choices than the same model choosing between twenty — the description of each tool is all it has to go on, and twenty descriptions contain more near-collisions than four.

So delegation improves decisions twice over: the subagent has less to read, and less to choose between.

## Depth is where the cost is

Subagents can call subagents. That composes nicely and multiplies quickly.

| depth | branching 2 | branching 3 | branching 5 | cost at branching 5 |
| --- | --- | --- | --- | --- |
| 1 | 2 | 3 | 5 | $0.15 |
| 2 | 4 | 9 | 25 | $0.75 |
| 3 | 8 | 27 | **125** | **$3.75** |
| 4 | 16 | 81 | 625 | $18.75 |

Depth three with five-way branching is 125 agent runs for a single user request. Nobody designs that on purpose; it happens when each level looks locally reasonable.

Latency behaves similarly. Siblings run in parallel, but levels do not — a three-deep hierarchy has three sequential rounds of waiting whatever the branching.

So depth needs an explicit limit, the same way a loop needs a step limit.

## What it costs elsewhere

**Coordination tokens.** Splitting the task and combining the results are extra model calls that exist only because the work was split.

**Lossy handoffs.** The subagent sees only what the parent passed it. A missing constraint produces a technically correct answer to the wrong question, and the parent has no way to notice because it never saw the working.

**Harder debugging.** A wrong final answer might come from a bad split, a bad subagent, or a bad synthesis. The parent's transcript shows three tidy summaries and none of the evidence.

Which suggests logging what goes into and out of every subagent, even though the parent does not see it. The discarded transcript is exactly what you need when something is wrong.

## When not to

If the task does not decompose cleanly, splitting it just adds handoffs. If each part needs everything the other parts saw, you will spend the saving re-sending context across the boundaries.

And for anything a single agent handles adequately, subagents add coordination cost, latency, and failure modes in exchange for nothing.

## The short version

- A subagent is an agent called like a function: narrow task in, result out, working discarded.
- Discarding the working is the point — a parent sees ~2% of what its subagents did.
- Narrow tool sets also improve tool choice, because there is less to confuse.
- Nesting multiplies: depth 3 with 5-way branching is 125 runs for one request.
- Levels are sequential even though siblings are parallel, so depth costs latency too.
- Cap the depth explicitly, as you would cap loop steps.
- Log subagent inputs and outputs, since the parent's view has the evidence removed.
- Do not split work that does not decompose — the handoffs cost more than the split saves.
