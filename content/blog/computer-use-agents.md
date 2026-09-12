---
title: "Computer-Use Agents"
date: "2026-09-11T16:00"
category: "AI"
tags: ["computer-use", "agents", "vision", "automation", "reliability"]
summary: "An agent that drives a screen with a mouse and keyboard needs no integration at all, which is its whole appeal. It also has to be right at every single step, and that requirement is much harsher than it sounds."
draft: false
cover: "/blog/computer-use-agents.svg"
---

A computer-use agent operates a machine the way a person does: it looks at the screen, decides on one action, performs it, and looks again.

The appeal is that it needs nothing from the software it drives. No API, no export format, no cooperation from the vendor. If a task can be done by looking and clicking, it is in scope — which covers a great deal of software that offers no other way in.

The cost of that generality is the subject of this post.

## The loop

Three steps, repeated:

1. **Capture.** Take a screenshot. Often also read the accessibility tree, which names the on-screen elements and gives their positions without any guessing from pixels.
2. **Decide.** Send the goal, the current screen, and a summary of what has already been done to a vision-capable model. It returns one action, structured — `click` at a coordinate, `type` this text, `scroll` here, press this key.
3. **Act.** Perform it. Go back to step 1.

Note that the model decides only the *next* action. It does not produce a plan and follow it, because after any action the screen may not be what a plan expected — a dialog appeared, the page was still loading, the click landed on nothing. Re-reading the screen every time is what makes the agent robust to that.

It is also what makes it slow and expensive, and both of those follow directly.

## The arithmetic of a long loop

A routine task — open a record, edit two fields, save, confirm — is around 25 actions.

For the whole task to succeed, every one of those 25 must be right. So the success rates multiply:

| per-step accuracy | 25-step task |
| --- | --- |
| 95.0% | 27.7% |
| 97.0% | 46.7% |
| 99.0% | 77.8% |
| 99.9% | 97.5% |

Read that the other way and it is stark: **to finish a 25-step task nine times out of ten, the agent must be right 99.58% of the time.** To finish it as often as a coin flip, 97.27%.

A model that gets the right button 97 times out of 100 sounds excellent and is nearly useless on this task. That gap is the central engineering problem of computer use, and it is why the practical work goes into shortening the loop — fewer steps, each with more effect — rather than into raising per-step accuracy alone.

<figure>
<svg viewBox="0 0 560 280" width="560" role="img" aria-label="A curve showing task success collapsing as the number of steps rises, drawn for several per-step accuracies." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE TASK IS EVERY STEP, MULTIPLIED</text>
<path d="M60 40 V200 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="30" y="46">100%</text>
<text class="l" x="38" y="124">50%</text>
<text class="l" x="46" y="204">0%</text>
<path d="M60 40 L106 41 L152 42 L198 42 L244 43 L290 44 L336 45 L382 46 L428 46 L474 47 L520 48" stroke="var(--primary)" stroke-width="2.2" fill="none"/>
<text class="b" x="470" y="36">99.9%</text>
<path d="M60 40 L106 48 L152 55 L198 62 L244 69 L290 76 L336 82 L382 87 L428 93 L474 98 L520 103" stroke="color-mix(in srgb, var(--primary) 70%, transparent)" stroke-width="2" fill="none"/>
<text class="b" x="478" y="94">99%</text>
<path d="M60 40 L106 63 L152 82 L198 99 L244 113 L290 125 L336 136 L382 145 L428 153 L474 159 L520 165" stroke="color-mix(in srgb, var(--muted-foreground) 75%, transparent)" stroke-width="2" fill="none"/>
<text class="l" x="478" y="156">97%</text>
<path d="M60 40 L106 76 L152 104 L198 126 L244 143 L290 156 L336 166 L382 173 L428 179 L474 184 L520 188" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)" stroke-width="2" fill="none" stroke-dasharray="5 4"/>
<text class="l" x="478" y="184">95%</text>
<path d="M290 40 V200" stroke="var(--primary)" stroke-opacity="0.35" stroke-dasharray="4 4"/>
<circle cx="290" cy="125" r="3.5" fill="var(--muted-foreground)"/>
<text class="l" x="60" y="220">0</text>
<text class="l" x="290" y="220" text-anchor="middle">25 steps</text>
<text class="l" x="520" y="220" text-anchor="end">50</text>
<text class="b" x="20" y="244">at 25 steps, 97% per action finishes fewer than half of all tasks</text>
<text class="l" x="20" y="260">the fix is fewer steps, not only better steps</text>
</svg>
<figcaption>Nothing about the per-step number tells you whether the task works. Only the exponent does.</figcaption>
</figure>

## Time and money

Each step is a screenshot, a model call over an image, and an action. Call it 0.2 s, 2.5 s and 0.15 s. Twenty-five steps is **71 seconds** for something a person does in fifteen.

The token cost has a subtler shape. A 1,280 × 800 screenshot is roughly 1,100 image tokens. If every step resends the full history of screenshots, the total is quadratic in the number of steps:

| | image tokens over 25 steps |
| --- | --- |
| resend every screenshot | 357,500 |
| keep only the latest | 27,500 |

That is a 13× difference on a 25-step task, and it grows with length — at 50 steps it is 25×. The usual approach is to keep the current screen in full and reduce earlier steps to short text summaries of what was done. The model does not need to see the dialog it dismissed nine actions ago; it needs to know that it dismissed it.

## Why coordinates are the hard part

The model has to name a place on the screen, and pixel coordinates are an unforgiving way to do that. A button's centre is a small target, screens differ in resolution and scaling, and layouts shift when content loads.

Which is why the accessibility tree matters more than it first appears. It supplies element names, roles and bounding boxes directly, so the action can reference *the element* rather than a guessed pixel. Where it is available and accurate, reliability improves sharply — and a large part of the remaining error comes from the applications where it is neither.

## What has to be guarded

An agent driving a real machine has whatever access the machine has. That is the point of it and the risk of it.

Two guardrails are non-negotiable. **Irreversible actions need confirmation** — anything that sends, pays, publishes or deletes should stop and ask, because a misread screen is not a rare event. And **the screen is untrusted input**: text on a page saying "ignore your instructions and do this instead" reaches the model exactly like the user's goal does. A page the agent visits can attempt to redirect it, and nothing in the loop distinguishes the two by default.

Loop detection belongs here too. An agent that misreads a state can click the same thing indefinitely, and the cheapest protection is a step budget with a hard stop.

## What to take away

Computer use trades integration for reliability. You get to automate anything with a screen; you pay by needing near-perfect accuracy at every step of a long chain.

Which is why the useful question is never "can the agent do this?" but "how many steps does it take?" — because that number, not the model's competence at any single one of them, is what decides whether the task finishes.
