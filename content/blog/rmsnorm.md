---
title: "RMSNorm"
date: "2026-09-10T11:00"
category: "AI"
tags: ["rmsnorm", "layernorm", "normalisation", "transformers", "training"]
summary: "Layer normalisation does two things: it recentres values and it rescales them. RMSNorm drops the recentring, keeps the rescaling, and modern language models have almost all switched to it."
draft: false
cover: "/blog/rmsnorm.svg"
---

Stack enough layers and the numbers flowing through them drift. They grow, or they shrink towards nothing, and training becomes unstable either way.

Normalisation is the fix: at points along the network, pull the values back into a sensible range. RMSNorm is a stripped-down version of how that is usually done.

## What layer normalisation does

Layer normalisation takes a vector and performs two separate corrections.

First it **recentres**: subtract the mean, so the values sit around zero. Then it **rescales**: divide by the standard deviation, so the spread is consistent.

$$
\text{LayerNorm}(x) = \gamma \cdot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta
$$

$\gamma$ and $\beta$ are learned, so the network can undo or adjust the normalisation if it turns out to need to.

## Dropping half of it

RMSNorm rests on a claim: of those two corrections, only the rescaling was doing much work.

So it keeps the scaling and throws the centring away. There is no mean to subtract, which means no variance to compute either — variance is defined around the mean. What replaces it is the root mean square, which measures magnitude directly, without reference to any centre:

$$
\text{RMS}(x) = \sqrt{\frac{1}{n}\sum_i x_i^2}
$$

$$
\text{RMSNorm}(x) = \gamma \cdot \frac{x}{\sqrt{\text{mean}(x^2) + \epsilon}}
$$

Note what is missing. There is no $\beta$ — with no recentring step there is nothing for a shift parameter to correct — so RMSNorm carries half the learned parameters of LayerNorm.

## Watching both run

Take a vector with a mean that is clearly not zero: $x = [3, -1, 5, 7, -2, 0]$.

Its mean is 2, its standard deviation is 3.2660, and its RMS is 3.8297.

| | result | mean | RMS |
| --- | --- | --- | --- |
| input | 3, −1, 5, 7, −2, 0 | 2.0000 | 3.8297 |
| LayerNorm | 0.3062, −0.9186, 0.9186, 1.5309, −1.2247, −0.6124 | 0.0000 | 1.0000 |
| RMSNorm | 0.7833, −0.2611, 1.3056, 1.8278, −0.5222, 0.0000 | 0.5222 | 1.0000 |

Both land the magnitude in exactly the same place — an RMS of 1. That is the part that stabilises training, and RMSNorm gets there without the mean.

Where they differ is the offset. LayerNorm has moved the whole vector so it straddles zero. RMSNorm has left it where it was, only smaller: the mean of 2 became 2 ÷ 3.8297 = 0.5222.

<figure>
<svg viewBox="0 0 580 215" width="580" role="img" aria-label="Two bar charts of the same vector after normalisation. After LayerNorm the bars straddle zero with a mean of zero. After RMSNorm the bars keep their original offset, with a mean of 0.52, but reach the same overall magnitude." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.pt{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.06em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="16">SAME MAGNITUDE, DIFFERENT CENTRE</text>
<text class="pt" x="150" y="38" text-anchor="middle">LAYERNORM</text>
<path d="M56 120 H244" stroke="var(--border)" stroke-width="1"/>
<text class="l" x="48" y="124" text-anchor="end">0</text>
<rect x="64" y="107.1" width="22" height="12.9" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="94" y="120" width="22" height="38.6" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="124" y="81.4" width="22" height="38.6" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="154" y="55.7" width="22" height="64.3" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="184" y="120" width="22" height="51.4" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="214" y="120" width="22" height="25.7" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="l" x="150" y="196" text-anchor="middle">mean 0.00 · rms 1.00</text>
<text class="pt" x="430" y="38" text-anchor="middle">RMSNORM</text>
<path d="M336 120 H524" stroke="var(--border)" stroke-width="1"/>
<text class="l" x="328" y="124" text-anchor="end">0</text>
<rect x="344" y="87.1" width="22" height="32.9" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="374" y="120" width="22" height="11" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="404" y="65.2" width="22" height="54.8" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="434" y="43.2" width="22" height="76.8" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="464" y="120" width="22" height="21.9" rx="2" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="494" y="120" width="22" height="1.5" rx="1" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="l" x="430" y="196" text-anchor="middle">mean 0.52 · rms 1.00</text>
</svg>
<figcaption>The same six numbers after each. Both reach an RMS of 1; only one of them moves the centre.</figcaption>
</figure>

## Why leaving the offset alone is fine

The obvious worry is that a drifting mean will cause the trouble normalisation was supposed to prevent.

In a transformer it mostly does not, because the mean is not left unattended. Every sub-layer is followed by a linear projection, and a linear layer can shift its output by whatever its bias says — so any offset the network actually minds can be corrected there, using parameters that already exist. Recentring inside the normalisation step was doing a job something else was already able to do.

What could not be handled elsewhere is the magnitude, since that is what runs away across dozens of layers. RMSNorm keeps exactly that.

## What it buys

Not much per call, but the calls are everywhere.

Computing a mean and then a variance means two passes over the vector, and the second depends on the first. Root mean square needs one pass and one square root. That removes a dependency as well as some arithmetic, which matters more than the operation count suggests — it is one fewer point where the whole vector has to be reduced before anything can continue.

The parameters shrink too. For a model with $d = 4096$ and 32 layers, normalising before attention, before the feed-forward network, and once at the end:

| | parameters |
| --- | --- |
| LayerNorm ($\gamma$ and $\beta$) | 532,480 |
| RMSNorm ($\gamma$ only) | 266,240 |

That is a rounding error against billions of weights. The speed is the reason it was adopted, not the size — normalisation runs twice per layer for every token of every batch across a training run of trillions of tokens, and a cheaper version of something that frequent is worth having.

## Where it sits

In current models the normalisation goes *before* each sub-layer rather than after it — once before attention, once before the feed-forward network, and once more at the end before the output projection.

The residual path skips around it. That is the arrangement that makes deep stacks trainable: the untouched signal flows straight through, while each sub-layer sees an input that has already been brought back to a stable magnitude.

## The short version

- Deep stacks need normalisation or their values explode or vanish.
- LayerNorm recentres and rescales; RMSNorm only rescales.
- It divides by the root mean square, which measures magnitude without needing a mean.
- With no centring step there is no $\beta$, so it has half the learned parameters.
- On the same vector both reach an RMS of 1; RMSNorm just leaves the offset in place.
- That is safe because the following linear layer's bias can shift the mean anyway.
- One pass instead of two, twice a layer, for trillions of tokens — which is why it took over.
