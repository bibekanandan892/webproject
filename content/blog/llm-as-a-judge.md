---
title: "LLM as a judge"
date: "2026-09-10T19:20"
category: "AI"
tags: ["evaluation", "judge", "bias", "rubric", "testing"]
summary: "Using one model to grade another scales in a way human review cannot. It also brings biases that are measurable — and at least one of them cancels exactly if you run the comparison twice."
draft: false
cover: "/blog/llm-as-a-judge.svg"
---

Open-ended output is hard to score. There is no single right answer to compare against, so the two traditional options are people, which does not scale, and word-overlap metrics, which measure whether the same words appeared rather than whether the answer was any good.

Using a model as the grader gets you judgement that understands meaning, at a rate that lets you evaluate everything rather than a sample.

## Four ways to ask

**Score one answer.** Rate it 1 to 5 on a criterion. Simple, and the least reliable — absolute scores drift between runs and cluster in the middle.

**Compare two answers.** Show both, ask which is better. Far more stable, because relative judgements are easier than absolute ones. This is also where the worst bias lives.

**Compare against a reference.** Show the model answer and a known-good one, and ask how close they are in substance. Needs ground truth, which you often do not have.

**Score against a rubric.** Several named criteria, each scored separately, each with a stated definition. More work to set up, and the most usable in practice — a single number tells you something got worse, whereas a rubric tells you which part.

## The bias you can cancel

In pairwise comparison, judges systematically favour whichever answer they read first. This is not subtle and it is not rare.

But it has a convenient shape. Suppose the judge's honest preference for answer A is $q$, and being shown first adds $b$:

| true preference | bias | A shown first | B shown first | mean of both |
| --- | --- | --- | --- | --- |
| 0.70 | 0.15 | 0.850 | 0.550 | **0.700** |
| 0.70 | 0.05 | 0.750 | 0.650 | **0.700** |
| 0.85 | 0.10 | 0.950 | 0.750 | **0.850** |
| 0.55 | 0.20 | 0.750 | 0.350 | **0.550** |

Run each comparison in one order only and the winner's score is inflated by exactly $b$. Run it in both orders and average, and the bias cancels precisely — $(q+b) + (q-b)$ over two is $q$.

So every pairwise comparison should be run twice with the answers swapped. It doubles the cost and removes an entire category of error.

## Disagreement is information

There is a second thing the swap gives you free. When the two orders disagree, the judge did not have a real preference — position decided it.

<figure>
<svg viewBox="0 0 560 220" width="560" role="img" aria-label="A curve showing how often the two orderings disagree, falling from about half when the judge has no real preference to about a tenth when the preference is strong." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">DISAGREEMENT MEANS THE JUDGE COULD NOT TELL</text>
<path d="M80 170 H520" stroke="var(--border)" stroke-width="1"/>
<path d="M80 40 V170" stroke="var(--border)" stroke-width="1"/>
<path d="M80 48.4 L168 51.0 L256 59.4 L344 72.4 L432 90.0 L520 104.6" fill="none" stroke="color-mix(in srgb, var(--primary) 75%, transparent)" stroke-width="2.4"/>
<circle cx="80" cy="48.4" r="4.5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="86" y="42">52%</text>
<circle cx="256" cy="59.4" r="4.5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="262" y="53">44%</text>
<circle cx="432" cy="90.0" r="4.5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="438" y="84">20%</text>
<circle cx="520" cy="104.6" r="4.5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="514" y="120" text-anchor="end">11%</text>
<text class="l" x="80" y="188" text-anchor="middle">0.50</text>
<text class="l" x="256" y="188" text-anchor="middle">0.70</text>
<text class="l" x="432" y="188" text-anchor="middle">0.90</text>
<text class="l" x="520" y="188" text-anchor="middle">0.99</text>
<text class="l" x="300" y="208" text-anchor="middle">how strongly the judge actually prefers one answer</text>
<text class="l" x="70" y="46" text-anchor="end">flip</text>
<text class="l" x="70" y="62" text-anchor="end">rate</text>
</svg>
<figcaption>A coin-flip preference disagrees about half the time. A clear one disagrees about a tenth.</figcaption>
</figure>

So the flip rate across your evaluation set is a direct measure of how much the judge is actually distinguishing. If half your comparisons flip when swapped, the scores are noise dressed as measurement — and no amount of averaging fixes that, because there is nothing underneath.

Treating flipped comparisons as ties rather than forcing a winner is usually the honest thing to do.

## The other biases

These do not cancel, and have to be designed around.

**Length.** Longer answers score higher, roughly regardless of content. The cheapest partial defence is to state in the rubric that length is not a criterion, and to check whether your judge's scores correlate with word count — if they do, you have measured verbosity.

**Style.** Bullet points, headings, confident phrasing. A well-formatted wrong answer beats a plainly-written right one more often than it should.

**Self-preference.** A judge rates output from its own model family more highly. Which means evaluating your own model with a judge from the same family is not an independent measurement.

**Confidence.** Hedged but correct loses to assertive but wrong. The judge is reading tone as evidence.

## Making it usable

**The judge must be at least as strong as what it grades.** A weaker judge cannot recognise the failures it is being asked to find, and will grade fluency instead.

**Ask for reasoning before the score, not after.** A model that writes its verdict first and justifies it afterwards is producing a rationalisation. Reasoning first genuinely changes the score it lands on.

**Keep the scale short.** 1–5 with each point defined beats 1–100, where nothing distinguishes 72 from 76 and the judge will not use the range consistently anyway.

**Validate against people once.** Score a hundred examples by hand, run the judge on the same hundred, and check they agree. Without that, you have automated a measurement of unknown validity — and it will be trusted precisely because it produces numbers.

**Use more than one judge for anything important.** Models from different families disagree in different directions, and the cases where they disagree with each other are the cases worth looking at.

## The short version

- One model grades another's open-ended output, at a scale human review cannot reach.
- Pairwise comparison is more reliable than absolute scoring; a rubric tells you *what* got worse.
- Position bias is real and inflates the first-shown answer by a fixed amount.
- Running both orders and averaging cancels it exactly.
- The disagreement rate between orders measures how much the judge is really distinguishing.
- Length, style, self-preference and confidence biases do not cancel and need designing around.
- Reasoning before the score, a short scale, a judge at least as strong as the model, and one validation against humans.
