---
title: "The softmax function"
date: "2026-11-06T15:50"
category: "AI"
tags: ["softmax", "probability", "logits", "numerical-stability", "fundamentals"]
summary: "Softmax turns any list of scores into probabilities that sum to 1: [3, 1, 0.2] becomes [0.836, 0.113, 0.051]. Adding 100 to every score changes nothing — which is the trick that stops it overflowing, since a float16 exponential breaks above 11.09 and float32 above 88.7."
draft: false
cover: "/blog/softmax-function.svg"
---

Neural networks produce scores. A classifier produces one score per class, a language model one score per vocabulary token, an attention head one score per earlier position. The scores — **logits** — can be any real numbers, positive or negative, and do not add up to anything in particular.

Very often what is needed instead is a probability distribution: non-negative numbers that add up to 1. Softmax is the standard way to get one.

## The formula

For scores *z₁ … zₙ*:

`softmax(zᵢ) = e^(zᵢ) / Σⱼ e^(zⱼ)`

Exponentiate every score, then divide each by the total. Exponentiating makes everything positive; dividing makes it sum to 1.

Take three classes scored `[3.0, 1.0, 0.2]`:

| | score | e^score | probability |
| --- | --- | --- | --- |
| cat | 3.0 | 20.09 | **0.836** |
| dog | 1.0 | 2.72 | 0.113 |
| fox | 0.2 | 1.22 | 0.051 |

The ordering is preserved — the highest score gets the highest probability — but the exponential exaggerates gaps. A score lead of 2 becomes a probability ratio of e² ≈ 7.4. That is why it is called *soft*-max: it picks out the maximum, mostly, while still giving the others a share.

## Only differences matter

Add the same constant to every score and the probabilities do not change. Adding 100:

`[103.0, 101.0, 100.2]` → `[0.836, 0.113, 0.051]`

The constant becomes a factor of *e¹⁰⁰* on top and bottom of the fraction, and cancels. Softmax depends only on how far apart the scores are, not on where they sit.

This is more than a curiosity; it is how softmax is computed safely.

## The overflow problem

Exponentials grow absurdly fast. The largest number a 32-bit float can hold is about 3.4 × 10³⁸, which *e^x* exceeds at x ≈ **88.7**. In 16-bit floats — common in modern training and inference — the limit is 65,504, exceeded at x ≈ **11.09**.

Logits of 12 are entirely ordinary. A naive softmax in float16 would compute `e^12 = infinity`, divide infinity by infinity, and produce `NaN`, which then spreads through every calculation after it.

The fix uses the shift invariance: **subtract the largest score first**.

```python title="stable softmax"
def softmax(z):
    m = max(z)
    e = [exp(v - m) for v in z]   # largest exponent is now e^0 = 1
    s = sum(e)
    return [v / s for v in e]
```

After the subtraction, the largest exponent is exactly 1 and every other one is between 0 and 1. Nothing can overflow, and the result is mathematically identical. Every framework's softmax does this internally — and so must any hand-written kernel, which is why Flash Attention tracks a running maximum as it processes attention scores in tiles.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Three scores turned into exponentials and then normalised into three probability bars summing to one, with a note that subtracting the maximum score leaves the result unchanged." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SCORES → EXPONENTIALS → SHARES</text>
<text class="l" x="20" y="44">scores</text><text class="l" x="200" y="44">e^score</text><text class="b" x="380" y="44">probability</text>
<g font-family="var(--font-geist-mono),ui-monospace,monospace">
<text class="l" x="20" y="72">cat 3.0</text><text class="l" x="20" y="102">dog 1.0</text><text class="l" x="20" y="132">fox 0.2</text>
</g>
<g fill="var(--muted-foreground)" fill-opacity="0.5"><rect x="200" y="60" width="150" height="16" rx="2"/><rect x="200" y="90" width="20" height="16" rx="2"/><rect x="200" y="120" width="9" height="16" rx="2"/></g>
<text class="l" x="226" y="102">2.72</text><text class="l" x="215" y="132">1.22</text><text class="l" x="300" y="72" fill="var(--background)">20.09</text>
<g fill="var(--primary)"><rect x="380" y="60" width="134" height="16" rx="2" fill-opacity="0.85"/><rect x="380" y="90" width="18" height="16" rx="2" fill-opacity="0.6"/><rect x="380" y="120" width="8" height="16" rx="2" fill-opacity="0.6"/></g>
<text class="b" x="520" y="72">0.836</text><text class="b" x="404" y="102">0.113</text><text class="b" x="394" y="132">0.051</text>
<path d="M20 156 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="180">add or subtract any constant: same probabilities</text>
<text class="l" x="20" y="200">so subtract the maximum first — the biggest exponential is then e⁰ = 1</text>
<text class="l" x="20" y="220">naively, e^x overflows float16 above 11.09 and float32 above 88.7</text>
</svg>
<figcaption>Exponentiate, divide by the total. The shift-invariance is what makes it safe to compute.</figcaption>
</figure>

## Where softmax appears

**The output of a classifier.** Scores per class become a predicted distribution, compared with the true label by cross-entropy loss.

**The output of a language model.** Scores for every token in the vocabulary become the next-token distribution that sampling draws from. Temperature divides the logits before the softmax, sharpening or flattening it.

**Inside attention.** Each query's scores against all keys go through a softmax to become attention weights — how much of each value to mix in.

## Its gradient is simple

Paired with cross-entropy loss, softmax has an unusually clean gradient. For the example above, if the correct class is "cat", the gradient of the loss with respect to the scores is just *predicted minus target*:

`[0.836 − 1, 0.113 − 0, 0.051 − 0] = [−0.164, 0.113, 0.051]`

Push the correct class's score up by how far its probability fell short of 1; push each wrong class down by how much probability it took. That simplicity is one reason the pairing is universal.

## Its limits

Softmax always produces a confident-looking distribution, even on inputs unlike anything the model was trained on. A probability of 0.84 is the model's score converted to a share, not a guarantee that it is right 84% of the time. Calibration has to be measured separately.

And softmax must give every option *some* probability — it can never output an exact zero. In attention, that means every position receives a little weight even when none is relevant, which is part of why attention sinks appear.

## What to take away

Softmax exponentiates each score and divides by the total, turning any list of logits into probabilities: `[3, 1, 0.2]` → `[0.836, 0.113, 0.051]`. It depends only on differences between scores, which is what makes the stable implementation possible — subtract the maximum before exponentiating, or float16 overflows at 11.09.

It sits at the output of classifiers and language models and inside every attention head, and with cross-entropy its gradient is simply predicted minus actual.
