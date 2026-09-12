---
title: "Loop Engineering"
date: "2026-09-12T04:20"
category: "AI"
tags: ["agents", "loops", "context", "cost", "verification"]
summary: "An agent's cost grows with the square of its step budget, so doubling the budget nearly quadruples the bill. In one accounting the last six of twelve turns served 12% of runs and carried 71% of the tokens."
draft: false
cover: "/blog/loop-engineering.svg"
---

An agent is a loop. The model reads its context and decides on an action, the system performs it, the result goes back into the context, and round it goes.

Prompt engineering is about what you say once. Loop engineering is about what happens on the ninth iteration, and it is where working agents are separated from demos.

## The cost is quadratic

Start with the failure that surprises people, because it is arithmetic rather than judgement.

Each turn appends its observation to the context, and the whole context is re-sent next turn. So turn 12 pays for the observations of turns 1 through 11 as well as its own.

With a 2,000-token base and 3,000-token tool outputs:

| turns | raw observations | trimmed to 400 tokens | ratio |
| --- | --- | --- | --- |
| 6 | 75,000 | 20,400 | 3.7× |
| 12 | 258,000 | 55,200 | 4.7× |
| 20 | 670,000 | 124,000 | 5.4× |
| 30 | **1,455,000** | 246,000 | 5.9× |

And the growth against the budget:

| | |
| --- | --- |
| 6 → 12 turns | **3.44×** the tokens |
| 12 → 24 turns | 3.67× |

Doubling the step budget roughly **quadruples** the token cost. Not because the extra turns are expensive individually, but because every turn after them carries their output.

So trimming observations is not a tidiness measure. A tool that returns 3,000 tokens of which 400 matter is multiplying your bill by five, and the fix is to reduce the output at the point it enters the context — the head and tail of a log, the error line rather than the full stack, the changed rows rather than the table.

<figure>
<svg viewBox="0 0 560 314" width="560" role="img" aria-label="Two curves of total tokens against turn count, one growing quadratically with raw observations and one much flatter with trimmed observations." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EVERY TURN PAYS FOR EVERY EARLIER TURN</text>
<path d="M60 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="14" y="46">1.46M</text>
<text class="l" x="20" y="119">730k</text>
<text class="l" x="46" y="194">0</text>
<path d="M60 190 L106 184 L152 171 L198 150 L244 121 L290 85 L336 41" stroke="color-mix(in srgb, var(--muted-foreground) 80%, transparent)" stroke-width="2.4" fill="none"/>
<path d="M60 190 L152 186 L244 177 L336 165 L428 148 L520 127" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="170" cy="164" r="4" fill="var(--muted-foreground)"/>
<text class="l" x="180" y="158">12 turns — 258k</text>
<circle cx="170" cy="184" r="4" fill="var(--primary)"/>
<text class="b" x="182" y="200">12 turns, trimmed — 55k</text>
<circle cx="336" cy="41" r="4.4" fill="var(--muted-foreground)"/>
<text class="l" x="346" y="50">30 turns — 1.46M</text>
<circle cx="520" cy="127" r="4.4" fill="var(--primary)"/>
<text class="b" x="512" y="118" text-anchor="end">50 turns, trimmed — 610k</text>
<text class="l" x="60" y="212">0</text>
<text class="l" x="290" y="212" text-anchor="middle">25</text>
<text class="l" x="520" y="212" text-anchor="end">50 turns</text>
<path d="M20 230 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="254">raw observations grow as n², so doubling the budget quadruples the bill</text>
<text class="l" x="20" y="276">fifty turns with trimmed output costs less than thirty without</text>
<text class="l" x="20" y="292">the fix is at the point the output enters the context</text>
</svg>
<figcaption>Fifty trimmed turns are cheaper than thirty untrimmed ones. The step budget is not what makes a loop expensive.</figcaption>
</figure>

## Where the budget is actually spent

Suppose each turn has roughly a 28% chance of finishing the task:

| | share of runs finished |
| --- | --- |
| by turn 3 | 62.7% |
| by turn 6 | 86.1% |
| by turn 9 | 94.8% |
| by turn 12 | 98.1% |

So turns 7 through 12 serve the remaining **12%** of runs — and carry **71%** of the token cost, because they are the expensive late turns with the largest contexts.

That is the shape of the decision. The tail of the budget is where the hard cases get solved and where nearly all the money goes. Which suggests two things worth doing: measure where your own successes land before choosing a budget, and treat "still going at turn 9" as a signal that something is wrong rather than as normal progress.

## The parts that have to be designed

**A goal a machine can check.** Not "make the tests pass to a good standard" but a command whose exit code says yes or no. Without this, nothing else in the loop can work, because the loop cannot tell whether it is done.

**A step budget.** Any loop without one can run forever, and eventually will.

**A tool list that is short.** Every tool is a way to be wrong. The right set is the smallest one that can accomplish the task.

**Trimmed observations.** See above. This is the single largest cost lever.

**Memory that is deliberate.** Decide what survives a turn. Everything that survives is paid for repeatedly; everything that does not is forgotten and may be rediscovered.

**Errors that say what to do.** "Command failed" produces a retry of the same command. "Command failed: no such file — the path is relative to the repository root" produces a different attempt. An error message is the only input the model has for changing course.

**Exit conditions, plural.** Success is one. Budget exhausted is another. **Repeated failure is the one people forget** — the same action failing twice in a row means the loop has no new information, and another attempt will not produce any.

## The six ways it breaks

Each one maps to a missing piece above.

- **Endless** — no budget.
- **Repeating** — the same failing action, because nothing detects repetition.
- **Forgetting** — the solution scrolled out of context.
- **Drifting** — the goal was not concrete, so scope expanded.
- **Lying** — the agent reported success without anything checking.
- **Expensive** — observations untrimmed.

The lying loop deserves a note, because it is the one that looks like success. A model's claim that it finished was produced by the same process that did the work, so it carries no independent information. If the loop's exit depends on that claim, the loop has no verification at all. The check has to be run *by the loop*, not reported by the model.

## What it is not

**Prompt engineering** is the wording of a single request. **Context engineering** is what sits in the window on any given turn. **Loop engineering** is the dynamics across turns — whether the thing converges, and what happens when it does not.

They are complementary, and the third is the one that decides whether an agent finishes. A perfectly worded prompt in a loop with no exit condition runs until someone kills it.

## What to take away

Two numbers should exist before an agent is deployed: the distribution of how many turns successful runs take, and the token cost at the budget you set.

The first tells you where to put the budget. The second tells you that trimming observations matters more than anything else you could tune — because the cost grows with the square of the turns, and most of that growth is output nobody needed.
