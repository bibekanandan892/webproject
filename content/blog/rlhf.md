---
title: "RLHF"
date: "2026-09-10T16:40"
category: "AI"
tags: ["rlhf", "alignment", "reward-model", "ppo", "preferences"]
summary: "People cannot score an answer out of ten consistently, but they can say which of two is better. RLHF is the machinery for turning a pile of those comparisons into a model that behaves."
draft: false
cover: "/blog/rlhf.svg"
---

A model trained only to predict the next token is very good at continuing text and not at all interested in being useful. Ask it a question and a plausible continuation might be another question, or a page of links.

RLHF is how that becomes an assistant. The awkward part is that "helpful" has no formula, so it has to be learned from people — and the way people are asked matters more than it looks.

## Ask for comparisons, not scores

Nobody can rate an answer 7.5 out of 10 consistently. Ask the same person the same question next week and the number moves; ask a second person and it moves more.

Ask instead which of two answers is better, and agreement is much higher. Comparison is a judgement people can actually make.

That leaves a problem: training needs a number, and comparisons are not numbers. The standard conversion assumes the probability of preferring A over B depends on the gap between two hidden scores:

$$
P(A \succ B) = \sigma(s_A - s_B)
$$

Which makes the scores interpretable, since a gap maps to a win rate:

| score gap | how often A is preferred |
| --- | --- |
| 0.0 | 50.0% |
| 0.5 | 62.2% |
| 1.0 | 73.1% |
| 2.0 | 88.1% |
| 3.0 | 95.3% |

And it works. Take four responses, generate 24,000 pairwise comparisons between them, throw away everything except who won each one, and fit a single score per response:

| response | true score | recovered from comparisons |
| --- | --- | --- |
| A | 1.250 | 1.250 |
| B | 0.450 | 0.471 |
| C | −0.350 | −0.342 |
| D | −1.350 | −1.378 |

Nobody ever stated a score. They only said which of two they preferred, and the scale falls out of the pattern of wins.

## Three stages

<figure>
<svg viewBox="0 0 620 250" width="620" role="img" aria-label="A pipeline: a base model becomes a supervised fine-tuned model, which drives a reinforcement learning loop scored by a reward model trained on preference pairs, producing an aligned model. A dashed KL arrow ties the loop back to the fine-tuned model." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.g{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="rl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="24" y="20">THREE STAGES, THREE DATASETS</text>
<rect x="24" y="60" width="100" height="44" rx="8" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 32%, transparent)"/>
<text class="g" x="74" y="87" text-anchor="middle">base</text>
<rect x="164" y="60" width="100" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 46%, transparent)"/>
<text class="b" x="214" y="87" text-anchor="middle">sft</text>
<rect x="304" y="60" width="120" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<text class="b" x="364" y="87" text-anchor="middle">rl loop</text>
<rect x="464" y="60" width="120" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 46%, transparent)"/>
<text class="b" x="524" y="87" text-anchor="middle">aligned</text>
<rect x="304" y="150" width="120" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="364" y="177" text-anchor="middle">reward model</text>
<rect x="140" y="150" width="120" height="44" rx="8" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="g" x="200" y="177" text-anchor="middle">A beats B</text>
<path d="M124 82 H158" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rl)"/>
<path d="M264 82 H298" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rl)"/>
<path d="M424 82 H458" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rl)"/>
<path d="M260 172 H298" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rl)"/>
<path d="M364 146 V110" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rl)"/>
<path d="M340 56 V36 H214 V54" fill="none" stroke="var(--primary)" stroke-opacity="0.55" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#rl)"/>
<text class="b" x="277" y="30" text-anchor="middle">KL: do not drift far from this</text>
<text class="g" x="24" y="222">the reward model is a training tool — it is never the thing you ship</text>
</svg>
<figcaption>Three models are in play during stage three, and only one of them is the product.</figcaption>
</figure>

**Supervised fine-tuning.** Train the base model on tens of thousands of hand-written prompt-and-answer pairs. This does not make it good; it makes it *behave like an assistant* — answering when asked, stopping when finished. Everything after this needs a starting point that is already roughly in the right shape.

**The reward model.** Take the fine-tuned model, generate several answers per prompt, have people say which they prefer, and fit the score above. The result is a model that reads a prompt and an answer and outputs one number predicting how a person would rank it. It is scaffolding — it is never deployed.

**Reinforcement learning.** Generate answers, score them with the reward model, and nudge the weights toward higher scores. The nudges are deliberately small; large policy updates make this unstable.

## Why the model is tethered

The reward model is an approximation fitted to a finite set of comparisons. Push hard enough on any approximation and you find the places it is wrong.

Left alone, that is exactly what happens. The model discovers that longer answers score well, or that confident phrasing scores well, or that refusing scores better than risking a bad answer — and it produces long, confident, hedging text that the reward model loves and nobody wants.

So a penalty is added for drifting away from the fine-tuned model it started as:

$$
\text{objective} = \text{reward} - \beta \cdot \text{KL}(\text{model} \,\|\, \text{sft})
$$

With $\beta = 0.05$:

| reward | KL | objective |
| --- | --- | --- |
| 3.4 | 1 | 3.35 |
| **3.9** | **6** | **3.60** |
| 4.6 | 22 | 3.50 |
| 5.1 | 48 | 2.70 |

Read the reward column on its own and the last row is best. Read the objective and it is the worst of the four.

The optimum is the second row — some movement, not much. That is the entire design: the reward is allowed to pull, and the penalty decides how far, and the best point is never the highest reward available.

## Reward hacking

When it goes wrong it is recognisable.

Answers get longer without getting more informative. Every response opens with a paragraph of throat-clearing about how happy it is to help. Harmless questions get refused because refusal was safer in the preference data than a wrong answer.

None of these are bugs in the optimisation. It maximised what it was given, and what it was given was an imperfect model of what people wanted.

The defences are all about not trusting that model too far. Keep the penalty on. Re-collect preferences on the *current* model's outputs rather than the ones you started with, since old data cannot describe behaviours that did not exist yet. And keep a held-out human evaluation, because a rising reward score is not evidence of anything — the reward model is the thing being gamed.

## What goes wrong in practice

**Skipping the fine-tuning stage.** Reinforcement learning on a raw base model has almost nothing to reinforce; good answers are too rare to find by sampling.

**A weak reward model.** It is the ceiling. The final model can only be as aligned as the thing scoring it.

**Turning off the penalty.** Reliably produces drift into nonsense that scores well.

**Collecting preferences once.** After a round of training the model produces different output, and the preference data describes a model that no longer exists.

**Inconsistent labellers.** Two people applying different standards put contradictory signal into the same dataset, and the reward model learns the average of a disagreement.

There is also a simpler path. Instead of fitting a reward model and running reinforcement learning against it, the preference pairs can be used to update the model directly — which removes two models and most of the instability, at the cost of some of the flexibility.

## The short version

- People rank pairs consistently and score individually badly, so preferences are collected as comparisons.
- A score gap maps to a win rate through a sigmoid, and per-response scores can be recovered from comparisons alone.
- Stage one teaches assistant behaviour; stage two fits the reward model; stage three optimises against it.
- The reward model is scaffolding and is never shipped.
- A KL penalty holds the model near where it started, and the best objective is never the highest reward.
- Push too hard and you get reward hacking: long, over-polite, over-refusing answers that score well and help nobody.
- Re-collect preferences each round, and judge progress by human evaluation rather than by the score being optimised.
