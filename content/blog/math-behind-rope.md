---
title: "The math behind RoPE"
date: "2026-09-10T10:20"
category: "AI"
tags: ["rope", "position-embedding", "attention", "transformers", "rotation"]
summary: "RoPE gives a transformer position information by rotating query and key vectors instead of adding anything to them. The rotation cancels in the dot product, leaving only the gap between two tokens."
draft: false
cover: "/blog/math-behind-rope.svg"
---

A transformer looks at every token at once. Nothing in that operation records which token came first, so position has to be supplied deliberately.

RoPE supplies it by rotating each query and key vector by an angle set by its position. Nothing is added and nothing is concatenated — the vector is simply turned.

## Why position has to be injected

Attention compares every token against every other. If you shuffle the input, you shuffle the outputs in the same way, and nothing else changes.

So `the dog bit the man` and `the man bit the dog` contain the same tokens and, without position information, produce the same result. The meaning lives entirely in the order, and the order is exactly what attention cannot see.

## What was done before

The original approach was to build a vector for each position and add it to the token's embedding. Sometimes that vector was a fixed pattern of sines and cosines; sometimes it was learned.

Both work, and both have the same two weaknesses.

Adding mixes position into the same numbers that carry meaning — the model has to disentangle them afterwards. And what gets encoded is the *absolute* slot: position 5 and position 9 each get their own vector, with nothing in the arithmetic stating that they are four apart. Any sense of distance has to be learned from the data rather than falling out of the maths.

## Rotating instead of adding

A rotation in two dimensions turns a vector without changing its length:

$$
\begin{aligned}
x' &= x\cos\theta - y\sin\theta \\
y' &= x\sin\theta + y\cos\theta
\end{aligned}
$$

RoPE takes a query or key vector, cuts it into consecutive pairs of numbers, and treats each pair as a little 2D vector to be rotated. A token at position $m$ has every one of its pairs rotated by $m\theta_i$, where $\theta_i$ depends on which pair it is.

Because rotation preserves length, the size of the vector is untouched. Only its direction moves, and it moves further the later the token sits.

## Every pair turns at a different speed

If all pairs rotated at the same rate, the whole vector would just spin and positions far apart would keep landing back on top of each other. So each pair gets its own frequency:

$$
\theta_i = 10000^{-2(i-1)/d}
$$

For a head dimension of 64 there are 32 pairs, and the range they cover is enormous:

| pair | $\theta_i$ | positions per full turn |
| --- | --- | --- |
| 1 | 1.000000 | 6 |
| 2 | 0.749894 | 8 |
| 8 | 0.133352 | 47 |
| 16 | 0.013335 | 471 |
| 24 | 0.001334 | 4,712 |
| 32 | 0.000133 | 47,117 |

The first pair completes a full turn every six tokens, so it is a fine-grained marker useful only for telling near neighbours apart. The last takes over forty-seven thousand tokens to come back around, so across any realistic sequence it barely moves — it acts as a slow hand on a clock, marking roughly where in the document you are.

Between them the pairs cover every scale at once. That spread is what lets one mechanism handle both "the previous word" and "somewhere in the last few thousand".

## Why the dot product only sees the gap

This is the part that makes it worth doing.

Attention scores a query against a key with a dot product. Rotate the query by $m$ and the key by $n$, and the score is:

$$
(R_m q) \cdot (R_n k) = q^{\top} R_m^{\top} R_n k = q^{\top} R_{n-m} k
$$

Rotation matrices are orthogonal, so $R_m^{\top}$ is $R_{-m}$, and rotating by $-m$ and then by $n$ is the same as rotating once by $n - m$. The absolute positions cancel. What survives is the difference.

Take $\theta = 30°$, $q = [2, 1]$ and $k = [1, 3]$:

| positions | gap | score |
| --- | --- | --- |
| 0 and 4 | 4 | −6.8301 |
| 3 and 7 | 4 | −6.8301 |
| 10 and 14 | 4 | −6.8301 |
| 2 and 5 | 3 | −5.0000 |

Three different places in the sequence, the same gap, the same score to every decimal. Change the gap and the score changes.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Two circles. In the left one the query sits at position 3 and the key at position 7, a hundred and twenty degrees apart. In the right one they sit at positions 10 and 14, in completely different places on the circle but still a hundred and twenty degrees apart, giving the same attention score." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">DIFFERENT PLACES, SAME GAP, SAME SCORE</text>
<circle cx="130" cy="110" r="62" fill="none" stroke="var(--border)" stroke-width="1"/>
<path d="M130 110 L130 48" stroke="color-mix(in srgb, var(--primary) 70%, transparent)" stroke-width="2"/>
<circle cx="130" cy="48" r="4.5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="130" y="38" text-anchor="middle">q</text>
<path d="M130 110 L76.3 141" stroke="color-mix(in srgb, var(--primary) 70%, transparent)" stroke-width="2"/>
<circle cx="76.3" cy="141" r="4.5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="64" y="150" text-anchor="middle">k</text>
<path d="M130 76 A 34 34 0 0 0 100.6 127" fill="none" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<text class="l" x="130" y="196" text-anchor="middle">positions 3 and 7</text>
<text class="l" x="130" y="216" text-anchor="middle">120° apart</text>
<text class="v" x="130" y="238" text-anchor="middle">−6.8301</text>
<circle cx="400" cy="110" r="62" fill="none" stroke="var(--border)" stroke-width="1"/>
<path d="M400 110 L431 163.7" stroke="color-mix(in srgb, var(--primary) 70%, transparent)" stroke-width="2"/>
<circle cx="431" cy="163.7" r="4.5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="444" y="174" text-anchor="middle">q</text>
<path d="M400 110 L431 56.3" stroke="color-mix(in srgb, var(--primary) 70%, transparent)" stroke-width="2"/>
<circle cx="431" cy="56.3" r="4.5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="444" y="50" text-anchor="middle">k</text>
<path d="M417 139.4 A 34 34 0 0 0 417 80.6" fill="none" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<text class="l" x="400" y="196" text-anchor="middle">positions 10 and 14</text>
<text class="l" x="400" y="216" text-anchor="middle">120° apart</text>
<text class="v" x="400" y="238" text-anchor="middle">−6.8301</text>
</svg>
<figcaption>Both pairs sit four positions apart, so both are turned through the same angle relative to each other.</figcaption>
</figure>

Nothing enforces this. It is a property of rotation, and it arrives for free the moment you choose to encode position as an angle rather than as something to add on.

## What it costs

Nothing, in parameters. There is no table of position vectors to learn and no extra weights — just a rotation applied to the queries and keys before the attention scores are computed.

It also degrades gracefully past the training length. A learned position table has no entry for position 6,000 if it was only ever trained to 4,000. RoPE has an angle for every position, because the formula keeps working; the model may not use very long distances well without adaptation, but there is no missing entry and nothing undefined. That is why the common tricks for stretching context — scaling or interpolating the frequencies — are adjustments to $\theta_i$ rather than new machinery.

## The short version

- Attention sees a set of tokens, not a sequence, so position must be supplied.
- Older methods added a position vector, which mixes position into meaning and encodes absolute slots rather than distances.
- RoPE splits queries and keys into 2D pairs and rotates each pair by an angle proportional to the token's position.
- Each pair rotates at its own frequency, from a full turn every six tokens to one every forty-seven thousand.
- In the dot product the absolute rotations cancel and only the gap between the two tokens survives.
- It adds no parameters, preserves vector length, and has a defined angle for any position.
