---
title: "Why attention divides by √dₖ"
date: "2026-09-07"
category: "AI"
tags: ["llm", "attention", "softmax", "variance", "scaling"]
summary: "The scaling factor in scaled dot-product attention is not a tuning knob. It is the one number that keeps the attention scores at a usable size no matter how wide the vectors are."
draft: false
cover: "/blog/scaling-dot-product-attention.svg"
---

The attention formula has a division in the middle of it:

$$
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

That $\sqrt{d_k}$ is not a hyperparameter someone tuned. It is the exact value needed to keep the scores at a workable size, and the reason is a short piece of statistics.

## What goes wrong without it

An attention score is a dot product: one query vector against one key vector. The wider those vectors are, the more terms get summed, and the larger the score tends to be.

That matters because the next step is softmax, which exponentiates. Feed it large numbers with large gaps between them and it produces something close to a one-hot vector — one token takes almost everything, the rest get nothing.

That is bad in two ways. The token gets almost no information from anywhere else. And because softmax is nearly flat once it saturates, the gradients through it shrink towards zero, so the model barely learns from that step.

## The size of a dot product

Here is the useful fact. Suppose the elements of the query and key vectors each have mean 0 and variance 1, which is roughly what normalisation gives you.

The dot product is a sum of $d_k$ products. Each product has mean 0 and variance 1, and they are independent, so the variances add:

$$
\text{Var}(q \cdot k) = d_k
$$

The variance of a score is the width of the vectors. Nothing else.

That is easy to check rather than take on trust. Drawing 400,000 random query and key pairs at each width:

| $d_k$ | measured variance | standard deviation |
| --- | --- | --- |
| 16 | 15.93 | 3.99 |
| 64 | 63.75 | 7.98 |
| 128 | 127.94 | 11.31 |
| 512 | 512.13 | 22.63 |

The variance tracks $d_k$ every time. And the standard deviation — the typical size of a score — is $\sqrt{d_k}$: 4, 8, 11.31, 22.63.

So at $d_k = 512$, scores routinely land tens of units apart. Softmax on numbers that far apart is effectively a hard maximum.

## Why the square root specifically

Now the choice of divisor falls out.

Dividing a quantity by a constant $c$ divides its variance by $c^2$. So dividing the scores by $c$ gives:

$$
\text{Var}\!\left(\frac{q \cdot k}{c}\right) = \frac{d_k}{c^2}
$$

We want that to be 1 — scores with a variance of 1 sit in the range where softmax is well behaved. Set it and solve:

$$
\frac{d_k}{c^2} = 1 \quad\Longrightarrow\quad c = \sqrt{d_k}
$$

That is the whole derivation. $\sqrt{d_k}$ is the only divisor that returns the score variance to 1 regardless of how wide the vectors are.

Measured at $d_k = 128$, dividing by different constants:

| divisor $c$ | predicted $d_k/c^2$ | measured |
| --- | --- | --- |
| 1 | 128.0 | 128.10 |
| 4 | 8.0 | 8.01 |
| $\sqrt{128} \approx 11.31$ | 1.0 | 1.00 |
| 20 | 0.32 | 0.32 |

Divide by too little and the scores stay huge. Divide by too much and they all squash together, which flattens the attention into a near-uniform average and loses the signal. Only $\sqrt{d_k}$ lands on 1.

## What it looks like in practice

Take four tokens with scores 26, 21, 24 and 17, at $d_k = 128$.

Run softmax on them as they are, then again after dividing by $\sqrt{128} \approx 11.31$:

<figure>
<svg viewBox="0 0 608 222" width="608" role="img" aria-label="Two bar charts of attention weights over four tokens. Without scaling one token takes 0.876 of the weight and another gets almost none. After dividing by the square root of 128 the weights spread to 0.341, 0.219, 0.286 and 0.154." xmlns="http://www.w3.org/2000/svg">
<style>.h{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.06em}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="h" x="46" y="14">WITHOUT SCALING</text>
<path d="M38 176.5 H276" stroke="var(--border)" stroke-width="1"/>
<rect x="46" y="64" width="46" height="112" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="69" y="57" text-anchor="middle">0.876</text>
<text class="l" x="69" y="194" text-anchor="middle">a</text>
<rect x="106" y="174" width="46" height="2" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="129" y="167" text-anchor="middle">0.006</text>
<text class="l" x="129" y="194" text-anchor="middle">b</text>
<rect x="166" y="161" width="46" height="15" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="189" y="154" text-anchor="middle">0.118</text>
<text class="l" x="189" y="194" text-anchor="middle">c</text>
<rect x="226" y="174" width="46" height="2" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="249" y="167" text-anchor="middle">0.000</text>
<text class="l" x="249" y="194" text-anchor="middle">d</text>
<text class="h" x="368" y="14">DIVIDED BY &#8730;128</text>
<path d="M360 176.5 H598" stroke="var(--border)" stroke-width="1"/>
<rect x="368" y="132" width="46" height="44" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="391" y="125" text-anchor="middle">0.341</text>
<text class="l" x="391" y="194" text-anchor="middle">a</text>
<rect x="428" y="148" width="46" height="28" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="451" y="141" text-anchor="middle">0.219</text>
<text class="l" x="451" y="194" text-anchor="middle">b</text>
<rect x="488" y="139" width="46" height="37" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="511" y="132" text-anchor="middle">0.286</text>
<text class="l" x="511" y="194" text-anchor="middle">c</text>
<rect x="548" y="156" width="46" height="20" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="571" y="149" text-anchor="middle">0.154</text>
<text class="l" x="571" y="194" text-anchor="middle">d</text>
</svg>
<figcaption>The same four scores, before and after scaling. Both sets of weights sum to 1.</figcaption>
</figure>

Unscaled, one token takes **0.876** of the attention and the weakest gets **0.000** — it may as well not be in the sequence. Scaled, the same four scores give **0.341, 0.219, 0.286, 0.154**.

The ordering is identical in both. Scaling changes nothing about which token wins. What it changes is how brutally that win is enforced — and whether the other three tokens contribute anything at all.

## The short version

- Attention scores are dot products, and their variance equals $d_k$.
- Wider vectors therefore mean bigger scores, purely as a side effect of width.
- Softmax on big, widely spread scores collapses to nearly one-hot, starving the other tokens and flattening the gradient.
- Dividing by $c$ divides the variance by $c^2$, so $c = \sqrt{d_k}$ is what brings it back to 1.
- Scaling does not change which token wins, only how much room the rest are left.
