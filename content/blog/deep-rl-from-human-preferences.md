---
title: "Deep RL from Human Preferences"
date: "2026-09-12T03:20"
category: "AI"
tags: ["rlhf", "reward-modelling", "reinforcement-learning", "preferences", "credit-assignment"]
summary: "Nine hundred comparisons — one hour of someone's attention — taught a simulated robot to backflip. That is 11,111× fewer human decisions than scoring every step, and the trick is what the comparison is asked about."
draft: false
cover: "/blog/deep-rl-from-human-preferences.svg"
---

Reinforcement learning needs a reward: a number after every action saying how well that went. Where there is a natural score — a game, a clearly measurable outcome — this is fine.

For anything else it is the hardest part of the problem. Write a reward for "do a backflip" and you find yourself specifying joint angles, rotation thresholds and landing conditions, and the agent finds some spinning-on-the-ground behaviour that maximises your formula and looks nothing like a backflip.

This paper replaced the written reward with a learned one, and its lasting contribution is *what it asked people to do.*

## The unit of human work

Not "score this action". Two design choices, both about human perception rather than machine learning.

**Short clips, not single states.** A snapshot of a robot mid-air says nothing about whether it is doing the right thing — motion only exists over time. So the unit is a clip of one or two seconds, the shortest window in which a person can tell what is happening.

**Comparison, not scoring.** A person is shown two clips and asked which is better. Not how good either is — just which one. That is a judgement people make consistently; absolute numbers are not.

Both choices are about making the question answerable, and they are the reason the labelling budget works out.

## How little labelling that is

An agent training for ten million environment steps, with nine hundred comparisons of two-second clips:

| | |
| --- | --- |
| environment steps | 10,000,000 |
| steps a human actually saw | 216,000 |
| share of the run observed | **2.16%** |

| | human decisions required |
| --- | --- |
| a reward for every step | 10,000,000 |
| one preference per pair of clips | **900** |
| | **11,111× fewer** |

At roughly four seconds of attention per comparison, nine hundred comparisons is **one hour** of one person's time. That hour produced a backflip that no hand-written reward function had managed.

## How a preference becomes a reward

The reward model outputs a number for each step. A clip's score is the sum of those numbers over its steps, and the probability that a person prefers clip A is:

```
P(A preferred) = exp(sum of A) / ( exp(sum of A) + exp(sum of B) )
```

With per-step predictions of `[2, 1, 2]` against `[1, 1, 0]`:

| | |
| --- | --- |
| sum of A | 5 |
| sum of B | 2 |
| P(A preferred) | **95.3%** |

The formula depends only on the difference, which means absolute reward values carry no information:

| gap between the sums | P(preferred) |
| --- | --- |
| 0 | 50.0% |
| 1 | 73.1% |
| 2 | 88.1% |
| 3 | 95.3% |

Training minimises `−log P(the clip the human chose)`. If the human agreed with the model, the loss here is 0.049. If they picked B, it is 3.049 — **63× larger**. A confident wrong prediction is punished hard, a hedged one mildly, which is what makes the model calibrate rather than just rank.

<figure>
<svg viewBox="0 0 560 306" width="560" role="img" aria-label="Two clips of three frames with per-step rewards summed, converted into a preference probability, with the loss shown for agreeing and disagreeing." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE HUMAN PICKS A CLIP — THE MODEL INFERS THE STEPS</text>
<text class="b" x="20" y="44">clip A</text>
<g fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6">
<rect x="70" y="32" width="52" height="24" rx="3"/><rect x="128" y="32" width="52" height="24" rx="3"/><rect x="186" y="32" width="52" height="24" rx="3"/>
</g>
<text class="b" x="96" y="48" text-anchor="middle">2</text>
<text class="b" x="154" y="48" text-anchor="middle">1</text>
<text class="b" x="212" y="48" text-anchor="middle">2</text>
<text class="b" x="252" y="48">sum 5</text>
<text class="l" x="20" y="86">clip B</text>
<g fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)">
<rect x="70" y="74" width="52" height="24" rx="3"/><rect x="128" y="74" width="52" height="24" rx="3"/><rect x="186" y="74" width="52" height="24" rx="3"/>
</g>
<text class="l" x="96" y="90" text-anchor="middle">1</text>
<text class="l" x="154" y="90" text-anchor="middle">1</text>
<text class="l" x="212" y="90" text-anchor="middle">0</text>
<text class="l" x="252" y="90">sum 2</text>
<path d="M20 116 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="140">a gap of 3 means P(A preferred) = 95.3%</text>
<rect x="20" y="150" width="440" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 32%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="460" y="150" width="22" height="18" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 26%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="b" x="26" y="163">A — 95.3%</text>
<text class="l" x="490" y="163">B — 4.7%</text>
<text class="l" x="20" y="196">loss if the human agreed: 0.049</text>
<rect x="20" y="204" width="8" height="14" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="20" y="242">loss if the human picked B: 3.049 — 63× larger</text>
<rect x="20" y="250" width="500" height="14" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 34%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="20" y="284">nobody told the model which of the three steps was good</text>
</svg>
<figcaption>The comparison is about the whole clip. The per-step numbers are the model's own explanation of it.</figcaption>
</figure>

## The clever part: nobody says which step was good

Look again at what the human provided. "Clip A was better." That is all.

The model produces a number for every individual step, and those numbers are never labelled. They are inferred — fitted so that their *sums* explain which clips people preferred, across hundreds of comparisons.

That is credit assignment, solved by the reward model rather than by the person. A step that appears in many preferred clips accumulates a high value; one that appears in rejected clips does not. The human never had to decide that frame 34 was the good bit, which is fortunate, because they could not have.

## Three things running at once

The loop is asynchronous, and this is what makes the tiny labelling budget sufficient.

1. The **agent** trains against the current reward model, continuously.
2. The **reward model** retrains on all comparisons collected so far, continuously.
3. A **human** labels clips sampled from what the agent is doing *now*.

Because the clips come from current behaviour, the labels always describe the region of the space the policy actually occupies. There is no need to label good behaviour in advance, or to cover the space — only to keep correcting the model where the agent has arrived.

Two refinements matter. Clips are chosen where the reward model is most *uncertain*, so each comparison is maximally informative. And an ensemble of reward models provides that uncertainty estimate, as well as making the learned reward harder to exploit — a policy would have to fool all of them at once.

## What it became

The published result — a backflip from about 900 comparisons in under an hour, and complex behaviours from feedback on well under 1% of interactions — was the proof that the approach worked at all.

The structure transferred directly. Replace clips of a simulated robot with candidate text responses, and the same three components appear: demonstrations of preference, a reward model trained by comparison, a policy optimised against it. The vocabulary changed and the method did not.

## What to take away

The paper's insight is about the interface to the human, not the algorithm.

Ask for a comparison rather than a score, over a window long enough to see behaviour, sampled from what the agent is doing right now — and one hour of attention replaces ten million judgements. Everything about learning per-step rewards from whole-clip preferences follows from having asked the answerable question.
