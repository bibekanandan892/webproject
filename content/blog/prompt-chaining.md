---
title: "Prompt Chaining"
date: "2026-09-11T20:20"
category: "AI"
tags: ["prompt-chaining", "prompting", "reliability", "workflows", "llm"]
summary: "Splitting a task across several prompts makes each step more reliable and makes more steps that all have to work. Those pull against each other, and the result is an optimal chain length that is shorter than most people assume."
draft: false
cover: "/blog/prompt-chaining.svg"
---

Prompt chaining is doing a job in several model calls instead of one, where each call's output feeds the next.

The case for it is straightforward: a prompt asked to do one thing does it better than a prompt asked to do five. The case against it is equally straightforward and gets mentioned less: five steps that must all succeed is a harder bar than one.

Both are true, so there is an answer to "how many steps", and it is computable.

## The two forces

Take a job with five parts — read a document, pull out the commitments in it, judge which are overdue, rank them, write a summary.

Asked as one prompt, the model does all five at once. Say it gets the whole thing right 70% of the time: it drops a commitment, or ranks well but summarises badly.

Split it up and each step is narrower, so each step is more reliable. But the chain only works if every step works, and between steps something can be lost — a step's output is the next step's only view of the world, so anything it omitted is gone.

Writing both effects down, with per-step reliability improving as the scope narrows and a 1% chance of a handoff losing something:

| steps | per-step reliability | whole chain |
| --- | --- | --- |
| 1 | 70.0% | 70.0% |
| 2 | 85.0% | **71.5%** |
| 3 | 90.0% | 71.4% |
| 5 | 94.0% | 70.5% |
| 10 | 97.0% | 67.4% |
| 20 | 98.5% | 61.1% |

The best chain here is two or three steps. At twenty steps each step is 98.5% reliable — excellent — and the chain is *worse than the monolithic prompt it replaced*.

(The reliability figures are a model, not a measurement of your system. The shape is what transfers: per-step accuracy rises quickly and then flattens, while the number of things that must all go right keeps multiplying. Only the first few splits are clearly worth it.)

Even with no handoff loss at all, the gain is bounded. Splitting a 70%-reliable task into ever-finer steps converges to 74.1% and no further. The ceiling is low because the total amount of work did not change.

<figure>
<svg viewBox="0 0 560 276" width="560" role="img" aria-label="A curve of end-to-end chain reliability against the number of steps, rising to a peak at two or three steps and then falling below the single-prompt baseline." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">MORE STEPS IS NOT MORE RELIABLE</text>
<path d="M60 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="26" y="44">75%</text>
<text class="l" x="26" y="114">68%</text>
<text class="l" x="26" y="194">60%</text>
<path d="M60 90 H520" stroke="var(--muted-foreground)" stroke-opacity="0.4" stroke-dasharray="5 4"/>
<text class="l" x="392" y="86">70.0% — one prompt</text>
<path d="M60 90 L84 75 L108 76 L133 80 L157 85 L181 91 L229 103 L278 116 L399 148 L520 179" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="84" cy="75" r="4.4" fill="var(--primary)"/>
<text class="b" x="94" y="66">71.5% at 2 steps</text>
<circle cx="278" cy="116" r="3.6" fill="var(--muted-foreground)"/>
<text class="l" x="236" y="134">10 steps — worse than not splitting</text>
<text class="l" x="60" y="212">1</text>
<text class="l" x="181" y="212" text-anchor="middle">6</text>
<text class="l" x="520" y="212" text-anchor="end">20 steps</text>
<path d="M20 230 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="252">at 20 steps each step is 98.5% reliable and the chain is 61.1%</text>
</svg>
<figcaption>Per-step accuracy and the number of steps move in opposite directions. Only the first couple of splits are clearly worth it.</figcaption>
</figure>

## What the splits should be

Given that only a few are worth making, they should be the ones that matter. Three shapes earn their place.

**Extract, then act.** The first call pulls structured facts out of messy text; the second works on the structure. This split is valuable because the two halves fail differently — extraction fails by missing something, reasoning fails by being wrong about something — and a single prompt doing both makes those failures indistinguishable.

**Generate, then check.** One call produces a draft, a second inspects it against explicit criteria. This works because judging output is a genuinely different task from producing it, and a model reviewing text it can see is more reliable than the same model trying to get it right while writing.

**Decide, then route.** One call classifies the input; the branch decides which specialised prompt handles it. This is the one split that reduces total work rather than adding to it, because each branch prompt is smaller than a prompt covering every case.

What does not earn its place is splitting on a boundary that exists only in your head. "Summarise, then shorten the summary" is two calls doing one thing, and the second call's only input is already-lossy text.

## The other costs

**Latency multiplies.** One call at 1.8 s against five at 1.1 s each is 5.5 s — **3.1× slower** for a reliability difference that was, on the numbers above, slightly negative.

**Every step is billed.** And the intermediate outputs become inputs, so a chain's token count is higher than the sum of its prompts.

**Errors propagate silently.** A wrong step-two output is a perfectly reasonable-looking step-three input. The model downstream has no way to know it is working from something false, and will produce a confident answer built on it.

That last one is worth designing for. The counter-measure is to make each step's output checkable — a schema, a required citation, a field that can be validated against the source — so a bad handoff fails loudly instead of quietly flowing onward.

## What chaining is genuinely good at

Debuggability, which is not a reliability claim but is often the real reason to do it.

When one prompt does five things and the output is wrong, you have one string to inspect and no idea which part failed. When five prompts do one thing each, the broken step is visible, fixable in isolation, and testable on its own. You can put an assertion between steps. You can cache step one.

That is a strong argument, and it is a maintenance argument rather than an accuracy one. Worth being honest about which you are buying.

## What to take away

Splitting a task helps, and it helps much less than the per-step numbers suggest, because the steps multiply.

Two or three deliberate splits — along boundaries where the failure modes genuinely differ — capture nearly all of the available gain. Beyond that you are paying latency and tokens to make the chain less reliable, with each individual step looking better than ever.
