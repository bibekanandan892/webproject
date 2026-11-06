---
title: "Decision trees and random forests"
date: "2026-11-06T19:40"
category: "AI"
tags: ["decision-trees", "random-forests", "ensembles", "gini", "machine-learning"]
summary: "A decision tree asks one yes/no question at a time, choosing each by how much purer it makes the groups: splitting 10/10 into 8/2 and 2/8 cuts Gini impurity from 0.5 to 0.32. A forest averages hundreds of deliberately different trees — 100 trees with correlation 0.3 keep only 30.7% of one tree's variance."
draft: false
cover: "/blog/decision-trees-and-random-forests.svg"
---

A decision tree makes a prediction by asking a sequence of questions about the input, each with a yes or no answer, until it reaches a conclusion. *Is income above 50,000? Has the customer missed a payment in the last year? Is the loan longer than five years?* Each answer leads to the next question or to a final prediction.

It is the most interpretable model in common use — you can print it and read it — and, combined into **random forests** and boosted ensembles, still one of the strongest choices for tabular data.

## How a tree chooses its questions

Training a tree means choosing, at each point, which question to ask. The tree considers every feature and every threshold, and picks the split that makes the resulting groups as **pure** as possible — as close as possible to containing only one class.

A common measure of impurity is **Gini impurity**: the chance that two items picked at random from a group have different labels.

`Gini = 1 − Σ pᵢ²`

Start with 20 loan applicants, 10 who repaid and 10 who did not:

`Gini = 1 − 0.5² − 0.5² = 0.500`

Compare two candidate questions:

| split | left group | right group | Gini of each | weighted Gini | improvement |
| --- | --- | --- | --- | --- | --- |
| "missed a payment?" | 8 repaid, 2 not | 2 repaid, 8 not | 0.320 | 0.320 | **0.180** |
| "owns a car?" | 6 repaid, 4 not | 4 repaid, 6 not | 0.480 | 0.480 | 0.020 |

The first question separates the groups far better, so the tree asks it. Then it repeats the process inside each group, and inside each of those, until the groups are pure, too small to split, or a depth limit is reached. The prediction at each leaf is the majority class (or the average value, for regression) of the training examples that ended there.

## The weakness: one tree overfits

Left to grow, a tree keeps splitting until every leaf is pure — which on real, noisy data means memorising the training set. Its predictions then depend heavily on the particular examples it saw: change a few, and the top split may change, and with it the entire tree below. Deep trees have **low bias and high variance**.

Pruning and depth limits help, but at the cost of accuracy. The better fix is to stop relying on one tree.

## Random forests: many different trees, averaged

A random forest trains hundreds of trees and averages their predictions (or takes a majority vote). Averaging cancels out errors — but only if the trees make *different* errors. Two sources of randomness make them different:

1. **Bootstrap samples.** Each tree trains on a random sample of the data, drawn with replacement, the same size as the original. On average each sample contains about **63.2%** of the distinct examples, some repeated, the rest left out.
2. **Random feature subsets.** At each split, a tree may choose only among a random subset of the features — often about the square root of the total. This stops every tree from making the same obvious first split.

How much averaging helps depends on how correlated the trees' errors are. If each tree's prediction has variance σ² and any two trees have correlation ρ, the average of *B* trees has variance:

`ρσ² + (1 − ρ)σ² / B`

| correlation between trees | 1 tree | 10 trees | 100 trees |
| --- | --- | --- | --- |
| 0 | 1.000σ² | 0.100σ² | 0.010σ² |
| 0.3 | 1.000σ² | 0.370σ² | **0.307σ²** |
| 0.6 | 1.000σ² | 0.640σ² | 0.604σ² |

Adding trees drives the second term toward zero, but the first term — the shared error — never goes away. That is why the random feature subsets matter: they lower ρ. With correlation 0.3, a hundred trees keep about 31% of a single tree's variance; with 0.6, about 60%, no matter how many trees are added.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A small decision tree splitting 10 and 10 into 8/2 and 2/8 groups with Gini values, and beside it several different trees whose votes are averaged into one prediction." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE TREE, THEN MANY</text>
<rect x="70" y="34" width="120" height="30" rx="5" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text class="b" x="130" y="48" text-anchor="middle">missed payment?</text><text class="l" x="130" y="60" text-anchor="middle">10 / 10 · Gini 0.50</text>
<path d="M110 64 L70 100 M150 64 L190 100" stroke="var(--muted-foreground)"/>
<text class="l" x="76" y="84">no</text><text class="l" x="174" y="84">yes</text>
<rect x="20" y="100" width="100" height="30" rx="5" fill="var(--primary)" fill-opacity="0.12" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="140" y="100" width="100" height="30" rx="5" fill="var(--muted-foreground)" fill-opacity="0.12" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<text class="b" x="70" y="114" text-anchor="middle">8 repaid / 2</text><text class="l" x="70" y="126" text-anchor="middle">Gini 0.32</text>
<text class="l" x="190" y="114" text-anchor="middle">2 repaid / 8</text><text class="l" x="190" y="126" text-anchor="middle">Gini 0.32</text>
<text class="b" x="20" y="152">gain 0.180 vs 0.020 for "owns a car?"</text>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6">
<path d="M320 40 L300 70 M320 40 L340 70 M300 70 L290 95 M300 70 L310 95"/>
<path d="M390 40 L370 70 M390 40 L410 70 M410 70 L400 95 M410 70 L420 95"/>
<path d="M460 40 L440 70 M460 40 L480 70 M440 70 L430 95 M480 70 L490 95"/>
</g>
<g fill="var(--muted-foreground)"><circle cx="320" cy="40" r="4"/><circle cx="390" cy="40" r="4"/><circle cx="460" cy="40" r="4"/></g>
<path d="M310 104 L390 130 M410 104 L390 130 M470 104 L390 130" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="350" y="130" width="80" height="24" rx="5" fill="var(--primary)" fill-opacity="0.15" stroke="var(--primary)"/>
<text class="b" x="390" y="146" text-anchor="middle">average</text>
<text class="l" x="300" y="176">bootstrap sample + random features each</text>
<path d="M20 196 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="218">variance of the average = ρσ² + (1 − ρ)σ² / B</text>
<text class="l" x="20" y="238">100 trees at ρ = 0.3 keep 30.7% of one tree's variance — the shared part never averages out</text>
</svg>
<figcaption>Each tree splits on purity; the forest's strength comes from how differently its trees err.</figcaption>
</figure>

## A free validation set

Because each tree skips about 36.8% of the data, every training example is left out by roughly a third of the trees. Predicting each example using only those trees gives the **out-of-bag** error — an honest estimate of generalisation without a separate validation set.

## Boosting: the other ensemble

Random forests grow trees independently and average them, which mainly reduces variance. **Gradient boosting** — XGBoost, LightGBM, CatBoost — grows shallow trees one after another, each fitting the errors the previous ones left, which mainly reduces bias. Boosted trees are often slightly more accurate on tabular data, at the cost of more tuning and more risk of overfitting. Both remain hard to beat for structured, spreadsheet-like data, frequently outperforming neural networks there.

## Strengths and limits

**Strengths:** handle mixed numeric and categorical features, need little preprocessing (no scaling), capture non-linear interactions, are fast, and provide feature-importance estimates.

**Limits:** a forest is no longer readable like a single tree; trees cannot extrapolate beyond the range of values seen in training; and on images, audio and text, neural networks are far better.

## What to take away

A decision tree asks one question at a time, choosing each to maximise purity — "missed a payment?" turns a 10/10 group with Gini 0.5 into two 8/2 groups with Gini 0.32. Grown deep, a single tree overfits.

A random forest averages many trees, each trained on a bootstrap sample (about 63.2% of distinct examples) with random feature choices, so they err differently. The variance left is `ρσ² + (1 − ρ)σ²/B`: 30.7% of one tree's with 100 trees at correlation 0.3. Lower correlation, not just more trees, is what makes forests strong.
