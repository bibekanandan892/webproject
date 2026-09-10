---
title: "Large reasoning models"
date: "2026-09-10T17:00"
category: "AI"
tags: ["reasoning", "test-time-compute", "rlvr", "thinking-tokens", "cost"]
summary: "A reasoning model spends thousands of tokens working before it answers. Those tokens are billed, they set the latency, and they are the reason it gets harder problems right."
draft: false
cover: "/blog/large-reasoning-models.svg"
---

An ordinary language model answers immediately. The first token of its reply is produced straight after the question, and everything follows from there.

A reasoning model does not. It first generates a long stretch of working — laying the problem out, computing, checking itself, sometimes going back — and only then writes the answer.

That working is made of ordinary tokens. It is generated exactly the way the answer is, and it is billed exactly the way the answer is.

## What the working looks like

*A van leaves at 08:20 averaging 54 km/h. A second leaves the same place at 09:05 averaging 72 km/h. When does the second catch the first?*

The trace runs something like this:

> The second leaves 45 minutes later, so the first has a head start. Head start = 45 × 54 = 2,430 km.
>
> That cannot be right — 2,430 km in 45 minutes. The 45 is in minutes and the speed is per hour. 45 minutes is 0.75 h, so the head start is 0.75 × 54 = **40.5 km**.
>
> The second gains at 72 − 54 = 18 km/h. Closing 40.5 km takes 40.5 ÷ 18 = **2.25 h**.
>
> 2.25 h after 09:05 is **11:20**.
>
> Check: the second travels 72 × 2.25 = 162 km. The first has been going from 08:20 to 11:20, which is 3 h, so 54 × 3 = 162 km. Same. ✓

Three behaviours in there, and they are the point.

It **broke the problem down** rather than reaching for the answer. It **caught its own mistake** — the units slip in the first line is exactly the error a model answering directly would have carried through to a confident wrong answer. And it **checked the result by a different route**, computing the same distance two ways.

None of that is reasoning in any deep sense. It is a learned habit of producing text that has those shapes, and the habit is worth a great deal on problems where a single slip ruins the answer.

## Where the ability comes from

Not from the pre-training, and not from instruction tuning. From a third stage that only works on problems whose answers can be **checked automatically**.

Take a hard problem with a known answer. Have the model produce many attempts in parallel — a few dozen. Run each one's final answer through a checker: is the number right, do the unit tests pass, does the proof hold. Score each attempt against how the rest of the group did, then reinforce the patterns in the ones that worked.

The checker is what makes this possible and what limits it. Nobody has to grade the reasoning — only the final answer, and only in domains where correctness is mechanically decidable. Which is why reasoning models are strongest at maths, code and formal logic, and much less transformed on questions where nothing can be automatically verified.

What gets learned is not the answers. It is the habits: decompose, check units, verify by a second method, notice when a number is absurd.

## Thinking longer works, and it is not free

<figure>
<svg viewBox="0 0 560 200" width="560" role="img" aria-label="Two paths drawn to scale. A direct model goes from question to a short answer. A reasoning model goes from question through a very long thinking block before reaching an answer of the same size." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.g{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="lr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="30" y="20">DRAWN TO SCALE</text>
<text class="g" x="30" y="44">direct</text>
<rect x="30" y="52" width="80" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 32%, transparent)"/>
<text class="g" x="70" y="71" text-anchor="middle">question</text>
<path d="M114 67 H126" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.3" marker-end="url(#lr)"/>
<rect x="132" y="52" width="80" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="b" x="172" y="71" text-anchor="middle">answer</text>
<text class="g" x="222" y="71">200 tokens</text>
<text class="g" x="30" y="116">reasoning</text>
<rect x="30" y="124" width="80" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 32%, transparent)"/>
<text class="g" x="70" y="143" text-anchor="middle">question</text>
<path d="M114 139 H126" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.3" marker-end="url(#lr)"/>
<rect x="132" y="124" width="298" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 42%, transparent)" stroke-dasharray="5 4"/>
<text class="b" x="281" y="143" text-anchor="middle">thinking · 8,192 tokens</text>
<path d="M434 139 H446" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.3" marker-end="url(#lr)"/>
<rect x="452" y="124" width="80" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="b" x="492" y="143" text-anchor="middle">answer</text>
<text class="g" x="30" y="184">the dashed block is billed and timed exactly like the solid one</text>
</svg>
<figcaption>The user sees the same short answer in both cases. The bill does not.</figcaption>
</figure>

Accuracy on hard problems rises with the amount of working — more attempts, longer traces, or both. That is a real and repeatable effect, and it is what makes these models worth having.

The cost is straightforwardly proportional. At $12 per million output tokens and around 80 tokens a second:

| thinking tokens | billed | cost | vs direct | latency |
| --- | --- | --- | --- | --- |
| 0 | 200 | $0.0024 | 1× | 2.5 s |
| 1,024 | 1,224 | $0.0147 | 6× | 15 s |
| 8,192 | 8,392 | $0.1007 | **42×** | 105 s |
| 32,768 | 32,968 | $0.3956 | **165×** | 412 s |

Two things follow.

The user sees a 200-token answer in every row. Nothing on screen indicates whether it cost $0.0024 or $0.40, which makes reasoning spend easy to lose track of — it is invisible in the output and only appears on the bill.

And the latency is not a queue or a slow server. Generating 32,000 tokens takes as long as generating 32,000 tokens.

## Using them well

**Do not use one for easy work.** A summary or a reformat gains nothing from a thinking trace and pays the full multiple for it. The gap only appears on problems with enough steps for a slip to matter.

**Set a budget.** Uncapped thinking on production traffic makes costs unpredictable, because the model decides how long to think. A fixed ceiling — a few thousand tokens normally, more for known-hard requests — makes the bill bounded.

**Do not tell it to think step by step.** That instruction exists to induce working in models that were not trained to produce it. A model already trained to think does it anyway, and being told again mostly disrupts the pattern it learned.

**Never show the trace as the answer.** It contains abandoned approaches and corrected mistakes — the 2,430 km line above is in there. It is working, not output.

## The short version

- A reasoning model generates a long trace of working before its answer.
- The trace is made of ordinary tokens: generated, billed and timed like any others.
- Its useful habits are decomposition, self-correction, and verifying by a second method.
- It is trained by generating many attempts to problems with checkable answers and reinforcing the ones that come out right.
- That is why the gains concentrate in maths, code and logic — the domains a checker can grade.
- Accuracy rises with thinking, and so does cost: 8,192 thinking tokens is 42× a direct answer.
- The user sees the same short answer either way, which is what makes the spend easy to miss.
