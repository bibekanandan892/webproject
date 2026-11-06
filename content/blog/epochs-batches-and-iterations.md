---
title: "Epochs, batches and iterations"
date: "2026-10-18T19:30"
category: "AI"
tags: ["training", "batch-size", "epochs", "sgd", "fundamentals"]
summary: "50,000 examples in batches of 32 is 1,563 iterations per epoch; ten epochs is 15,630 weight updates. Batches of 512 need only 980 updates for the same ten epochs and give gradients a quarter as noisy. A large language model, by contrast, sees most of its data less than once — 3.75 million steps, under one epoch."
draft: false
cover: "/blog/epochs-batches-and-iterations.svg"
---

Training a model means showing it data and adjusting its weights to reduce error. Three terms describe how that showing is organised, and they are easy to mix up:

- A **batch** is the group of examples processed together before one weight update. Its size is the **batch size**.
- An **iteration** (or **step**) is one update: process one batch, compute the gradient, change the weights.
- An **epoch** is one complete pass over the training set.

They are tied together by a single equation:

`iterations per epoch = ⌈ dataset size ÷ batch size ⌉`

## A worked example

Take a dataset of 50,000 images.

| batch size | iterations per epoch | iterations in 10 epochs | gradient noise (relative) |
| --- | --- | --- | --- |
| 32 | 1,563 | **15,630** | 1.00 |
| 128 | 391 | 3,910 | 0.50 |
| 512 | 98 | **980** | 0.25 |

(50,000 ÷ 32 = 1,562.5, rounded up because the last, smaller batch still counts.)

Every row trains on exactly the same data the same number of times — ten epochs. What changes is how many updates the model gets and how reliable each one is.

## Why batches at all

**One example at a time** gives an update per example, but each gradient is computed from a single example and is very noisy: it points toward what would help *this* example, which may hurt others.

**The whole dataset at once** gives the true average gradient, but only one update per pass, and the dataset may not fit in memory.

**Mini-batches** sit between. The gradient of a batch is an estimate of the full-dataset gradient, and its noise falls with the square root of the batch size: a batch 16 times larger gives an estimate 4 times less noisy, as in the table. And hardware processes a batch of examples almost as quickly as one, because of how matrix multiplication reuses data — so larger batches also make each step efficient.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="A dataset bar divided into batches, one highlighted as an iteration, the whole bar labelled an epoch; below, three rows showing that larger batches mean fewer, less noisy steps." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">BATCH → ITERATION → EPOCH</text>
<g fill="var(--muted-foreground)" fill-opacity="0.3" stroke="var(--background)" stroke-width="2">
<rect x="20" y="40" width="52" height="24"/><rect x="72" y="40" width="52" height="24"/><rect x="124" y="40" width="52" height="24"/><rect x="176" y="40" width="52" height="24"/><rect x="228" y="40" width="52" height="24"/><rect x="280" y="40" width="52" height="24"/><rect x="332" y="40" width="52" height="24"/><rect x="384" y="40" width="52" height="24"/><rect x="436" y="40" width="52" height="24"/><rect x="488" y="40" width="52" height="24"/>
</g>
<rect x="124" y="40" width="52" height="24" fill="var(--primary)" fill-opacity="0.8"/>
<text class="b" x="150" y="80" text-anchor="middle">one batch = one iteration</text>
<path d="M20 90 H540" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<path d="M20 86 V94 M540 86 V94" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<text class="l" x="280" y="106" text-anchor="middle">all batches once = one epoch (50,000 examples)</text>
<text class="l" x="20" y="136">batch 32</text><text class="l" x="120" y="136">1,563 steps/epoch · noise 1.00</text>
<text class="l" x="20" y="156">batch 128</text><text class="l" x="120" y="156">391 steps/epoch · noise 0.50</text>
<text class="b" x="20" y="176">batch 512</text><text class="b" x="120" y="176">98 steps/epoch · noise 0.25</text>
<path d="M20 194 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="216">bigger batches: fewer, steadier, more efficient steps</text>
<text class="l" x="20" y="234">smaller batches: more, noisier steps — sometimes generalising better</text>
</svg>
<figcaption>The same epoch can be 1,563 small steps or 98 large ones.</figcaption>
</figure>

## Choosing a batch size

**Memory sets the ceiling.** Activations for every example in the batch must be held for the backward pass. When the batch you want does not fit, **gradient accumulation** processes several small batches, adds up their gradients, and applies one update — equivalent to a larger batch, at the cost of time.

**Learning rate must move with it.** A larger batch gives a less noisy gradient, so the model can take larger steps. A common rule of thumb scales the learning rate up roughly in proportion to the batch size, usually with a warm-up period at the start of training.

**Very large batches can generalise worse.** Some noise in the gradient helps training escape sharp, narrow minima that fit the training set but not new data. Past a certain point, larger batches give diminishing returns per example: you process more data per step without making proportionally more progress.

Typical values: tens to a few hundred for small vision or tabular models on one GPU; millions of tokens per step for large language models across thousands of GPUs.

## How many epochs

Too few and the model has not learned what the data can teach — **underfitting**. Too many and it starts memorising the training set — **overfitting** — and validation error rises while training error keeps falling.

The standard practice is to watch the validation loss after each epoch and stop when it stops improving (**early stopping**), keeping the best checkpoint. Small datasets often need many epochs; data augmentation helps by making each epoch slightly different.

## Large language models break the pattern

A large language model trained on 15 trillion tokens, in batches of about 4 million tokens, takes:

`15 × 10¹² ÷ 4 × 10⁶ = 3,750,000 steps`

and in that time sees most of its data **once** — less than one epoch. Some high-quality sources are repeated a few times; most text never is. At that scale, data is so plentiful that seeing new examples beats revisiting old ones, and overfitting to the training set is less of a concern than whether there is enough good data at all.

The vocabulary therefore shifts: language model training is described in tokens and steps, not epochs.

## What to take away

A batch is the set of examples behind one update; an iteration is one update; an epoch is one pass through the data. Iterations per epoch is the dataset size divided by the batch size: 1,563 for 50,000 examples at batch 32, 98 at batch 512.

Larger batches give fewer, steadier and more hardware-efficient steps — four times less gradient noise for sixteen times the batch — and need a correspondingly larger learning rate. Small datasets train for many epochs with early stopping; large language models train for millions of steps without finishing one.
