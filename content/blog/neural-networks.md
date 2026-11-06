---
title: "What a neural network is"
date: "2026-09-08T15:55"
category: "AI"
tags: ["neural-networks", "deep-learning", "backpropagation", "fundamentals", "xor"]
summary: "Layers of weighted sums, each followed by a bend. A network with 17 parameters learns XOR — something no single neuron can — going from outputs stuck near 0.41 to 0.01 / 0.99 / 0.99 / 0.013 in 5,000 steps. Every large model is the same idea with more of everything."
draft: false
cover: "/blog/neural-networks.svg"
---

A neural network is a function with adjustable numbers inside it. You give it an input — pixels, words, sensor readings — and it produces an output — a label, a probability, the next word. Training means adjusting the numbers until the outputs are right on examples where the right answer is known.

That is the whole idea. Everything else is the specifics of what the function looks like and how the adjusting is done.

## One neuron

The building block takes some inputs, multiplies each by a **weight**, adds them up with a **bias**, and passes the result through an **activation function**:

`output = activation(w₁x₁ + w₂x₂ + … + b)`

The weights say how much each input matters and in which direction. The bias shifts the threshold. The activation bends the result — a sigmoid squashes it into 0 to 1, a ReLU zeroes out negatives.

A single neuron draws one straight line (or flat plane) through the input space and says which side a point is on. That is enough for AND and OR. It is not enough for XOR.

## Why one neuron is not enough

XOR is true when exactly one of two inputs is true:

| x₁ | x₂ | XOR |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

Plot the four points and try to draw one straight line with the 1s on one side and the 0s on the other. It cannot be done — the 1s are on one diagonal and the 0s on the other. No single neuron can compute XOR, whatever its weights.

## A layer in between

Put a **hidden layer** of neurons between the inputs and the output. Each hidden neuron draws its own line; the output neuron combines them. Two lines can fence off the diagonal, so XOR becomes possible.

The network below has 2 inputs, 4 hidden neurons and 1 output, all with sigmoid activations. Counting weights and biases: `2×4 + 4 + 4×1 + 1 =` **17 parameters**. Starting from random weights, I trained it on the four XOR examples, measuring error as the mean squared difference between output and target:

| step | loss | outputs for (0,0) (0,1) (1,0) (1,1) |
| --- | --- | --- |
| 1 | 0.3350 | 0.417 · 0.406 · 0.419 · 0.409 |
| 100 | 0.2879 | 0.488 · 0.504 · 0.496 · 0.508 |
| 500 | 0.0093 | 0.077 · 0.913 · 0.908 · 0.113 |
| 1,000 | 0.0011 | 0.030 · 0.968 · 0.968 · 0.040 |
| 5,000 | **0.0001** | **0.010 · 0.990 · 0.990 · 0.013** |

At the start every output is about 0.41 — the network knows nothing and says roughly the same thing for everything. By step 100 it has only learned to say 0.5, the safest answer when unsure. Somewhere before step 500 the hidden neurons find useful lines, and the outputs split apart. By 5,000 steps it is right to two decimal places.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="A 2-4-1 neural network diagram with weighted connections, beside a curve of training loss falling from 0.335 to 0.0001 with a plateau near step 100." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">17 PARAMETERS LEARN XOR</text>
<g stroke="var(--muted-foreground)" stroke-opacity="0.45">
<path d="M50 90 L140 50"/><path d="M50 90 L140 90"/><path d="M50 90 L140 130"/><path d="M50 90 L140 170"/>
<path d="M50 150 L140 50"/><path d="M50 150 L140 90"/><path d="M50 150 L140 130"/><path d="M50 150 L140 170"/>
<path d="M140 50 L230 110"/><path d="M140 90 L230 110"/><path d="M140 130 L230 110"/><path d="M140 170 L230 110"/>
</g>
<g fill="var(--background)" stroke="var(--primary)" stroke-width="1.6">
<circle cx="50" cy="90" r="11"/><circle cx="50" cy="150" r="11"/>
<circle cx="140" cy="50" r="11"/><circle cx="140" cy="90" r="11"/><circle cx="140" cy="130" r="11"/><circle cx="140" cy="170" r="11"/>
<circle cx="230" cy="110" r="11"/>
</g>
<text class="l" x="36" y="200">input</text><text class="l" x="118" y="200">hidden</text><text class="l" x="212" y="200">output</text>
<path d="M290 40 V180 H540" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="296" y="36">loss (log)</text>
<path d="M290 50 L304 54 L316 58 L328 120 L346 145 L380 160 L540 176" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<text class="l" x="306" y="76">stuck at 0.5</text>
<text class="b" x="470" y="168">0.0001</text>
<text class="l" x="290" y="196">step 1</text><text class="l" x="540" y="196" text-anchor="end">5,000</text>
<path d="M20 216 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="238">0.41 · 0.41 · 0.42 · 0.41 → 0.01 · 0.99 · 0.99 · 0.01</text>
<text class="l" x="20" y="258">each hidden neuron draws one line; together they fence off the diagonal</text>
</svg>
<figcaption>The plateau, then the sudden drop, is typical: the network has to find useful hidden features before the loss can fall.</figcaption>
</figure>

## How the weights get adjusted

Each training step does four things:

1. **Forward pass.** Run the inputs through the network to get outputs.
2. **Loss.** Measure how wrong the outputs are — here, the squared difference from the target.
3. **Backward pass.** Use the chain rule to compute, for every weight, how much the loss would change if that weight changed slightly. This is **backpropagation**, and the resulting numbers are the **gradient**.
4. **Update.** Nudge every weight a small step in the direction that reduces the loss. This is **gradient descent**; the size of the step is the **learning rate**.

Repeat, thousands or millions of times. No one tells the hidden neurons what to detect. They end up detecting whatever makes the loss go down — in XOR, two diagonal boundaries; in an image model, edges, then textures, then parts of objects.

## Scaling up

Nothing about the method changes as networks grow. Only the numbers do:

| network | parameters |
| --- | --- |
| XOR, 2-4-1 | 17 |
| handwritten digits, 784-128-10 | 101,770 |
| a large language model | tens to hundreds of billions |

Larger networks add more layers ("deep" learning means many layers), wider layers, and specialised structures — convolutions for images, attention for sequences. But each layer is still weighted sums followed by a non-linear bend, and training is still forward, loss, backward, update.

The bend matters. Without activation functions, stacking layers achieves nothing: a sequence of weighted sums is itself just one weighted sum, and the deep network collapses into a single neuron that still cannot learn XOR.

## What to take away

A neural network is layers of neurons, each a weighted sum plus a bias passed through a non-linear activation. One neuron can only draw a straight boundary; a hidden layer combines several boundaries into shapes no single line can make.

Training adjusts every weight by gradient descent, with gradients computed by backpropagation. A 17-parameter network learns XOR from four examples in a few thousand steps. Every modern model — including the largest language models — is the same procedure with vastly more parameters and data.
