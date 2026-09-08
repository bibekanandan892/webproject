---
title: "Mixture of experts in LLMs"
date: "2026-09-08T01:10"
category: "AI"
tags: ["llm", "moe", "router", "sparse", "architecture"]
summary: "A mixture-of-experts layer holds many small networks and sends each token through only two of them. The model gets to be large without every token paying for all of it."
draft: false
cover: "/blog/mixture-of-experts-in-llms.svg"
---

A mixture-of-experts layer holds several small networks side by side and sends each token through only two of them. The rest do nothing for that token.

## Why it is needed

In an ordinary language model, every token passes through every parameter. A 30-billion-parameter model runs all 30 billion of them, whether the token is a comma or a rare technical term.

That is expensive, and a lot of it is wasted. Most tokens are easy and do not need the whole model.

Mixture of experts breaks the link between how large a model is and how much work each token costs. The model can hold a very large number of parameters while any single token touches only a slice of them.

## What an expert is

An expert is a small feed-forward network — the same kind that already sits inside every transformer layer. That is all it is.

The name oversells it. Nobody hands an expert a subject. They all start out the same shape and the same blank, and whatever division of labour appears is one the model worked out during training. The splits tend to be mundane — punctuation, word endings, the shape of a token — rather than tidy topics like law or biology.

A layer usually holds 8, 16, 64 or 128 of them.

## Where it sits

A transformer layer does two things: attention, then a feed-forward network. Mixture of experts swaps out the feed-forward network for a group of experts plus a router. Attention is left exactly as it was.

Every layer gets its own router, trained separately. A 24-layer model has 24 of them, and the same token can be sent to a different pair of experts at each one.

## The router

The router is a small linear layer followed by a softmax. It reads the token's vector and gives one score per expert. The scores add up to 1.

Take a layer with 12 experts, and one token arriving at it:

<figure>
<svg viewBox="0 0 582 200" width="582" role="img" aria-label="Bar chart of one token's router scores across twelve experts. Expert 9 scores 0.400 and expert 4 scores 0.189; the remaining ten experts all score below 0.11, most of them near zero." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.v{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="36" y="14">ROUTER SCORES &#183; 12 EXPERTS &#183; TOP-2 KEPT</text>
<path d="M36 168.5 H574" stroke="var(--border)" stroke-width="1"/>
<rect x="44" y="153" width="34" height="15" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="61" y="186" text-anchor="middle">1</text>
<rect x="88" y="165" width="34" height="3" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="105" y="186" text-anchor="middle">2</text>
<rect x="132" y="148" width="34" height="20" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="149" y="186" text-anchor="middle">3</text>
<rect x="176" y="117" width="34" height="51" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="193" y="109" text-anchor="middle">0.189</text>
<text class="l" x="193" y="186" text-anchor="middle">4</text>
<rect x="220" y="162" width="34" height="6" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="237" y="186" text-anchor="middle">5</text>
<rect x="264" y="156" width="34" height="12" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="281" y="186" text-anchor="middle">6</text>
<rect x="308" y="161" width="34" height="7" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="325" y="186" text-anchor="middle">7</text>
<rect x="352" y="139" width="34" height="29" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="369" y="186" text-anchor="middle">8</text>
<rect x="396" y="60" width="34" height="108" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="413" y="52" text-anchor="middle">0.400</text>
<text class="l" x="413" y="186" text-anchor="middle">9</text>
<rect x="440" y="164" width="34" height="4" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="457" y="186" text-anchor="middle">10</text>
<rect x="484" y="164" width="34" height="4" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="501" y="186" text-anchor="middle">11</text>
<rect x="528" y="157" width="34" height="11" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)"/>
<text class="l" x="545" y="186" text-anchor="middle">12</text>
</svg>
<figcaption>One token's router scores. Two experts are kept; the other ten never run.</figcaption>
</figure>

The two highest scores are expert 9 at 0.400 and expert 4 at 0.189. Those two run. The other ten are skipped.

Those two scores do not add up to 1 by themselves, so they are rescaled until they do:

$$
w_9 = \frac{0.400}{0.400 + 0.189} = 0.68
\qquad
w_4 = \frac{0.189}{0.400 + 0.189} = 0.32
$$

The layer's output is then those two experts' outputs, blended in that ratio:

$$
\text{output} = 0.68 \cdot E_9(x) + 0.32 \cdot E_4(x)
$$

Ten of the twelve experts contributed nothing to this token. That is where the saving comes from.

## Total parameters and active parameters

Because most experts sit out, an MoE model has two sizes worth quoting.

**Total parameters** is everything stored in the weights. **Active parameters** is what actually runs for one token.

Take a model with 24 layers, 12 experts in each, half a billion parameters per expert. Attention, embeddings and normalisation come to 9 billion, and those are shared — they are not copied per expert.

| | working | count |
| --- | --- | --- |
| experts, all of them | $24 \times 12 \times 0.5\text{B}$ | 144B |
| shared layers | attention + embeddings + norms | 9B |
| **total** | | **153B** |
| experts that run, per token | $24 \times 2 \times 0.5\text{B}$ | 24B |
| shared layers | same, always run | 9B |
| **active per token** | | **33B** |

So each token costs about what a 33-billion-parameter dense model would cost — **21.6%** of the weights — while the model holds 153 billion.

Note which parts got replicated. Only the feed-forward half is copied across experts. Attention and the embeddings are shared, which is why adding more experts grows the total count without changing what one token pays.

## Keeping the experts busy

Left alone, the router does something unhelpful. It picks a few experts early, those experts get more training and improve, so the router picks them even more. The rest are barely trained and end up as dead weight.

The fix is a second loss term added during training, alongside the usual one. It penalises uneven routing, pushing the router to spread tokens across all the experts over a batch rather than crowding a favourite few.

There is also a cap. Each expert is given a fixed number of tokens it can take in a batch, and once it is full the extra tokens are either dropped or sent to the next expert on the list.

## What it costs

- **Memory.** All 153 billion parameters have to be in GPU memory, even though only 33 billion run. Memory follows the total; speed follows the active count. Sparsity buys compute, not RAM.
- **Communication.** Experts are usually spread across several GPUs, so tokens have to be shipped to whichever device holds their expert and the results shipped back — twice per layer.
- **Fine-tuning.** On a small dataset the router can shift its habits and fall back onto a handful of experts, undoing the balance that training worked to establish.

## The short version

- A mixture-of-experts layer replaces one feed-forward network with many, plus a router that chooses between them.
- The router scores every expert, keeps the top two, and rescales their weights to sum to 1.
- The output is a weighted blend of just those two; the rest never run.
- Experts are not given subjects — the division of labour is learned, and it is usually mundane.
- Memory follows the total parameter count, compute follows the active count.
- A balancing loss stops the router collapsing onto a few favourites and wasting the others.
