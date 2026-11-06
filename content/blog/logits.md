---
title: "Logits"
date: "2026-11-06T16:20"
category: "AI"
tags: ["logits", "softmax", "classification", "llm", "fundamentals"]
summary: "Logits are a model's raw scores before they become probabilities. A logit of 0 is a coin flip, 2.2 is 90% and 4.6 is 99% — every 2.3 is another factor of ten in the odds. A language model produces 128,000 of them per token, and editing them directly is how constrained decoding works."
draft: false
cover: "/blog/logits.svg"
---

At the end of almost every neural network that makes a choice, there is a layer that produces one number per possible answer. A cat-or-dog classifier produces two; a language model produces one for every token in its vocabulary. Those numbers are **logits**: raw, unbounded scores, before anything turns them into probabilities.

They are worth understanding on their own, because a lot of practical work with models — sampling, constrained output, calibration, debugging — happens on logits rather than probabilities.

## From logits to probabilities

For a single yes/no output, the logit becomes a probability through the sigmoid, `p = 1 / (1 + e⁻ᶻ)`:

| logit | probability |
| --- | --- |
| −2.2 | 10% |
| 0 | **50%** |
| 1 | 73.1% |
| 2.2 | 90% |
| 4.6 | **99%** |

For many classes, the softmax does the same job across all of them at once: exponentiate each logit and divide by the total.

## What a logit actually measures

The name comes from statistics, where the logit of a probability is its **log-odds**: `log(p / (1 − p))`. A probability of 90% is odds of 9 to 1, and `log 9 ≈ 2.2`. So a binary logit has a direct meaning:

- **0** means even odds.
- **Each +2.3** multiplies the odds by 10 (because `ln 10 ≈ 2.3`): 2.2 is about 9:1, 4.6 about 99:1.
- **Negative** logits favour "no" by the same amounts.

For softmax over many classes, only *differences* between logits matter. If one token's logit is 2.3 above another's, it is 10 times as likely, regardless of the logits' absolute values. That is why adding a constant to all logits changes nothing, and why logits are compared, not read in isolation.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Sigmoid curve mapping logits from -6 to 6 onto probabilities, with marked points at 0 for 50%, 2.2 for 90% and 4.6 for 99%." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EVERY 2.3 IS ANOTHER ×10 IN THE ODDS</text>
<path d="M60 176 H500 M280 36 V176" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<path d="M60.0 175.7 L69.2 175.6 L78.3 175.4 L87.5 175.3 L96.7 175.1 L105.8 174.8 L115.0 174.5 L124.2 174.0 L133.3 173.5 L142.5 172.8 L151.7 171.9 L160.8 170.8 L170.0 169.4 L179.2 167.6 L188.3 165.4 L197.5 162.7 L206.7 159.3 L215.8 155.3 L225.0 150.5 L234.2 144.8 L243.3 138.3 L252.5 131.1 L261.7 123.1 L270.8 114.7 L280.0 106.0 L289.2 97.3 L298.3 88.9 L307.5 80.9 L316.7 73.7 L325.8 67.2 L335.0 61.5 L344.2 56.7 L353.3 52.7 L362.5 49.3 L371.7 46.6 L380.8 44.4 L390.0 42.6 L399.2 41.2 L408.3 40.1 L417.5 39.2 L426.7 38.5 L435.8 38.0 L445.0 37.5 L454.2 37.2 L463.3 36.9 L472.5 36.7 L481.7 36.6 L490.8 36.4 L500.0 36.3" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<g fill="var(--primary)"><circle cx="280" cy="106" r="4"/><circle cx="361" cy="50" r="4"/><circle cx="449" cy="37.4" r="4"/></g>
<text class="b" x="288" y="122">0 → 50%</text>
<text class="b" x="366" y="66">2.2 → 90%</text>
<text class="b" x="440" y="30">4.6 → 99%</text>
<text class="l" x="60" y="192">−6</text><text class="l" x="276" y="192">0</text><text class="l" x="500" y="192" text-anchor="end">6  logit</text>
<text class="l" x="54" y="40" text-anchor="end">1</text><text class="l" x="54" y="180" text-anchor="end">0</text>
<path d="M20 208 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="230">logits are additive and unbounded; probabilities squash at both ends</text>
</svg>
<figcaption>Between 90% and 99% the probability barely moves; the logit moves a lot. Logits keep confidence readable.</figcaption>
</figure>

## Why models output logits, not probabilities

**Numerical stability.** Probabilities near 0 and 1 squash huge differences into tiny ones — 99% and 99.99% look similar but are odds of 99:1 and 9,999:1. Logits keep those differences on an even scale, and loss functions computed from logits directly (cross-entropy "with logits") avoid the rounding errors of taking the log of a near-zero probability.

**Flexibility.** The same logits can be turned into different distributions: divided by a temperature, filtered by top-k, biased, masked. All of these are simple operations on logits.

## Logits in a language model

At each step, the final hidden vector — say 4,096 numbers — is multiplied by an output matrix with one row per vocabulary entry. For a 128,000-token vocabulary that is 524 million multiply-adds, producing **128,000 logits**: 500 KB in 32-bit floats, every token. In an 8B-parameter model, that output projection alone is about 6.6% of the per-token arithmetic.

Everything about how the next token is chosen happens here:

- **Temperature** divides every logit by *T* before the softmax.
- **Top-k and top-p** discard the logits outside the chosen set.
- **Logit bias** adds a fixed amount to specific tokens — +5 to encourage one, −100 to effectively ban it.
- **Constrained decoding** sets the logits of every token that would break a required format — invalid JSON, a value not in a list — to −∞, so they have exactly zero probability. This is how structured outputs are guaranteed rather than requested.
- **Repetition penalties** lower the logits of tokens that have already appeared.

## Reading logits for insight

Because they are on an additive scale, logits are useful diagnostics:

- **The gap between the top two logits** says how decisive a prediction was. A gap of 0.1 is a near coin flip between them; a gap of 7 is over a thousand to one.
- **Log-probabilities** — logits after a log-softmax — are what APIs return as "logprobs", and are used to score answers, detect uncertainty, and estimate how surprising a piece of text is to the model.
- **Intermediate layers' logits** — projecting a middle layer's vector through the output matrix — show what the model "would" predict partway through its computation, a common interpretability technique.

## What to take away

Logits are the raw, unbounded scores a model produces before softmax or sigmoid turns them into probabilities. A binary logit is log-odds: 0 is 50%, 2.2 is 90%, 4.6 is 99%, and every 2.3 is another factor of ten. Only differences between logits matter.

Language models produce one logit per vocabulary token — 128,000 per step — and almost every decoding technique, from temperature to guaranteed JSON, is an operation on those numbers before a token is chosen.
