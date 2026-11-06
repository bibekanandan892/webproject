---
title: "Tree of Thoughts"
date: "2026-11-06T11:50"
category: "AI"
tags: ["reasoning", "prompting", "search", "tree-of-thoughts", "agents"]
summary: "Chain-of-thought commits to one line of reasoning; Tree of Thoughts explores several and keeps the best. A three-step problem solved 21.6% of the time in one chain becomes 97.0% with five candidates per step and a perfect judge — and 49.6% with a judge that is right 80% of the time."
draft: false
cover: "/blog/tree-of-thoughts.svg"
---

Chain-of-thought prompting asks a model to reason step by step before answering. It helps a great deal, but it has a structural weakness: the chain is written once, left to right. If step two goes wrong, every step after it builds on the mistake. There is no going back.

Tree of Thoughts treats reasoning as a search instead. At each step the model proposes several possible next thoughts, evaluates them, keeps the promising ones, and expands those further. Dead ends are abandoned. The answer is the best path found through the tree.

## The parts

A Tree of Thoughts system needs four decisions:

1. **What a "thought" is.** A unit of progress small enough to evaluate — one equation in a maths puzzle, one line of a plan, one paragraph outline.
2. **How to generate candidates.** Sample *b* different next thoughts from the current state, or ask the model to propose *b* options in one call.
3. **How to evaluate them.** Ask the model to rate each partial solution — "sure / likely / impossible" — or to vote on which is most promising. Sometimes a program can check directly.
4. **How to search.** Breadth-first, keeping the best *k* states at each level (a beam), or depth-first with backtracking when a branch is judged hopeless.

## Why it helps: the arithmetic

Suppose a problem needs three steps and the model gets each step right with probability 0.6 when it writes one attempt.

**One chain:** all three must be right. `0.6³ =` **21.6%**.

**A tree with 5 candidates per step:** the chance at least one of five candidates is right is `1 − 0.4⁵ = 98.98%`. If the evaluator always recognises the right one, three steps succeed with probability `0.9898³ =` **97.0%**.

That is the promise: generate several options at each step, and the search almost always contains a correct path even when any single attempt usually fails.

## The catch: the judge

But the evaluator is the same model, and it is not perfect. If it picks the correct candidate — when one exists — with probability *e*:

| judge accuracy | per step | three steps |
| --- | --- | --- |
| perfect | 0.990 | **97.0%** |
| 0.9 | 0.891 | 70.7% |
| 0.8 | 0.792 | **49.6%** |
| 0.7 | 0.693 | 33.3% |

With an 80%-accurate judge, the tree solves the problem about half the time — still more than double the single chain, but nowhere near 97%. The generation side is almost never the bottleneck; recognising the good branch is. Tree of Thoughts works best where evaluation is easier than generation, or where a program can verify partial answers outright.

<figure>
<svg viewBox="0 0 560 280" width="560" role="img" aria-label="A search tree three levels deep with five candidates at each level; one path is highlighted as the kept branch and others are crossed out as pruned." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">PROPOSE, JUDGE, PRUNE, REPEAT</text>
<circle cx="280" cy="44" r="9" fill="var(--primary)"/>
<g stroke="var(--muted-foreground)" stroke-opacity="0.4"><path d="M280 53 L120 92"/><path d="M280 53 L200 92"/><path d="M280 53 L360 92"/><path d="M280 53 L440 92"/></g>
<path d="M280 53 L280 92" stroke="var(--primary)" stroke-width="2"/>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"><circle cx="120" cy="100" r="8"/><circle cx="200" cy="100" r="8"/><circle cx="360" cy="100" r="8"/><circle cx="440" cy="100" r="8"/></g>
<circle cx="280" cy="100" r="8" fill="var(--primary)"/>
<g stroke="var(--muted-foreground)" stroke-opacity="0.6"><path d="M114 94 L126 106 M126 94 L114 106"/><path d="M434 94 L446 106 M446 94 L434 106"/></g>
<g stroke="var(--muted-foreground)" stroke-opacity="0.4"><path d="M280 108 L200 148"/><path d="M280 108 L240 148"/><path d="M280 108 L320 148"/><path d="M280 108 L360 148"/></g>
<path d="M280 108 L280 148" stroke="var(--primary)" stroke-width="2"/>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"><circle cx="200" cy="156" r="8"/><circle cx="240" cy="156" r="8"/><circle cx="320" cy="156" r="8"/><circle cx="360" cy="156" r="8"/></g>
<circle cx="280" cy="156" r="8" fill="var(--primary)"/>
<path d="M280 164 L280 196" stroke="var(--primary)" stroke-width="2"/>
<rect x="250" y="196" width="60" height="20" rx="4" fill="var(--primary)" fill-opacity="0.18" stroke="var(--primary)"/>
<text class="b" x="280" y="210" text-anchor="middle">answer</text>
<text class="l" x="470" y="104">5 per step</text>
<text class="l" x="400" y="160">judge keeps best</text>
<path d="M20 234 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="256">one chain: 21.6% · tree + perfect judge: 97.0% · tree + 80% judge: 49.6%</text>
<text class="l" x="20" y="274">the good branch is nearly always generated; the question is whether it is chosen</text>
</svg>
<figcaption>Search turns a weak generator into a strong one only if the evaluator is strong.</figcaption>
</figure>

## What it costs

A beam search keeping *k* = 5 states, generating *b* = 5 candidates from each, over *d* = 3 levels, makes:

- `3 × 5 × 5 = 75` generation calls
- `75` evaluation calls

**150 model calls** where chain-of-thought made one. Batching and asking for several candidates in one call reduce this, but Tree of Thoughts is fundamentally a way of spending much more inference compute for better answers on hard problems.

The original paper's showcase was the Game of 24 — combine four numbers with arithmetic to make 24 — where GPT-4 with chain-of-thought solved 4% of puzzles and with Tree of Thoughts 74%. That task is close to ideal: each step is one equation, partial states are easy to judge ("can 10 and 14 still make 24? yes"), and errors early are fatal to a single chain.

## Where it fits now

Reasoning models trained with reinforcement learning do a version of this internally: they explore, notice mistakes and backtrack within one long chain of thought, without an external search harness. For many problems that has replaced explicit Tree of Thoughts.

The explicit version is still useful when:

- **a program can verify partial work** — tests for code, a checker for a puzzle, a solver for constraints;
- **the search should be inspectable** — every branch and every judgement is logged;
- **you want to control the budget** — width and depth are parameters, not something the model decides.

## What to take away

Tree of Thoughts turns reasoning into search: propose several next steps, judge them, keep the best, repeat. Generating five candidates per step makes it very likely the right path exists — 97% versus 21.6% for a single chain on a three-step problem with a perfect judge.

The judge is the limit. At 80% accuracy the same tree solves about half the problems, at roughly 150 calls instead of one. Use it where evaluating a step is much easier than producing it, ideally with a program doing the checking.
