---
title: "Why weights are initialised randomly"
date: "2026-11-06T18:20"
category: "AI"
tags: ["initialisation", "neural-networks", "symmetry", "training", "fundamentals"]
summary: "Start every weight at the same value and every hidden neuron computes the same thing, gets the same update, and stays identical forever. A 4-neuron XOR network started at 0.5 ends 5,000 steps later with all four neurons still exactly equal and the problem unsolved; started randomly, it solves it."
draft: false
cover: "/blog/random-weight-initialization.svg"
---

Before a neural network trains, its weights need starting values. Zero seems natural — a blank slate. Or any constant. It is one of the few choices in deep learning that is simply wrong, and the reason is worth understanding.

## The symmetry problem

Consider a hidden layer of four neurons, each connected to the same inputs. If all their weights start equal, then:

1. **Forward pass:** every neuron computes the same weighted sum of the same inputs, so every neuron outputs the same value.
2. **Backward pass:** every neuron's outgoing weight is the same too, so every neuron receives the same gradient.
3. **Update:** the same gradient, applied to the same weights, gives the same new weights.

After the update the neurons are still identical. And so after the next one, and every one after that. Training cannot break the tie, because nothing in the process treats the neurons differently. Four neurons behave as one neuron copied four times.

## Seeing it happen

I trained the same small network twice on XOR — 2 inputs, 4 sigmoid hidden neurons, 1 output, 5,000 steps, identical in every respect except the starting weights.

| starting weights | final loss | outputs for (0,0) (0,1) (1,0) (1,1) | difference between hidden neurons |
| --- | --- | --- | --- |
| all 0.5 | 0.1674 | 0.018 · 0.653 · 0.653 · **0.655** | **0.0** |
| random in [−1, 1] | **0.0001** | 0.010 · 0.990 · 0.990 · 0.013 | 9.73 |

With constant weights, the four hidden neurons ended training *exactly* identical — a measured difference of zero. The network behaves as if it had a single hidden neuron, and a single neuron cannot represent XOR: it outputs 0.655 for (1, 1), where the answer is 0, and only 0.653 where the answer is 1. Training made what progress one neuron can make and stopped.

With random weights, each neuron started slightly different, received different gradients, and moved in different directions. They specialised — each learning a different boundary — and together solved the problem to two decimal places.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Two small networks after training: on the left all four hidden neurons drawn identically with identical connection weights; on the right four distinct neurons with different connection strengths." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME START, SAME FATE</text>
<g stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="2">
<path d="M50 80 L130 50 M50 80 L130 90 M50 80 L130 130 M50 80 L130 170 M50 140 L130 50 M50 140 L130 90 M50 140 L130 130 M50 140 L130 170"/>
<path d="M130 50 L210 110 M130 90 L210 110 M130 130 L210 110 M130 170 L210 110"/>
</g>
<g fill="var(--background)" stroke="var(--muted-foreground)" stroke-width="1.6"><circle cx="50" cy="80" r="9"/><circle cx="50" cy="140" r="9"/><circle cx="130" cy="50" r="9"/><circle cx="130" cy="90" r="9"/><circle cx="130" cy="130" r="9"/><circle cx="130" cy="170" r="9"/><circle cx="210" cy="110" r="9"/></g>
<text class="l" x="20" y="200">constant 0.5: neurons identical</text>
<text class="l" x="20" y="216">difference 0.0 · loss 0.1674</text>
<g stroke="var(--primary)">
<path d="M330 80 L410 50" stroke-width="3.5"/><path d="M330 80 L410 90" stroke-width="0.8"/><path d="M330 80 L410 130" stroke-width="2.5"/><path d="M330 80 L410 170" stroke-width="1.2"/>
<path d="M330 140 L410 50" stroke-width="1"/><path d="M330 140 L410 90" stroke-width="3.2"/><path d="M330 140 L410 130" stroke-width="2"/><path d="M330 140 L410 170" stroke-width="0.6"/>
<path d="M410 50 L490 110" stroke-width="2.8"/><path d="M410 90 L490 110" stroke-width="3.4"/><path d="M410 130 L490 110" stroke-width="0.9"/><path d="M410 170 L490 110" stroke-width="1.8"/>
</g>
<g fill="var(--background)" stroke="var(--primary)" stroke-width="1.6"><circle cx="330" cy="80" r="9"/><circle cx="330" cy="140" r="9"/><circle cx="410" cy="50" r="9"/><circle cx="410" cy="90" r="9"/><circle cx="410" cy="130" r="9"/><circle cx="410" cy="170" r="9"/><circle cx="490" cy="110" r="9"/></g>
<text class="b" x="300" y="200">random: neurons specialise</text>
<text class="b" x="300" y="216">difference 9.73 · loss 0.0001</text>
<path d="M20 230 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="250">identical inputs, identical gradients, identical updates — forever</text>
</svg>
<figcaption>Left: four neurons that are really one. Right: four neurons that learned four different things.</figcaption>
</figure>

## Zero is worse than any other constant

With all weights at zero, it is even worse. Hidden neurons all output the same value (zero with ReLU, 0.5 with sigmoid), and the gradients flowing back through zero outgoing weights are themselves zero for the earlier layers. Depending on the architecture, parts of the network do not learn at all.

Biases are the exception. Starting biases at zero is normal and harmless, because the random weights already break the symmetry.

## Random, but not any random

Randomness breaks symmetry. The *scale* of the randomness decides whether signals survive the trip through many layers. Too small and activations shrink layer by layer until they vanish; too large and they grow until they overflow — and gradients do the same on the way back.

The standard schemes choose the scale from the layer's size so that each layer roughly preserves the variance of its input:

- **Xavier / Glorot:** standard deviation about √(1 / fan-in), or √(2 / (fan-in + fan-out)). Designed for tanh and sigmoid.
- **He / Kaiming:** standard deviation √(2 / fan-in). The factor of 2 compensates for ReLU zeroing out half its inputs. The default for ReLU networks.

Transformers often use small, fixed-scale normal initialisations with extra down-scaling of the layers that feed residual connections, so that adding many blocks together does not grow the signal.

## Randomness has consequences

Because initialisation is random, two training runs with different random seeds produce different networks — different weights, often slightly different accuracy. Good practice is to report results over several seeds, and to fix the seed when exact reproducibility matters.

Some techniques exploit this. **Ensembles** train the same architecture from several random starts and average their predictions, which is usually more accurate than any single run, precisely because the random starts lead them to different solutions.

## What to take away

If all weights start equal, every neuron in a layer computes the same output, receives the same gradient and makes the same update, so they stay identical for ever. A 4-neuron XOR network started at 0.5 finished with its hidden neurons exactly equal and the problem unsolved; started randomly, it solved it.

Random initialisation breaks that symmetry so neurons can specialise. Its scale — Xavier for tanh, He for ReLU — keeps signals and gradients from vanishing or exploding as they pass through many layers.
