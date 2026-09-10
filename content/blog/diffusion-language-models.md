---
title: "Diffusion Language Models"
date: "2026-09-11T15:20"
category: "AI"
tags: ["diffusion", "language-models", "parallel-decoding", "generation", "sampling"]
summary: "Instead of writing left to right, a diffusion language model starts from an all-masked sequence and fills it in over a few rounds. The speedup is real, and so is the reason it cannot be pushed as far as it looks."
draft: false
cover: "/blog/diffusion-language-models.svg"
---

The usual language model writes one token, looks at what it wrote, writes the next. Every token needs its own pass over the model, so a 256-token answer needs 256 passes, strictly in order.

A diffusion language model does something different. It starts with the entire output masked out and fills positions in over a small number of rounds, all positions in play at once.

## How the rounds work

Training teaches the model to recover text from partial masking. Take a real sentence, hide a random subset of its tokens, and train the model to predict what was hidden — everywhere at once, using both sides for context.

Generation runs that in reverse. Round one starts from a fully masked sequence of the target length. The model produces a prediction for every position, and the ones it is most confident about are committed. Those become fixed context. Round two runs again with those anchors visible, which sharpens everything else. Repeat until nothing is masked.

Say the answer is a service window:

```
round 0   [?] [?] [?] [?] [?] [?]
round 1   the [?] [?] [?] [?] pm        <- confident, committed
round 2   the desk [?] until [?] pm
round 3   the desk stays until six pm
```

The order is by confidence, not by position. The model commits the easy tokens first and lets them constrain the hard ones — which is why it can fix an early word using a later one, something a strictly left-to-right process cannot do.

## Where the speed comes from

Fewer passes over the model:

| rounds | tokens committed per round | passes vs 256 |
| --- | --- | --- |
| 256 | 1 | 1× |
| 64 | 4 | 4× |
| 32 | 8 | 8× |

Generating tokens is bottlenecked on reading the weights, not on the arithmetic. A pass costs roughly the same whether it commits one token or eight, so cutting the rounds cuts the time almost proportionally.

Which raises the obvious question: why not one round?

## The cost of committing together

When the model commits several positions in the same round, it samples each from its own prediction, independently. But the correct tokens at those positions are not independent — they have to agree with each other.

Here is the cleanest case. Two slots, and only two valid fillings of the pair:

```
the desk stays until  six   pm
the desk stays until eleven am
```

Look at either slot on its own and the model is genuinely 50/50 — both readings are equally plausible. Commit them in the same round and each is sampled separately, so a quarter of the time you get *six am* and a quarter *eleven pm*. **Half the outputs are wrong**, and neither individual prediction was mistaken.

It gets worse quickly. With *k* mutually-dependent positions committed together, the chance of a coherent result is 2^(1−k):

| positions committed together | coherent |
| --- | --- |
| 2 | 50.0% |
| 3 | 25.0% |
| 4 | 12.5% |
| 8 | 0.78% |

(Simulated over 2 million draws, matching the formula to three decimals.)

This is the whole tension. A left-to-right model never has this problem, because each token is sampled *after* seeing the previous one — the dependency is handled by construction.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Two slots each with two equally likely fillings, showing that independent sampling produces the two invalid combinations half the time." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.x{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:color-mix(in srgb, var(--muted-foreground) 90%, transparent)}</style>
<text class="hd" x="20" y="18">EACH SLOT IS RIGHT — THE PAIR IS NOT</text>
<text class="l" x="20" y="46">slot A, on its own</text>
<rect x="20" y="56" width="110" height="24" rx="4" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="b" x="75" y="73" text-anchor="middle">six · 50%</text>
<rect x="20" y="86" width="110" height="24" rx="4" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="b" x="75" y="103" text-anchor="middle">eleven · 50%</text>
<text class="l" x="160" y="46">slot B, on its own</text>
<rect x="160" y="56" width="110" height="24" rx="4" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="b" x="215" y="73" text-anchor="middle">pm · 50%</text>
<rect x="160" y="86" width="110" height="24" rx="4" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="b" x="215" y="103" text-anchor="middle">am · 50%</text>
<text class="l" x="310" y="46">committed together</text>
<rect x="310" y="56" width="180" height="24" rx="4" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="400" y="73" text-anchor="middle">six pm · 25%</text>
<rect x="310" y="86" width="180" height="24" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="x" x="400" y="103" text-anchor="middle">six am · 25%</text>
<rect x="310" y="116" width="180" height="24" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="x" x="400" y="133" text-anchor="middle">eleven pm · 25%</text>
<rect x="310" y="146" width="180" height="24" rx="4" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="400" y="163" text-anchor="middle">eleven am · 25%</text>
<path d="M20 192 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="216">half the outputs are incoherent, with no wrong prediction anywhere</text>
<text class="l" x="20" y="238">this is why rounds cannot collapse to one</text>
</svg>
<figcaption>Independent sampling of dependent positions is the price of committing them in the same round.</figcaption>
</figure>

## Why confidence is the right selector

Committing by confidence is not a heuristic for picking easy tokens. It is a way of avoiding exactly this failure.

A position the model is 99% sure about has almost no dependence left to violate — whatever the neighbouring slot turns out to be, this one was going to be the same token. Committing it in parallel is nearly free. A position sitting at 50/50 is precisely one whose value is being decided by something not yet fixed, and committing it early is a coin flip.

So the round count adapts to the text. Predictable stretches collapse into few rounds; genuinely ambiguous ones need many. The usable speedup depends on how much of the output was easy.

## What it costs elsewhere

**The length is decided up front.** The sequence has a fixed number of slots from round zero, so the model commits to a length before it knows what it is going to say. Padding and stopping tokens paper over this, awkwardly.

**Caching does not carry over.** A left-to-right model keeps its attention state and extends it by one token per step. When earlier positions can change between rounds, that state is invalidated, so each round does more work than the equivalent step in an autoregressive model. The 8× reduction in passes is not 8× in wall-clock.

**The training objective is harder.** Predicting every masked position from arbitrary partial context is a broader task than predicting the next token, and it is diluted across positions the model was going to get right anyway.

## What to take away

The appeal is genuine: parallel commits, and the ability to revise a decision using text that comes after it.

The limit is equally genuine, and it is not an engineering detail. Every token committed in parallel with another is a dependency the model chose not to resolve — so the achievable speedup is bounded by how much of the answer was never in doubt.
