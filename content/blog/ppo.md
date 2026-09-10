---
title: "PPO"
date: "2026-09-10T17:40"
category: "AI"
tags: ["ppo", "reinforcement-learning", "clipping", "policy", "training"]
summary: "PPO improves a policy while refusing to move it far in one step. The clipping that enforces this is not symmetric, and the asymmetry is the part worth understanding."
draft: false
cover: "/blog/ppo.svg"
---

A policy is whatever decides the next action — for a language model, the distribution over the next token. Reinforcement learning improves it by trying things, scoring the results, and adjusting.

The difficulty is step size. Adjust too little and training takes forever. Adjust too much and the policy lands somewhere that behaves badly, and since it is now generating its own training data, everything after that is collected from a broken policy. There is no going back to good data.

PPO is the answer that took over: improve the policy, but refuse to move it far from where it started.

## The ratio

Everything is expressed through one quantity — how much more likely the new policy is to take an action than the old one was:

$$
r = \frac{\pi_{\text{new}}(a)}{\pi_{\text{old}}(a)}
$$

$r = 1$ means no change. $r = 1.5$ means half again as likely. $r = 0.5$ means half as likely.

Alongside it sits the **advantage**, $A$: how much better the action turned out than expected. Positive means it beat expectations and should be made more likely; negative means the opposite.

Multiply them and you have the naive objective, $rA$. Maximise it and a good action's probability is pushed up without limit — which is exactly the instability to avoid.

## The clipped objective

$$
L = \min\bigl(rA,\; \text{clip}(r,\, 1-\epsilon,\, 1+\epsilon)\,A\bigr)
$$

With $\epsilon = 0.2$ the clip holds $r$ between 0.8 and 1.2. Two terms, and the smaller wins.

That `min` looks like a detail. It is the whole mechanism, and it does something asymmetric:

| ratio | $A = +1$ | clipped? | $A = -1$ | clipped? |
| --- | --- | --- | --- | --- |
| 0.5 | 0.50 | no | **−0.80** | yes |
| 0.8 | 0.80 | no | −0.80 | no |
| 1.0 | 1.00 | no | −1.00 | no |
| 1.2 | 1.20 | no | −1.20 | no |
| 1.5 | **1.20** | yes | −1.50 | no |
| 3.0 | **1.20** | yes | **−3.00** | no |

<figure>
<svg viewBox="0 0 580 272" width="580" role="img" aria-label="Two curves of the clipped objective against the probability ratio. For a positive advantage the curve rises then flattens above ratio 1.2. For a negative advantage the curve is flat below ratio 0.8 and then falls without limit as the ratio rises." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">THE CLIP ONLY BITES ONE WAY AT A TIME</text>
<path d="M70 106.1 H534" stroke="var(--border)" stroke-width="1"/>
<path d="M185 34 V220" stroke="var(--muted-foreground)" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="4 3"/>
<path d="M300 34 V220" stroke="var(--muted-foreground)" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="4 3"/>
<path d="M242.5 34 V220" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.2"/>
<path d="M70.0 87.2 L98.8 82.5 L127.5 77.8 L156.3 73.1 L185.0 68.3 L213.8 63.6 L242.5 58.9 L271.3 54.2 L300.0 49.4 L328.8 49.4 L357.5 49.4 L386.3 49.4 L415.0 49.4 L443.8 49.4 L472.5 49.4 L501.3 49.4 L530.0 49.4" fill="none" stroke="color-mix(in srgb, var(--primary) 75%, transparent)" stroke-width="2.2"/>
<path d="M70.0 143.9 L98.8 143.9 L127.5 143.9 L156.3 143.9 L185.0 143.9 L213.8 148.6 L242.5 153.3 L271.3 158.1 L300.0 162.8 L328.8 167.5 L357.5 172.2 L386.3 176.9 L415.0 181.7 L443.8 186.4 L472.5 191.1 L501.3 195.8 L530.0 200.6" fill="none" stroke="color-mix(in srgb, var(--muted-foreground) 75%, transparent)" stroke-width="2.2"/>
<text class="v" x="392" y="42">A = +1 · flat, stop pushing</text>
<text class="l" x="392" y="216">A = −1 · keeps falling</text>
<text class="l" x="185" y="236" text-anchor="middle">0.8</text>
<text class="l" x="242.5" y="236" text-anchor="middle">1.0</text>
<text class="l" x="300" y="236" text-anchor="middle">1.2</text>
<text class="l" x="300" y="252" text-anchor="middle">probability ratio</text>
<text class="l" x="62" y="60" text-anchor="end">L</text>
</svg>
<figcaption>Above 1.2 the two curves behave completely differently. That is deliberate.</figcaption>
</figure>

Read the two curves separately.

**A good action, pushed too far.** Above $r = 1.2$ the objective flattens. Raising the probability further gains nothing, the gradient is zero, and the update stops. This is the safety.

**A bad action, made more likely.** Above $r = 1.2$ nothing flattens — the objective keeps falling, without limit. The gradient stays alive and the correction keeps pulling.

That asymmetry is the point of the `min`. A cap on how far you can *reward* something is prudent. A cap on how far you can *correct* a mistake would be dangerous. If the policy has drifted into making a bad action three times more likely, PPO does not respond by shrugging at 1.2 — it applies the full penalty and drags it back.

The same asymmetry holds mirrored on the other side: suppressing a good action too hard is not clipped either.

So the rule is not "never move more than 20%". It is **never move more than 20% in the direction the data is encouraging**, while leaving corrections unbounded.

## Why the step limit lets you reuse data

There is a practical payoff beyond stability.

Collecting experience is expensive — for a language model, it means generating complete responses and scoring them. You would like several gradient steps out of each batch.

But the data was generated by the old policy, and after one update the current policy is different, so the data is technically off-policy and increasingly misleading. The ratio $r$ is exactly the measure of how stale it has become — it is 1 when the policies agree and drifts away as they diverge.

Clipping therefore does double duty: it bounds the step, and it switches off the gradient precisely when the data has become too stale to trust. That is what makes several passes over one batch safe.

## What it costs

**A second model.** The advantage needs an expectation to compare against, which means a value model predicting how good a state is, trained alongside the policy. Roughly doubles the memory and the compute.

**Hyperparameters.** $\epsilon$, the number of passes over each batch, the value model's learning rate. PPO is more forgiving than what came before it, not forgiving.

**Noisy rewards.** Clipping bounds the size of a step, not its direction. If the reward signal is systematically wrong, PPO will walk steadily toward the wrong place.

In language-model alignment there is usually a further term: a penalty on drifting from the model you started with. Clipping keeps each individual step small; that penalty keeps the total distance small. They are answering different questions, and both are needed.

## The short version

- A policy decides the next action; RL improves it from scored outcomes.
- Big steps break training irrecoverably, because the policy then generates its own bad data.
- PPO works with the ratio of new to old probability for an action, and the advantage.
- The objective takes the minimum of the raw and the clipped term.
- With a positive advantage the objective flattens past $1+\epsilon$ — pushing further gains nothing.
- With a negative advantage it does not flatten — corrections are never capped.
- That is also what makes reusing a batch safe: the gradient dies exactly when the data goes stale.
- The cost is a second model for the advantage, plus hyperparameters to tune.
