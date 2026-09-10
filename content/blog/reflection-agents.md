---
title: "Reflection agents"
date: "2026-09-10T14:20"
category: "AI"
tags: ["agents", "reflection", "critic", "revision", "quality"]
summary: "The agent writes something, criticises its own draft, and rewrites. It works because judging is an easier job than writing — and it fails in a specific way when the critic asks for facts it cannot check."
draft: false
cover: "/blog/reflection-agents.svg"
---

A reflection agent produces a draft, reads it back critically, and rewrites it using its own criticism. Round and round until the criticism runs out or the budget does.

Usually the critic is the same model as the writer, with a different prompt.

## Why criticising yourself works at all

That last sentence should look suspicious. If the model could write a better draft, why did it not write one first?

Because the two are different jobs. Writing means producing something from a blank page while holding the whole task in mind at once. Judging means reading a finished artefact that is now sitting in the context window, and checking it against stated criteria. The second task has more to work with — the draft exists, and its weaknesses are in front of the model rather than hypothetical.

That also bounds what reflection can do. A critic with no access to anything outside the draft can only check *internal* properties: is it clear, is it complete against the brief, does it contradict itself. It cannot check whether anything in it is true.

Which leads directly to the characteristic failure.

## One running

Task: write the release note for a caching change.

<figure>
<svg viewBox="0 0 560 264" width="560" role="img" aria-label="Three drafts down the left, each followed by a critique on the right that feeds into the next draft. The third draft is accepted." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.c{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="rf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="40" y="20">THE DRAFT IS WHAT CHANGES</text>
<rect x="40" y="36" width="180" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="130" y="63" text-anchor="middle">draft 1 · vague</text>
<rect x="320" y="36" width="160" height="44" rx="8" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="c" x="400" y="63" text-anchor="middle">critic</text>
<rect x="40" y="116" width="180" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="130" y="143" text-anchor="middle">draft 2 · invented</text>
<rect x="320" y="116" width="160" height="44" rx="8" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="c" x="400" y="143" text-anchor="middle">critic + tool</text>
<rect x="40" y="196" width="180" height="44" rx="8" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<text class="b" x="130" y="223" text-anchor="middle">draft 3 · checked</text>
<text class="l" x="240" y="223">accepted</text>
<path d="M220 58 H314" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rf)"/>
<path d="M400 80 V98 H130 V110" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rf)"/>
<path d="M220 138 H314" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rf)"/>
<path d="M400 160 V178 H130 V190" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rf)"/>
</svg>
<figcaption>Nothing is retrieved and nothing acted on. Each round rewrites the same artefact.</figcaption>
</figure>

**Draft 1.** *"This release improves performance. Caching has been added to the API."*

**Critique.** Too vague to be useful. Does not say which endpoints changed, gives no measure of the improvement, and does not say who needs to do anything.

**Draft 2.** *"Response caching now cuts p95 latency on the reports endpoint by 43%…"*

That reads much better. It is also partly invented. Nobody measured 43% — the critic asked for a number, the generator had none, and producing plausible text is what it does.

This is the failure that matters, and note how it happens: the critique was correct. "Be specific" was good feedback. The problem is that a critic which can only read the draft has no way to distinguish a specific fact from a specific-sounding one, so its pressure toward detail becomes pressure toward fabrication.

**The fix is to give the critic something to check against.** Let it read the benchmark file. Now it finds no 43% anywhere and rejects the draft on that basis.

**Draft 3.** States the endpoints from the diff and the measured figure from the benchmark, and says nothing about numbers that were never recorded.

## What actually changes each round

Worth being precise, because several agent patterns look similar from a distance.

Here the thing being revised is the **output itself**. Round three's draft replaces round two's. The loop is about polish, and it terminates when the criticism stops finding anything.

That is different from a loop that gathers information, where each round adds an observation and nothing earlier is replaced. If the task needs facts from outside, gathering is the loop you want; reflection will simply produce a better-written version of what the model already believed.

## How it fails

**The critic is too kind.** It says the draft is good, and the loop ends on round one having achieved nothing. Demand specific issues against named criteria rather than an overall verdict.

**The critique is unusable.** "Improve the wording" cannot be acted on. Feedback should name what to change and to what.

**The revision is worse.** It happens. Keep the previous draft and compare; do not assume the newest is best.

**It never stops.** Each round finds something new. Cap the rounds — two or three is usually plenty — and stop when consecutive critiques make substantially the same point.

**It drifts.** After three rounds of polishing, the text is elegant and no longer answers the brief. Put the original task in every critique prompt and have the critic check alignment before anything else.

**It costs a multiple.** Three rounds is roughly seven model calls where one would have done. Reflection is for tasks where quality is worth that, and skipping it entirely is correct for most tasks.

## When to use it

When the first attempt is reliably not good enough and the improvement is judgeable from the artefact — writing that has to hit a brief, code with a specification to check against, anything with clear criteria.

Not for simple questions, where the first answer is usually right and the extra rounds only add cost and drift. Not for anything latency-sensitive. And not as a substitute for retrieval: if the model does not know something, criticising it will not teach it.

## The short version

- Generate a draft, critique it, revise, repeat.
- The critic is usually the same model — judging a finished draft is an easier task than writing one.
- A critic with no external access can only check internal qualities, never truth.
- That is why pushing for specifics induces invented specifics; the fix is giving the critic something to verify against.
- What changes each round is the output, not the information available.
- Cap the rounds, keep the old draft, and stop when the criticism repeats itself.
- Every round is more model calls, so use it only where quality is worth the multiple.
