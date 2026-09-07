---
title: "Causal masking in attention"
date: "2026-09-05"
category: "AI"
tags: ["llm", "attention", "transformers"]
summary: "Causal masking is what stops a token from attending to the tokens that come after it. Without it, a language model can see the answer it is being asked to predict."
draft: false
cover: "/blog/causal-masking-in-transformers.svg"
---

In a Transformer's attention layer, a token can attend to every other token in the sequence — including the ones that come after it. Causal masking removes that. It makes each token attend only to itself and the tokens before it, **never to future tokens**.

## Why it is needed

Take the sentence `The kettle boiled over`, four tokens:

| position | token |
| --- | --- |
| 1 | `The` |
| 2 | `kettle` |
| 3 | `boiled` |
| 4 | `over` |

A language model is trained to predict the next token. At position 2 it should predict `kettle` having seen only `The`.

Without masking, position 2 can also attend to `boiled` and `over`. Now the task is trivial — something that boiled over is very likely a kettle, and the model can read that straight off the input instead of predicting it.

This is information leakage. The model learns to lean on tokens it is supposed to be predicting, training loss looks excellent, and then generation falls apart, because at generation time those future tokens do not exist yet.

## The mask

The fix is a mask matrix the same shape as the attention score matrix. A `1` allows attention, a `0` blocks it. It comes out lower-triangular:

<figure>
<svg viewBox="0 0 344 334" width="344" role="img" aria-label="A four by four causal mask for the tokens The, kettle, boiled, over. Each row is a query token and each column a key token. Cells on or below the diagonal hold 1 and are allowed; cells above the diagonal hold 0 and are blocked." xmlns="http://www.w3.org/2000/svg">
<style>.lbl{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.ax{font:600 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.08em}.kp{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.mk{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground);opacity:.6}</style>
<text class="ax" x="84" y="14">KEY &#8594;</text>
<text class="ax" x="0" y="326">QUERY &#8595;</text>
<text class="lbl" x="115" y="44" text-anchor="middle">The</text>
<text class="lbl" x="177" y="44" text-anchor="middle">kettle</text>
<text class="lbl" x="239" y="44" text-anchor="middle">boiled</text>
<text class="lbl" x="301" y="44" text-anchor="middle">over</text>
<text class="lbl" x="72" y="91" text-anchor="end">The</text>
<rect x="84" y="56" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="115" y="91" text-anchor="middle">1</text>
<rect x="146" y="56" width="62" height="62" rx="6" fill="var(--secondary)" stroke="var(--border)"/>
<text class="mk" x="177" y="91" text-anchor="middle">0</text>
<rect x="208" y="56" width="62" height="62" rx="6" fill="var(--secondary)" stroke="var(--border)"/>
<text class="mk" x="239" y="91" text-anchor="middle">0</text>
<rect x="270" y="56" width="62" height="62" rx="6" fill="var(--secondary)" stroke="var(--border)"/>
<text class="mk" x="301" y="91" text-anchor="middle">0</text>
<text class="lbl" x="72" y="153" text-anchor="end">kettle</text>
<rect x="84" y="118" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="115" y="153" text-anchor="middle">1</text>
<rect x="146" y="118" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="177" y="153" text-anchor="middle">1</text>
<rect x="208" y="118" width="62" height="62" rx="6" fill="var(--secondary)" stroke="var(--border)"/>
<text class="mk" x="239" y="153" text-anchor="middle">0</text>
<rect x="270" y="118" width="62" height="62" rx="6" fill="var(--secondary)" stroke="var(--border)"/>
<text class="mk" x="301" y="153" text-anchor="middle">0</text>
<text class="lbl" x="72" y="215" text-anchor="end">boiled</text>
<rect x="84" y="180" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="115" y="215" text-anchor="middle">1</text>
<rect x="146" y="180" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="177" y="215" text-anchor="middle">1</text>
<rect x="208" y="180" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="239" y="215" text-anchor="middle">1</text>
<rect x="270" y="180" width="62" height="62" rx="6" fill="var(--secondary)" stroke="var(--border)"/>
<text class="mk" x="301" y="215" text-anchor="middle">0</text>
<text class="lbl" x="72" y="277" text-anchor="end">over</text>
<rect x="84" y="242" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="115" y="277" text-anchor="middle">1</text>
<rect x="146" y="242" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="177" y="277" text-anchor="middle">1</text>
<rect x="208" y="242" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="239" y="277" text-anchor="middle">1</text>
<rect x="270" y="242" width="62" height="62" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="kp" x="301" y="277" text-anchor="middle">1</text>
</svg>
<figcaption>The causal mask for four tokens. 1 = attention allowed, 0 = blocked.</figcaption>
</figure>

Row 1 (`The`) sees only itself. Row 4 (`over`) sees the whole sentence. Each row is exactly the context that position would have during real generation.

## Worked example

Take the row for `kettle` — its raw attention scores against all four tokens:

| | `The` | `kettle` | `boiled` | `over` |
| --- | --- | --- | --- | --- |
| scores | 1.1 | 2.5 | 1.0 | 0.3 |

Run softmax on that row **without** masking:

| | `The` | `kettle` | `boiled` | `over` |
| --- | --- | --- | --- | --- |
| weights | 0.16 | 0.63 | **0.14** | **0.07** |

`kettle` is putting 14% of its attention on `boiled` and 7% on `over`. That is 21% of its attention spent on the future — the leak, in numbers.

Now apply the mask. Positions 3 and 4 are set to −∞:

| | `The` | `kettle` | `boiled` | `over` |
| --- | --- | --- | --- | --- |
| masked scores | 1.1 | 2.5 | −∞ | −∞ |

And softmax again:

| | `The` | `kettle` | `boiled` | `over` |
| --- | --- | --- | --- | --- |
| weights | 0.20 | 0.80 | **0.00** | **0.00** |

The future gets exactly zero. The 21% that was leaking redistributes over `The` and `kettle`, and the row still sums to 1.

## Why −∞ and not 0

Because of how softmax works:

$$
\text{softmax}(z)_i = \frac{e^{z_i}}{\sum_j e^{z_j}}
$$

Softmax exponentiates every score. $e^{-\infty} = 0$, so a masked position contributes nothing to the numerator and nothing to the denominator — it drops out completely.

Set the *score* to 0 instead and you get $e^{0} = 1$, which is not small at all. In the row above, a score of 0 would still earn `boiled` a real share of the attention. Zero is not "off"; −∞ is.

The mask also has to be applied to the scores, before the softmax. Zeroing the weights afterwards does not work either — the future tokens have already contributed to the denominator, so the surviving weights no longer sum to 1.

## Attention sinks

One thing worth noticing in the masked row: `The` still gets a 0.20 share, even though it carries almost no meaning here.

This is common. Across models, nearly every position sends some attention to the first token, and the pattern has a name — **attention sinks**. The first token acts as somewhere for attention to go when a head has nothing in particular to attend to.

It matters in practice. Methods that drop old tokens to save memory have to keep the first few, or quality collapses.

## Summary

- Causal masking limits each token to itself and the tokens before it.
- Without it, the model attends to tokens it is meant to predict — information leakage.
- The mask is lower-triangular: `1` on and below the diagonal, `0` above.
- Masked positions are set to −∞ *before* the softmax, so they come out as exactly 0.
- Setting them to 0 instead does not work, because $e^0 = 1$.
