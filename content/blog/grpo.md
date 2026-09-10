---
title: "GRPO"
date: "2026-09-10T18:20"
category: "AI"
tags: ["grpo", "reinforcement-learning", "baseline", "reasoning", "training"]
summary: "Generate several answers to the same question, and score each one against how the others did. The group's own average replaces a whole second network — and it fails in a way that is easy to measure."
draft: false
cover: "/blog/grpo.svg"
---

Reinforcement learning on a language model needs to know not just whether an answer scored well, but whether it scored well *compared to what was expected*. Otherwise every answer that earns a positive reward gets encouraged, including the mediocre ones.

The usual way to get that expectation is a second network — a critic, trained alongside the model, predicting how good things are about to be. It is roughly the size of the model itself.

GRPO gets the same expectation for free. Generate several answers to the same question, and use their average as the yardstick.

## What the baseline changes

Take one question, generate eight answers, and score them. Say five are right and three are wrong, with a reward of 1 for correct and 0 for wrong. The group mean is 0.625.

<figure>
<svg viewBox="0 0 600 210" width="600" role="img" aria-label="Eight answers to the same question shown as bars, five scoring one and three scoring zero, with a dashed line at the group mean of 0.625. Advantages below each bar are positive for the correct answers and negative for the wrong ones." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.p{font:600 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.n{font:600 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EIGHT ANSWERS, ONE QUESTION</text>
<path d="M82 140 H502" stroke="var(--border)" stroke-width="1"/>
<rect x="90" y="90" width="40" height="50" rx="3" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="142" y="137" width="40" height="3" rx="1" fill="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<rect x="194" y="90" width="40" height="50" rx="3" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="246" y="90" width="40" height="50" rx="3" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="298" y="137" width="40" height="3" rx="1" fill="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<rect x="350" y="90" width="40" height="50" rx="3" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="402" y="137" width="40" height="3" rx="1" fill="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<rect x="454" y="90" width="40" height="50" rx="3" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<path d="M82 108.8 H502" stroke="var(--primary)" stroke-opacity="0.8" stroke-width="1.4" stroke-dasharray="5 4"/>
<text class="p" x="508" y="112">mean 0.625</text>
<text class="p" x="110" y="164" text-anchor="middle">+0.38</text>
<text class="n" x="162" y="164" text-anchor="middle">−0.63</text>
<text class="p" x="214" y="164" text-anchor="middle">+0.38</text>
<text class="p" x="266" y="164" text-anchor="middle">+0.38</text>
<text class="n" x="318" y="164" text-anchor="middle">−0.63</text>
<text class="p" x="370" y="164" text-anchor="middle">+0.38</text>
<text class="n" x="422" y="164" text-anchor="middle">−0.63</text>
<text class="p" x="474" y="164" text-anchor="middle">+0.38</text>
<text class="l" x="82" y="192">advantages always sum to zero — the group grades itself</text>
</svg>
<figcaption>The dashed line is the only thing a critic network would otherwise have been for.</figcaption>
</figure>

Now compare what the model is told, with and without that line:

| | reward alone | reward − group mean |
| --- | --- | --- |
| the five correct answers | +1.00 | +0.375 |
| the three wrong answers | 0.00 | **−0.625** |

Without the baseline, five answers get pushed up and three are left completely alone. Nothing is ever discouraged, because a reward of zero produces no gradient — being wrong is indistinguishable from not being considered.

With it, the wrong answers get a **negative** weight and are actively pushed down. That sign flip is what a baseline buys, and it is why a baseline of some kind is not optional.

The advantages also sum to exactly zero, always. The group grades itself on a curve.

## What replaces what

Everything else looks much like the clipped policy update it descends from: a ratio between the new and old policy, clipping to stop any single step going too far, and a penalty for drifting away from the model you started with.

The one substitution is the advantage. Instead of a learned per-step prediction of expected value, it is:

$$
A_i = \frac{r_i - \text{mean}(r)}{\text{std}(r)}
$$

computed across the group. Dividing by the group's standard deviation keeps the update size stable whether the group was tightly clustered or spread out.

That removes an entire network from memory and from the training loop — no critic to size, initialise, tune, or debug.

The cost is that credit is assigned to a **whole answer**, not to individual tokens within it. A critic can say which step of a long chain went wrong; a group mean can only say that this answer was better than average. For tasks where the final answer is what matters, that is enough. For tasks where partial credit within a response matters, it is a real loss of resolution.

## The failure you can compute

The baseline comes from the group. If every answer in the group scores the same, the mean equals every reward, every advantage is zero, and the update is zero. The question was generated, sampled eight times, and scored, for no gradient at all.

With binary rewards and a per-answer success rate $p$, a group of $G$ is uniform with probability $p^G + (1-p)^G$:

| success rate | G = 4 | G = 8 | G = 16 | G = 32 |
| --- | --- | --- | --- | --- |
| 0.50 | 12.5% | 0.8% | 0.0% | 0.0% |
| 0.70 | 24.8% | 5.8% | 0.3% | 0.0% |
| 0.90 | 65.6% | **43.0%** | 18.5% | 3.4% |
| 0.95 | 81.5% | 66.3% | 44.0% | 19.4% |
| 0.99 | 96.1% | 92.3% | 85.1% | **72.5%** |

Two things fall out of that table.

**Problems the model has already learned are nearly worthless.** At a 90% success rate, 43% of groups of eight produce no gradient. At 99%, even groups of 32 are wasted almost three quarters of the time. The same holds at the other end — a problem the model never solves gives all-zero rewards and is equally silent.

**The signal is strongest in the middle.** Around a 50% success rate almost every group is informative. So the compute goes where the model is genuinely uncertain, and filtering training problems by difficulty is not a refinement — it is most of the efficiency.

Larger groups help, but they cost linearly: a group of 32 is four times the generation of a group of 8. Past a point it is cheaper to pick better questions than to sample more answers to bad ones.

## Where it fits

It suits tasks with a checkable answer — maths with a known result, code with tests to run, logic with a verifiable conclusion. There the reward is a function you can write, the group scores itself honestly, and no reward model is needed either.

It suits them for a second reason too: those are the tasks where whole-answer credit is sufficient, because the answer is either right or it is not.

On open-ended work — was this helpful, was the tone right — a reward model is still needed to produce a score at all, and the loss of per-step credit hurts more.

## The short version

- Reinforcement learning needs a baseline, or nothing is ever discouraged — a zero reward produces no gradient.
- GRPO generates several answers to one question and uses their mean as that baseline.
- Wrong answers then get a negative advantage rather than merely a small one.
- That removes the critic network entirely, at the cost of per-token credit assignment.
- Advantages are normalised by the group's spread and always sum to zero.
- If a whole group scores identically there is no gradient at all.
- At a 90% success rate that wastes 43% of groups of eight, so choosing problems the model finds genuinely uncertain matters more than sampling more of them.
