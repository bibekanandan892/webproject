---
title: "One-hot encoding"
date: "2026-11-06T16:30"
category: "AI"
tags: ["one-hot", "encoding", "embeddings", "features", "fundamentals"]
summary: "One-hot encoding turns a category into a vector of zeros with a single 1. It makes no false claims about order or similarity — and that is also its limit: every pair of categories is equally unrelated, and a 50,000-word one-hot is 195 KB to say what a 4-byte index says."
draft: false
cover: "/blog/one-hot-encoding.svg"
---

Models do arithmetic, so their inputs must be numbers. Many useful inputs are not: a colour, a country, a product category, a word. One-hot encoding is the most basic way to turn a category into numbers without pretending it is something it is not.

## The encoding

Give each possible category its own position in a vector. To encode a value, set its position to 1 and every other position to 0.

| colour | red | green | blue |
| --- | --- | --- | --- |
| red | **1** | 0 | 0 |
| green | 0 | **1** | 0 |
| blue | 0 | 0 | **1** |

Exactly one entry is "hot". The vector has as many entries as there are categories.

## Why not just number them?

The obvious alternative is to assign integers: red = 1, green = 2, blue = 3. The trouble is that a model treats numbers as numbers. It will learn that blue is "more" than red, that green is halfway between them, and that the average of red and blue is green. None of that is true of colours.

One-hot encoding makes no such claims. No category is bigger than another; no category lies between two others. The model is free to learn a separate weight for each.

Integer encoding *is* right when the categories really are ordered — small, medium, large; low, medium, high risk — and the order matters to the prediction. That is **ordinal** data. One-hot is for **nominal** data, where the categories are just names.

## What one-hot says about similarity

Take the dot product of two different one-hot vectors: every position multiplies a 0 by something, so the result is always **0**. The distance between any two different categories is always the same, √2.

In other words, one-hot encoding says every category is *equally* unrelated to every other. "Cat" is as different from "kitten" as it is from "carburettor". For colours or countries that is a reasonable starting assumption. For words it is plainly false, and it means a model learns nothing about "kitten" from everything it has learned about "cat".

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Three one-hot vectors as rows of cells with a single filled cell each, and a note that every pair has dot product zero; beside it, a one-hot vector times an embedding matrix selecting one row." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE HOT, ALL ELSE COLD</text>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5">
<rect x="80" y="36" width="24" height="24"/><rect x="104" y="36" width="24" height="24"/><rect x="128" y="36" width="24" height="24"/><rect x="152" y="36" width="24" height="24"/>
<rect x="80" y="68" width="24" height="24"/><rect x="104" y="68" width="24" height="24"/><rect x="128" y="68" width="24" height="24"/><rect x="152" y="68" width="24" height="24"/>
<rect x="80" y="100" width="24" height="24"/><rect x="104" y="100" width="24" height="24"/><rect x="128" y="100" width="24" height="24"/><rect x="152" y="100" width="24" height="24"/>
</g>
<g fill="var(--primary)" fill-opacity="0.8"><rect x="81" y="37" width="22" height="22"/><rect x="129" y="69" width="22" height="22"/><rect x="153" y="101" width="22" height="22"/></g>
<text class="l" x="20" y="53">cat</text><text class="l" x="20" y="85">kitten</text><text class="l" x="20" y="117">car</text>
<text class="b" x="20" y="148">any two: dot product 0</text>
<text class="l" x="20" y="164">cat–kitten as far apart as cat–car</text>
<rect x="300" y="60" width="96" height="14" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<rect x="324" y="60" width="24" height="14" fill="var(--primary)" fill-opacity="0.8"/>
<text class="l" x="404" y="72">×</text>
<rect x="420" y="36" width="100" height="96" fill="var(--muted-foreground)" fill-opacity="0.15" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<rect x="420" y="60" width="100" height="24" fill="var(--primary)" fill-opacity="0.35"/>
<text class="b" x="420" y="148">= one row of the table</text>
<text class="l" x="300" y="164">so it's done as a lookup, not a multiply</text>
<path d="M20 186 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="208">50,000 categories: 195 KB of mostly zeros to say what a 4-byte index says</text>
<text class="l" x="20" y="226">and multiplying it by a 4,096-wide table would cost 205M multiply-adds for nothing</text>
</svg>
<figcaption>One-hot is the honest starting point and the reason embeddings exist.</figcaption>
</figure>

## The size problem

One-hot vectors are as long as the number of categories. A colour has three; a city might have ten thousand; a vocabulary fifty thousand.

A 50,000-entry one-hot vector stored as 32-bit floats is **195 KB** — all of it zeros except one value. The same information fits in a single 4-byte integer: the index of the hot position.

Worse, high-cardinality one-hot features spread little data thinly. A city that appears in five training examples gets a weight learned from five examples, with no way to borrow from similar cities.

## One-hot and embeddings are the same operation

Multiply a one-hot vector by a matrix and you get exactly one row of that matrix — the row at the hot position. Everything else is multiplied by zero.

So "one-hot encode the word, then multiply by a weight matrix" is identical to "look up the word's row in a table". For a 50,000-word vocabulary and 4,096-dimensional rows, doing the literal multiplication would cost 205 million multiply-adds to produce a result that a lookup produces for free. This is why deep learning frameworks have **embedding layers**: conceptually a one-hot times a matrix, implemented as an index lookup.

The difference is what is learned. The embedding table's rows are trained, and categories that behave similarly end up with similar rows. "Cat" and "kitten" drift close together; "carburettor" stays far away. The fixed, equal distances of one-hot become learned, meaningful ones. Embeddings are what you get when you keep one-hot's honesty about the input and let the model learn the similarity.

## Where one-hot is still the right tool

- **Low-cardinality categorical features** in tabular models: payment method, device type, day of week (unless the cyclic order matters).
- **Target labels** for classification: the true class as a one-hot vector is exactly what cross-entropy loss compares against the predicted distribution.
- **Linear models and trees**, which handle a few dozen one-hot columns well and benefit from their interpretability.

For high-cardinality features, alternatives are better: learned embeddings, hashing many categories into a fixed number of buckets, or target encoding (replacing a category with a statistic of the target over that category, computed carefully to avoid leakage).

## What to take away

One-hot encoding represents a category as a vector with a single 1. It avoids the false ordering of integer codes, which makes it right for nominal data and for classification targets.

But it treats every pair of categories as equally unrelated, and grows with the number of categories — 195 KB per 50,000-way value. Multiplying a one-hot by a matrix just selects a row, which is why embedding layers implement it as a lookup and learn rows that make related categories similar.
