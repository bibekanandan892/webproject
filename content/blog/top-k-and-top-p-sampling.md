---
title: "Top-k and top-p sampling"
date: "2026-08-18T09:25"
category: "AI"
tags: ["sampling", "top-k", "top-p", "decoding", "llm"]
summary: "Both cut off the long tail of unlikely tokens before sampling, and each fails where the other works. On a confident step, top-p at 0.9 keeps 4 tokens where top-k keeps 40; on a flat one it keeps 15,996 where top-k keeps 40 — and leaves 62.5% of the probability out."
draft: false
cover: "/blog/top-k-and-top-p-sampling.svg"
---

A language model's vocabulary has tens of thousands of tokens, and at every step every one of them gets some probability. Almost all of those probabilities are tiny. But there are so many of them that, together, they add up — and sampling from the full distribution means occasionally drawing one.

That is the long tail, and it is where incoherent text comes from: not from the model's top choices, but from the thousands of near-zero options that, added up, are drawn surprisingly often.

Top-k and top-p are two ways of cutting the tail off before sampling. They differ in what they hold fixed.

## Top-k: keep a fixed number

Keep the *k* most likely tokens, set the rest to zero, renormalise, sample. With *k* = 40, there are always exactly 40 candidates.

## Top-p: keep a fixed share of probability

Sort tokens by probability and keep the smallest set whose probabilities add up to at least *p*. With *p* = 0.9, keep whatever the top tokens are that together cover 90% of the mass — maybe 3 tokens, maybe 3,000. Also called **nucleus sampling**.

## The same rule on three different steps

The shape of the distribution changes from step to step. After *"The capital of France is"*, nearly all the probability sits on one token. After *"My favourite word is"*, it is spread over thousands.

Model three steps over a 50,000-token vocabulary, from very confident to very open:

| step | top token | top-p 0.9 keeps | top-k 40 covers |
| --- | --- | --- | --- |
| confident | 67.1% | **4 tokens** | 99.3% of the mass |
| typical | 43.8% | 27 tokens | 92.2% |
| open-ended | 8.8% | **15,996 tokens** | 37.5% |

Read the rows.

**On the confident step**, top-k is too loose. It keeps 40 candidates when four cover 90% of the probability. The other 36 are the tail it was supposed to remove; together they hold a few per cent of the mass — enough to be drawn now and then. Top-p adapts and keeps just the four.

**On the open-ended step**, top-p is too loose. Keeping 90% of a flat distribution means keeping almost sixteen thousand tokens, most of them individually absurd. Top-k caps the candidates at 40, and those 40 hold only 37.5% of the probability — the model has many reasonable options, and top-k picks among the best of them.

Neither rule is right on both. That is why they are usually used together.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="Two probability distributions: a peaked one where top-p keeps 4 tokens and top-k keeps 40, and a flat one where top-k keeps 40 and top-p keeps nearly 16,000." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EACH CUT FAILS WHERE THE OTHER WORKS</text>
<text class="b" x="20" y="44">confident step</text>
<path d="M20 150 H260" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<g fill="var(--primary)" fill-opacity="0.8"><rect x="24" y="60" width="10" height="90"/><rect x="36" y="134" width="10" height="16"/><rect x="48" y="142" width="10" height="8"/><rect x="60" y="145" width="10" height="5"/></g>
<g fill="var(--muted-foreground)" fill-opacity="0.45"><rect x="72" y="147" width="10" height="3"/><rect x="84" y="148" width="10" height="2"/><rect x="96" y="148" width="10" height="2"/><rect x="108" y="149" width="10" height="1"/><rect x="120" y="149" width="10" height="1"/><rect x="132" y="149" width="10" height="1"/></g>
<path d="M71 52 V156" stroke="var(--primary)" stroke-dasharray="3 3"/><text class="b" x="76" y="62">top-p: 4</text>
<path d="M200 52 V156" stroke="var(--muted-foreground)" stroke-dasharray="3 3"/><text class="l" x="160" y="62">top-k: 40</text>
<text class="b" x="300" y="44">open-ended step</text>
<path d="M300 150 H540" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<path d="M302 132 C330 138 380 142 420 144 C470 146 510 147 540 147 V150 H302 Z" fill="var(--muted-foreground)" fill-opacity="0.35"/>
<path d="M302 132 C320 136 335 139 350 140 V150 H302 Z" fill="var(--primary)" fill-opacity="0.75"/>
<path d="M350 52 V156" stroke="var(--primary)" stroke-dasharray="3 3"/><text class="b" x="355" y="62">top-k: 40</text>
<path d="M534 52 V156" stroke="var(--muted-foreground)" stroke-dasharray="3 3"/><text class="l" x="530" y="76" text-anchor="end">top-p: 15,996</text>
<path d="M20 190 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="214">top-p adapts to confidence; top-k caps the damage when there is none</text>
<text class="l" x="20" y="234">used together, the stricter of the two applies on every step</text>
</svg>
<figcaption>A fixed count is wrong on confident steps; a fixed share is wrong on flat ones.</figcaption>
</figure>

## Using both, with temperature

Most serving stacks apply the filters in a fixed order:

1. **Temperature** scales the logits, sharpening or flattening the distribution.
2. **Top-k** keeps at most *k* candidates.
3. **Top-p** keeps the smallest set covering *p* of what remains.
4. Renormalise and sample.

With both set, the stricter one wins on each step. On the confident step, top-p leaves 4 tokens. On the open-ended step, top-k leaves 40. The tail is cut either way.

The order with temperature matters. Raising the temperature flattens the distribution *before* the filters see it, so a higher temperature makes top-p keep more tokens. That is often what people want — more variety among plausible options — but it means the two settings are not independent dials.

## Min-p, briefly

A newer alternative keeps every token whose probability is at least some fraction of the top token's. With min-p = 0.1, the cut-off is a tenth of whatever the top token has:

| step | cut-off | min-p 0.1 keeps |
| --- | --- | --- |
| confident | 6.71% | 2 tokens |
| typical | 4.38% | 4 tokens |
| open-ended | 0.88% | 10 tokens |

It adapts in both directions: tight on confident steps like top-p, bounded on flat steps like top-k. The price is that it is stricter than either — on the open-ended step its 10 tokens hold only 25.7% of the probability — so it is usually paired with a somewhat higher temperature.

## Typical settings

| task | temperature | top-k | top-p |
| --- | --- | --- | --- |
| code, extraction, facts | 0 – 0.2 | — | — |
| general chat | 0.7 | 40 | 0.9 |
| creative writing | 0.9 – 1.0 | 50–100 | 0.95 |

At temperature 0 the filters do nothing: greedy decoding already takes only the top token.

## What to take away

Top-k keeps a fixed number of candidates; top-p keeps a fixed share of probability. On a confident step top-k is too generous — 40 tokens where 4 hold 90% of the mass. On a flat step top-p is too generous — 15,996 tokens to reach 90%.

Use both, so the stricter one applies on each step, and remember that temperature reshapes the distribution before either filter sees it.
