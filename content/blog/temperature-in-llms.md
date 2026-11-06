---
title: "Temperature in LLMs"
date: "2026-08-11T15:45"
category: "AI"
tags: ["sampling", "temperature", "softmax", "decoding", "llm"]
summary: "Temperature divides the logits before the softmax. On the same four candidates, T = 0.2 gives the wrong answer a 0.0% chance and T = 1.5 gives it 5.2% — which across 100 users means nobody sees it, or 99.5% of the time somebody does."
draft: false
cover: "/blog/temperature-in-llms.svg"
---

At every step a language model produces a score — a logit — for every token in its vocabulary. A softmax turns the scores into probabilities, and one token is drawn from them.

Temperature is a single number applied in between. The logits are divided by it before the softmax:

`p(token) = softmax(logit / T)`

That is all it does. Everything people describe as "creativity" or "randomness" is the consequence of that one division.

## What the division does

Dividing by a number below 1 pushes the scores apart. Dividing by a number above 1 pulls them together. Since the softmax is exponential, small changes in the gaps become large changes in the probabilities.

Take the prompt *"The capital of France is"* and suppose the four top candidates score:

| token | logit |
| --- | --- |
| Paris | 4.0 |
| the | 3.0 |
| a | 2.0 |
| Lyon | 0.5 |

"the" and "a" are harmless — they lead to "the city of Paris" or "a city called Paris". "Lyon" is wrong.

| temperature | Paris | the | a | Lyon | entropy |
| --- | --- | --- | --- | --- | --- |
| 0.2 | **99.3%** | 0.7% | 0.0% | 0.0% | 0.06 bits |
| 0.7 | 76.7% | 18.4% | 4.4% | 0.5% | 0.98 bits |
| 1.0 | 65.2% | 24.0% | 8.8% | 2.0% | 1.32 bits |
| 1.5 | 53.4% | 27.4% | 14.1% | **5.2%** | 1.61 bits |

At 1.0 the model's own distribution is used unchanged. At 0.2 it is almost deterministic: the top token takes 99.3%. At 1.5 the distribution is flattened enough that the wrong answer gets one draw in twenty.

As *T* approaches 0 the top token's share approaches 100% and sampling becomes greedy decoding — always take the highest logit. That is why "temperature 0" is the usual setting for reproducible output, although in practice tiny numerical differences on the hardware can still occasionally flip a near-tie.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="Four bar groups showing the probability of Paris, the, a and Lyon at temperatures 0.2, 0.7, 1.0 and 1.5; the distribution flattens as temperature rises." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME LOGITS, FOUR TEMPERATURES</text>
<path d="M30 170 H540" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<g fill="var(--primary)" fill-opacity="0.8">
<rect x="40" y="51" width="22" height="119"/><rect x="170" y="78" width="22" height="92"/><rect x="300" y="92" width="22" height="78"/><rect x="430" y="106" width="22" height="64"/>
</g>
<g fill="var(--muted-foreground)" fill-opacity="0.5">
<rect x="64" y="169" width="22" height="1"/><rect x="194" y="148" width="22" height="22"/><rect x="324" y="141" width="22" height="29"/><rect x="454" y="137" width="22" height="33"/>
<rect x="88" y="170" width="22" height="0"/><rect x="218" y="165" width="22" height="5"/><rect x="348" y="159" width="22" height="11"/><rect x="478" y="153" width="22" height="17"/>
</g>
<g fill="none" stroke="var(--primary)" stroke-width="1.6">
<rect x="112" y="169" width="22" height="1"/><rect x="242" y="169" width="22" height="1"/><rect x="372" y="168" width="22" height="2"/><rect x="502" y="164" width="22" height="6"/>
</g>
<text class="l" x="88" y="190" text-anchor="middle">T = 0.2</text><text class="l" x="218" y="190" text-anchor="middle">T = 0.7</text><text class="l" x="348" y="190" text-anchor="middle">T = 1.0</text><text class="l" x="478" y="190" text-anchor="middle">T = 1.5</text>
<text class="b" x="51" y="45" text-anchor="middle">99%</text><text class="b" x="441" y="100" text-anchor="middle">53%</text>
<text class="l" x="513" y="158" text-anchor="middle">5.2%</text>
<path d="M20 210 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="232">bars: Paris · the · a · Lyon (outlined — the wrong answer)</text>
<text class="l" x="20" y="252">dividing by T scales every gap between logits, and softmax exponentiates the gaps</text>
</svg>
<figcaption>Raising the temperature does not add new options; it gives the existing weak ones more of the share.</figcaption>
</figure>

## The number that matters: at scale

5.2% sounds small. But a deployed model answers the same kind of question many times. The chance that "Lyon" appears at least once across 100 requests is `1 − (1 − p)^100`:

| temperature | P(Lyon) per request | at least once in 100 requests |
| --- | --- | --- |
| 0.2 | ~0.0% | 0.0% |
| 0.7 | 0.5% | **40.4%** |
| 1.0 | 2.0% | 86.3% |
| 1.5 | 5.2% | **99.5%** |

At the model's default temperature, a hundred users asking a factual question almost certainly produces at least one wrong answer — not because the model does not know, but because the sampler was told to sometimes pick a token the model considered unlikely.

And this is one token. A long answer makes hundreds of such draws. A low-probability token early on changes the context for every token after it, so the effect compounds over the length of the reply.

## Choosing a temperature

**Facts, extraction, classification, code: low.** 0 to 0.3. There is one right answer, the model's top choice is usually it, and variation is a defect.

**Writing, brainstorming, dialogue: moderate.** 0.7 to 1.0. Here the top token is often bland — the most predictable word — and sampling from the rest produces more natural, varied text. Ten drafts that are all identical are useless.

**Above 1.0: rarely.** The tail of the distribution is mostly tokens the model rated low for good reason. Text degrades into non sequiturs quickly.

**Sampling several answers to pick from:** a higher temperature on purpose, because the point is to get answers that differ. Self-consistency — sampling many reasoning paths and taking the majority answer — relies on this.

Temperature is usually combined with top-k or top-p, which cut off the long tail entirely before sampling. That pairing makes moderate temperatures safer: the distribution is flattened only among tokens that were plausible to begin with.

## What to take away

Temperature divides the logits before the softmax. Below 1 it sharpens the distribution toward the top token; above 1 it flattens it toward the tail; at 0 it becomes greedy decoding.

The effect is easy to underestimate per token and hard to miss at scale: on the same four candidates, raising *T* from 0.2 to 1.5 takes the chance that a hundred users see the wrong answer at least once from zero to 99.5%. Match the temperature to whether the task has one right answer or many.
