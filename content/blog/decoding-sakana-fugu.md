---
title: "Decoding Sakana Fugu"
date: "2026-09-11T15:40"
category: "AI"
tags: ["orchestration", "routing", "multi-model", "sakana", "agents"]
summary: "Fugu does not answer questions. It decides which frontier model should, and in its larger form how several of them should divide the work — which makes the interesting question how much capability is actually available to be routed to."
draft: false
cover: "/blog/decoding-sakana-fugu.svg"
---

Fugu, from Sakana AI, is a model whose output is not an answer. Given a task, it decides which of several frontier models should handle it — and in its larger variant, how several of them should split the work between them.

The claim behind it is that coordination is its own axis of capability: that a well-directed team of existing models beats any one of them, without training anything bigger.

That claim is testable, and the arithmetic is more interesting than the architecture.

## How much is there to win

Different models fail on different problems. If they failed on exactly the same ones, routing would be pointless — you would always pick the strongest and be done.

So the ceiling for routing is the **union**: the share of problems that at least one model in the pool can solve. A perfect router with foreknowledge would hit exactly that.

On one software-engineering benchmark, three frontier models score 69.2%, 58.6% and 54.2%. If their failures were statistically independent, the union would be 94.2% — a 25-point gap above the best single model, sitting there waiting for a router good enough to claim it.

They are not independent. Hard problems tend to be hard for everyone, so the real union is far below 94.2%.

But this cuts both ways, and here is what makes it worth computing. The orchestrated system reaches **73.7%**. For that to be possible, the fraction of the best model's failures that are hard for *every* model must be at most 85.4% — because if more than that were commonly hard, no router could have got past 72.3%.

So the reported number tells you something about the pool that no individual score does: at least 15% of what the strongest model gets wrong, some other model gets right.

<figure>
<svg viewBox="0 0 560 274" width="560" role="img" aria-label="A bar from the best single model's score up to the independent-failure ceiling, with the achieved orchestrated score marked partway along." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHAT ROUTING CAN POSSIBLY BUY</text>
<rect x="20" y="46" width="346" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 26%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="374" y="64">69.2% — best single model</text>
<rect x="20" y="82" width="369" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="397" y="100">73.7% — orchestrated</text>
<rect x="20" y="118" width="471" height="26" rx="4" fill="none" stroke="var(--primary)" stroke-opacity="0.5" stroke-dasharray="5 4"/>
<text class="l" x="499" y="136">94.2%</text>
<text class="l" x="20" y="166">the dashed bar is the ceiling if the three models failed independently</text>
<text class="l" x="20" y="184">they do not — hard problems are hard for everyone</text>
<path d="M20 202 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="226">reaching 73.7% proves at most 85.4% of the leader's failures</text>
<text class="b" x="20" y="244">are hard for the whole pool — so the pool is genuinely diverse</text>
</svg>
<figcaption>You cannot route to capability that is not in the pool. The gap between the solid bars is what the router actually recovered.</figcaption>
</figure>

## Two shapes of the same idea

**The fast variant picks one model per input.** It does not write out its reasoning — it reads its own hidden state after taking in the task and produces a score per candidate model directly. One forward pass, then hand the whole job over.

That design decision is the point of the variant. If choosing which model to use cost as much as running one, routing would be a tax rather than a saving.

**The larger variant plans a small workflow.** Rather than one choice it emits a structure: a set of subtasks, which model handles each, and which earlier results each one is allowed to see.

This second form is not bound by the union ceiling above, and that is exactly why it exists. Two models can each produce a partial answer that neither could complete alone, and a third can assemble them. Composition can exceed the best member in a way selection cannot.

## Training something whose output is a plan

Both variants face the same difficulty: the thing being learned is a decision, and decisions have no gradient of their own. You only find out whether a choice was good by running it.

The first stage is ordinary supervised learning. Run every candidate model over a set of tasks, record how well each did, turn those scores into a target distribution, and train the selector to match it. This teaches broad competence — which models are generally good at which kinds of work.

The second stage handles what supervision cannot. For workflows there is no labelled correct plan, so training compares *sampled* plans against each other: generate several for the same task, score each on whether the final answer was right, and push toward the ones that scored above the group's average. A plan is not judged against an ideal; it is judged against its own siblings.

The selection head is also adjusted with a search method that needs no gradients at all — perturb the parameters, keep what scores well, move that way. Slow per step, but it works on objectives that are not differentiable, which a "did this workflow succeed" reward is not.

## The parts that are easy to overlook

**Workers do not see each other's context.** Each subtask gets only what the plan explicitly grants it. This is a correctness measure, not tidiness: if every worker inherited every previous result, one confused step would contaminate the rest, and the orchestrator would lose the independence that makes combining answers worth anything.

**The pool is swappable.** Because the orchestrator scores candidates rather than embedding knowledge of specific ones, a better model can be added without retraining from scratch. That is a real practical property — the alternative is a system that decays as the field moves.

## What to take away

The honest reading of Fugu is not "orchestration beats big models". It is that a pool of models with genuinely different failures contains more capability than any member exposes, and that this surplus can be partly recovered by something small and cheap deciding who does what.

How much surplus there is depends entirely on how different the models are. That is the number worth measuring before building anything — and it is the one usually left unmeasured.
