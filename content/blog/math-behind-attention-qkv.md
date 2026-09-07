---
title: "The math behind attention: Q, K and V"
date: "2026-09-07"
category: "AI"
tags: ["llm", "attention", "transformers", "matrices"]
summary: "Attention is one formula built from three matrices. Working it end to end on a three-word sentence shows exactly what Q, K and V are doing."
draft: false
cover: "/blog/math-behind-attention-qkv.svg"
---

Attention is one formula:

$$
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

Three matrices and four operations. The names are the confusing part, so start there:

- **Query** — what this token is looking for.
- **Key** — what each token offers, as an advertisement.
- **Value** — the information a token actually hands over when chosen.

Each token compares its query against every key to decide how much attention to pay, then collects a weighted blend of the values. The rest is arithmetic, and it is worth doing once by hand.

## Words become vectors

Take three tokens: `birds`, `eat`, `seeds`. Each becomes a vector — here four numbers each, kept small so the arithmetic stays readable.

Stack them and you get the input matrix $X$, three rows by four columns:

| token | vector |
| --- | --- |
| `birds` | (1, 0, 2, 0) |
| `eat` | (0, 2, 0, 1) |
| `seeds` | (1, 1, 0, 1) |

## Three matrices from one

$Q$, $K$ and $V$ are not separate inputs. They are all made from $X$, by multiplying it with three weight matrices that the model learns during training.

Each weight matrix here is 4×2 — four rows to match the input width, two columns because we are projecting down to $d_k = 2$:

$$
W_Q = \begin{bmatrix}1&2\\1&0\\0&1\\0&1\end{bmatrix}
\quad
W_K = \begin{bmatrix}1&0\\0&1\\1&0\\1&0\end{bmatrix}
\quad
W_V = \begin{bmatrix}0&2\\2&0\\0&1\\0&2\end{bmatrix}
$$

Multiply: $Q = XW_Q$, $K = XW_K$, $V = XW_V$. Each gives a 3×2 matrix — one row per token.

| token | Q | K | V |
| --- | --- | --- | --- |
| `birds` | (1, 4) | (3, 0) | (0, 4) |
| `eat` | (2, 1) | (1, 2) | (4, 2) |
| `seeds` | (2, 3) | (2, 1) | (2, 4) |

Same three tokens, three different views of them. That is all the weight matrices do: learn what to emphasise when a token is asking, when it is being asked about, and when it is handing over content.

## Scoring every pair

Now compare every query against every key with a dot product — that is what $QK^\top$ computes. A bigger dot product means the query and key point in more similar directions, so the match is stronger.

Row 1 of $Q$ is `birds` = (1, 4). Row 2 of $K$ is `eat` = (1, 2). Their score:

$$
1 \times 1 + 4 \times 2 = 9
$$

Do that for all nine pairs:

| | `birds` | `eat` | `seeds` |
| --- | --- | --- | --- |
| **`birds`** | 3 | **9** | 6 |
| **`eat`** | **6** | 4 | 5 |
| **`seeds`** | 6 | **8** | 7 |

Reading row by row: `birds` scores highest against `eat`, `eat` scores highest against `birds`, `seeds` scores highest against `eat`.

## Dividing by √d_k

Next the scores are divided by $\sqrt{d_k}$. Here $d_k = 2$, so everything is divided by about 1.41:

| | `birds` | `eat` | `seeds` |
| --- | --- | --- | --- |
| **`birds`** | 2.12 | 6.36 | 4.24 |
| **`eat`** | 4.24 | 2.83 | 3.54 |
| **`seeds`** | 4.24 | 5.66 | 4.95 |

The reason is what happens next. Softmax exponentiates, so large gaps between scores become enormous gaps in the output. Dot products grow with the number of dimensions, so without scaling the biggest score would dominate almost completely and the gradients would flatten out.

You can see it even at this size. The top row of scores, run through softmax **without** scaling, gives `0.002, 0.950, 0.047` — one token taking 95% of the attention. **With** scaling it gives `0.013, 0.882, 0.106`. Still a clear winner, but the other tokens keep a real share.

## Softmax turns scores into weights

Softmax is applied to each row on its own, so every row becomes a set of weights that sums to 1:

<figure>
<svg viewBox="0 0 422 258" width="422" role="img" aria-label="A three by three attention weight grid for the tokens birds, eat and seeds. Each row is a query token and each column a key token; brighter cells carry more weight, and every row sums to one." xmlns="http://www.w3.org/2000/svg">
<style>.t{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.ax{font:600 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.08em}.v{font:600 13px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="ax" x="104" y="14">KEY &#8594;</text>
<text class="ax" x="0" y="250">QUERY &#8595;</text>
<text class="t" x="152" y="38" text-anchor="middle">birds</text>
<text class="t" x="256" y="38" text-anchor="middle">eat</text>
<text class="t" x="360" y="38" text-anchor="middle">seeds</text>
<text class="t" x="90" y="81" text-anchor="end">birds</text>
<rect x="104" y="50" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 6%, transparent)" stroke="color-mix(in srgb, var(--primary) 20%, transparent)"/>
<text class="v" x="152" y="82" text-anchor="middle" fill-opacity="0.46">0.01</text>
<rect x="208" y="50" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 36%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="256" y="82" text-anchor="middle" fill-opacity="0.93">0.88</text>
<rect x="312" y="50" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 25%, transparent)"/>
<text class="v" x="360" y="82" text-anchor="middle" fill-opacity="0.51">0.11</text>
<text class="t" x="90" y="143" text-anchor="end">eat</text>
<rect x="104" y="112" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 46%, transparent)"/>
<text class="v" x="152" y="144" text-anchor="middle" fill-opacity="0.77">0.58</text>
<rect x="208" y="112" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 11%, transparent)" stroke="color-mix(in srgb, var(--primary) 26%, transparent)"/>
<text class="v" x="256" y="144" text-anchor="middle" fill-opacity="0.53">0.14</text>
<rect x="312" y="112" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 33%, transparent)"/>
<text class="v" x="360" y="144" text-anchor="middle" fill-opacity="0.60">0.28</text>
<text class="t" x="90" y="205" text-anchor="end">seeds</text>
<rect x="104" y="174" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 11%, transparent)" stroke="color-mix(in srgb, var(--primary) 26%, transparent)"/>
<text class="v" x="152" y="206" text-anchor="middle" fill-opacity="0.53">0.14</text>
<rect x="208" y="174" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 46%, transparent)"/>
<text class="v" x="256" y="206" text-anchor="middle" fill-opacity="0.77">0.58</text>
<rect x="312" y="174" width="96" height="54" rx="7" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 33%, transparent)"/>
<text class="v" x="360" y="206" text-anchor="middle" fill-opacity="0.60">0.28</text>
</svg>
<figcaption>Attention weights. Each row sums to 1 — brighter means more attention.</figcaption>
</figure>

Row 1 says: when `birds` builds its new representation, it takes 88% of it from `eat`, 11% from `seeds`, and almost nothing from itself.

## Multiplying by V

The last step multiplies those weights by $V$. Each token's output is a blend of every token's value vector, in proportion to the attention it paid.

For `birds`, with weights (0.013, 0.882, 0.106) over value rows (0, 4), (4, 2) and (2, 4):

$$
0.013 \times 0 + 0.882 \times 4 + 0.106 \times 2 = 3.74
$$

$$
0.013 \times 4 + 0.882 \times 2 + 0.106 \times 4 = 2.24
$$

Doing that for all three:

| token | output |
| --- | --- |
| `birds` | (3.74, 2.24) |
| `eat` | (1.13, 3.72) |
| `seeds` | (2.87, 2.85) |

Compare `birds` before and after. It went in as (1, 0, 2, 0), a vector that knew nothing about the sentence it was in. It comes out as (3.74, 2.24), which is mostly `eat`'s value with a little `seeds` mixed in.

That is the entire point of the mechanism. Every token leaves carrying a summary of whatever it decided was relevant.

## The short version

- Attention is $\text{softmax}(QK^\top / \sqrt{d_k})V$.
- $Q$, $K$ and $V$ are three learned projections of the same input.
- $QK^\top$ dot-products every query against every key to score each pair.
- Dividing by $\sqrt{d_k}$ stops softmax from collapsing onto a single token.
- Softmax turns each row of scores into weights that sum to 1.
- Multiplying by $V$ blends the values, so each token leaves carrying context.
