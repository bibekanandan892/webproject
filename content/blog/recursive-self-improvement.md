---
title: "Recursive self-improvement"
date: "2026-08-13T18:25"
category: "AI"
tags: ["rsi", "self-improvement", "evaluation", "agents", "safety"]
summary: "A system that improves the thing that improves it. Ten cycles at a steady 10% compound to 2.59×; with returns halving each cycle the ceiling is 1.21×. And on a 500-question benchmark, a change that makes the model 1% worse passes as an improvement 36.5% of the time."
draft: false
cover: "/blog/recursive-self-improvement.svg"
---

Most AI systems are improved by people. Engineers collect data, change the training recipe, run evaluations and decide what ships. The model is the thing being improved; it is not doing the improving.

Recursive self-improvement is the loop where it is. The system proposes a change to itself — its prompts, its tools, its training data, eventually its own code or weights — evaluates the result, keeps the change if it helped, and then uses the improved version to propose the next change. The improver and the improved are the same thing, so every gain also improves the process of gaining.

That is the whole idea, and the interesting questions are all quantitative: does the loop compound, stall, or quietly go backwards?

## The loop

One cycle has four steps:

1. **Propose.** Generate a candidate change — a new system prompt, a rewritten tool, a batch of synthetic training data, a modified training script.
2. **Apply.** Build the candidate version.
3. **Evaluate.** Measure the candidate against the current version.
4. **Select.** Keep whichever scored better. Repeat, with the winner as the new proposer.

Pieces of this exist today. Models generate training data that is filtered and used to train their successors. Agents rewrite their own prompts and tool code and keep the versions that pass more tests. Search systems propose and benchmark candidate algorithms. None of these is the full loop running unattended on its own weights — but each is one of its steps.

## Does it compound?

If every cycle improves capability by a fixed 10%, ten cycles give `1.1¹⁰ = 2.59×`. That is the optimistic picture: steady, compounding gains.

The shape depends entirely on how the per-cycle gain changes as the system gets better:

| per-cycle gain | after 10 cycles | limit |
| --- | --- | --- |
| steady 10% | 2.59× | unbounded |
| 10%, growing 10% per cycle | **4.36×** | unbounded, faster |
| 10%, shrinking 20% per cycle | 1.54× | bounded |
| 10%, halving each cycle | 1.21× | **1.21×** |

Accelerating returns — each improvement making the next one larger — is the "intelligence explosion" scenario. Diminishing returns — each improvement harder to find than the last — produces a plateau that arrives quickly: with gains halving, the loop has delivered almost everything it ever will in five cycles.

Which regime is real is an open empirical question, and probably differs by what is being improved. Prompt and tool tweaks show steep diminishing returns: the easy wins are found first. Improvements to the improvement process itself are the ones that could accelerate, and they are the hardest to make.

<figure>
<svg viewBox="0 0 560 280" width="560" role="img" aria-label="Four curves of capability over ten cycles: accelerating to 4.36, steady to 2.59, shrinking to 1.54 and halving to 1.21." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE SAME LOOP, FOUR RETURN CURVES</text>
<path d="M60 36 V200 H460" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="30" y="204">1×</text><text class="l" x="30" y="40">4.4×</text>
<path d="M60 200 C200 190 330 140 460 40" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<text class="b" x="468" y="44">4.36× accelerating</text>
<path d="M60 200 C220 180 340 150 460 125" stroke="var(--primary)" stroke-opacity="0.6" stroke-width="2" fill="none"/>
<text class="l" x="468" y="129">2.59× steady</text>
<path d="M60 200 C150 186 260 177 460 174" stroke="var(--muted-foreground)" stroke-width="2" fill="none"/>
<text class="l" x="468" y="172">1.54×</text>
<path d="M60 200 C110 192 170 190 460 190" stroke="var(--muted-foreground)" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="4 3" fill="none"/>
<text class="l" x="468" y="196">1.21× halving</text>
<text class="l" x="60" y="218">cycle 0</text><text class="l" x="460" y="218" text-anchor="end">cycle 10</text>
<path d="M20 236 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="258">whether it compounds depends on what each gain does to the next one</text>
</svg>
<figcaption>A start of 10% says nothing about where the loop ends. The decay rate does.</figcaption>
</figure>

## The real bottleneck: measurement

Step 3 is where the loop is weakest, and it is easy to quantify.

Suppose the evaluation is a benchmark of 500 questions on which the system scores about 70%. The standard error of that score is `√(0.7 × 0.3 / 500) = 2.05%`. Comparing two versions doubles the variance, so the difference between them is uncertain by 2.90%.

Now ask: if the candidate is genuinely *worse*, how often does it score higher anyway and get kept?

| true change | kept by a 500-question benchmark |
| --- | --- |
| −1% (worse) | **36.5%** |
| 0% (no change) | 50.0% |
| +1% | 63.5% |
| +3% | 85.0% |

A regression of one point is accepted more than a third of the time. Run the loop for many cycles and it performs a random walk with a small upward drift — and, worse, it accumulates changes that exploit quirks of the benchmark, because every change that happens to score well is kept whether or not it reflects real capability.

Bigger evaluations help, slowly:

| benchmark size | uncertainty of a difference | a −1% change kept |
| --- | --- | --- |
| 500 | 2.90% | 36.5% |
| 2,000 | 1.45% | 24.5% |
| 10,000 | 0.65% | 6.1% |

Twenty times the evaluation reduces the false-acceptance rate six-fold. And a fixed benchmark used for selection hundreds of times is, by the end, a training set. A self-improving loop is only as good as a measurement that stays honest under repeated optimisation — fresh held-out tasks, varied evaluators, real-world outcomes rather than proxy scores.

## Why it is a safety topic

Every cycle optimises the system toward whatever the evaluation rewards. If that is slightly different from what people actually want, the loop amplifies the difference. Humans in the loop are not there for formality; they are the evaluation that is hardest to game.

The practical safeguards follow from the arithmetic:

- **Gate each change with a human or an independent evaluator,** at least for changes to the improvement process itself.
- **Hold out evaluation data the loop never sees,** and rotate it.
- **Bound what the loop may change.** Prompts and tool code are reviewable; unsupervised edits to weights and training code are not.
- **Log every accepted change,** so regressions can be traced and reverted.

## What to take away

Recursive self-improvement is a loop where the system improves the thing that improves it. Whether that compounds — 4.36× in ten cycles — or plateaus at 1.21× depends on whether gains make the next gain larger or smaller, and that is not known in general.

What is known is that the loop cannot be better than its evaluation. On a 500-question benchmark, a change that makes things 1% worse is kept 36.5% of the time. Honest, fresh, hard-to-game measurement is the actual engine, and human review is part of it.
