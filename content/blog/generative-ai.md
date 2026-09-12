---
title: "Generative AI"
date: "2026-09-12T01:20"
category: "AI"
tags: ["generative-ai", "llm", "autoregression", "sampling", "hallucination"]
summary: "A classifier picks one of a handful of labels. A generator picks one of 10^470 possible answers, which is why it cannot work by choosing from a list — and why its characteristic failure is being fluent and wrong."
draft: false
cover: "/blog/generative-ai.svg"
---

The AI that came before this one *labelled* things. Is this email spam. Is this review positive. What object is in this photograph. Input goes in, one of a fixed set of answers comes out.

Generative AI produces content — text, images, audio, code. The difference sounds like a difference of ambition. It is a difference of arithmetic.

## The size of the answer

A spam filter chooses between two outputs. An image classifier with a thousand labels chooses between a thousand.

A model writing a hundred-token answer from a vocabulary of fifty thousand tokens is choosing between **50,000¹⁰⁰**, which is about 10⁴⁷⁰.

| | possible outputs |
| --- | --- |
| spam or not | 2 |
| 1,000-label image classifier | 1,000 |
| a 100-token answer | ~10⁴⁷⁰ |

There are roughly 10⁸⁰ atoms in the observable universe. The space of hundred-token answers is 10³⁹⁰ times larger than that.

Three consequences follow immediately, and they explain nearly everything about how these systems behave.

**It cannot work by choosing from a list.** No training set contains examples of every output, because there is no list to draw them from. The model has to *compose* an answer from smaller pieces it understands how to combine — which is why a model can produce a sentence no one has ever written.

**It cannot be evaluated by accuracy.** A classifier is right or wrong against a known label. There is no single correct hundred-token answer to compare against, so "accuracy" is not defined, and evaluating generation means judging quality — a much harder and more subjective task.

**It has to be built one step at a time.** Which is exactly what it does.

<figure>
<svg viewBox="0 0 560 286" width="560" role="img" aria-label="A comparison of output space sizes on a logarithmic scale, from two options for a classifier up to ten to the four hundred and seventieth for a short answer." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">HOW MANY THINGS COULD COME OUT</text>
<text class="l" x="20" y="44">spam or not — 2</text>
<rect x="20" y="52" width="1" height="18" fill="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="20" y="90">1,000 image labels — 10³</text>
<rect x="20" y="98" width="3" height="18" fill="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="20" y="136">atoms in the observable universe — 10⁸⁰</text>
<rect x="20" y="144" width="85" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 48%, transparent)"/>
<text class="b" x="20" y="182">a 100-token answer — 10⁴⁷⁰</text>
<rect x="20" y="190" width="500" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 34%, transparent)" stroke="var(--primary)" stroke-opacity="0.65"/>
<text class="l" x="20" y="226">log scale — each 1.06 px is a tenfold increase</text>
<path d="M20 242 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="264">too many to enumerate, so it has to be composed a token at a time</text>
</svg>
<figcaption>The classifier's whole output space is invisible at this scale, which is the point.</figcaption>
</figure>

## One token at a time

Given "the sky is", the model produces a probability for every one of the fifty thousand tokens it knows. One is chosen. Now the input is "the sky is blue" and it does it again.

That is the entire generation process. A hundred choices of one-in-fifty-thousand, each made with everything already written in view.

So the enormous answer space is never enumerated — it is *walked*. The model never compares 10⁴⁷⁰ candidates; it makes a hundred small decisions, and the combination is what produces something new.

Two details worth knowing because they explain visible behaviour:

**The model outputs a distribution, not a word.** At each step there is a ranked set of plausible continuations with probabilities attached.

**Generation samples from that distribution.** Which is why the same question asked twice gives different answers. Always taking the highest-probability token instead produces the same answer every time — useful when you want reproducibility, and noticeably flatter prose, because the most probable next word is usually the most predictable one.

## How it learns

The training task is unglamorous: take real text, hide what comes next, predict it, adjust when wrong. Repeat across an enormous amount of text.

Nothing in that says "learn grammar" or "learn that Paris is in France". Both are learned anyway, because predicting the next word well *requires* them. Grammar constrains what can follow; facts determine which continuation is right. The capability is a side effect of being good at the prediction task.

The same applies to images and audio with a different objective — typically learning to reverse a process that gradually destroys the data, so that running it backwards produces something new. Different mechanism, same shape: learn the structure of the domain by having to reproduce it.

## Why it invents things

This is the part to be clear-eyed about, and it follows from the output space.

The model is choosing continuations by plausibility within the sequence. A sentence that is fluent and false scores exactly as well as one that is fluent and true, because fluency is what the objective measured. There is no separate step where it checks.

So a made-up citation looks like a real one. A confident wrong number is formatted like a right one. The failure mode is not noise — it is well-formed, appropriately-worded, and wrong, which is the hardest kind of error to notice.

The other limits have the same origin. It inherits the associations of its training text, because that is where the patterns came from. It does not know what it does not know, because "I am uncertain" would have to be a learned continuation rather than a genuine measurement. And it responds to how a request is phrased, because phrasing is part of the sequence it is continuing.

## What to take away

The step from labelling to generating is a step from choosing among a few options to constructing one of astronomically many.

That is what makes it powerful: the output was never on a list, so it can be genuinely new. It is also what makes it unreliable in a specific way — a plausible answer and a correct answer are the same shape, and only one of them was what the model was optimised to produce. Which is why the output is a draft, and checking it is the part you keep.
