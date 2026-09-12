---
title: "Decoding InstructGPT"
date: "2026-09-12T03:00"
category: "AI"
tags: ["instructgpt", "rlhf", "alignment", "reward-model", "ppo"]
summary: "Thirteen thousand written examples is 0.002% of the pretraining text, and the whole alignment run was 1.6% of the compute. It made a 1.3-billion-parameter model preferred over a 175-billion one."
draft: false
cover: "/blog/decoding-instructgpt.svg"
---

A model trained purely to predict the next token continues patterns. Give it a question and a plausible continuation is another question — because in the text it learned from, questions frequently appear in lists of questions.

That is not a defect in the training. It is the training working exactly as specified, on an objective that never mentioned being helpful.

InstructGPT is the paper that closed that gap, and its most striking property is how little it took.

## The leverage

The pipeline is three steps, described below. What it cost:

| | |
| --- | --- |
| written demonstrations | ~13,000 |
| tokens of alignment data | ~5.2 million |
| as a share of the pretraining text | **0.002%** |
| compute, as a share of pretraining | **1.6%** |

And what it bought: a **1.3-billion-parameter** aligned model whose outputs people preferred to those of the **175-billion-parameter** unaligned one. A 135× reduction in parameters, from two thousandths of one percent more data.

That number is the paper's real result. The capability was already in the pretrained weights; what was missing was any instruction to *use* it in the shape a person wanted. Supplying that instruction turned out to be almost free, and worth more than two orders of magnitude of scale.

<figure>
<svg viewBox="0 0 560 300" width="560" role="img" aria-label="A bar for pretraining data dwarfing an almost invisible sliver for alignment data, beside a comparison of a small aligned model beating a large unaligned one." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHAT 0.002% MORE DATA WAS WORTH</text>
<text class="l" x="20" y="44">pretraining — 300 billion tokens</text>
<rect x="20" y="54" width="500" height="22" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 26%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 44%, transparent)"/>
<text class="b" x="20" y="100">alignment — 5.2 million tokens</text>
<rect x="20" y="108" width="2" height="22" rx="1" fill="var(--primary)"/>
<text class="b" x="32" y="124">this sliver, at this scale</text>
<path d="M20 152 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="176">preference, head to head</text>
<rect x="20" y="186" width="404" height="20" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="l" x="30" y="201">175B parameters, unaligned</text>
<rect x="20" y="212" width="3" height="20" rx="1.5" fill="color-mix(in srgb, var(--primary) 60%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="32" y="227">1.3B parameters, aligned — and preferred</text>
<text class="l" x="20" y="256">bars are parameter counts to scale: 135× fewer, and it wins</text>
<text class="l" x="20" y="278">the capability was already in the weights — nothing told it to use it</text>
</svg>
<figcaption>Both comparisons are drawn to scale. The alignment stage is the thin line in each.</figcaption>
</figure>

## Step one: show it

Human writers produce good answers to real prompts, and the model is fine-tuned on them the ordinary way — next-token prediction on the demonstrations.

Around forty people wrote roughly thirteen thousand of these. This alone fixes most of the pattern-continuation problem: after seeing thousands of examples where a question is followed by an answer, that becomes the likely continuation.

What it cannot do is scale. Writing a good answer is slow, and there is no way to cover the space of things people ask by hand.

## Step two: learn what people prefer

So the second step learns a *judge* instead of more answers.

For a prompt, several candidate outputs are generated and a person **ranks** them. A separate model — 6 billion parameters — is trained to assign a score such that better-ranked answers score higher.

The loss is one expression:

```
loss = −log(sigmoid(r_win − r_lose))
```

It cares only about the gap:

| gap between the two scores | confidence | loss |
| --- | --- | --- |
| 0.0 | 50.0% | 0.693 |
| 1.0 | 73.1% | 0.313 |
| 3.0 | 95.3% | 0.049 |

Nothing anchors the absolute values, which is deliberate. Only the ordering carries information.

Two design choices here are worth pausing on.

**Comparison, not scoring.** Asking a person to rate an answer 7 out of 10 produces numbers that vary between annotators and drift for the same annotator over a session. Asking which of two is better produces a judgement that is stable and much easier to make. The model learns from the reliable signal.

**Ranking many at once.** Ranking *k* answers yields every pair among them:

| answers ranked together | training pairs | pairs per answer read |
| --- | --- | --- |
| 2 | 1 | 0.50 |
| 4 | 6 | 1.50 |
| 9 | **36** | **4.00** |

Ranking nine answers produces 36 pairs from one reading session — eight times the pairs of the same effort spent on pairwise comparisons alone. The labelling budget is the binding constraint, so a combinatorial multiplier on it is a large win.

## Step three: optimise against the judge

Now the model is trained to produce outputs the reward model scores highly, using a policy-gradient method.

And immediately there is a problem: the reward model is an approximation. Optimise hard against any approximation and you find its errors rather than the thing it was approximating. The policy drifts toward text that scores well and reads badly.

The fix is a penalty on drift:

```
final reward = reward model score − β × distance from the original model
```

Every step away from the pretrained model's distribution costs something. So improvements have to be worth the distance — which keeps the policy in the region where the reward model was actually trained and still measures something real.

That penalty is not a detail. It is the difference between alignment and reward hacking, and the whole method depends on it being tuned.

## The tax, stated honestly

Aligning the model made it worse at some of the academic benchmarks the pretrained model was measured on.

This is the alignment tax, and it is a genuine trade rather than a bug: optimising for "answers a person finds useful" is a different objective from "completes text in the distribution of the internet", and moving toward one moves away from the other. Mixing pretraining gradients back into the reinforcement-learning stage reduces it without removing it.

Worth naming because it is the honest cost, and because the paper's own numbers show the trade was clearly worth taking:

| | |
| --- | --- |
| preference for the aligned 175B model | 85% |
| hallucination rate | 41% → 21% |
| toxicity | down 25% |

Halving hallucination is the line that mattered most in practice.

## What to take away

The paper's lasting contribution is a claim about where capability comes from.

A pretrained model already contains what it needs; what it lacks is any indication of which of its many possible behaviours is wanted. Supplying that took 0.002% more data and 1.6% more compute, and beat 135× the parameters — which is why every assistant-style model since has some version of these three steps in its history.
