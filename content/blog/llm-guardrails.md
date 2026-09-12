---
title: "LLM Guardrails"
date: "2026-09-12T02:20"
category: "AI"
tags: ["guardrails", "safety", "false-positives", "moderation", "llm"]
summary: "A guardrail catching 90% of harmful requests with a 1% false-positive rate blocks 1,267 requests a day, of which 997 are legitimate. The visible effect of most guardrails is refusing real users."
draft: false
cover: "/blog/llm-guardrails.svg"
---

A guardrail is a check around a model, not inside it. Something looks at the request before the model sees it, or at the response before the user does, and decides whether to let it through.

That placement is the important part. The model has no idea a guardrail exists; it cannot be argued out of one, and it cannot be relied on to enforce one.

## Where they sit and what they check

Two checkpoints. **Input** guardrails inspect the incoming request. **Output** guardrails inspect the generated response.

Both are needed and they catch different things. An input check can stop a request that should never be processed. An output check catches the case where the request looked fine and the response did not — a leaked internal note, a phone number, a claim about pricing you do not want made.

The categories in practice:

- **Topic** — is this within what the product is for
- **Safety** — harmful content, either direction
- **Privacy** — personal data in the request or the response
- **Format** — does the output match the required shape
- **Grounding** — is the response supported by the retrieved source

The implementations range from trivial to expensive. A regular expression masking anything that looks like a ten-digit number costs microseconds. A separate small model classifying a request as safe or unsafe costs a model call. Both are guardrails; they differ by what they can recognise and what they cost.

## The number that decides whether users tolerate it

Here is the arithmetic that gets skipped, and it is the reason guardrails get ripped out.

Take 100,000 requests a day of which 0.3% are genuinely harmful — 300 of them. A guardrail catching 90% with a 1% false-positive rate:

| | |
| --- | --- |
| requests blocked | 1,267 |
| genuinely harmful | 270 |
| legitimate | **997** |
| share of blocks that are mistakes | **78.7%** |

Nearly four out of five blocked requests are real users being refused. Not because the guardrail is bad — 90% recall at 1% false positives is a decent classifier. Because harmful requests are **rare**, so 1% of the enormous legitimate majority outnumbers 90% of the tiny harmful minority.

Tightening it:

| catch rate | false-positive rate | blocked | share that are mistakes |
| --- | --- | --- | --- |
| 90% | 2.0% | 2,264 | 88.1% |
| 90% | 1.0% | 1,267 | 78.7% |
| 90% | 0.3% | 569 | 52.6% |
| 90% | 0.1% | 370 | **27.0%** |

The false-positive rate has to fall to roughly a third of the base rate before most blocks are correct. Which means **the metric to optimise is the false-positive rate, not the catch rate** — and a guardrail shipped without measuring it will generate a steady stream of complaints from people who did nothing wrong.

<figure>
<svg viewBox="0 0 560 290" width="560" role="img" aria-label="Stacked bars of blocked requests at four false-positive rates, showing the legitimate portion shrinking while the harmful portion stays the same size." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHO IS ACTUALLY BEING BLOCKED</text>
<text class="l" x="20" y="44">fpr 2.0%</text>
<rect x="86" y="32" width="52" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="138" y="32" width="382" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="l" x="528" y="44" text-anchor="end">88.1%</text>
<text class="l" x="20" y="80">fpr 1.0%</text>
<rect x="86" y="68" width="52" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="138" y="68" width="191" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="l" x="337" y="80">78.7% of blocks are mistakes</text>
<text class="l" x="20" y="116">fpr 0.3%</text>
<rect x="86" y="104" width="52" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="138" y="104" width="57" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="l" x="203" y="116">52.6%</text>
<text class="l" x="20" y="152">fpr 0.1%</text>
<rect x="86" y="140" width="52" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="138" y="140" width="19" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="b" x="165" y="152">27.0%</text>
<text class="b" x="86" y="180">shaded = the 270 harmful requests, the same in every row</text>
<path d="M20 200 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="224">the catch rate is 90% in all four — only the false-positive rate changed</text>
<text class="b" x="20" y="246">most blocks are correct only once the fpr is below a third of the base rate</text>
<text class="l" x="20" y="268">so the false-positive rate is the number to optimise</text>
</svg>
<figcaption>The harmful requests are the small block on the left in every row. Everything else is someone who did nothing wrong.</figcaption>
</figure>

## Why layering helps less than claimed

The standard advice is to stack guardrails. Two at 90% each should let only 1% through, since 0.10 × 0.10 = 0.01.

That holds only if their mistakes are independent, and they usually are not — both are models, often trained on similar data, failing on similar phrasings.

| share of misses that are common to both | combined miss rate |
| --- | --- |
| 0% (independent) | 1.00% |
| 30% | 3.70% |
| 50% | 5.50% |
| 80% | 8.20% |

At 50% correlation, two layers let through 5.5% rather than 1% — five and a half times the claimed figure, and barely twice as good as one layer.

The implication is not "don't layer". It is to layer *different kinds* of check: a regular expression and a classifier fail differently; two classifiers fail together. Independence is what you are buying, and it comes from mechanism diversity rather than from count.

## The latency you are adding

A guard model on the input and another on the output, at 120 ms each, adds 240 ms to a 900 ms request — **27% slower**. Two layers on each side make it 53%.

Which is a real product cost, and it argues for a shape: cheap deterministic checks always, expensive model-based checks only where the cheap ones are insufficient or the consequences justify it.

## What guardrails cannot do

They are classifiers, so they have a false-negative rate and an attempt count. A determined user rephrases until something passes; nothing here prevents that.

So guardrails belong in a system that does not depend on them. The load-bearing protections are the ones that cannot be talked around: limits enforced in code, tools the model simply does not have, human approval on irreversible actions. Guardrails reduce volume and catch the accidental cases. They are not the thing standing between you and the worst outcome.

## What to take away

Two numbers, neither of which is the catch rate.

The **false-positive rate**, because harmful requests are rare and everything else is your users. And the **correlation between your layers**, because stacking similar checks buys much less than multiplying their individual rates suggests.

Log every block, review a sample weekly, and treat a rising complaint rate as the signal it is. A guardrail nobody notices is working; one that generates support tickets is refusing the wrong people.
