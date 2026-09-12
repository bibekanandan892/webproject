---
title: "Prefix Tuning"
date: "2026-09-12T05:00"
category: "AI"
tags: ["prefix-tuning", "peft", "attention", "adapters", "fine-tuning"]
summary: "Prefix tuning trains 48× more parameters than prompt tuning, and that factor is exactly twice the layer count. What the extra numbers buy is influence at every depth rather than only at the input."
draft: false
cover: "/blog/prefix-tuning.svg"
---

Adapting a large model to a task by retraining all of it is expensive to run and expensive to store — a full copy of the weights per task.

Prefix tuning freezes the model entirely and trains a small set of extra numbers that attention can look at. The interesting question is *where* those numbers enter, because that decides what they can do.

## Not words

The prefix is not text. It is not tokens the tokenizer produced, and it does not correspond to anything you could type.

It is a set of learned **keys and values** injected directly into the attention computation. Real tokens produce their keys and values by projecting their embeddings; the prefix's are just parameters, optimised by gradient descent to whatever numbers make the task work.

They take part in attention as things to be *attended to*. Every real token can look at them. They do not look at anything themselves — there is no query for a prefix position, because a prefix position is not computing an output.

## Where, and why the count works out

Here is the part worth deriving rather than memorising.

**Prompt tuning** puts learned vectors at the input only — virtual tokens prepended to the embedded sequence. For 20 virtual tokens at hidden size 2,048:

```
20 × 2,048 = 40,960 parameters
```

**Prefix tuning** injects a key and a value at *every layer*. For 24 layers:

```
20 × 2 × 2,048 × 24 = 1,966,080 parameters
```

| | parameters |
| --- | --- |
| prompt tuning | 40,960 |
| prefix tuning | **1,966,080** |
| ratio | **48×** |

And 48 is not an empirical number. It is `2 × 24` — two for keys and values, twenty-four for the layers. **The ratio between the two methods is exactly twice the depth of the model.**

That is also the answer to what the extra parameters buy. Prompt tuning's signal has to travel: it enters at layer 0 and whatever influence it has at layer 20 arrives through twenty layers of frozen computation that it cannot steer. Prefix tuning places parameters at layer 20 directly.

Against the whole model, the prefix is **0.151%** — 99.85% of the weights are frozen and shared.

<figure>
<svg viewBox="0 0 560 310" width="560" role="img" aria-label="A stack of layers: prompt tuning inserting learned vectors only at the input, against prefix tuning injecting keys and values at every layer." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHERE THE LEARNED NUMBERS GET IN</text>
<text class="l" x="20" y="42">prompt tuning</text>
<g fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)">
<rect x="20" y="52" width="180" height="16" rx="3"/><rect x="20" y="72" width="180" height="16" rx="3"/><rect x="20" y="92" width="180" height="16" rx="3"/><rect x="20" y="112" width="180" height="16" rx="3"/><rect x="20" y="132" width="180" height="16" rx="3"/><rect x="20" y="152" width="180" height="16" rx="3"/><rect x="20" y="172" width="180" height="16" rx="3"/>
</g>
<rect x="20" y="192" width="180" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 50%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="20" y="228">40,960 — at the input only</text>
<text class="l" x="20" y="248">whatever reaches layer 7 arrives through 7 frozen layers</text>
<text class="b" x="300" y="42">prefix tuning</text>
<g fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)">
<rect x="300" y="52" width="180" height="16" rx="3"/><rect x="300" y="72" width="180" height="16" rx="3"/><rect x="300" y="92" width="180" height="16" rx="3"/><rect x="300" y="112" width="180" height="16" rx="3"/><rect x="300" y="132" width="180" height="16" rx="3"/><rect x="300" y="152" width="180" height="16" rx="3"/><rect x="300" y="172" width="180" height="16" rx="3"/><rect x="300" y="192" width="180" height="16" rx="3"/>
</g>
<g fill="color-mix(in srgb, var(--primary) 50%, transparent)" stroke="var(--primary)" stroke-opacity="0.7">
<rect x="484" y="52" width="36" height="16" rx="3"/><rect x="484" y="72" width="36" height="16" rx="3"/><rect x="484" y="92" width="36" height="16" rx="3"/><rect x="484" y="112" width="36" height="16" rx="3"/><rect x="484" y="132" width="36" height="16" rx="3"/><rect x="484" y="152" width="36" height="16" rx="3"/><rect x="484" y="172" width="36" height="16" rx="3"/><rect x="484" y="192" width="36" height="16" rx="3"/>
</g>
<text class="b" x="300" y="228">1,966,080 — at every layer</text>
<text class="l" x="300" y="248">48× more, and 48 is exactly 2 × 24 layers</text>
<path d="M20 264 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="288">both are under 1% of the model — they differ in reach, not size</text>
</svg>
<figcaption>The parameter count is a consequence of the placement, not a separate design choice.</figcaption>
</figure>

## What it costs at inference

This is the limitation that decided which method won in practice.

The prefix is present in every forward pass, forever. Twenty extra keys and values at every layer means every attention computation processes twenty more positions than it otherwise would:

| context length | extra attention work |
| --- | --- |
| 100 tokens | **20.0%** |
| 500 | 4.0% |
| 2,000 | 1.0% |
| 8,000 | 0.25% |

The overhead is proportionally worst on short inputs, which is often exactly the workload — a classifier, a short extraction, a routing decision.

And twenty positions of the context window are gone. Not a large loss at 8,000, and material at 512.

Compare this with an approach that trains a low-rank update to the weight matrices: that update can be **added into the weights** after training, leaving a model that is exactly the original shape and exactly the original speed. Zero inference overhead, and the reason that approach became the default.

## What it is good at

Storage, and it is a big win.

| | per task |
| --- | --- |
| a full copy of the model | 2.6 GB |
| one prefix | **3.93 MB** |

**661× smaller.** Two hundred tasks cost 786 MB of prefixes against half a terabyte of model copies — and all two hundred share one loaded set of weights in memory, so switching tasks is swapping a few megabytes rather than reloading a model.

That is the shape of the argument for any of these methods: one frozen base, many tiny per-task files.

## The honest limitations

**It is weaker than full fine-tuning** on tasks that need a real change in capability. Adjusting what attention attends to is less expressive than adjusting the weights, and where the gap shows, it shows.

**Training can be unstable.** The prefix parameters have no natural initialisation — they are not embeddings of anything — and poorly initialised prefixes train badly. Initialising from the embeddings of actual words is a common and slightly inelegant fix.

**The prefix is not interpretable.** With prompt-based approaches you can at least decode the nearest real tokens and get a hint. A prefix's keys and values at layer 17 do not correspond to anything nameable.

## What to take away

The family of methods is distinguished by *where* the learned numbers enter: at the input, at every layer's attention, or in the weight matrices themselves.

Prefix tuning's choice — every layer's attention — is what makes it 48× larger than prompt tuning and more expressive for the same reason. It also means the extra positions are there on every forward pass for the life of the model, which is the cost a weight-space method does not pay.
