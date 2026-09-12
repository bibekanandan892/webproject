---
title: "LangGraph"
date: "2026-09-11T18:00"
category: "AI"
tags: ["langgraph", "agents", "state-machines", "checkpointing", "workflows"]
summary: "The point is not that graphs are more flexible than lines. It is that the graph's position is stored alongside its data, so a run can be paused, resumed after a crash, or held for a human — none of which a straight-line pipeline can do."
draft: false
cover: "/blog/langgraph.svg"
---

LangGraph describes an application as a graph: nodes that do work, edges that say what runs next, and a state object that every node reads from and writes to.

The usual explanation is that graphs allow branching and loops where a straight pipeline does not. True, and not the interesting part. The interesting part is that the run's *position* is data.

## State, and what is in it

A node is a function from state to a partial update:

```python
def classify(state):
    return {"category": pick_category(state["message"])}
```

It receives the whole state, returns only the fields it changed, and the framework merges them. Nodes never call each other; they only leave things in the state for whatever runs next.

Edges decide what that is. A plain edge always goes to the same node. A **conditional** edge is a function that inspects the state and returns the name of the next node — which is how a routing decision becomes part of the structure rather than something buried in a node's body.

Because an edge can point backwards, the graph can contain cycles. An agent loop — call the model, run a tool, call the model again — is a cycle between two nodes, and a pipeline cannot express it at all: a pipeline is a line, and a line has no way back.

## Who calls the tool

Worth stating plainly, because it is the most common misunderstanding: **the model does not execute anything.**

A node asks the model what to do. The model replies with a request — this tool, these arguments. A different node runs it and writes the result into the state. Then the loop goes round and the model sees the result as text.

The graph makes this separation structural rather than conventional. The tool-executing node is a visible thing you can put a guard in front of, which matters as soon as the tools do anything real.

## The part that only works because position is data

Run state and current node are both persisted. A **checkpointer** writes them after every step, under a thread identifier.

This one property is what the framework is actually for.

**A crash resumes where it stopped.** Suppose each step fails 2% of the time — a timeout, a rate limit, a bad parse. A workflow with no saved position has to start over, and the longer it is the worse that gets:

| steps | finishes with no retry | steps executed, restart from scratch | checkpointed |
| --- | --- | --- | --- |
| 9 | 83.4% | 10.0 | 9.2 |
| 25 | 60.3% | 32.9 | 25.5 |
| 60 | 29.8% | 118.3 | 61.2 |
| 120 | 8.9% | 516.8 | 122.4 |

At nine steps, restarting costs 9% extra — barely worth the machinery. At 120 steps it costs **4.2× the work**, because a run that has to be perfect end to end almost never is. A 2% step failure rate means a 120-step workflow completes cleanly 8.9% of the time.

The saving is not linear in length; it accelerates. Which tells you exactly when this framework earns its complexity, and when it does not.

<figure>
<svg viewBox="0 0 560 282" width="560" role="img" aria-label="Two curves of total steps executed against workflow length, one rising steeply for restart-from-scratch and one near-linear for checkpointed." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHAT A LOST POSITION COSTS</text>
<path d="M60 40 V200 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="20" y="46">520</text>
<text class="l" x="20" y="124">260</text>
<text class="l" x="34" y="204">0</text>
<path d="M95 197 L155 190 L290 164 L520 41" stroke="color-mix(in srgb, var(--muted-foreground) 75%, transparent)" stroke-width="2.2" fill="none"/>
<path d="M95 197 L155 192 L290 181 L520 162" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="290" cy="164" r="3.4" fill="var(--muted-foreground)"/>
<circle cx="290" cy="181" r="3.4" fill="var(--primary)"/>
<circle cx="520" cy="41" r="3.8" fill="var(--muted-foreground)"/>
<circle cx="520" cy="162" r="3.8" fill="var(--primary)"/>
<text class="l" x="330" y="96">restart from scratch</text>
<text class="b" x="330" y="150">checkpointed</text>
<text class="l" x="95" y="220">9</text>
<text class="l" x="290" y="220" text-anchor="middle">60</text>
<text class="l" x="520" y="220" text-anchor="end">120 steps</text>
<path d="M20 238 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="260">at 2% failure per step, a 120-step run finishes cleanly 8.9% of the time</text>
</svg>
<figcaption>The gap is small at nine steps and 4.2× at a hundred and twenty. Length is what decides whether persistence matters.</figcaption>
</figure>

**A run can pause for a person.** This is the feature that is simply impossible without stored position. Stop before the node that sends the email, write the state down, return. Hours later a human approves, the state is loaded, and execution continues from that node with everything intact.

Nothing was held in memory across that gap. The process that resumes need not be the process that paused — which is what makes approval workflows deployable rather than a demo.

**Conversations get memory for free.** Reusing a thread identifier loads the previous state, so prior turns are already there. Memory is not a separate component; it is the same persistence read back.

## When not to reach for it

A single model call does not need a graph. Neither does a fixed three-step pipeline that either works or fails as a unit — a straight chain expresses that, with less to understand.

The cost of the graph is real: every piece of shared data has to be named in a state schema, control flow lives in edge functions rather than in the reading order of a file, and debugging means inspecting state snapshots instead of a stack trace.

That cost buys branching, cycles, and the ability to survive interruption. If a workflow has none of those needs, it is paying for nothing.

## What to take away

Every framework of this kind is really answering one question: where does the run's progress live?

A pipeline keeps it on the call stack, which means the run cannot outlive the process. LangGraph moves it into storage, and everything that makes the framework worth using — resuming, pausing for a human, retrying just the failed step, remembering a conversation — is a consequence of that single move.
