---
title: "Small language models"
date: "2026-09-10T15:40"
category: "AI"
tags: ["slm", "quantisation", "on-device", "inference", "memory"]
summary: "Under about ten billion parameters, a model stops needing a datacentre. What actually decides where it can run is not the parameter count but how many gigabytes it occupies."
draft: false
cover: "/blog/small-language-models.svg"
---

A small language model is the same thing as a large one, with fewer parameters. Usually under about ten billion, often between half a billion and nine.

That number is not the interesting part. What matters is what it implies: a model of that size fits in memory you already own, which changes where it can run, what it costs, and how fast it answers.

## Parameters are not the unit that matters

A parameter count is not a size. Bytes are a size, and how many bytes a parameter takes depends on the precision it is stored in.

| params | fp16 | int8 | int4 |
| --- | --- | --- | --- |
| 0.5B | 1.00 GB | 0.50 GB | 0.25 GB |
| 1B | 2.00 GB | 1.00 GB | 0.50 GB |
| 3B | 6.00 GB | 3.00 GB | 1.50 GB |
| 8B | 16 GB | 8.00 GB | 4.00 GB |
| 70B | 140 GB | 70 GB | 35 GB |

Quantisation — storing weights in fewer bits — is what turns a parameter count into something that fits. A 3B model at full precision needs 6 GB and will not run on a phone. The same model at four bits needs 1.5 GB and will.

Leaving headroom for the KV cache and everything else on the device:

<figure>
<svg viewBox="0 0 580 242" width="580" role="img" aria-label="Bars showing model size in gigabytes at four-bit precision, against dashed lines marking the memory available on a phone, a laptop and a single GPU." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.d{font:600 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">SIZE AT FOUR BITS, AGAINST WHAT DEVICES HAVE</text>
<text class="l" x="70" y="52" text-anchor="end">0.5B</text>
<rect x="80" y="38" width="3" height="18" rx="1" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="v" x="92" y="52">0.25 GB</text>
<text class="l" x="70" y="82" text-anchor="end">1B</text>
<rect x="80" y="68" width="6" height="18" rx="1" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="v" x="95" y="82">0.5 GB</text>
<text class="l" x="70" y="112" text-anchor="end">3B</text>
<rect x="80" y="98" width="18" height="18" rx="1" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="107" y="112">1.5 GB</text>
<text class="l" x="70" y="142" text-anchor="end">8B</text>
<rect x="80" y="128" width="48" height="18" rx="1" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="137" y="142">4 GB</text>
<text class="l" x="70" y="172" text-anchor="end">70B</text>
<rect x="80" y="158" width="420" height="18" rx="1" fill="color-mix(in srgb, var(--primary) 30%, transparent)"/>
<text class="v" x="509" y="172">35 GB</text>
<path d="M116 30 V194" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="4 3"/>
<text class="d" x="119" y="208">phone</text>
<path d="M188 30 V194" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="4 3"/>
<text class="d" x="191" y="208">laptop</text>
<path d="M296 30 V194" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="4 3"/>
<text class="d" x="299" y="208">24 GB GPU</text>
<text class="l" x="20" y="224">dashed lines are usable memory, not total</text>
</svg>
<figcaption>The 70B bar is the same measurement as the others. That is the whole gap.</figcaption>
</figure>

A phone runs up to about 3B. A laptop or a single consumer GPU runs up to about 8B. A 70B model needs a datacentre card even at four bits.

## Why they are fast

Generating a token means reading every weight out of memory. So speed is set by memory bandwidth divided by model size, and that estimate is usually close:

| | 0.5B | 1B | 3B | 8B | 70B |
| --- | --- | --- | --- | --- | --- |
| phone, ~50 GB/s | 200 | 100 | 33 | 13 | 1 |
| laptop, ~100 GB/s | 400 | 200 | 67 | 25 | 3 |
| one GPU, ~900 GB/s | >1000 | >1000 | 600 | 225 | 26 |

Tokens per second, four-bit weights.

A 3B model at four bits is 1.5 GB, and a phone with 50 GB/s of bandwidth can read that about 33 times a second — which is roughly the generation speed people actually measure on phones. The estimate is crude and it is not far off, because reading the weights really is the dominant cost.

The same arithmetic explains the latency difference. A small model starts answering in tens of milliseconds because there is little to read; a large one takes seconds.

## Why small models got good

A 3B model today is not the same thing as a 3B model from a few years ago, and three changes account for most of that.

**Better data.** Training on a filtered, high-quality corpus rather than as much scraped text as possible. With few parameters, what they are spent on matters more.

**Distillation.** Train the small model to reproduce a large model's output distribution rather than just to predict the next token from raw text. The larger model's judgement gets compressed into the smaller one.

**Architectural savings.** Techniques that improve efficiency without adding parameters — sharing keys and values across attention heads, encoding position by rotation rather than a learned table. Every parameter not spent on overhead is available for capability.

## What is actually lost

The trade is real, and it is worth being precise about which parts get worse.

**Stored facts.** Parameters are where knowledge lives, and there are far fewer of them. A small model is thinner on anything obscure, and it does not signal the difference between recall and invention.

**Multi-step reasoning.** Long chains of arithmetic or logic degrade first. It will often produce a confident, well-formed, wrong answer.

**Using long context.** Supporting 128K tokens and *using* 128K tokens are different claims. Small models usually support long windows and get worse at finding things buried in them.

**Prompt sensitivity.** Rephrasing a prompt shifts the answer more than it would with a large model. This is the failure that surprises people in production, because it looks like randomness.

## What they are good at

Narrow, well-defined work — classification, extraction, formatting, deciding which tool to call. Tasks with a small output space and a clear right answer, where breadth of world knowledge is irrelevant.

High volume, where the price difference stops being abstract. And anything with a latency budget under a couple of hundred milliseconds.

And anything that cannot leave the device. A model running locally sends nothing anywhere, which for medical, financial, or confidential material is not an optimisation but the requirement.

Fine-tuning is also within reach: adapting a 3B model on a single consumer GPU is a matter of hours, and a 3B model fine-tuned on ten thousand examples of your specific task will usually beat a much larger general model at that task.

## The short version

- Small means under roughly ten billion parameters.
- Bytes, not parameters, decide where a model runs — and quantisation is what converts one into the other.
- At four bits: 3B fits a phone, 8B fits a laptop, 70B still needs a datacentre GPU.
- Speed is memory bandwidth divided by model size, and that estimate lands close to reality.
- Better data, distillation from larger models, and cheaper architecture are why small models improved.
- What degrades: stored facts, multi-step reasoning, long-context use, and stability under rephrasing.
- Best for narrow tasks, high volume, tight latency, and anything that must stay on the device.
