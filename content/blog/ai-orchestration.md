---
title: "AI orchestration"
date: "2026-09-10T20:20"
category: "AI"
tags: ["orchestration", "workflows", "latency", "cost", "patterns"]
summary: "Wiring several model calls and tools into one workflow. The shape you choose is not a style preference — it decides latency, cost, and how much you can debug."
draft: false
cover: "/blog/ai-orchestration.svg"
---

One model call rarely finishes a real job. Something has to fetch the documents, call the model, check the output, call it again with different instructions, handle the tool that failed, and return an answer.

Orchestration is that wiring: which components run, in what order, what is passed between them, and what happens when one of them breaks.

The important distinction is who decides the order. In orchestration **you** decide, in code, before anything runs. That is the whole difference from letting the model choose its own path — you trade the ability to handle open-ended work for predictability, cheaper failure modes, and a system you can actually debug.

## The shapes, with their costs

Take a job made of five sub-steps, each about 1.2 seconds and $0.004.

<figure>
<svg viewBox="0 0 620 250" width="620" role="img" aria-label="Three workflow shapes drawn to the same time scale: sequential steps end to end, parallel steps stacked, and an orchestrator-worker shape with a split before and a combine after the parallel block." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">SAME WORK, THREE SHAPES, SAME TIME SCALE</text>
<text class="l" x="112" y="54" text-anchor="end">sequential</text>
<rect x="122" y="40" width="66" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="190" y="40" width="66" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="258" y="40" width="66" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="326" y="40" width="66" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="394" y="40" width="66" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="v" x="470" y="54">6.0 s</text>
<text class="l" x="112" y="98" text-anchor="end">parallel</text>
<rect x="122" y="72" width="66" height="14" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="122" y="88" width="66" height="14" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="122" y="104" width="66" height="14" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="122" y="120" width="66" height="14" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="122" y="136" width="66" height="14" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="198" y="98">1.2 s</text>
<text class="l" x="112" y="190" text-anchor="end">orchestrator</text>
<rect x="122" y="164" width="82" height="18" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)"/>
<rect x="206" y="160" width="66" height="12" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="206" y="174" width="66" height="12" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="206" y="188" width="66" height="12" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="206" y="202" width="66" height="12" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="274" y="164" width="110" height="18" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)"/>
<text class="v" x="394" y="178">4.7 s</text>
<text class="l" x="122" y="236">grey blocks are the split and combine calls the other shapes do not need</text>
</svg>
<figcaption>Parallelism is free when the steps are genuinely independent. Everything else costs something.</figcaption>
</figure>

| | latency | cost | model calls |
| --- | --- | --- | --- |
| sequential | 6.0 s | $0.0200 | 5 |
| parallel | **1.2 s** | $0.0200 | 5 |
| orchestrator and workers | 4.7 s | $0.0360 | 7 |
| conditional, 2 of 5 run | 2.4 s | **$0.0080** | 2 |

Four things worth reading off that.

**Parallel is a free five-fold speedup** — identical cost, same calls, just not waiting. The only requirement is that the steps do not depend on each other, and the most common orchestration mistake is running steps in sequence that never needed to be.

**Orchestrator-and-workers costs 80% more** than plain parallelism, because the split and the combine are extra model calls. You are paying for a model to decide the decomposition. Worth it when the decomposition genuinely varies; wasteful when you already know it.

**Conditional routing is the only pattern that saves money**, because it is the only one where work does not happen. Running two of five steps costs 60% less than running all five, and most requests do not need every step.

**Loops are the one that can run away.** Generate, check, fix, re-check — potentially forever. Every loop needs a hard iteration cap, and the cap is not a safety net, it is the exit condition.

## Retries are cheaper than they look

Chains fail step by step. With a 99% per-step success rate, a five-step chain finishes 95.1% of the time — the failures compound.

| | chain completes |
| --- | --- |
| no retry | 95.10% |
| one retry per step | **99.95%** |
| two retries per step | 99.9995% |

One retry per step takes the failure rate from one in twenty to one in two thousand. And it costs almost nothing on average, because the retry only fires on the 1% of steps that failed — roughly a 1% increase in calls for a fortyfold improvement in reliability.

This is the highest-value thing in a workflow and it is routinely left out, because chains work fine in testing where nothing fails.

## What actually goes wrong

**Cascades.** Step two produces something malformed and steps three through five produce garbage from it. Validating between steps is unglamorous and stops the wrong error from being the one you see.

**State corruption.** Steps write into shared state, and one writing an unexpected shape breaks a later step that reads it. This looks like a bug in the later step.

**Prompt drift.** Someone improves step two's prompt, and its output format shifts slightly, and step three — which parsed the old format — quietly starts failing on some inputs.

**Invisibility.** With seven components and branching, "it gave a bad answer" does not localise. Every step needs its inputs, outputs, duration and cost logged, or debugging is guesswork.

**Cost blindness.** Five calls per request looks fine until it is five calls times the traffic. Track cost per request from the first day, not after the first bill.

## Building one

Start with plain code. A framework earns its place when you need branching, loops and state that plain functions have stopped expressing clearly — not before.

Use the smallest model that works for each step. Classification and formatting steps do not need your best model, and in a five-step workflow the difference is multiplied by five.

Keep prompts in one place so they can be versioned and diffed. Test each step alone before testing the whole thing, because end-to-end failures on a non-deterministic system are miserable to localise.

Validate at the boundaries — what comes in from the user, what goes out to them.

And put a human in front of anything irreversible. Sending, paying, deleting: an approval step costs a moment and prevents the class of failure you cannot undo.

## The short version

- Orchestration is coordinating model calls, tools and data into one workflow, with the order fixed in code.
- Sequential, parallel, conditional, loop, and orchestrator-with-workers are the shapes.
- Parallel is a free speedup on independent steps — five steps in the time of one, same cost.
- Orchestrator-and-workers costs about 80% more for the split and combine calls.
- Conditional routing is the only pattern that saves money, because work is skipped.
- One retry per step takes a five-step chain from 95.1% to 99.95%, for about 1% more calls.
- Log every step's input, output, duration and cost, or you cannot debug it.
- Require human approval for anything that cannot be undone.
