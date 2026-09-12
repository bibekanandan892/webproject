---
title: "Graph Engineering"
date: "2026-09-12T04:40"
category: "AI"
tags: ["graphs", "agents", "testing", "workflows", "state"]
summary: "A graph with one three-way decision and a cycle capped at three has fifteen possible paths. The same work as a free loop with six tools and twelve steps has 2.61 billion. Only one of those numbers can be tested."
draft: false
cover: "/blog/graph-engineering.svg"
---

There are two ways to build something multi-step around a model. Give it tools and let it decide what to do next, over and over. Or lay out the steps yourself and let the model do the work inside each one.

The second is graph engineering: **every step is a node, every possible transition is an edge, and a shared state object carries information between them.** The model still does the thinking. The graph decides where that thinking goes.

## The number that justifies the constraint

Take a document question-answering flow: understand the question, search, write an answer, check it. The check either accepts, sends it back to search because nothing was found, or sends it back to write because the answer was weak — with the cycle capped at three attempts.

How many distinct paths can a run take?

| cycle cap | distinct paths |
| --- | --- |
| 1 | 3 |
| 2 | 7 |
| 3 | **15** |
| 4 | 31 |

Fifteen. Every one of them can be written down, walked through, and tested.

Now the same job as a free loop with six tools and a twelve-step budget:

| | possible action sequences |
| --- | --- |
| the graph | **15** |
| the loop | **2,610,000,000** |

Two and a half billion. Not "hard to test" — **coverage is not a meaningful concept** at that size. You can test the cases you thought of and you have no idea what fraction of the space that is.

That is the trade in its entirety. The graph gives up the ability to solve problems whose shape you did not anticipate, in exchange for a system whose behaviour is finite.

<figure>
<svg viewBox="0 0 560 314" width="560" role="img" aria-label="A small graph with four nodes and a three-way decision, beside a note that a free loop with six tools over twelve steps has billions of possible sequences." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="ge" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--primary)"/></marker>
<marker id="gr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">FIFTEEN PATHS, OR TWO AND A HALF BILLION</text>
<rect x="20" y="56" width="86" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="63" y="75" text-anchor="middle">understand</text>
<path d="M112 71 H140" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ge)"/>
<rect x="146" y="56" width="72" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="182" y="75" text-anchor="middle">search</text>
<path d="M224 71 H252" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ge)"/>
<rect x="258" y="56" width="66" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="291" y="75" text-anchor="middle">write</text>
<path d="M330 71 H358" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ge)"/>
<rect x="364" y="56" width="66" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 34%, transparent)" stroke="var(--primary)" stroke-width="2"/>
<text class="b" x="397" y="75" text-anchor="middle">check</text>
<path d="M436 71 H470" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ge)"/>
<text class="b" x="476" y="75">send</text>
<path d="M397 92 V116 H182 V92" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" fill="none" marker-end="url(#gr)"/>
<text class="l" x="200" y="112">nothing found — search again</text>
<path d="M380 92 V138 H291 V92" stroke="var(--muted-foreground)" stroke-opacity="0.45" stroke-width="1.4" fill="none" marker-end="url(#gr)"/>
<text class="l" x="300" y="134">weak — write again</text>
<text class="l" x="20" y="164">capped at three attempts</text>
<path d="M20 184 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="208">15 paths — every one enumerable, every node testable alone</text>
<rect x="20" y="218" width="12" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="l" x="20" y="256">a free loop, 6 tools over 12 steps: 2,610,000,000 sequences</text>
<rect x="20" y="266" width="500" height="16" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 48%, transparent)"/>
<text class="l" x="20" y="292">the bars are not to scale — nothing would be visible if they were</text>
</svg>
<figcaption>Both do the same job. One of them you can write a test suite for.</figcaption>
</figure>

## The three pieces

**A node** is a function. It receives the state, does one thing, and returns the fields it changed. Small and single-purpose: `understand`, `search`, `write`, `check`.

**An edge** says what runs next. A plain edge always goes to the same node; a **conditional** edge is a function that reads the state and returns a name.

**State** is a shared object with a declared schema. It is the only channel between nodes — they never call each other — and designing it first is the advice that matters most, because a vague state schema is how nodes end up secretly depending on each other.

The best-practice list is short and all of it follows from these three:

- **Put decisions in code, not in a model call.** A conditional edge reading `state["score"] >= 8` is deterministic and testable. Asking a model which node to run next reintroduces exactly the unpredictability the graph was for.
- **Cap every cycle.** A cycle without a counter is a loop with extra steps.
- **Every path must terminate.** Check this by walking the graph on paper, which is possible precisely because there are fifteen paths.
- **Turn errors into branches.** Catch the failure, write it into the state, and route on it. A crash ends the run; a state field routes to a recovery node.

## What being testable actually buys

Two concrete things.

**Faults localise immediately.** When a seven-stage opaque loop produces a wrong answer, you have one transcript and seven candidates — bisecting it by re-running takes about three attempts, each of which may not reproduce. With per-node tests, the failing test names the node and costs nothing extra.

**Nodes can be tested without the model.** `check` is a function from state to a score; feed it a fixed document and a fixed answer and assert the score. No model call, no non-determinism, runs in milliseconds. That is an ordinary unit test, which is not available for any part of a free loop.

## Two things graphs get for free

**Parallel branches.** If `search_docs` and `search_web` do not depend on each other, the graph knows that — they are both edges out of the same node — and can run them together. Two searches at 1.4 s and 2.1 s take 2.1 s instead of 3.5 s, a **1.67×** improvement for no change other than declaring the structure.

**Pausing.** Because state and current position are both explicit, they can be written down. That is what makes a run resumable after a crash, and what makes a human-approval step possible: stop before the node that sends, save, return, and continue hours later in a different process.

## Where it is the wrong choice

**Genuinely open-ended work.** If you cannot enumerate the steps, you cannot draw the graph. Debugging an unfamiliar codebase has no fixed shape, and a graph would just be a loop with more ceremony.

**Trivial work.** One model call does not need a node.

**Graphs that grew.** Past a few dozen nodes the structure stops being something a person can hold, and the property that justified the constraint — that you can see all the paths — is gone. At that point it is a state machine that nobody understands, which is worse than either alternative.

## Graph or loop

| | loop | graph |
| --- | --- | --- |
| the path taken | varies per run | the same for the same inputs |
| testing | end to end only | node by node |
| the model's freedom | chooses every step | works inside steps you chose |
| suits | open-ended problems | processes you can name |

Neither is better. A refund workflow has a known shape and benefits enormously from being drawn; an investigation does not have one and cannot be.

## What to take away

The choice is about whether you can name the steps.

If you can, a graph converts billions of possible sequences into fifteen, and that is what makes the system testable, resumable, and explainable to someone who has to sign off on it. If you cannot, drawing a graph of guesses is worse than admitting the work is open-ended and building a loop with good exit conditions instead.
