---
title: "Chain-of-Thought Prompting"
date: "2026-09-11T20:40"
category: "AI"
tags: ["chain-of-thought", "prompting", "reasoning", "llm", "inference"]
summary: "A model has no scratchpad except the tokens it has already written, and each token gets one fixed pass through the network. Asking for the steps is asking for more computation — sixty tokens of working is sixty times as much."
draft: false
cover: "/blog/chain-of-thought-prompting.svg"
---

Chain-of-thought prompting is asking the model to write out its reasoning before the answer, rather than producing the answer directly.

It works, and the reason it works is more mechanical than "thinking helps".

## Where the computation happens

A model produces one token per forward pass through its layers. For a 32-layer model, that is 32 layers of processing — no more, whatever the question.

There is no hidden workspace. Nothing persists between tokens except the tokens themselves. So if a problem needs four intermediate quantities and the model is asked for the final number immediately, all four have to be resolved inside a single pass.

Ask for the working instead and the picture changes completely:

| tokens of working | layer passes applied to the question |
| --- | --- |
| 1 | 32 |
| 20 | 640 |
| 60 | 1,920 |
| 200 | 6,400 |

Sixty tokens of reasoning is **60× more computation** spent on the same question. And it is not merely more — each new token can attend to every intermediate result already written, so step three is computed with steps one and two available as input rather than having to rederive them.

The written steps are the scratchpad. That is the whole mechanism.

<figure>
<svg viewBox="0 0 560 290" width="560" role="img" aria-label="One token of output getting a single pass through the layers, compared with a sequence of reasoning tokens each getting its own pass and attending to the previous ones." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EVERY TOKEN IS ANOTHER PASS THROUGH THE MODEL</text>
<text class="l" x="20" y="44">answer straight away</text>
<g fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)">
<rect x="20" y="54" width="30" height="7"/><rect x="20" y="64" width="30" height="7"/><rect x="20" y="74" width="30" height="7"/><rect x="20" y="84" width="30" height="7"/><rect x="20" y="94" width="30" height="7"/>
</g>
<text class="l" x="60" y="80">32 layers, once</text>
<rect x="176" y="64" width="44" height="30" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="198" y="83" text-anchor="middle">198</text>
<text class="l" x="232" y="83">four quantities, one pass</text>
<path d="M20 118 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="142">write the steps</text>
<g fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="var(--primary)" stroke-opacity="0.5">
<rect x="20" y="152" width="28" height="7"/><rect x="20" y="162" width="28" height="7"/><rect x="20" y="172" width="28" height="7"/><rect x="20" y="182" width="28" height="7"/><rect x="20" y="192" width="28" height="7"/>
<rect x="58" y="152" width="28" height="7"/><rect x="58" y="162" width="28" height="7"/><rect x="58" y="172" width="28" height="7"/><rect x="58" y="182" width="28" height="7"/><rect x="58" y="192" width="28" height="7"/>
<rect x="96" y="152" width="28" height="7"/><rect x="96" y="162" width="28" height="7"/><rect x="96" y="172" width="28" height="7"/><rect x="96" y="182" width="28" height="7"/><rect x="96" y="192" width="28" height="7"/>
<rect x="134" y="152" width="28" height="7"/><rect x="134" y="162" width="28" height="7"/><rect x="134" y="172" width="28" height="7"/><rect x="134" y="182" width="28" height="7"/><rect x="134" y="192" width="28" height="7"/>
<rect x="172" y="152" width="28" height="7"/><rect x="172" y="162" width="28" height="7"/><rect x="172" y="172" width="28" height="7"/><rect x="172" y="182" width="28" height="7"/><rect x="172" y="192" width="28" height="7"/>
<rect x="210" y="152" width="28" height="7"/><rect x="210" y="162" width="28" height="7"/><rect x="210" y="172" width="28" height="7"/><rect x="210" y="182" width="28" height="7"/><rect x="210" y="192" width="28" height="7"/>
</g>
<text class="l" x="252" y="164">… 60 tokens …</text>
<rect x="386" y="167" width="62" height="30" rx="4" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="408" y="186" text-anchor="middle">227.74</text>
<text class="b" x="252" y="192">1,920 layer passes</text>
<text class="l" x="20" y="230">each step can read the ones before it, instead of rederiving them</text>
<path d="M20 246 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="268">the tokens are the scratchpad — there is no other one</text>
</svg>
<figcaption>The steps are not an explanation of the answer. They are where the answer is computed.</figcaption>
</figure>

## What it looks like

A problem with a threshold in it:

> A crate weighs 14 kg. Freight is ₹85 for the first 5 kg and ₹12 for each additional kilogram, then 18% tax is added. What is the total?

Asked for the number alone, a common failure is to multiply all 14 kg at the per-kilogram rate — 14 × 12 = 168, then ₹198.24 — which is wrong because the first five kilograms are covered by the base charge. The error is a single missed condition, and there was nowhere to notice it.

With the steps written:

```
weight above the base       14 − 5 = 9 kg
extra charge                9 × 12 = ₹108
subtotal                    85 + 108 = ₹193
tax                         193 × 0.18 = ₹34.74
total                       ₹227.74
```

The threshold is handled in step one, where it is visible, and every later step reads a number that is already on the page.

## Two ways to ask

**Zero-shot** is a single instruction — "work through it step by step before answering" — and costs nothing. It is the first thing to try.

**Few-shot** shows two or three worked examples in the format you want. It costs prompt tokens on every request but buys control over the *shape* of the reasoning: which intermediate quantities appear, in what order, with what units. Where the steps need to be machine-readable, or where the model keeps skipping a check you care about, the examples are how you specify it.

## Where it makes things worse

**Tasks with nothing to decompose.** Classifying tone, judging whether text is on-topic, picking one of four labels — these are single judgements. Asking for reasoning gives the model room to construct an argument away from a correct first instinct, and accuracy falls.

**Long chains.** Every step must be right for the conclusion to be right. At 96% per step, three steps is 88.5% and eight is 72.1% — and a wrong intermediate is worse than no intermediate, because it is now in the context and everything after conditions on it. The model will not revisit it; it will build on it.

**Explanations that are not the reasoning.** If a model settles on an answer and then produces steps, the steps are a justification rather than a derivation. They will look sound and will not be what produced the answer, which makes them misleading precisely where you wanted transparency.

## What to take away

Chain of thought is not a trick for making a model more careful. It is a way of giving it somewhere to put intermediate results, and more forward passes in which to compute them.

Which tells you where it belongs: problems with genuine intermediate quantities, few enough steps that they can all be right, and where the working is worth its latency. Not on single judgements, and not as a substitute for checking whether the steps actually say anything.
