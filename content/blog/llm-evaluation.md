---
title: "LLM evaluation"
date: "2026-09-10T19:40"
category: "AI"
tags: ["evaluation", "benchmarks", "metrics", "contamination", "testing"]
summary: "There is no formula for whether an answer was any good, so evaluation becomes a choice about what to trade away. The costs differ by two orders of magnitude, which is what decides the shape of a real setup."
draft: false
cover: "/blog/llm-evaluation.svg"
---

Ordinary software has tests: run the function, compare against the expected value. Language model output has no expected value. There are many good answers to most questions and no way to enumerate them.

So evaluation stops being a correctness check and becomes a measurement problem, with a trade to make between how good the judgement is and how much of it you can afford.

## Four ways to measure

**Formulas against a reference.** Count overlapping words with a known-good answer, or measure embedding similarity to it. Instant and free. They also cannot tell a rephrasing from a contradiction — a correct answer using different words scores badly, and a wrong answer reusing the right vocabulary scores well. Useful where output is genuinely constrained; misleading almost everywhere else.

**Benchmarks.** Standard datasets everyone runs, so numbers are comparable across models. Good for choosing between models, weak for telling you whether *your* application works, because your task is not in there.

**People.** The only thing that actually knows what a good answer is. Slow, expensive, and inconsistent between raters, but it is the ground truth everything else is approximating.

**A model as the grader.** A capable model scores the output against stated criteria. Understands meaning, runs at scale, and brings its own biases — toward length, toward confident phrasing, toward output from its own family.

## The numbers that decide the design

Ten thousand outputs to evaluate:

| | cost | wall time |
| --- | --- | --- |
| formula | ~$0 | seconds |
| model as grader | $61.50 | minutes, in parallel |
| people | **$12,500** | **500 person-hours** |

Human evaluation is about **200 times** the cost of a model grader, and takes three months of one person's time instead of an afternoon.

That ratio is why nobody chooses one method. You grade everything with a model, and spend the human budget on a sample — used not to evaluate the output, but to check whether the grader can be trusted.

## How big a sample

Which raises a question worth doing the arithmetic on. If people label a sample and you measure how often the grader agrees with them, how precisely do you know that agreement?

<figure>
<svg viewBox="0 0 560 210" width="560" role="img" aria-label="Bars showing the width of the confidence interval on judge-human agreement shrinking as the hand-labelled sample grows from 25 to 4000 examples." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">HOW MUCH HAND-LABELLING BUYS</text>
<text class="l" x="100" y="46" text-anchor="end">25</text>
<rect x="110" y="34" width="280" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 30%, transparent)"/>
<text class="v" x="398" y="47">±14.0 pts</text>
<text class="l" x="100" y="74" text-anchor="end">50</text>
<rect x="110" y="62" width="198" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<text class="v" x="316" y="75">±9.9</text>
<text class="l" x="100" y="102" text-anchor="end">100</text>
<rect x="110" y="90" width="140" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="v" x="258" y="103">±7.0</text>
<text class="l" x="100" y="130" text-anchor="end">400</text>
<rect x="110" y="118" width="70" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="v" x="188" y="131">±3.5</text>
<text class="l" x="100" y="158" text-anchor="end">1000</text>
<rect x="110" y="146" width="44" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="162" y="159">±2.2</text>
<text class="l" x="100" y="186" text-anchor="end">4000</text>
<rect x="110" y="174" width="22" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 70%, transparent)"/>
<text class="v" x="140" y="187">±1.1</text>
</svg>
<figcaption>Precision improves with the square root of the sample, so the fourth hundred buys much less than the first.</figcaption>
</figure>

A hundred hand-labelled examples pins the agreement rate to about **±7 points**. That is enough to know the grader is roughly sane, and not enough to tell an 85% grader from an 80% one — for that you need around 400.

Worth knowing before someone reports that a prompt change improved agreement from 82% to 86% on a sample of fifty.

## The two failures that quietly invalidate everything

**Contamination.** If the test data was in the training data, the score measures memorisation. This is not a hypothetical for public benchmarks — they are on the web, and the web is the training set. A model can score well on a benchmark and fail on the same task phrased slightly differently, which is exactly the signature.

The defence is a private evaluation set drawn from your own data that has never been published.

**Drift.** The model behind an API changes. Your prompts change. Retrieved documents change as the corpus grows. An evaluation run once at launch describes a system that no longer exists.

The defence is running the same set on a schedule and keeping the history, so a regression shows up as a step down in a chart rather than as a support ticket.

## What a working setup looks like

A small evaluation set built from **real cases**, including the awkward ones — the ambiguous questions, the adversarial inputs, the rare-but-costly scenarios. A hundred well-chosen examples from your actual traffic are worth more than any public benchmark, because they are the distribution you serve.

Everything graded automatically, re-run on every change, with the results kept over time.

A human sample large enough to have validated the grader once, then re-checked occasionally.

And latency and cost tracked alongside quality, because a change that improves scores while doubling response time is not obviously an improvement, and nothing in a quality metric will tell you.

## The short version

- Open-ended output has no expected value, so evaluation is measurement, not a correctness check.
- Four families: reference formulas, benchmarks, people, and a model as grader.
- People cost about 200× a model grader and take person-months rather than minutes.
- So grade everything automatically and spend the human budget validating the grader.
- 100 hand-labelled examples pin agreement to ±7 points; distinguishing 85% from 80% needs about 400.
- Contamination makes benchmark scores measure memorisation; a private set from your own data is the defence.
- Drift makes any one-off evaluation stale; re-run on a schedule and keep the history.
