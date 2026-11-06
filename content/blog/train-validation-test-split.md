---
title: "Train, validation and test sets"
date: "2026-11-06T15:30"
category: "AI"
tags: ["machine-learning", "evaluation", "overfitting", "validation", "fundamentals"]
summary: "Three slices of data, three jobs: learn, choose, and report. Skip the middle one and tune on the test set, and the best of 20 equally good models scores 91.71% on a 1,000-example test that all of them would really score 90% on — an improvement that does not exist."
draft: false
cover: "/blog/train-validation-test-split.svg"
---

A model is only useful if it works on data it has not seen. Every evaluation practice in machine learning is built around measuring that honestly, and the most basic one is splitting the data into three parts before anything else happens.

| set | typical share | used to |
| --- | --- | --- |
| **training** | 70–80% | fit the model's weights |
| **validation** | 10–15% | choose between models, settings and when to stop |
| **test** | 10–15% | report the final result — once |

The reason there are three, not two, is the interesting part.

## Training: where the model learns

The training set is what gradient descent sees. The model's weights are adjusted to reduce error on exactly these examples, so performance on them is always optimistic. A large enough model can memorise its training set completely and still be useless on anything else. Training accuracy tells you the model *can* fit the data, nothing more.

## Validation: where you make decisions

Building a model involves many choices the training process does not make for you: the architecture, the learning rate, how much regularisation, which features to include, when to stop training. Each is decided by trying options and comparing them on data the model did not train on — the validation set.

Validation data is therefore *used*, indirectly. Every choice made by looking at validation scores fits the final model a little to those particular examples.

## Test: where you find out

The test set answers one question: how well will the finished model do on new data? To answer it honestly, it must play no part in any decision. Ideally it is looked at once, at the end.

## What goes wrong without the middle set

Suppose you skip validation and choose between models by their test score. It feels harmless — you are only picking the best one.

Simulate it. Twenty model configurations, all with the same **true** accuracy of 90%. Each is scored on the same 1,000-example test set; random variation means each gets a slightly different score. Pick the best:

| configurations compared on the test set | average score of the "best" one |
| --- | --- |
| 1 | 90.00% |
| 5 | 91.11% |
| 20 | **91.71%** |
| 100 | 92.39% |

None of them is better than 90%. But pick the winner from 20 and you will report 91.71% — an improvement that exists only because you chose the configuration that happened to get lucky on those particular 1,000 examples. Try 100 and you will report 92.39%.

This is overfitting to the test set, and it happens with no change to any model weights at all. It is why test sets must be reserved, and why public benchmarks that the whole field tunes against gradually stop measuring what they claim to.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A bar divided into training, validation and test segments, and below it a chart showing the reported score rising from 90% to 92.39% as more configurations are compared on the test set, against a flat true accuracy of 90%." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">LEARN · CHOOSE · REPORT</text>
<rect x="20" y="32" width="364" height="24" fill="var(--muted-foreground)" fill-opacity="0.35"/>
<rect x="384" y="32" width="78" height="24" fill="var(--muted-foreground)" fill-opacity="0.6"/>
<rect x="462" y="32" width="78" height="24" fill="var(--primary)" fill-opacity="0.8"/>
<text class="l" x="30" y="48">train 70%</text><text class="l" x="392" y="48">val 15%</text><text class="b" x="470" y="48" fill="var(--background)">test 15%</text>
<path d="M80 80 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="74" y="190" text-anchor="end">90%</text><text class="l" x="74" y="90" text-anchor="end">92.5%</text>
<path d="M80 190 H520" stroke="var(--muted-foreground)" stroke-width="2" stroke-dasharray="4 3"/>
<text class="l" x="420" y="184">true accuracy</text>
<path d="M90 190 L200 146 L330 122 L500 94" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<g fill="var(--primary)"><circle cx="90" cy="190" r="3.5"/><circle cx="200" cy="146" r="3.5"/><circle cx="330" cy="122" r="3.5"/><circle cx="500" cy="94" r="3.5"/></g>
<text class="b" x="206" y="142">5 → 91.11%</text><text class="b" x="336" y="118">20 → 91.71%</text><text class="b" x="452" y="88">100 → 92.39%</text>
<text class="l" x="80" y="206">configurations compared on the test set →</text>
<path d="M20 222 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="244">every model is 90%; choosing on the test set reports up to 92.39%</text>
</svg>
<figcaption>Selection on a noisy score is optimistic by construction. The validation set absorbs that optimism so the test set does not.</figcaption>
</figure>

## How big each set needs to be

The test set's size decides how precisely you know the result. For a model around 90% accurate:

| test examples | standard error | 95% interval |
| --- | --- | --- |
| 100 | 3.00% | ±5.88% |
| 1,000 | 0.95% | ±1.86% |
| 10,000 | 0.30% | ±0.59% |

With 100 test examples, "91%" means anywhere from about 85% to 97%. Differences between models smaller than the interval are not evidence of anything. When data is plentiful, test and validation sets can be a small percentage of the total and still contain tens of thousands of examples; when it is scarce, **cross-validation** — rotating which slice is held out and averaging — gets more out of it.

## Splitting correctly

The split must mimic how the model will meet new data. Random splitting is right only when examples are independent. Common traps:

- **Time.** Forecasting models must be validated on data *later* than their training data. A random split lets the model peek at the future.
- **Groups.** If one patient contributes many scans, or one user many messages, all of that person's data must fall in one set. Otherwise the model can recognise the person rather than learn the task.
- **Duplicates.** Near-identical examples on both sides of the split — the same image resized, the same document reposted — inflate test scores.
- **Preprocessing.** Statistics used to normalise data, fill missing values or select features must be computed on the training set only, then applied to the others.

Each of these is a form of **leakage**: information about the test examples reaching the model or the modeller before the final evaluation.

## What to take away

Training data fits the weights, validation data makes the choices, test data reports the result. Merging the last two looks harmless but is not: choosing the best of 20 equally good models on a 1,000-example test set reports 91.71% for models that are all really 90%.

Size the test set for the precision you need — ±1.86% at 1,000 examples — split in a way that matches how the model will be used, and keep the test set out of every decision until the end.
