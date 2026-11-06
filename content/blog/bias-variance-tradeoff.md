---
title: "The bias-variance tradeoff"
date: "2026-11-06T18:30"
category: "AI"
tags: ["bias-variance", "overfitting", "underfitting", "generalisation", "fundamentals"]
summary: "Fit 15 noisy points with a straight line and it is wrong in the same way every time (bias). Fit them with a degree-12 polynomial and it is wrong in a different way every time (variance). Across 400 simulated datasets the line scores 0.304 on new data, degree 12 scores 0.587 despite the lowest training error, and degree 3 wins at 0.116."
draft: false
cover: "/blog/bias-variance-tradeoff.svg"
---

A model trained on one dataset is a guess. Draw a different sample from the same source — different customers, different patients, different noise — and you get a slightly different model, making slightly different predictions. The bias-variance tradeoff is about how that guess goes wrong.

There are two ways.

**Bias** is error that persists no matter which sample you trained on. The model is systematically wrong because it is too simple to represent the truth — a straight line fitted to a curve misses the curve every time.

**Variance** is error that comes from the particular sample. The model is flexible enough to fit the truth, but also flexible enough to fit the noise, so it changes a lot from one dataset to the next.

For squared error, the expected error on new data splits exactly into three parts:

`expected error = bias² + variance + irreducible noise`

The noise term is the randomness in the data itself; no model can remove it. The other two are the tradeoff.

## A simulation

The true relationship is a sine curve over [−1, 1]. Each dataset has 15 evenly spaced points with noise of standard deviation 0.3 (so the irreducible noise is 0.09). I generated 400 such datasets, fitted polynomials of several degrees to each, and measured the error averaged over them:

| degree | training error | bias² | variance | expected test error |
| --- | --- | --- | --- | --- |
| 1 (a line) | 0.311 | **0.2034** | 0.011 | 0.304 |
| 3 | 0.073 | 0.0058 | 0.020 | **0.116** |
| 5 | 0.054 | 0.0001 | 0.031 | 0.121 |
| 9 | 0.030 | 0.0004 | 0.063 | 0.153 |
| 12 | **0.010** | 0.0002 | **0.497** | 0.587 |

Read the columns.

**Bias falls fast.** A line cannot bend, so it is wrong by 0.20 on average no matter what data it sees. By degree 3 the curve shape is captured and bias is nearly gone.

**Variance rises steadily.** Each added degree lets the fit chase more of the noise. At degree 12, with 13 coefficients for 15 points, the curve nearly passes through every noisy point — and swings wildly between them, differently for every dataset. Variance reaches 0.497.

**Training error only goes down.** Degree 12 has the lowest training error of all, 0.010, and the worst test error, 0.587 — almost twice as bad as the straight line. Training error rewards flexibility unconditionally; it cannot see variance.

**The sweet spot is in the middle.** Degree 3 has the lowest test error, 0.116: flexible enough to follow the sine, not so flexible that it follows the noise.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="U-shaped curve of test error against polynomial degree with falling bias squared and rising variance curves beneath it; the minimum is at degree 3. Training error falls monotonically." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">TEST ERROR IS A U; TRAINING ERROR IS A SLIDE</text>
<path d="M70 36 V196 H500" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="64" y="40" text-anchor="end">0.6</text><text class="l" x="64" y="200" text-anchor="end">0</text>
<path d="M90 115 L155 165 L220 164 L350 155 L448 39" stroke="var(--primary)" stroke-width="2.6" fill="none"/>
<text class="b" x="452" y="44">test 0.587</text>
<circle cx="155" cy="165" r="4" fill="var(--primary)"/><text class="b" x="160" y="182">degree 3 · 0.116</text>
<path d="M90 113 L155 177 L220 182 L350 188 L448 193" stroke="var(--muted-foreground)" stroke-width="2" stroke-dasharray="5 3" fill="none"/>
<text class="l" x="452" y="196">train 0.010</text>
<path d="M90 142 L155 194 L220 196 L350 196 L448 196" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.6" fill="none"/>
<text class="l" x="96" y="138">bias²</text>
<path d="M90 193 L155 191 L220 188 L350 179 L448 63" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.6" fill="none"/>
<text class="l" x="400" y="96">variance</text>
<text class="l" x="90" y="212">1</text><text class="l" x="155" y="212">3</text><text class="l" x="220" y="212">5</text><text class="l" x="350" y="212">9</text><text class="l" x="448" y="212">12 · degree</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="250">bias falls, variance rises, and their sum has a minimum the training error cannot show</text>
</svg>
<figcaption>400 simulated datasets of 15 points from a sine curve with noise. Degree axis not to scale.</figcaption>
</figure>

## Recognising which problem you have

| symptom | likely problem |
| --- | --- |
| training error high, test error similar | **high bias** — underfitting |
| training error low, test error much higher | **high variance** — overfitting |
| both low and close | about right |

The gap between training and validation error is the practical signal of variance; the level of training error is the signal of bias.

## What to do about each

**High bias:** use a more flexible model, add better features, train longer, reduce regularisation.

**High variance:** get more data (the most reliable fix — variance shrinks as data grows), add regularisation, simplify the model, use data augmentation, stop training earlier, or average several models (ensembles and random forests reduce variance directly by averaging many high-variance models whose errors partly cancel).

## The tradeoff in modern deep learning

Large neural networks often have far more parameters than training examples and still generalise well, which the classic U-curve would not predict. With enough data, implicit regularisation from the training process, explicit techniques like weight decay and dropout, and sometimes training well past the point of fitting the training set, very large models can land on smooth solutions rather than wild ones. The decomposition still holds — error is still bias² plus variance plus noise — but model size alone is a poor guide to where on the curve you are. Validation error remains the honest measure.

## What to take away

Prediction error on new data is bias² + variance + noise. Simple models are biased — systematically wrong; flexible models have variance — wrong differently for each dataset. In 400 simulated datasets, a line scored 0.304, degree 12 scored 0.587 despite the lowest training error, and degree 3 scored best at 0.116.

Training error always favours flexibility; only held-out data shows variance. Diagnose with the train–validation gap, fix bias with capacity and features, and fix variance with data, regularisation and averaging.
