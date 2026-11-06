---
title: "Activation functions"
date: "2026-10-02T15:40"
category: "AI"
tags: ["activation-functions", "relu", "sigmoid", "softmax", "deep-learning"]
summary: "Without a bend between layers, a deep network is one linear layer in disguise. Which bend matters too: a sigmoid's slope is at most 0.25, so ten sigmoid layers can shrink a gradient by a factor of a million — 9.54 × 10⁻⁷. ReLU's slope is 1, which is most of why deep networks became trainable."
draft: false
cover: "/blog/activation-functions.svg"
---

Every layer of a neural network computes a weighted sum of its inputs and then passes the result through an **activation function**. The weighted sum is the part that learns; the activation is the part that makes learning worth anything.

## Why there has to be one

A weighted sum is a linear operation. Two linear operations in a row are still one linear operation: multiplying by one matrix and then another is the same as multiplying by their product. So a hundred layers with no activation between them collapse into a single layer. However deep the network looks, it can only draw straight lines and flat planes — it cannot even learn XOR.

An activation function bends the output of each layer. With a bend between every pair of layers, stacking finally means something: each layer can build curved, folded, combined shapes out of the previous layer's output.

## The common ones

| input | sigmoid | tanh | ReLU | GELU |
| --- | --- | --- | --- | --- |
| −2 | 0.119 | −0.964 | 0 | −0.046 |
| 0 | 0.500 | 0.000 | 0 | 0.000 |
| 2 | 0.881 | 0.964 | 2 | 1.954 |

**Sigmoid**, `1 / (1 + e⁻ˣ)`, squashes any input into (0, 1). It reads naturally as a probability and is still used for that at the output of binary classifiers.

**Tanh** squashes into (−1, 1) and is centred on zero, which made it preferable to sigmoid in hidden layers for a long time.

**ReLU**, `max(0, x)`, passes positive inputs unchanged and zeroes negative ones. It is almost trivially cheap and became the default for deep networks.

**GELU** and **SiLU/Swish** are smooth versions of ReLU: close to the identity for large positive inputs, close to zero for large negative ones, with a soft curve between that lets small negative values through. They are the standard choice in transformers, often inside gated variants like SwiGLU.

**Softmax** is different in kind: it acts on a whole vector, turning a list of scores into probabilities that sum to 1. Scores of `[2.0, 1.0, 0.1]` become `[0.659, 0.242, 0.099]`. It is used at the output of classifiers and language models, and inside attention.

## Why ReLU took over: the slope

Training passes gradients backward through every layer, and at each layer the gradient is multiplied by the activation function's slope at that point. Over many layers those multiplications compound.

The sigmoid's slope is never more than **0.25** (at x = 0) and falls toward zero for large inputs, where the function flattens out — it **saturates**. Even in the best case, ten sigmoid layers multiply the gradient by:

`0.25¹⁰ = 9.54 × 10⁻⁷`

and twenty layers by about 10⁻¹². The early layers receive a gradient a million times weaker than the later ones and barely learn. This is the **vanishing gradient** problem, and it is why deep networks were so hard to train before around 2010.

Tanh is better — its slope reaches 1 at zero — but at an input of 1 its slope is already 0.42, and ten such layers give 0.000171.

ReLU's slope is exactly **1** for every positive input. Gradients pass through active units without shrinking at all. Combined with careful weight initialisation and normalisation layers, that is much of what made very deep networks trainable.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="Plots of sigmoid, tanh and ReLU on the same axes, with a note that the sigmoid's maximum slope is 0.25 and ten layers of it shrink a gradient to 9.54e-7." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THREE BENDS, THREE SLOPES</text>
<path d="M40 120 H300 M170 36 V200" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<path d="M40 117 C110 116 140 108 170 90 C200 72 230 64 300 63" stroke="var(--muted-foreground)" stroke-width="2" fill="none"/>
<text class="l" x="232" y="58">sigmoid</text>
<path d="M40 178 C120 178 140 170 170 120 C200 70 220 62 300 62" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="4 3" fill="none"/>
<text class="l" x="44" y="172">tanh</text>
<path d="M40 120 H170 L248 42" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<text class="b" x="252" y="44">ReLU</text>
<text class="l" x="174" y="214">0</text>
<text class="b" x="330" y="56">maximum slope</text>
<text class="l" x="330" y="80">sigmoid  0.25</text>
<text class="l" x="330" y="98">tanh     1 at 0, 0.42 at 1</text>
<text class="b" x="330" y="116">ReLU     1 when active</text>
<text class="b" x="330" y="146">after 10 layers</text>
<text class="l" x="330" y="168">sigmoid  9.54 × 10⁻⁷</text>
<text class="b" x="330" y="186">ReLU     1</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="250">gradients are multiplied by the slope at every layer on the way back</text>
</svg>
<figcaption>Saturating curves flatten at the ends, and a flat curve passes almost no gradient.</figcaption>
</figure>

## ReLU's own problem, and the fix

ReLU's slope is zero for negative inputs. A neuron whose weighted sum is negative for every input in the data outputs zero always, receives no gradient, and can never recover. These are **dead neurons**; a bad learning rate can kill a substantial share of a network.

Variants address this:

- **Leaky ReLU** gives negative inputs a small slope, such as 0.01, so a gradient always flows.
- **GELU and SiLU** curve smoothly through zero, passing a little gradient for moderately negative inputs and none only for very negative ones. Their smoothness also tends to make optimisation slightly better in large models.

## Choosing one

- **Hidden layers of most networks:** ReLU, or a smooth relative.
- **Transformers:** GELU or SiLU, usually in a gated form (SwiGLU) in the feed-forward layers.
- **Binary output:** sigmoid, giving a probability.
- **Multi-class output:** softmax over the class scores.
- **Regression output:** no activation — the raw weighted sum is the prediction.

## What to take away

An activation function bends each layer's output, without which any stack of layers is equivalent to one linear layer. Sigmoid and tanh squash into fixed ranges and saturate; their small slopes compound during backpropagation, so ten sigmoid layers can shrink gradients to 9.54 × 10⁻⁷ of their size.

ReLU passes gradients unchanged through active units, which is a large part of why deep learning became practical. Its smooth successors, GELU and SiLU, are now standard in transformers, and softmax remains the way scores become probabilities at the output.
