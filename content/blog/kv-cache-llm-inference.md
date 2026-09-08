---
title: "KV cache in LLMs"
date: "2026-09-07T16:08"
category: "AI"
tags: ["llm", "inference", "kv-cache"]
summary: "An LLM generates one token at a time, and each new token needs the keys and values of every token before it. The KV cache stores them instead of recomputing them."
draft: false
cover: "/blog/kv-cache-llm-inference.svg"
---

A large language model does not produce a sentence in one go. It generates **one token at a time**, and each new token is predicted by looking at everything generated so far:

```
The                ->  The train
The train          ->  The train was
The train was      ->  The train was late
```

Every step re-reads the whole sequence. That is where the waste comes from, and the KV cache is what removes it.

## Q, K and V

Inside an attention layer, each token is turned into three vectors:

| | what it is |
| --- | --- |
| **Query (Q)** | what the current token is looking for |
| **Key (K)** | what each token has to offer |
| **Value (V)** | the actual information a token carries |

To produce the next token, the model takes the current token's Query, compares it against the Keys of every token in the sequence to get attention scores, and uses those scores to collect the matching Values.

So a single decoding step needs one Query, plus the Keys and Values of **every** token so far.

## The problem

Do that literally and you recompute the Keys and Values of the earlier tokens at every single step:

<figure>
<svg viewBox="0 0 436 612" width="436" role="img" aria-label="Two panels comparing generation without and with a KV cache. Without a cache every step recomputes keys and values for all previous tokens. With a cache each step computes only the newest token and reads the rest back." xmlns="http://www.w3.org/2000/svg">
<style>.t{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.s{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.n{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.c{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground);opacity:.65}.cost{font:600 11px var(--font-geist-mono),ui-monospace,monospace}</style>
<text class="t" x="0" y="28">WITHOUT A KV CACHE</text>
<text class="s" x="0" y="71">step 1</text>
<rect x="88" y="44" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="111" y="71" text-anchor="middle">t1</text>
<text class="cost" x="312" y="71" fill="var(--destructive)">1 K/V computed</text>
<text class="s" x="0" y="129">step 2</text>
<rect x="88" y="102" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="111" y="129" text-anchor="middle">t1</text>
<rect x="142" y="102" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="165" y="129" text-anchor="middle">t2</text>
<text class="cost" x="312" y="129" fill="var(--destructive)">2 K/V computed</text>
<text class="s" x="0" y="187">step 3</text>
<rect x="88" y="160" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="111" y="187" text-anchor="middle">t1</text>
<rect x="142" y="160" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="165" y="187" text-anchor="middle">t2</text>
<rect x="196" y="160" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="219" y="187" text-anchor="middle">t3</text>
<text class="cost" x="312" y="187" fill="var(--destructive)">3 K/V computed</text>
<text class="s" x="0" y="245">step 4</text>
<rect x="88" y="218" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="111" y="245" text-anchor="middle">t1</text>
<rect x="142" y="218" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="165" y="245" text-anchor="middle">t2</text>
<rect x="196" y="218" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="219" y="245" text-anchor="middle">t3</text>
<rect x="250" y="218" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="273" y="245" text-anchor="middle">t4</text>
<text class="cost" x="312" y="245" fill="var(--destructive)">4 K/V computed</text>
<text class="cost" x="88" y="290" fill="var(--destructive)">total: 10 K/V computations</text>
<text class="t" x="0" y="338">WITH A KV CACHE</text>
<text class="s" x="0" y="381">step 1</text>
<rect x="88" y="354" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="111" y="381" text-anchor="middle">t1</text>
<text class="cost" x="312" y="381" fill="var(--muted-foreground)">1 K/V computed</text>
<text class="s" x="0" y="439">step 2</text>
<rect x="88" y="412" width="46" height="46" rx="6" fill="var(--secondary)" stroke="var(--border)" stroke-dasharray="3 3"/>
<text class="c" x="111" y="439" text-anchor="middle">t1</text>
<rect x="142" y="412" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="165" y="439" text-anchor="middle">t2</text>
<text class="cost" x="312" y="439" fill="var(--muted-foreground)">1 K/V computed</text>
<text class="s" x="0" y="497">step 3</text>
<rect x="88" y="470" width="46" height="46" rx="6" fill="var(--secondary)" stroke="var(--border)" stroke-dasharray="3 3"/>
<text class="c" x="111" y="497" text-anchor="middle">t1</text>
<rect x="142" y="470" width="46" height="46" rx="6" fill="var(--secondary)" stroke="var(--border)" stroke-dasharray="3 3"/>
<text class="c" x="165" y="497" text-anchor="middle">t2</text>
<rect x="196" y="470" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="219" y="497" text-anchor="middle">t3</text>
<text class="cost" x="312" y="497" fill="var(--muted-foreground)">1 K/V computed</text>
<text class="s" x="0" y="555">step 4</text>
<rect x="88" y="528" width="46" height="46" rx="6" fill="var(--secondary)" stroke="var(--border)" stroke-dasharray="3 3"/>
<text class="c" x="111" y="555" text-anchor="middle">t1</text>
<rect x="142" y="528" width="46" height="46" rx="6" fill="var(--secondary)" stroke="var(--border)" stroke-dasharray="3 3"/>
<text class="c" x="165" y="555" text-anchor="middle">t2</text>
<rect x="196" y="528" width="46" height="46" rx="6" fill="var(--secondary)" stroke="var(--border)" stroke-dasharray="3 3"/>
<text class="c" x="219" y="555" text-anchor="middle">t3</text>
<rect x="250" y="528" width="46" height="46" rx="6" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="n" x="273" y="555" text-anchor="middle">t4</text>
<text class="cost" x="312" y="555" fill="var(--muted-foreground)">1 K/V computed</text>
<text class="cost" x="88" y="600" fill="var(--muted-foreground)">total: 4 K/V computations</text>
<line x1="0" y1="304" x2="436" y2="304" stroke="var(--border)"/>
</svg>
<figcaption>Solid = computed at this step. Dashed = read back from the cache.</figcaption>
</figure>

Step 2 recomputes the K and V for token 1, which it already computed in step 1. Step 3 recomputes tokens 1 and 2. Step 4 recomputes 1, 2 and 3. The work piles up quadratically, and every repeat produces exactly the same numbers as the time before.

Put real numbers on it. Starting from a 4-token prompt and generating out to 200 tokens, the uncached version computes:

$$
4 + 5 + 6 + \dots + 200 = 20{,}094 \text{ K/V computations}
$$

## The solution

The Keys and Values for a token never change. Once token 1 has been processed, its K and V are fixed — nothing generated later alters them.

So store them. Compute each token's K and V once, keep them in memory, and read them back on every later step. Each step then computes K and V for exactly one new token.

For the same 200-token sequence:

$$
4 + 196 = 200 \text{ K/V computations}
$$

20,094 down to 200 — about **100 times fewer**.

## Why only K and V

The Query belongs only to the token being generated right now. Once that step is done it has served its purpose and is never needed again, so there is nothing to gain by keeping it.

Keys and Values are the opposite. Every token's K and V are needed at every future step, because each new Query has to be compared against all of them. They get reused for the rest of the sequence, which is exactly what makes them worth caching.

## The trade-off

The cache buys speed with memory. Nothing is free: the K and V of every token sit in GPU memory for as long as the sequence is alive, and that grows linearly with sequence length.

For short sequences this is a clear win. For very long ones the cache itself becomes the constraint, which is why serving systems manage it — commonly by keeping only a sliding window of recent tokens plus the first few tokens, the attention sinks, which cannot be dropped without quality falling apart.

## Summary

- LLMs generate one token at a time, and each step needs the K and V of every previous token.
- Recomputing them every step is quadratic and entirely redundant — the values never change.
- Caching K and V turns 20,094 computations into 200 for a 200-token sequence.
- Q is not cached, because it is only ever used for the current token.
- The cost is memory, which becomes the limiting factor on long sequences.
