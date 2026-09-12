---
title: "RNNs vs Transformers"
date: "2026-09-12T05:40"
category: "AI"
tags: ["rnn", "transformers", "attention", "complexity", "training"]
summary: "Attention costs n²d and recurrence costs nd², so they cross exactly at n = d — 768 tokens for a typical model. Transformers won on training parallelism, and pay for it past that crossover."
draft: false
cover: "/blog/rnns-vs-transformers.svg"
---

Both architectures exist to read a sequence. They differ in one respect and everything else follows from it.

A **recurrent network** reads one position at a time, carrying a hidden state forward. Position 5 cannot be computed until position 4 is done.

A **transformer** reads every position at once, and each position uses attention to look directly at any other.

## What sequential reading costs

Consider a sentence where agreement depends on something far back:

> The letter, which had sat unopened in the drawer since the move, was —

To choose the next word you need *letter*, which is eleven words earlier. A recurrent network has carried that information through eleven update steps, each of which mixed in new content and had a fixed-size state to do it in. Whatever survives of *letter* survived eleven rounds of compression.

A transformer's attention at the final position looks at *letter* directly. One hop, no decay, and the distance does not appear in the computation at all.

That is the capability argument, and it is real. But it is not why transformers took over.

## The reason they won: training depth

Training processes whole sequences. The question is how many steps must happen *in order*.

| sequence length | recurrent: sequential steps | transformer |
| --- | --- | --- |
| 128 | 128 | **1** |
| 512 | 512 | 1 |
| 2,048 | 2,048 | 1 |

A recurrent network cannot compute position 200 until 199 is finished, so a 2,048-token sequence has 2,048 dependencies to wait on regardless of how many processors are available. A transformer computes all positions in one pass.

On hardware whose entire advantage is doing thousands of independent things at once, that difference decides everything. The transformer is not better at using a GPU by a margin — it is the only one of the two that can use one properly.

## The cost crossover, exactly

Per layer, ignoring constants:

- attention over *n* positions costs about **2n²d**
- a recurrent step repeated *n* times costs about **2nd²**

Set them equal: `n²d = nd²`, so **n = d**. For a hidden size of 768, the crossover is at exactly **768 tokens**.

| sequence length | transformer | recurrent | ratio |
| --- | --- | --- | --- |
| 128 | 2.52 × 10⁷ | 1.51 × 10⁸ | **0.17×** |
| 512 | 4.03 × 10⁸ | 6.04 × 10⁸ | 0.67× |
| **768** | 9.06 × 10⁸ | 9.06 × 10⁸ | **1.00×** |
| 2,048 | 6.44 × 10⁹ | 2.42 × 10⁹ | 2.67× |
| 4,096 | 2.58 × 10¹⁰ | 4.83 × 10⁹ | 5.33× |
| 16,384 | 4.12 × 10¹¹ | 1.93 × 10¹⁰ | **21.33×** |

Below the crossover the transformer does less arithmetic. Above it the recurrent network does — and the gap is exactly `n / d`, so at 16,384 tokens the transformer is doing 21× the work.

The transformer wins anyway at those lengths, because the work it does is parallel and the recurrent network's is not. Which is the whole trade in one sentence: **transformers spend more arithmetic to remove the sequential dependency.**

<figure>
<svg viewBox="0 0 560 316" width="560" role="img" aria-label="Two cost curves against sequence length, quadratic for attention and linear for recurrence, crossing at the hidden size." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THEY CROSS EXACTLY AT THE HIDDEN SIZE</text>
<path d="M60 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="20" y="46">6.4e9</text>
<text class="l" x="20" y="118">3.2e9</text>
<text class="l" x="46" y="194">0</text>
<path d="M60 190 L118 188 L175 181 L233 169 L290 153 L348 131 L405 106 L462 75 L520 40" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<path d="M60 190 L520 134" stroke="color-mix(in srgb, var(--muted-foreground) 75%, transparent)" stroke-width="2.2" fill="none"/>
<circle cx="233" cy="169" r="4.4" fill="var(--primary)"/>
<text class="b" x="130" y="164">768 — equal here</text>
<text class="b" x="398" y="66">attention · n²d</text>
<text class="l" x="392" y="152">recurrence · nd²</text>
<text class="l" x="60" y="210">0</text>
<text class="l" x="290" y="210" text-anchor="middle">1,024</text>
<text class="l" x="520" y="210" text-anchor="end">2,048 tokens</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="252">below 768 tokens attention does less arithmetic; above it, more</text>
<text class="l" x="20" y="274">at 16,384 tokens it does 21× more — and still wins, because it parallelises</text>
<text class="l" x="20" y="294">recurrence has 2,048 sequential steps where attention has 1</text>
</svg>
<figcaption>The crossover is not a tuning artefact. It sits at n = d by construction.</figcaption>
</figure>

## Generation flips it

The picture at inference time is the reverse, and this is the part worth knowing.

To produce one more token with a history of *n*:

| | cost |
| --- | --- |
| recurrent — update the state | 1.18 × 10⁶, **flat** |
| transformer at n = 512 | 7.86 × 10⁵ (0.7×) |
| transformer at n = 4,096 | 6.29 × 10⁶ (5.3×) |
| transformer at n = 32,768 | 5.03 × 10⁷ (**42.7×**) |

A recurrent network's per-token cost does not depend on how much came before — the state is fixed-size, and generating the ten-thousandth token costs the same as the tenth. A transformer has to attend over everything it has written, so its per-token cost grows linearly with the history.

There is no parallelism to recover here, because generation is inherently sequential either way. So the transformer's advantage does not apply, and its cost disadvantage does.

That is why recurrent-style architectures keep being revisited for long-sequence and streaming work. The question they are answering is not "can we beat attention at reading" — it is "can we get a fixed-size state back without giving up trainability".

## Where each one belongs

**A transformer** for anything trained on substantial data, and for anything where a distant dependency has to be exact. Which is most current work.

**A recurrent model** where the sequence is unbounded or arrives as a stream, where memory is fixed and small, or where per-token inference cost has to be constant. Sensor streams, always-on audio, small devices.

## What to take away

Attention did not win by being cheaper. At 16,384 tokens it does 21 times the arithmetic.

It won by having no sequential dependency during training, which is the one thing that matters on parallel hardware — and it pays for that at generation time, where every token attends over everything before it and a fixed-size state would have been free.
