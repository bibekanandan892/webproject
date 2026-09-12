---
title: "LLM Watermarking"
date: "2026-09-12T03:40"
category: "AI"
tags: ["watermarking", "detection", "statistics", "provenance", "llm"]
summary: "Detecting a watermark is a coin-flip test. At full strength 64 tokens is enough; every halving of the signal quadruples the text you need, which is exactly why paraphrasing defeats it."
draft: false
cover: "/blog/llm-watermarking.svg"
---

At every step a model has a set of acceptable next tokens rather than one. Asked to continue "I am heading to the", it might weigh *office* at 0.31, *park* at 0.29, *market* at 0.22, *gym* at 0.18.

All four produce fluent text. Which one gets chosen carries no information about quality — and that is the freedom a watermark uses.

## The mechanism

Before each token, a secret key and the recent context are hashed to split the vocabulary pseudo-randomly in half: a **green** list and the rest. Tokens on the green list get a small boost to their scores.

The model then samples normally. It still avoids nonsense, because a boost is not a command — if no green token fits, a red one wins anyway. But across many steps, green tokens are chosen more often than chance.

Two properties make this work:

**The split changes every step**, because it depends on the preceding context. So there is no fixed set of watermarked words to notice, and no vocabulary to strip out.

**No single token is evidence.** Any one choice was plausible without a watermark. The signal exists only in aggregate.

## Detection is a coin-flip test

The detector has the key, so it can recompute the green list at every position and count how many of the actual tokens were on it.

Text written by a person has no relationship to the key, so it lands on the green list about half the time. Watermarked text lands there more often. That is a straightforward test:

```
z = (2 × green − n) / √n
```

For 750 green tokens out of 1,000, `z = 15.81` — far beyond any plausible accident.

The useful question is the reverse one: how much text is needed?

| green rate | tokens needed for z ≥ 4 |
| --- | --- |
| 75% | **64** |
| 70% | 101 |
| 65% | 178 |
| 60% | 401 |
| 55% | 1,600 |
| 52% | 10,000 |

At a strong watermark — 75% green — sixty-four tokens is enough. Roughly a sentence and a half.

But look at the shape. The requirement scales as **1/(2p − 1)²**: halving the excess above chance quadruples the text needed. From 75% to 60% is a 6× increase in required length for what sounds like a modest weakening.

<figure>
<svg viewBox="0 0 560 296" width="560" role="img" aria-label="A curve of tokens needed for detection against the green-token rate, rising steeply as the rate approaches fifty percent." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WEAKEN THE SIGNAL A LITTLE, NEED A LOT MORE TEXT</text>
<path d="M60 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="20" y="46">1,600</text>
<text class="l" x="28" y="118">800</text>
<text class="l" x="46" y="194">0</text>
<path d="M60 184 L78 183 L97 183 L115 182 L134 181 L152 181 L170 180 L189 178 L207 177 L226 175 L244 173 L262 171 L281 168 L299 164 L318 159 L336 152 L354 144 L373 131 L391 113 L410 86 L428 40" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="60" cy="184" r="4.4" fill="var(--primary)"/>
<text class="b" x="70" y="178">75% → 64 tokens</text>
<circle cx="244" cy="173" r="4" fill="var(--primary)"/>
<text class="l" x="254" y="167">65% → 178</text>
<circle cx="336" cy="152" r="4" fill="var(--primary)"/>
<text class="l" x="346" y="146">60% → 401</text>
<circle cx="428" cy="40" r="4.4" fill="var(--muted-foreground)"/>
<text class="l" x="436" y="52">55% → 1,600</text>
<text class="l" x="60" y="210">75%</text>
<text class="l" x="290" y="210" text-anchor="middle">62.5%</text>
<text class="l" x="520" y="210" text-anchor="end">50% — undetectable at any length</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="252">the length needed grows as 1/(2p−1)², so it goes vertical near chance</text>
<text class="l" x="20" y="274">paraphrasing does not remove the watermark — it moves you right along this curve</text>
</svg>
<figcaption>The asymptote at 50% is why editing works as an attack: it does not erase the signal, it dilutes it into unmeasurability.</figcaption>
</figure>

## What editing does

Suppose someone replaces a fraction of the tokens with their own words. Those positions now land on the green list at chance, so the overall green rate falls toward 50%.

| share of tokens replaced | effective green rate | tokens needed |
| --- | --- | --- |
| 0% | 75.0% | 64 |
| 20% | 70.0% | 101 |
| 40% | 65.0% | 178 |
| 60% | 60.0% | 401 |
| 80% | 55.0% | **1,600** |

This is the honest account of robustness. Light editing barely matters: at 40% replacement you still only need 178 tokens. Heavy rewriting or a round trip through translation pushes the rate toward chance, and then no length is sufficient.

So a watermark is robust to the editing people do casually and not to editing done deliberately to remove it. Which is a real property, and less than it is sometimes claimed to be.

## The false-positive number

A threshold has to be chosen, and this is where the stakes are.

At `z ≥ 4`, roughly **32 per million** human-written documents will be flagged by chance. That sounds small. Across a million submissions it is 32 people accused of something they did not do.

Tightening to `z ≥ 5` cuts that to about 0.29 per million, and raises the text needed from 64 tokens to 100 at full strength. That is usually the right trade — the extra text is cheap, and a wrong accusation is not.

Which also settles what the tool is for. A statistical test on a single short document is not evidence about a person. It is a signal, best used where the consequence of a flag is a second look rather than a verdict.

## Why this is not an AI-text detector

The distinction matters and is routinely lost.

An **AI-text detector** guesses from style — perplexity, sentence uniformity, word choice. It has no secret and no ground truth, so it is wrong in both directions, and it is systematically unfair to anyone whose natural writing happens to be plain and regular.

A **watermark detector** is checking for a signal that was deliberately inserted and that it holds the key to. It is not a judgement about style; it is a measurement with a computable false-positive rate.

The corollary is that it only works on text from a model that watermarked it, with a key you have. It says nothing about output from any other model, which is the practical limit on the whole idea: a watermark is provenance for one vendor's output, not a test for machine writing in general.

## Why quality survives

The boost is applied among tokens that were all already acceptable. When a green token is a good fit, it wins slightly more often than it would have; when it is not, the red token still wins.

So the visible effect is a mild narrowing of variety rather than a degradation of sense. Push the boost hard enough and it does become noticeable — very strong watermarks read oddly — which is the trade: detection strength against naturalness, measured by the same green rate that sets the detection length.

## What to take away

Watermarking works, and one number describes it: the green rate.

That number sets how much text you need — 64 tokens at 75%, 1,600 at 55% — and it is what an attacker moves by rewriting. Nothing about the scheme is broken by editing; the signal is simply diluted until the length required exceeds the text available. And the threshold you set on the test is a decision about how many innocent documents you are willing to flag.
