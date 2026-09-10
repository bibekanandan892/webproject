---
title: "Knowledge Distillation"
date: "2026-09-11T13:00"
category: "AI"
tags: ["knowledge-distillation", "training", "softmax", "temperature", "model-compression"]
summary: "A trained model knows more than the answer it gives — it knows how close the wrong answers were. Distillation trains a small model on that whole distribution instead of the single correct label, which is a far richer target."
draft: false
cover: "/blog/knowledge-distillation.svg"
---

Knowledge distillation trains a small model to copy a large one. The small model is the student, the large one the teacher, and what passes between them is not weights or architecture. It is the teacher's output on each training example.

The point is what "output" means here.

## The target is thin

Train a classifier the ordinary way and the target for each example is the correct class. Nothing else. A document sorter with five categories gets told `contract`, and that is the entire supervision signal for that example — one choice out of five, at most 2.32 bits.

Every training example is one of five answers. Whatever else could have been said about that document is not said.

## The teacher says more

A trained teacher does not output a class. It outputs a score for every class, and turning those into probabilities gives something like:

| | probability |
| --- | --- |
| invoice | 0.941 |
| receipt | 0.042 |
| contract | 0.012 |
| warranty | 0.003 |
| résumé | 0.001 |

The top entry agrees with the label, so on the face of it nothing new has been said. But look at the rest. The teacher rates `receipt` about 3.7 times more likely than `contract`, and `résumé` at basically nothing.

That ordering is a real claim about the world: this document resembles a receipt far more than it resembles a contract. Nobody wrote that down in the training data. The teacher worked it out from millions of examples, and it is sitting in the numbers the hard label throws away.

Training on the full distribution replaces a one-out-of-five choice with four free numbers per example. With a thousand classes the target goes from a 10-bit index to a point in a 999-dimensional space. Each example teaches much more, which is why distillation often needs less data than training the student from scratch.

## Temperature

There is a problem with using those numbers directly. The teacher is confident, so the informative part is crushed into the last few decimal places. Everything below the top class sums to 0.059.

Temperature fixes this. Divide the scores by a constant *T* before the softmax:

| | T = 1 | T = 4 |
| --- | --- | --- |
| invoice | 0.941 | 0.448 |
| receipt | 0.042 | 0.206 |
| contract | 0.012 | 0.149 |
| warranty | 0.003 | 0.110 |
| résumé | 0.001 | 0.086 |
| **entropy** | **0.391 bits** | **2.054 bits** |

At T = 4 the non-top classes hold 55% of the mass instead of 6%. The comparisons the student needs to learn are now large enough to produce a meaningful gradient.

Two things worth noticing. First, temperature does not change the ranking — it never turns a wrong class into the top one. Second, it *compresses* the ratios: `receipt` over `contract` falls from 3.67 to 1.38. Raising the temperature makes the small classes visible but flattens the distinctions between them, which is why sensible values are around 2–5 rather than 50.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Two bar charts of the same five class probabilities, sharp at temperature one and spread out at temperature four." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 9px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE SAME TEACHER, READ AT TWO TEMPERATURES</text>
<text class="b" x="20" y="44">T = 1</text>
<rect x="20" y="54" width="216" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="20" y="84" width="10" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<rect x="20" y="114" width="3" height="26" rx="1.5" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="20" y="144" width="1" height="26" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="l" x="246" y="72">invoice .941</text>
<text class="l" x="246" y="102">receipt .042</text>
<text class="l" x="246" y="132">contract .012</text>
<text class="l" x="246" y="162">rest .004</text>
<text class="b" x="330" y="44">T = 4</text>
<rect x="330" y="54" width="103" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="330" y="84" width="47" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<rect x="330" y="114" width="34" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<rect x="330" y="144" width="45" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="443" y="72">.448</text>
<text class="l" x="443" y="102">.206</text>
<text class="l" x="443" y="132">.149</text>
<text class="l" x="443" y="162">.196</text>
<text class="l" x="20" y="200">the order never changes — only how visible the lower classes are</text>
<text class="l" x="20" y="220">0.391 bits of entropy becomes 2.054 bits</text>
<text class="l" x="20" y="240">that is what the student is asked to reproduce</text>
</svg>
<figcaption>Temperature does not add information. It moves information out of the decimals where a gradient can reach it.</figcaption>
</figure>

## The correction people forget

Softening the teacher also softens the gradient. Flatter targets produce smaller updates, so raising the temperature quietly turns down the learning rate on the distillation term.

The standard fix is to multiply that term by *T²*, which is exactly right when the score differences are small compared with *T*. In practice it over- or under-corrects: with the scores above, moving from T = 1 to T = 4 shrank the gradient by 4.6× rather than the full 16×. The correction is a good default, not an identity — worth knowing if a distillation run mysteriously trains slower after the temperature is raised.

## Both losses at once

The student is trained on two things added together: matching the teacher's softened distribution, and getting the true label right.

Keeping the true label matters because the teacher is not perfect. Where it is wrong, the hard label is the only thing pulling the student back toward correct. Where it is right, the soft distribution supplies everything the label leaves out. The weighting between them is a normal hyperparameter, usually leaning on the soft term.

Note that the student's own output is softened by the same *T* while learning, and then run at T = 1 in production. The temperature is a training-time lens, not part of the deployed model.

## What it buys

Distilled models are routinely 40% smaller and 60% faster while keeping around 97% of the original's accuracy on standard benchmarks. That trade is what makes on-device work possible at all — no network round trip, no per-request cost, no data leaving the device.

## What to take away

The compression is not the interesting part. Any small model is small.

What distillation adds is a much richer target. Instead of learning "this is a contract" five million times, the student learns what the teacher thinks everything *nearly* was — and that is where the structure the teacher discovered actually lives.
