---
title: "Embeddings"
date: "2026-09-12T00:20"
category: "AI"
tags: ["embeddings", "vectors", "cosine-similarity", "dimensions", "meaning"]
summary: "Two numbers can hold two distinguishable concepts. Sixteen can hold twenty-one. That measured curve is the reason real embeddings have hundreds of dimensions, and it is rarely the explanation given."
draft: false
cover: "/blog/embeddings.svg"
---

A computer comparing text compares characters. "How do I reset my password?" and "I forgot my login details" share almost no characters and mean the same thing; "the bank of the river" and "I need to visit the bank" share a word and mean unrelated things.

An embedding replaces the text with a list of numbers, arranged so that closeness in the numbers means closeness in meaning. Comparing meaning becomes arithmetic.

## The toy version, and why it is a toy

Start with two numbers per item — sweetness and size, say. An apple might be [7, 5], a banana [8, 5], a lemon [1, 3]. The apple and banana land near each other without anyone having declared them similar; that relationship is a consequence of the coordinates.

This is the standard explanation and it hides the important question: why do real embeddings use hundreds of numbers rather than two?

The answer is capacity, and it is measurable.

## How many things fit in a space

Two directions are *distinguishable* if the angle between them is wide enough that a small error cannot confuse them. Take a cosine of 0.30 as the threshold.

How many directions can be placed in *d* dimensions before some pair exceeds it:

| dimensions | distinguishable concepts |
| --- | --- |
| 2 | 2 |
| 4 | 4 |
| 8 | 9 |
| 16 | 21 |
| 64 | 363 |
| 384 | 3,000+ |

Two dimensions hold two ideas. Sixteen hold twenty-one. Sixty-four hold three hundred and sixty-three, and by 384 the count runs past where it is worth counting.

The growth is not linear — it accelerates, because the volume available at a given angular separation grows with dimension. This is the whole reason for the size of real embeddings. A language has hundreds of thousands of words standing in millions of relationships, and a two-dimensional space simply has nowhere to put them.

The same fact in another form: two random directions in *d* dimensions have an expected absolute cosine of √(2/πd).

| dimensions | typical cosine between unrelated items |
| --- | --- |
| 2 | 0.643 |
| 8 | 0.285 |
| 64 | 0.0995 |
| 768 | 0.0291 |

In two dimensions everything is close to everything — 0.64 between unrelated items, which leaves no room for a *meaningful* 0.8. In 768 dimensions unrelated things sit at 0.03, so a similarity of 0.8 is unambiguous.

That is why the usual advice — "related sentences score 0.7 to 0.9, unrelated 0.1 to 0.3" — only holds in a high-dimensional space. The scale is an artefact of the dimension count.

<figure>
<svg viewBox="0 0 560 302" width="560" role="img" aria-label="Bars on a logarithmic scale showing how many distinguishable concepts fit in two, eight, sixteen, sixty-four and three hundred and eighty-four dimensions." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ROOM FOR IDEAS, MEASURED</text>
<text class="l" x="20" y="44">concepts that fit, before any pair exceeds cosine 0.30</text>
<rect x="20" y="54" width="43" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="l" x="30" y="67">d = 2 → 2</text>
<rect x="20" y="78" width="137" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="l" x="30" y="91">d = 8 → 9</text>
<rect x="20" y="102" width="190" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="l" x="30" y="115">d = 16 → 21</text>
<rect x="20" y="126" width="368" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="l" x="30" y="139">d = 64 → 363</text>
<rect x="20" y="150" width="500" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 34%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="b" x="30" y="163">d = 384 → past counting</text>
<text class="l" x="20" y="180">log scale — each 144 px is a tenfold increase</text>
<path d="M20 196 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="218">and the noise floor falls as √(2/πd):</text>
<text class="l" x="20" y="236">unrelated items sit at 0.643 in 2 dimensions, 0.0291 in 768</text>
<text class="b" x="20" y="258">so a score of 0.8 means nothing in 2 dimensions and a lot in 768</text>
<text class="l" x="20" y="280">the familiar 0.7-to-0.9 range is a property of the dimension count</text>
</svg>
<figcaption>Capacity rises and the noise floor falls, both with dimension. That is what hundreds of numbers buy.</figcaption>
</figure>

## Where the numbers come from

Nobody assigns them. A model is trained on a task that requires understanding — predicting missing words, or matching sentences with their paraphrases — and the vectors are whatever internal representation the model developed to succeed at it.

Which means the axes are not interpretable. There is no "sweetness" dimension in a real embedding; dimension 412 is not *about* anything. The information lives in relative positions, not in individual coordinates.

It also means the training objective decides what "similar" means. A model trained to match questions with answers organises differently from one trained to detect paraphrases, and both are correct for their purpose.

## Word arithmetic, honestly

The famous demonstration is that `king − man + woman` lands near `queen`. It genuinely works, and it is weaker than the way it is usually told.

The standard evaluation excludes the three input words from the candidate list. Without that exclusion, the nearest vector to the result is typically one of the inputs — the arithmetic moves the point, but not far enough to escape the neighbourhood it started in. So the relationship is real and the "solving analogies" framing overstates it.

Worth knowing, because it is the example that convinces people embeddings are doing symbolic reasoning. They are not. They are placing points such that some directions happen to correspond roughly to some relationships.

## What to watch for

**Never compare across models.** Two models produce vectors in unrelated spaces. A cosine between them is not a weak signal; it is a meaningless number that looks exactly like a real one.

**Similar is not correct.** Retrieval finds the nearest text, which may be nearby and wrong — a document about the same topic contradicting the one you wanted scores just as well.

**The training data's associations are in there.** An embedding places stereotyped associations near each other because the text it learned from did, and that shows up in anything ranked by similarity.

## What to take away

An embedding turns meaning into coordinates, and the coordinate count is not arbitrary.

Two dimensions can separate two ideas. It takes hundreds before unrelated things are far apart enough that "close" carries information — which is why the smallest useful embeddings are in the hundreds and the toy example with two numbers, while a good illustration, is not a small version of the real thing.
