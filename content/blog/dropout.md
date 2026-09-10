---
title: "Dropout"
date: "2026-09-11T11:00"
category: "AI"
tags: ["dropout", "regularisation", "overfitting", "training", "ensembles"]
summary: "Switch off a random half of the neurons at every training step. It stops the network relying on any particular one, and the scaling factor that makes it work is more interesting than it looks."
draft: false
cover: "/blog/dropout.svg"
---

Dropout switches off a random subset of neurons at every training step. A dropped neuron outputs zero — it contributes nothing forward and receives nothing back.

Next step, a different random subset. Every step trains a different, thinner network.

## What it is preventing

A network with plenty of capacity can memorise its training data rather than learn from it, and the resulting model does well on what it has seen and badly on anything else.

The specific mechanism dropout attacks is **co-adaptation**. Neurons settle into fixed arrangements — one learns to correct another's systematic error, a third only fires when a particular pair does. The group works, but only as a group, and only on the data it was tuned to.

Dropout makes those arrangements unreliable. A neuron that depends on its neighbour being present will be wrong half the time, because half the time the neighbour is gone. What survives is features that are useful on their own.

## How many networks

Each step samples a mask over the layer, and every distinct mask is a distinct sub-network sharing weights with all the others.

| neurons in a layer | possible sub-networks |
| --- | --- |
| 4 | 16 |
| 10 | 1,024 |
| 32 | 4,294,967,296 |
| 100 | 1.27 × 10³⁰ |
| 256 | **1.16 × 10⁷⁷** |

Training visits a vanishing fraction of those. That is fine — the effect does not come from covering them. It comes from every weight being trained under an enormous variety of contexts, so it cannot specialise to any one of them.

At test time nothing is dropped, and the full network behaves roughly like an average over that family.

## The scaling factor

There is a detail here that is easy to skip and is the reason the method is usable.

If half the neurons are off during training and all are on at test time, the layer's output is roughly twice as large at test time as anything downstream was tuned for. The network was trained at one scale and evaluated at another.

The fix is to divide the surviving activations by the keep probability during training. With $p = 0.5$, survivors are doubled — so the layer's expected output matches what it would have been with nothing dropped.

Two million draws on the values 2, 4, 6, 8:

| $p$ | mean without scaling | mean with $/(1-p)$ |
| --- | --- | --- |
| 0.2 | 1.60, 3.20, 4.80, 6.40 | 2.001, 3.999, 6.000, 7.994 |
| 0.5 | 1.00, 2.00, 3.00, 4.00 | 2.000, 3.996, 6.002, 7.995 |
| 0.8 | 0.40, 0.80, 1.20, 1.60 | 2.001, 3.993, 6.005, 7.977 |

Unscaled, the layer is systematically quieter during training, and by exactly the drop rate. Scaled, the expectation lands on the original values at every rate.

<figure>
<svg viewBox="0 0 560 220" width="560" role="img" aria-label="Four neuron values shown three ways: the original values, the same values with two dropped to zero, and the survivors doubled so the total matches the original." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">DROP HALF, DOUBLE THE REST</text>
<text class="l" x="130" y="56" text-anchor="end">original</text>
<rect x="140" y="42" width="20" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="200" y="42" width="40" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="280" y="42" width="60" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="380" y="42" width="80" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="l" x="470" y="57">sum 20</text>
<text class="l" x="130" y="116" text-anchor="end">dropped</text>
<rect x="140" y="102" width="20" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="200" y="110" width="40" height="4" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="280" y="102" width="60" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="380" y="110" width="80" height="4" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="l" x="470" y="117">sum 8</text>
<text class="l" x="130" y="176" text-anchor="end">rescaled</text>
<rect x="140" y="162" width="40" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 65%, transparent)"/>
<rect x="200" y="170" width="40" height="4" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="280" y="162" width="120" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 65%, transparent)"/>
<rect x="380" y="170" width="80" height="4" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="v" x="470" y="177">sum 16</text>
<text class="l" x="20" y="206">on average across many masks the rescaled sum returns to 20</text>
</svg>
<figcaption>Any single mask is off. The expectation over masks is not.</figcaption>
</figure>

Doing the correction during training rather than at test time is called **inverted dropout**, and it is what everything uses. The alternative — leaving training alone and scaling everything down at inference — works out to the same thing, but puts the adjustment in the code path you least want to complicate.

## On during training, off at inference

Predictions should be deterministic. The same input twice should not give two answers because different neurons were dropped.

This is the most common mistake with dropout, and it is silent in both directions. Left on at inference, output becomes unnecessarily noisy. Left off during training — or, more usually, the framework never told to switch modes — and the regularisation simply never happened, with no error to indicate it.

## Choosing the rate

Usually 0.2 to 0.5, and lower for layers that are already narrow.

Too high and there is not enough signal left for the layer to learn anything; the network underfits and training is slow because most of each step is discarded. Too low and the neurons can still rely on each other, which was the thing being prevented.

Dropping individual units is the standard form. In convolutional layers, neighbouring units are so correlated that dropping them one at a time achieves little — the information survives in the neighbours — so entire channels are dropped instead. Dropping connections rather than units is another variant, and recurrent networks need the mask held constant across timesteps or the sequence memory is destroyed rather than regularised.

## The short version

- Randomly switch off neurons during training, a different set each step.
- It targets co-adaptation: neurons that only work as a fixed group.
- Every mask is a distinct sub-network — 1.16 × 10⁷⁷ of them for a 256-unit layer.
- The benefit is not covering them all; it is training each weight in many contexts.
- Surviving activations are divided by the keep probability so the expected output is unchanged.
- Without that, the layer is systematically quieter in training than at inference.
- Dropout must be on for training and off for inference; getting this wrong fails silently.
- Rates of 0.2 to 0.5, and drop whole channels rather than units in convolutional layers.
