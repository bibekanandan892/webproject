---
title: "Vanishing and exploding gradients"
date: "2026-11-06T16:40"
category: "AI"
tags: ["gradients", "deep-learning", "initialisation", "residual-connections", "training"]
summary: "Backpropagation multiplies a gradient by one factor per layer. At 0.9 per layer, 50 layers leave 0.5% of it; at 1.1, it grows 117-fold. In a simulated 50-layer ReLU network, weights drawn slightly too small shrink the signal to 2.7 × 10⁻¹³, slightly too large grow it to 5.65 million, and He initialisation keeps it near 0.5."
draft: false
cover: "/blog/vanishing-and-exploding-gradients.svg"
---

Training a neural network depends on gradients: for every weight, a number saying which way to change it to reduce the error. Backpropagation computes them by starting at the output and working backward, layer by layer, applying the chain rule. At each layer, the gradient is multiplied by that layer's local derivative.

That repeated multiplication is the whole problem. Multiply many numbers together and the result either collapses toward zero or blows up — unless every one of them is very close to 1.

## The arithmetic of depth

Suppose each layer multiplies the gradient by roughly the same factor:

| factor per layer | after 50 layers | after 100 steps |
| --- | --- | --- |
| 0.9 | 0.00515 | 2.66 × 10⁻⁵ |
| 1.0 | 1 | 1 |
| 1.1 | **117** | **13,781** |

A factor only 10% below 1 leaves half a per cent of the gradient after 50 layers: the early layers barely learn. **Vanishing gradients.** A factor 10% above 1 makes the gradient 117 times larger: updates become enormous, weights jump to absurd values, and the loss turns into `NaN`. **Exploding gradients.**

The "100 steps" column is the recurrent case. An RNN applies the same weights at every time step, so a sequence of 100 tokens is effectively 100 layers deep, with the *same* factor each time. That is why plain RNNs could not learn dependencies across long sequences.

## Where the factors come from

Two things set each layer's factor.

**The activation function's slope.** A sigmoid's slope is at most 0.25, so a stack of sigmoid layers vanishes almost by construction. ReLU's slope is 1 for active units and 0 for inactive ones, which is far better behaved.

**The scale of the weights.** A layer with *n* inputs sums *n* weighted terms. If the weights are too small, the sum shrinks layer after layer; too large, it grows. The same scale governs the signal going forward and the gradient going back.

## A simulation

I passed a random input through 50 fully connected ReLU layers of width 256, with weights drawn from a normal distribution, and measured the size (root mean square) of the activations at depth 10, 25 and 50:

| weight standard deviation | depth 10 | depth 25 | depth 50 |
| --- | --- | --- | --- |
| 0.05 — too small | 0.00386 | 7.94 × 10⁻⁷ | **2.7 × 10⁻¹³** |
| 0.0884 — He, √(2/n) | 1.09 | 0.512 | **0.466** |
| 0.12 — too large | 25.4 | 2,960 | **5.65 × 10⁶** |

The three settings differ by less than a factor of 2.5 in weight scale. After 50 layers, the outputs differ by **nineteen orders of magnitude**. With the small weights, the network's output is numerically indistinguishable from zero regardless of the input; with the large ones, it overflows half-precision arithmetic long before depth 50.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="Log-scale chart of activation size against depth for three weight scales: too small falling to 1e-13, He initialisation staying near 1, too large rising to 1e6." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">50 RELU LAYERS, THREE WEIGHT SCALES</text>
<path d="M70 32 V206 H480" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="64" y="38" text-anchor="end">10⁷</text><text class="l" x="64" y="78" text-anchor="end">10²</text><text class="l" x="64" y="96" text-anchor="end">1</text><text class="l" x="64" y="210" text-anchor="end">10⁻¹³</text>
<path d="M70 92.9 H480" stroke="var(--muted-foreground)" stroke-opacity="0.2" stroke-dasharray="3 3"/>
<path d="M70 92.9 L152 80.7 L275 62.7 L480 34.2" stroke="var(--muted-foreground)" stroke-width="2.2" fill="none"/>
<text class="l" x="486" y="40">σ 0.12 → 5.65 × 10⁶</text>
<path d="M70 92.9 L152 92.6 L275 95.4 L480 95.8" stroke="var(--primary)" stroke-width="2.6" fill="none"/>
<text class="b" x="486" y="99">He → 0.466</text>
<path d="M70 92.9 L152 113.9 L275 146.0 L480 202.2" stroke="var(--muted-foreground)" stroke-opacity="0.7" stroke-width="2.2" stroke-dasharray="5 3" fill="none"/>
<text class="l" x="486" y="208">σ 0.05 → 2.7 × 10⁻¹³</text>
<text class="l" x="70" y="222">depth 0</text><text class="l" x="152" y="222">10</text><text class="l" x="275" y="222">25</text><text class="l" x="480" y="222" text-anchor="end">50</text>
<path d="M20 236 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="258">less than 2.5× apart in weight scale; nineteen orders of magnitude apart in output</text>
</svg>
<figcaption>Log scale. The same mechanism governs gradients flowing backward.</figcaption>
</figure>

## The fixes

**Careful initialisation.** Choose the weight scale so each layer preserves the size of the signal. For ReLU layers that is **He initialisation**: standard deviation √(2 / fan-in). (The 2 compensates for ReLU zeroing half its inputs.) For tanh and similar, **Xavier/Glorot** initialisation uses √(1 / fan-in) or the average of fan-in and fan-out. In the simulation, He initialisation is the only row that stays near 1 at depth 50.

**Non-saturating activations.** ReLU and its smooth relatives keep slopes near 1 where units are active, unlike sigmoid and tanh.

**Normalisation layers.** Batch normalisation and layer normalisation rescale activations at each layer to a standard size, so small drifts in scale cannot compound. Transformers apply a normalisation before every attention and feed-forward block.

**Residual connections.** Each block computes `x + f(x)` instead of `f(x)`. The gradient then has a direct path through the addition, with a factor of exactly 1, alongside whatever passes through `f`. Depth stops being a product of many factors and becomes, roughly, a sum. This is what made networks with hundreds of layers trainable, and every transformer uses it.

**Gradient clipping.** For exploding gradients specifically, cap the gradient's overall size before each update. It does not fix the cause, but stops one bad batch from wrecking the weights. It is standard in language model training.

**Gated recurrent units.** For RNNs, LSTMs and GRUs add a memory path whose factor the network can hold near 1, letting gradients survive across many steps. Transformers sidestep the problem by connecting every position to every other directly through attention.

## Spotting it in practice

- **Vanishing:** early layers' weights barely change; loss plateaus early; gradient norms for the first layers are orders of magnitude smaller than for the last.
- **Exploding:** loss spikes or becomes `NaN`; gradient norms jump suddenly; weights grow without bound.

Logging per-layer gradient norms during training catches both early.

## What to take away

Backpropagation multiplies a gradient by one factor per layer, so depth turns small deviations from 1 into enormous ones: 0.9 per layer leaves 0.5% after 50 layers, 1.1 multiplies it by 117. In a simulated 50-layer ReLU network, weight scales 2.5× apart produced outputs nineteen orders of magnitude apart.

He or Xavier initialisation, non-saturating activations, normalisation layers, residual connections and gradient clipping each keep the per-layer factor near 1 — and together they are why very deep networks train at all.
