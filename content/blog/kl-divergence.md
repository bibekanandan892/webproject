---
title: "KL divergence, step by step"
date: "2026-10-29T13:50"
category: "AI"
tags: ["kl-divergence", "information-theory", "cross-entropy", "rlhf", "math"]
summary: "KL divergence measures the extra bits you pay for using the wrong distribution. For P = [0.5, 0.3, 0.2] and Q = [0.4, 0.4, 0.2] it is 0.0365 bits one way and 0.0372 the other — not a distance — and if Q gives an outcome that P considers likely just one in a million, it jumps to 3.30."
draft: false
cover: "/blog/kl-divergence.svg"
---

Kullback–Leibler divergence compares two probability distributions over the same outcomes. It turns up throughout machine learning: inside cross-entropy loss, in variational autoencoders, in knowledge distillation, and as the leash that keeps a model close to its original behaviour during reinforcement learning from human feedback.

It is easiest to understand as a cost.

## The idea: bits wasted on the wrong code

Suppose events happen according to a true distribution **P**, but you design your expectations — a compression code, a prediction, a betting strategy — around a different distribution **Q**. Each outcome *x* costs `−log₂ Q(x)` bits under your code, when the best possible code would cost `−log₂ P(x)`. KL divergence is the average extra cost, weighted by how often each outcome really happens:

`KL(P ‖ Q) = Σ P(x) · log₂( P(x) / Q(x) )`

It is zero when Q equals P, and positive otherwise.

## Step by step

Three outcomes. The truth is **P = [0.5, 0.3, 0.2]**; the model believes **Q = [0.4, 0.4, 0.2]**.

| outcome | P | Q | P / Q | log₂(P/Q) | P · log₂(P/Q) |
| --- | --- | --- | --- | --- | --- |
| A | 0.5 | 0.4 | 1.25 | 0.3219 | 0.1610 |
| B | 0.3 | 0.4 | 0.75 | −0.4150 | −0.1245 |
| C | 0.2 | 0.2 | 1.00 | 0 | 0 |
| | | | | **KL(P ‖ Q)** | **0.0365 bits** |

Outcome A happens more often than Q expects, so it adds cost; B happens less often than expected, which partly offsets; C is predicted exactly. On average, using Q instead of P costs 0.0365 extra bits per outcome.

## It is not a distance

Swap the roles — truth Q, belief P:

`KL(Q ‖ P) = 0.0372 bits`

Not the same number. KL divergence is **asymmetric**, so it is not a distance in the geometric sense, and the direction you compute it in matters. Here the two are close; for very different distributions they can differ enormously.

## Where it blows up

The asymmetry is clearest when Q assigns almost no probability to something P considers likely. Keep P the same, but let the model believe **Q = [0.5, 0.499999, 0.000001]** — outcome C, which really happens 20% of the time, is treated as one in a million:

`KL(P ‖ Q) = 3.301 bits`

A hundred times larger. Each time C occurs, the code built on Q pays about 20 bits for it instead of 2.3. If Q assigned C exactly zero, the divergence would be infinite. **KL(P ‖ Q) severely punishes Q for ruling out things that happen.**

The reverse direction behaves the other way: KL(Q ‖ P) barely cares if Q ignores outcomes, but punishes Q for putting probability where P has none. This difference shows up in practice:

- Minimising **KL(P ‖ Q)** over Q makes Q *cover* every outcome P allows — it spreads out. ("Mode-covering.")
- Minimising **KL(Q ‖ P)** makes Q concentrate on a region P likes and ignore the rest. ("Mode-seeking.")

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Paired bars for P and Q over three outcomes, with the per-outcome contributions to KL; below, a second Q that nearly rules out outcome C and drives the divergence from 0.0365 to 3.301 bits." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EXTRA BITS FOR BELIEVING Q WHEN P IS TRUE</text>
<path d="M40 150 H520" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<g fill="var(--primary)" fill-opacity="0.8"><rect x="70" y="50" width="40" height="100"/><rect x="230" y="90" width="40" height="60"/><rect x="390" y="110" width="40" height="40"/></g>
<g fill="var(--muted-foreground)" fill-opacity="0.5"><rect x="114" y="70" width="40" height="80"/><rect x="274" y="70" width="40" height="80"/><rect x="434" y="110" width="40" height="40"/></g>
<text class="l" x="90" y="166" text-anchor="middle">P 0.5</text><text class="l" x="134" y="166" text-anchor="middle">Q 0.4</text>
<text class="l" x="250" y="166" text-anchor="middle">P 0.3</text><text class="l" x="294" y="166" text-anchor="middle">Q 0.4</text>
<text class="l" x="410" y="166" text-anchor="middle">P 0.2</text><text class="l" x="454" y="166" text-anchor="middle">Q 0.2</text>
<text class="b" x="112" y="44" text-anchor="middle">+0.161</text><text class="l" x="272" y="62" text-anchor="middle">−0.125</text><text class="l" x="432" y="102" text-anchor="middle">0</text>
<text class="b" x="20" y="190">KL(P ‖ Q) = 0.0365 bits · KL(Q ‖ P) = 0.0372 — not symmetric</text>
<text class="b" x="20" y="212">make Q(C) one in a million: KL(P ‖ Q) = 3.301 bits</text>
<path d="M20 226 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="248">ruling out what actually happens is the most expensive mistake KL can measure</text>
</svg>
<figcaption>Dark: the true distribution P. Grey: the belief Q. Numbers above: each outcome's contribution.</figcaption>
</figure>

## How it connects to cross-entropy

Cross-entropy is the average cost of coding P's outcomes with Q's code: `H(P, Q) = −Σ P(x) log₂ Q(x)`. Entropy `H(P)` is the cost with the best code. KL is the difference:

`H(P, Q) = H(P) + KL(P ‖ Q)`

For the example: `1.4855 + 0.0365 = 1.5219` bits.

When training a classifier, P is the data's labels and is fixed, so H(P) is a constant. **Minimising cross-entropy loss is exactly minimising KL divergence** from the data to the model. Every classifier and language model trained with cross-entropy is, underneath, reducing a KL divergence.

KL from the uniform distribution has a neat reading too: `KL(P ‖ uniform) = log₂ n − H(P)`. For our P that is `log₂ 3 − 1.4855 = 0.0995` bits — how far P is from being completely uninformative.

## Where else it appears

**RLHF and preference tuning.** The reward-maximising policy is penalised by `β · KL(policy ‖ reference)`, so it cannot drift far from the pre-trained model while chasing reward. Without this, it finds degenerate outputs that score well and read badly.

**Knowledge distillation.** A small student model is trained to minimise the KL divergence between its output distribution and a larger teacher's, learning from the teacher's full probabilities rather than just its top answers.

**Variational autoencoders.** A KL term keeps each encoded distribution close to a simple prior, so the latent space stays smooth and can be sampled from.

**Monitoring.** KL between the distribution of model inputs or outputs today and at launch is a simple drift alarm.

## What to take away

KL divergence is the average number of extra bits paid for believing Q when P is true: `Σ P log(P/Q)`. For P = [0.5, 0.3, 0.2] and Q = [0.4, 0.4, 0.2] it is 0.0365 bits; reversed, 0.0372 — it is not a distance. It explodes when Q nearly rules out something P says is likely: 3.301 bits for a one-in-a-million belief in a 20% event.

Cross-entropy equals entropy plus KL, so training with cross-entropy is minimising KL; and the same quantity keeps RLHF-tuned models close to their starting point.
