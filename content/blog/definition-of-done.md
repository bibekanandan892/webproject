---
title: "Definition of Done"
date: "2026-09-12T05:20"
category: "AI"
tags: ["verification", "agents", "evaluation", "specification", "testing"]
summary: "A loop stops when its checker passes, so the checker sets a ceiling on quality that no number of attempts can lift. Tightening the checker buys more than improving the model does."
draft: false
cover: "/blog/definition-of-done.svg"
---

A definition of done is two things: a goal, and a way to check the goal. The second half is the one that gets left out, and it is the one that decides whether a model can work on the task at all.

## Exact, and fuzzy

Some definitions of done are mechanical:

- `applyBulkDiscount(1000, 20)` returns `800`
- the project compiles with no errors
- this query returns exactly these 14 rows
- the reported bug no longer reproduces

Each of those is a command with an exit code. No judgement involved, no disagreement possible.

Others are not:

- "build the sign-in flow"
- "write a good summary"
- "make this module more readable"
- "design a clean structure for this"

These are not vague because whoever wrote them was careless. They are genuinely underspecified — "build the sign-in flow" leaves open what happens when the network drops mid-request, how long a session lasts, what the error message says, and what counts as acceptable structure. Those decisions exist whether or not anyone wrote them down.

## Why the checker sets a ceiling

Here is the part worth making precise.

A loop attempts the work, runs the checker, and stops when the checker passes. So what the loop produces is not "correct output" — it is **whatever passes the checker**. Those are the same thing only if the checker is perfect.

Say each attempt is genuinely correct 55% of the time, and some fraction of *wrong* attempts pass the checker anyway:

| wrong answers the checker lets through | output actually correct |
| --- | --- |
| 0% | 100.0% |
| 5% | 96.1% |
| 10% | 92.4% |
| 15% | 89.1% |
| 25% | **83.0%** |
| 40% | 75.3% |

That is a **ceiling**. More attempts do not raise it — they raise the chance of stopping, and the stopping condition is what is flawed. A loop with a 25% false-pass rate produces wrong output 17% of the time no matter how long it runs.

And the leverage sits entirely on the checker:

| change | resulting ceiling |
| --- | --- |
| tighten the checker from 25% to 5% false passes | 83.0% → **96.1%** |
| improve the model from 55% to 75% per attempt, checker unchanged at 25% | 83.0% → 92.3% |

Tightening the checker beats improving the model, and it is usually the cheaper of the two.

<figure>
<svg viewBox="0 0 560 314" width="560" role="img" aria-label="A falling curve of achievable correctness against the fraction of wrong answers the checker lets through, with a marker showing that improving the model helps less than tightening the checker." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE CHECKER IS THE CEILING</text>
<path d="M60 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="26" y="46">100%</text>
<text class="l" x="34" y="119">85%</text>
<text class="l" x="34" y="194">70%</text>
<path d="M60 40 L106 60 L152 78 L198 95 L244 110 L290 125 L336 139 L382 151 L428 163 L474 175 L520 185" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="106" cy="60" r="4" fill="var(--primary)"/>
<text class="b" x="116" y="56">5% → 96.1%</text>
<circle cx="290" cy="125" r="4.4" fill="var(--muted-foreground)"/>
<text class="l" x="300" y="130">25% → 83.0%</text>
<path d="M290 121 V82" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4" stroke-dasharray="4 3"/>
<circle cx="290" cy="78" r="4" fill="var(--muted-foreground)"/>
<text class="l" x="300" y="74">a much better model, same checker → 92.3%</text>
<text class="l" x="60" y="210">0</text>
<text class="l" x="290" y="210" text-anchor="middle">25%</text>
<text class="l" x="520" y="210" text-anchor="end">50% of wrong answers pass</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="252">moving left along this curve beats moving up it</text>
<text class="l" x="20" y="274">because the loop stops on the checker, not on being right</text>
<text class="l" x="20" y="292">more attempts move neither</text>
</svg>
<figcaption>The vertical jump is what a large model improvement buys. The horizontal move is what a better test buys.</figcaption>
</figure>

## What the checker buys besides quality

It also decides who has to be present.

With a perfect checker and a 55% per-attempt success rate, four attempts reach 95.9%. The model runs those four attempts on its own, and a person looks at the result once.

Without a checker, every attempt needs a human to say whether it worked. Same four attempts, four reviews — and the person is now the slow part of a loop that was supposed to save their time.

That is the practical reason this matters more for agents than for chat. A single response gets read by a person anyway. A loop that is supposed to run unattended cannot run at all without something to tell it when to stop.

## Moving a fuzzy goal toward a checkable one

The work is not writing the goal more forcefully. It is naming the decisions the goal left open.

"Make this module more readable" becomes:

- no function longer than 40 lines
- no nesting deeper than three levels
- every exported function has a doc comment
- the existing test suite still passes
- the public interface is unchanged

None of those is *readability*. Together they capture enough of it to be checkable, and the residue — whether the naming is good, whether the structure makes sense to someone new — is the part that genuinely needs a person.

That split is the useful output of the exercise. You end up with a mechanical part a loop can grind on, and a small judgement-shaped part for review. Which is a much better division of labour than handing over the whole fuzzy thing and reviewing all of it.

## The honest limit

Some work has no exact checker and never will. Is this design right for where the product is going. Is this abstraction one someone will understand in a year. Does this summary emphasise what the reader cares about.

For those, a model is a source of drafts and a person is the definition of done. That is a legitimate way to work and it is worth recognising as different — it does not become an unattended loop by being wrapped in one.

## What to take away

Before handing work to a model, answer one question: **what command tells me this is finished?**

If there is one, the loop can run itself, and the effort belongs in making that command strict — because the loop's ceiling is the checker's precision, and no amount of model improvement or extra attempts moves it. If there is not one, say so, and plan for a person in the loop rather than discovering it when the output is confidently wrong.
