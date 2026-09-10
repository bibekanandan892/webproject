---
title: "World Models"
date: "2026-09-11T14:40"
category: "AI"
tags: ["world-models", "reinforcement-learning", "planning", "latent-space", "robotics"]
summary: "A world model is a learned simulator an agent can practise inside. The whole design question is how many steps it can imagine before its own small errors compound into fiction."
draft: false
cover: "/blog/world-models.svg"
---

An agent that learns by acting has to act to learn. Every improvement costs a real attempt in a real environment, and real attempts are slow, expensive, and sometimes destructive.

A world model changes what the agent practises against. Instead of a real environment, it learns a *predictor* of the environment: give it the current situation and a proposed action, and it returns what would happen next.

Once that exists, the agent can try things without doing them.

## What it has to predict

The model is trained on ordinary recorded experience. Every step the agent takes produces a triple — this was the situation, this is what I did, this is what happened — and predicting the third from the first two is a supervised learning problem like any other.

The subtlety is *what* "the situation" means.

If the agent sees a 64×64 colour image, the raw observation is 12,288 numbers. Predicting all of them for every imagined step is enormous work spent almost entirely on things that do not matter: texture, lighting, background.

So the model learns a compressed representation first — say 32 numbers that keep what is needed to predict the future and discard what is not. That is 384× smaller, and prediction happens entirely inside it. The agent imagines in this compact space and never renders a picture at all.

The compression is not a nicety. It is what makes imagining thousands of steps affordable.

## Imagining forward

To look several steps ahead you feed the model its own output. Predicted state, plus the next proposed action, gives the next predicted state, and so on.

This is where the trouble is. Each prediction has a small error, and every subsequent step is built on an input that was already slightly wrong.

Say each step adds 0.01 of error on a scale where 1.0 means the imagined state no longer resembles anything real. If errors merely accumulate, the rollout stays usable for 100 steps.

But most dynamics do not merely accumulate — they amplify. A slightly wrong position implies a slightly wrong velocity implies a more wrong position. With just 5% amplification per step:

| step | error, no amplification | error, 5% amplification |
| --- | --- | --- |
| 10 | 0.100 | 0.126 |
| 25 | 0.250 | 0.477 |
| 50 | 0.500 | **2.093** |

| amplification per step | steps before the imagination is fiction |
| --- | --- |
| none | 100 |
| 2% | 56 |
| 5% | 37 |
| 10% | 26 |

A 5% amplification does not sound like a flaw. It cuts the usable horizon by nearly two thirds.

<figure>
<svg viewBox="0 0 560 266" width="560" role="img" aria-label="Two error curves over fifty imagined steps: a straight line for accumulating error and a steep curve for amplifying error crossing the usable threshold much earlier." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SMALL PER-STEP ERROR, COMPOUNDED</text>
<path d="M60 190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<path d="M60 40 V190" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<path d="M60 115 H520" stroke="var(--muted-foreground)" stroke-opacity="0.3" stroke-dasharray="5 4"/>
<text class="l" x="524" y="118">1.0</text>
<path d="M60 190 L520 153" stroke="color-mix(in srgb, var(--muted-foreground) 70%, transparent)" stroke-width="2" fill="none"/>
<path d="M60 190 L106 186 L152 181 L198 174 L244 165 L290 154 L336 140 L382 122 L428 99" stroke="var(--primary)" stroke-width="2.2" fill="none"/>
<circle cx="400" cy="114" r="3.5" fill="var(--primary)"/>
<text class="b" x="300" y="88">5% amplification</text>
<text class="l" x="360" y="172">no amplification</text>
<text class="l" x="60" y="208">0</text>
<text class="l" x="290" y="208" text-anchor="middle">25</text>
<text class="l" x="520" y="208" text-anchor="end">50 imagined steps</text>
<text class="l" x="20" y="232">crossing the dashed line means the imagined state resembles nothing real</text>
<text class="l" x="20" y="248">that happens at step 37, not step 100</text>
</svg>
<figcaption>Compounding is why imagination horizons are measured in tens of steps, not thousands.</figcaption>
</figure>

## The loop this forces

Because the horizon is short, a world model is not something you build once and then plan inside forever. The agent alternates:

1. Act in the real environment for a while, recording what happened.
2. Improve the model on that new data.
3. Imagine many short rollouts and improve the policy against them.
4. Go back to step 1.

Step 3 is where the leverage is. A thousand real steps, each used as a starting point for a 15-step imagined rollout, produces 15,000 training transitions. The expensive resource — real interaction — is stretched fifteen-fold.

Step 1 is where the honesty is. Only real data can tell the model it is wrong, and the agent's improving policy keeps taking it to situations the model was never trained on. Skip step 1 for too long and the policy becomes excellent at exploiting the model's errors — finding the imagined state where the imagined reward is enormous and the real one is not there at all.

## Where it earns its cost

The technique pays off exactly where real attempts are painful.

A robot arm has motors that wear out and objects it can knock over. A driving policy cannot rehearse the situations that matter most. In both cases the sample budget is small and the cost of a bad attempt is high — precisely the conditions that make an imperfect simulator worth having.

Where attempts are cheap and fast, the calculation flips: a real environment you can run a million times is more accurate than any model of it, and free.

## What to take away

A world model buys practice with prediction. The exchange rate is set by how fast its errors compound.

Which is why the interesting number is never how accurate the model is on a single step. It is how many steps you can chain before that accuracy stops meaning anything — and the answer is usually smaller than it looks.
