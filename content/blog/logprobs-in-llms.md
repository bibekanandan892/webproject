---
title: "Log probabilities (logprobs) in LLMs"
date: "2026-11-06T19:10"
category: "AI"
tags: ["logprobs", "llm", "uncertainty", "perplexity", "classification"]
summary: "Logprobs are the model's own probability for each token it wrote, on a log scale. Four tokens at 0.9, 0.6, 0.95 and 0.05 sum to −3.663 — a sequence probability of 2.6% — and the single −2.996 is where to look for a guess. They turn a fluent answer back into a measure of how sure the model was."
draft: false
cover: "/blog/logprobs-in-llms.svg"
---

When a language model writes a token, it first computes a probability for every token in its vocabulary, then picks one. The text you see keeps only the choice. **Log probabilities** — logprobs — keep the number: how likely the model considered each token it produced, and optionally the alternatives it considered.

Many APIs return them on request. They are one of the most useful and least used diagnostics a model offers.

## Why logs?

Probabilities of whole sequences are products of per-token probabilities, and products of many numbers below 1 underflow quickly — a 500-token answer's probability can be smaller than any float can represent. Logs turn products into sums, which stay well behaved:

`log P(sequence) = Σ log P(token)`

A logprob is always 0 or negative. 0 means certainty (probability 1). −0.1 is about 90%. −0.69 is 50%. −2.3 is 10%. −4.6 is 1%. More negative means less likely.

## A worked example

Suppose a model writes four tokens with these probabilities:

| token | probability | logprob (natural log) |
| --- | --- | --- |
| "The" | 0.90 | −0.105 |
| " meeting" | 0.60 | −0.511 |
| " is" | 0.95 | −0.051 |
| " Thursday" | **0.05** | **−2.996** |
| **sequence** | **0.0257** | **−3.663** |

The total logprob is −3.663, so the model assigned this exact sequence a probability of about 2.6%.

More useful than the total is the shape. Three tokens are confident; one is not. The model was sure it was writing "The meeting is" and had only a 5% belief in "Thursday". If that day came from nowhere in the context, this is precisely where a hallucination would be. The text reads equally confidently throughout; the logprobs do not.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Four tokens with bars showing their logprobs: three short bars near zero and one long bar at -2.996 for the token Thursday." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE TEXT IS EVEN; THE CONFIDENCE ISN'T</text>
<path d="M60 40 H520" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<text class="l" x="56" y="44" text-anchor="end">0</text>
<g fill="var(--muted-foreground)" fill-opacity="0.55">
<rect x="80" y="40" width="70" height="5"/><rect x="190" y="40" width="70" height="20"/><rect x="300" y="40" width="70" height="2"/>
</g>
<rect x="410" y="40" width="70" height="118" fill="var(--primary)" fill-opacity="0.8"/>
<text class="l" x="115" y="60" text-anchor="middle">−0.105</text><text class="l" x="225" y="74" text-anchor="middle">−0.511</text><text class="l" x="335" y="58" text-anchor="middle">−0.051</text>
<text class="b" x="445" y="172" text-anchor="middle">−2.996</text>
<text class="l" x="115" y="196" text-anchor="middle">The</text><text class="l" x="225" y="196" text-anchor="middle">meeting</text><text class="l" x="335" y="196" text-anchor="middle">is</text><text class="b" x="445" y="196" text-anchor="middle">Thursday</text>
<text class="l" x="115" y="210" text-anchor="middle">90%</text><text class="l" x="225" y="210" text-anchor="middle">60%</text><text class="l" x="335" y="210" text-anchor="middle">95%</text><text class="b" x="445" y="210" text-anchor="middle">5%</text>
<path d="M20 222 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="242">sum −3.663 → sequence probability 2.6% · perplexity 2.50</text>
</svg>
<figcaption>Bars hang down from 0 (certainty). The one long bar is the token worth checking.</figcaption>
</figure>

## Perplexity

Averaging logprobs over a sequence and exponentiating the negative gives **perplexity**:

`perplexity = exp(−mean logprob)`

For the example, `exp(3.663 / 4) =` **2.50**. Read it as the effective number of equally likely choices the model was making at each step. A perplexity of 1 means total certainty; 2.5 means, on average, the model was choosing among two or three plausible tokens. Perplexity is the standard intrinsic measure of how well a language model fits a body of text: lower is better.

## What logprobs are good for

**Confidence for classification.** Ask a yes/no question and read the logprobs of "yes" and "no" rather than the text. If P(yes) = 0.82 and P(no) = 0.15, the normalised confidence is `0.82 / (0.82 + 0.15) = 0.845`. That is a usable score — thresholds, ranking, routing low-confidence cases to a human — instead of a binary string.

**Flagging likely hallucinations.** Low-probability tokens inside names, numbers, dates and citations are where invented details tend to appear. Highlighting them, or checking them against a source, catches a large share of errors cheaply.

**Ranking and choosing.** Score several candidate answers, or several retrieved passages, by the logprob the model assigns to them. Normalise by length, or long candidates lose by default.

**Evaluation.** Multiple-choice benchmarks are often scored by which option has the highest logprob, avoiding the need to parse generated text.

**Detecting surprise.** Text with unusually low logprobs under a model is unusual to it: useful for spotting out-of-distribution inputs, data quality problems, or text that the model did not itself write.

## Caveats

- **Logprobs are not calibrated by default.** Instruction-tuned and preference-tuned models are often overconfident; a 0.95 token is not right 95% of the time. Calibrate on labelled data before treating them as probabilities.
- **They reflect the sampling settings only partly.** APIs typically report the model's raw distribution, before temperature or top-p filtering changed which token was actually picked.
- **Tokenisation splits meaning.** A name split into three tokens has three logprobs; the uncertainty may sit in the first piece and the rest follow confidently once it is chosen.
- **Not every model or API exposes them**, and reasoning models may expose them only for the final answer.

## What to take away

Logprobs are the log of the probability the model assigned to each token it produced. Summing them gives a sequence's log-probability — −3.663 for four tokens at 0.9, 0.6, 0.95 and 0.05, or 2.6% — and the exponentiated negative mean gives perplexity, 2.50.

Their real value is in showing where the model was unsure: the one token at −2.996 in an otherwise confident sentence. Use them for classification confidence, hallucination flags, ranking and evaluation — after calibrating, because a tuned model's 95% is rarely a true 95%.
