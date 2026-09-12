---
title: "Fine-tuning"
date: "2026-09-11T23:20"
category: "AI"
tags: ["fine-tuning", "lora", "training", "prompting", "cost"]
summary: "Fine-tuning is good at changing how a model behaves and bad at teaching it facts. It also has a break-even point — about 6,750 requests in one worked case, and ten times that if the prompt it replaces was being cached."
draft: false
cover: "/blog/fine-tuning.svg"
---

Fine-tuning continues training a finished model on examples of your own. Same mechanism as the original training, far less of it, and aimed at one narrow thing.

The mechanics are simple. The interesting questions are what it is actually good for, and when it is worth doing at all.

## The mechanism, at one weight

Strip a model down to a single weight `w` making a prediction `w × x`.

Start at `w = 0.6`, with input 5 and the correct answer 4. The prediction is 3.0 — too low. The squared error tells you how to change `w`: its derivative is `2(prediction − target) × x`, which here is −10, so `w` should go up. With a learning rate of 0.01 it moves by 0.1.

Repeating:

```
3.000 → 3.500 → 3.750 → 3.875 → 3.938 → 3.969
```

After six steps `w` is 0.7969 against an exact answer of 0.8. That is the whole of training: measure the error, compute which direction each weight should move, take a small step, repeat.

A real model does this for billions of weights over millions of examples. Nothing about the idea changes — only the bookkeeping.

## What it is good at

Fine-tuning reliably changes **form**: the shape, tone, register and structure of output.

Teach a model that responses in your domain are three sentences and a bulleted list, or that a particular JSON shape is always correct, or that the house style avoids hedging, and it learns that from a few hundred examples. Behaviour is exactly what gradient descent on examples transfers.

What it is bad at is **facts**.

A fact absorbed into weights has no citation, no update path and no way to be corrected short of retraining. Prices change, policies change, a product gets renamed — and the model goes on asserting the version it was trained on, fluently and without any signal that it is out of date. Worse, it has no mechanism for saying "I do not know", because the fact is now indistinguishable from everything else it learned.

So the division is sharp: **fine-tune for form, retrieve for facts.** A fact in the prompt can be cited, replaced, and dated. A fact in the weights can only be overwritten.

## The break-even

Fine-tuning's practical appeal is that it removes tokens from every request. A long instruction block teaching the model your format becomes unnecessary once the format is in the weights.

That is a real saving with a real up-front cost:

| | token-equivalents |
| --- | --- |
| training — 3,000 examples × 600 tokens × 3 epochs, ×3 for the backward pass | 16,200,000 |
| saved per request, by dropping a 2,400-token instruction block | 2,400 |
| **break-even** | **6,750 requests** |

| volume | net |
| --- | --- |
| 1,000 requests | 13.8 M spent |
| 10,000 requests | 7.8 M saved |
| 100,000 requests | 223.8 M saved |

Which sounds like a straightforward call at any real volume — until you account for the alternative.

If that instruction block is a stable prefix, prompt caching already makes re-sending it cost roughly a tenth as much. The per-request saving drops from 2,400 to about 240 tokens, and **break-even moves to 67,500 requests.**

<figure>
<svg viewBox="0 0 560 280" width="560" role="img" aria-label="Two break-even lines for fine-tuning against request volume, one assuming the replaced prompt is re-sent in full and one assuming it is cached." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHEN FINE-TUNING STARTS PAYING</text>
<path d="M60 40 V150 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<path d="M60 95 H520" stroke="var(--muted-foreground)" stroke-opacity="0.45" stroke-dasharray="5 4"/>
<text class="l" x="524" y="98">0</text>
<text class="l" x="20" y="46">saved</text>
<text class="l" x="20" y="148">spent</text>
<path d="M60 143 L106 95 L520 44" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="106" cy="95" r="4.4" fill="var(--primary)"/>
<text class="b" x="114" y="86">6,750 — prompt re-sent in full</text>
<path d="M60 143 L520 95" stroke="color-mix(in srgb, var(--muted-foreground) 75%, transparent)" stroke-width="2.2" fill="none"/>
<circle cx="520" cy="95" r="4" fill="var(--muted-foreground)"/>
<text class="l" x="300" y="126">67,500 — prompt cached</text>
<text class="l" x="60" y="168">0</text>
<text class="l" x="520" y="168" text-anchor="end">67,500 requests</text>
<path d="M20 188 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="212">a cacheable prompt is already 90% cheaper to re-send</text>
<text class="l" x="20" y="234">so caching moves the break-even out by 10×</text>
<text class="l" x="20" y="258">and it can be changed this afternoon, which weights cannot</text>
</svg>
<figcaption>Compare fine-tuning against a cached prompt, not against an uncached one.</figcaption>
</figure>

That is the comparison people skip, and it changes the answer for most applications. Not because fine-tuning is bad, but because the thing it is being compared against is cheaper than it looks — and far easier to change.

## Full, or a small adapter

Updating every weight requires holding gradients and optimizer state for all of them, which is several times the memory of the model itself and usually out of reach.

The alternative trains a small set of added weights and leaves the original untouched. Far less memory, far faster, and the adapter is a small file you can swap, version, or keep several of for different tasks. It is the default for good reasons, and the full version is worth its cost only when the adaptation is large enough that a small correction cannot express it.

## Where it goes wrong

**Narrow data narrows the model.** Train hard on one format and general capability degrades — not visibly on your evaluation set, which is drawn from the same narrow distribution, but on everything else. The defence is to mix in general examples and to evaluate on tasks the fine-tune was *not* about.

**Bad examples are learned faithfully.** Gradient descent has no notion of a mistake in the training data. A hundred examples containing a formatting inconsistency teach that inconsistency. Data quality dominates data quantity here to an extent that surprises people: a few hundred carefully checked examples routinely beat several thousand scraped ones.

**Evaluation has to exist first.** Without a held-out set and a measure, there is no way to know whether the fine-tune helped. "It seems better" is how a model that regressed on everything except the demo gets shipped.

## What to take away

Try the prompt first, with caching, and measure it. That is nearly free and reversible in an afternoon.

Reach for fine-tuning when the behaviour you want cannot be described in a prompt at all, or when the volume clears a break-even you have actually calculated against the cached alternative. And whichever you use, keep the facts outside the weights — form belongs in training, and truth belongs somewhere it can be updated.
