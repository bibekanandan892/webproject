---
title: "Agent Skills"
date: "2026-09-12T00:00"
category: "AI"
tags: ["agent-skills", "context", "progressive-disclosure", "agents", "tooling"]
summary: "Loading fifty procedures eagerly costs 210,000 tokens and does not fit. Loading their descriptions costs 4,750, which makes the whole thing work — and turns the real problem into a fifty-way choice made from twenty words."
draft: false
cover: "/blog/agent-skills.svg"
---

An agent skill is a folder containing instructions — and optionally scripts and reference files — that an agent loads by itself when it recognises the situation.

It exists because the alternative does not fit.

## Why not just put it in the prompt

A team accumulates procedures: how a release note is formatted, which checks run before a deploy, what a data export has to include, the conventions a migration follows. Written down, each is a page or two — call it 4,200 tokens.

Fifty of those, loaded on every request:

| | tokens |
| --- | --- |
| 50 procedures, fully loaded | 210,000 |
| a 200,000-token context window | 200,000 |

It is over budget before the agent has read a single file of yours. And even if it fitted, 49 of the 50 are irrelevant to whatever was asked — diluting attention and paying for context that will not be used.

## Loading in stages

The answer is to load almost nothing and expand on demand.

**Level one** is a name and a one-line description, about 95 tokens per skill. Always present.

**Level two** is the full instructions, loaded only for the skill that matched — 4,200 tokens.

**Level three** is whatever the instructions themselves point at: a longer reference, a schema, an example file. Read only if the work needs it.

| | tokens |
| --- | --- |
| 50 descriptions | 4,750 |
| one skill expanded | 4,200 |
| **total** | **8,950** |

**23× less** than loading everything, and the descriptions cost 2.4% of the window — an amount you would not notice.

<figure>
<svg viewBox="0 0 560 300" width="560" role="img" aria-label="A bar for fifty fully loaded procedures overflowing the context window, against a small bar for fifty descriptions plus one expanded skill." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">LOAD THE INDEX, NOT THE LIBRARY</text>
<rect x="20" y="40" width="476" height="20" rx="3" fill="none" stroke="var(--primary)" stroke-opacity="0.5" stroke-dasharray="5 4"/>
<text class="b" x="20" y="76">the window — 200,000 tokens</text>
<text class="l" x="20" y="106">everything loaded</text>
<rect x="20" y="114" width="500" height="22" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 52%, transparent)"/>
<text class="l" x="30" y="129">210,000 — does not fit</text>
<text class="l" x="20" y="164">descriptions, then one skill</text>
<rect x="20" y="172" width="11" height="22" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<rect x="33" y="172" width="10" height="22" rx="2" fill="color-mix(in srgb, var(--primary) 25%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="b" x="52" y="188">8,950 — 23× less</text>
<path d="M20 214 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="238">the 44 skills that did not fire cost 4,180 tokens — 2.1% of the window</text>
<text class="b" x="20" y="260">so unused skills are not the problem. being picked wrongly is.</text>
<text class="l" x="20" y="278">selection is a 50-way choice made from twenty words each</text>
</svg>
<figcaption>The saving is large and easy. What it buys is a harder problem: choosing correctly from descriptions alone.</figcaption>
</figure>

## The description is the whole interface

Here is the consequence that matters, and it follows directly from the staging.

At level one the agent sees nothing but the descriptions. Whether a skill is ever used is decided entirely by whether its one line matches the situation — so the description is not a label, it is the trigger.

Which means the work of writing a good skill is mostly the work of writing that line. Two failures:

**Too vague.** "Helps with reports" matches nothing in particular and will be skipped in favour of doing the work from scratch. The instructions inside may be excellent and will never be read.

**Too broad.** "For any data-related task" matches constantly, including when something else was the right choice, and now a specific procedure is being applied to a situation it was not written for.

The useful shape is to say *when*, not *what*: "Use when producing the weekly operations summary — covers the required sections, the metric definitions, and the sign-off order." Someone reading that knows whether it applies. So does a model.

## What unused skills actually cost

Worth doing this arithmetic because the intuition is wrong.

Of 50 skills, suppose 6 are relevant in a typical session. The other 44 cost 44 × 95 = **4,180 tokens** — 2.1% of the window. Negligible.

So the reason to prune a skill collection is not token cost. It is that every added skill makes the selection problem harder: fifty descriptions that overlap are harder to choose between than twenty that do not. Keep them because they are distinguishable, delete them because they are confusable, and do not think about the tokens at all.

## Carrying code

A skill can include scripts, and this is more than a convenience.

Asking the model to write the code costs around 700 tokens and produces something slightly different every time. Invoking a script costs about 40 tokens and produces exactly the same behaviour on every run — 17.5× cheaper and, more importantly, deterministic.

Which suggests the division: put the *judgement* in the instructions and the *mechanics* in a script. Anything with a single correct implementation should not be regenerated on each use.

## Where it sits next to a connectivity protocol

Two different questions, often confused because both extend an agent.

A connectivity protocol answers **what can the agent reach** — it exposes tools and data sources that were previously unreachable.

A skill answers **how should this be done here** — it supplies procedure for something already reachable.

An agent with tools and no procedure will do the work in a way that is reasonable and not yours. An agent with procedure and no tools cannot do the work at all. They are additive.

## What to take away

Progressive disclosure is the mechanism, and it is not complicated: keep an index in context, expand one entry when it matches.

The interesting part is what that shifts. Once loading is cheap, the constraint stops being context and becomes selection — and a skill's value is decided by one line of description that has to be specific enough to be recognised and narrow enough not to be recognised wrongly.
