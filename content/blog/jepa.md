---
title: "JEPA"
date: "2026-09-11T12:00"
category: "AI"
tags: ["jepa", "self-supervised", "representation", "collapse", "world-models"]
summary: "Predict what a hidden part of an image means rather than what it looks like. The objective that makes that work has a perfect and useless solution, and the architecture exists to keep it out of reach."
draft: false
cover: "/blog/jepa.svg"
---

Cover part of a photograph and ask what is underneath. You can answer — more sky, probably a wall, the rest of the car — without being able to say anything about the exact pixels, the grain, or where the shadows fall.

That gap is the idea. JEPA learns by predicting the **meaning** of a hidden region from a visible one, and never attempts the pixels.

## Why not the pixels

A model trained to reconstruct hidden pixels has to predict all of them, and most of what it is predicting is not predictable.

The presence of a wall is inferable. Its precise texture, the sensor noise, the exact fall of light — those are effectively random from the model's point of view, and no amount of training makes them less so. Capacity spent trying is capacity wasted, and worse, the loss is dominated by that unpredictable component, so most of the training signal is noise.

Predicting an embedding avoids this entirely. An embedding is already a summary that has discarded exactly the detail that could not have been predicted. Getting it right means having understood what is there, not having memorised how it looked.

## The pieces

Two encoders and a predictor.

The **context encoder** takes the visible part and produces a summary. The **target encoder** takes the hidden part and produces a summary. The **predictor** takes the context summary plus a description of *where* the hidden region is, and tries to produce the target summary.

The loss is how far the prediction is from the target.

For images: cut the picture into patches, take one block as visible context, choose several other blocks as targets, and remove the target patches from the context so nothing is being predicted from itself.

## The problem with that objective

Here is the part worth pausing on.

Suppose both encoders learn to ignore their input and always emit the same constant vector. The predictor then predicts that constant. The prediction is exact.

| | loss under collapse |
| --- | --- |
| prediction objective, ‖predicted − actual‖² | **0.000000** |
| contrastive objective, 8 candidates | 2.0794 |
| contrastive objective, 1024 candidates | **6.9315** |

Zero. The **best possible score**, from a model that has learned nothing and encodes nothing.

<figure>
<svg viewBox="0 0 560 232" width="560" role="img" aria-label="Two objectives compared under a collapsed representation. The prediction loss falls to zero, the best possible value; the contrastive loss rises to log N, the worst possible value." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">THE SAME COLLAPSE, TWO VERDICTS</text>
<text class="l" x="150" y="60" text-anchor="end">prediction loss</text>
<path d="M160 74 H520" stroke="var(--border)" stroke-width="1"/>
<circle cx="164" cy="74" r="7" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="176" y="60">0 — best possible</text>
<text class="l" x="160" y="94">best</text>
<text class="l" x="520" y="94" text-anchor="end">worst</text>
<text class="l" x="150" y="150" text-anchor="end">contrastive loss</text>
<path d="M160 164 H520" stroke="var(--border)" stroke-width="1"/>
<circle cx="516" cy="164" r="7" fill="color-mix(in srgb, var(--muted-foreground) 70%, transparent)"/>
<text class="v" x="504" y="150" text-anchor="end">ln N — worst possible</text>
<text class="l" x="160" y="184">best</text>
<text class="l" x="520" y="184" text-anchor="end">worst</text>
<text class="l" x="20" y="210">one objective has to be defended against collapse; the other defends itself</text>
</svg>
<figcaption>Negatives make collapse the worst outcome. Prediction alone makes it the best one.</figcaption>
</figure>

Contrast that with an objective built on negatives. If every embedding is identical then every candidate looks equally good, the softmax is uniform, and the loss is $\ln N$ — the worst value it can take. Collapse is not merely discouraged there; it is the single worst thing the model could do.

So a prediction-only objective cannot rely on its loss to prevent collapse. **The loss prefers collapse.** Everything else in the architecture exists to make that solution unreachable rather than unattractive.

## Keeping it out of reach

Two mechanisms, both structural.

**The target encoder does not learn.** No gradient flows into it. It is not being optimised, so it cannot cooperate in finding a shared constant — from the loss's point of view it is a fixed answer key.

**It is a lagged copy.** Rather than being frozen at initialisation, its weights follow the context encoder slowly, as a moving average. With a momentum of 0.996, it retains 67% of its old value after a hundred steps and 1.8% after a thousand — it tracks, but always from behind.

Together those mean the two networks are never the same network at the same time. The context encoder cannot drift toward a constant and have the target follow it there, because the target is always reflecting where the context encoder was, not where it is going.

It is worth being clear about what this is: not a proof that collapse cannot happen, but an arrangement that makes it hard to reach by gradient descent. Training these models does still collapse when the momentum or the learning rate is wrong, and the symptom — a loss dropping smoothly to zero — looks exactly like success.

## What it is aimed at

Beyond images, the same structure applies to video: hide a region across space and time, predict its summary from what is visible.

The ambition there is a **world model** — an internal sense of how things behave, learned by watching rather than being told. Predict what happens next, in representation space; then, to plan, imagine the outcomes of several possible actions in that same space and pick one.

This is a genuinely different bet from scaling language models. A model trained on text knows what people have *written* about a glass falling off a table. A model trained this way has watched things fall. Neither subsumes the other, and current results are early — these models do not match human physical intuition on hard tests, and saying otherwise would be overselling it.

## The short version

- Predict the meaning of a hidden region, not its pixels.
- Pixel prediction wastes capacity on detail that was never predictable.
- Two encoders — one for visible context, one for the hidden target — and a predictor between them.
- The prediction objective has a perfect degenerate solution: everything encodes to the same constant, loss exactly zero.
- Contrastive objectives punish that maximally; prediction objectives reward it maximally.
- So collapse is prevented structurally: no gradient into the target encoder, and its weights lag the context encoder.
- It does still collapse when badly tuned, and it looks like a loss curve going beautifully to zero.
- The longer aim is learning how the world behaves by watching it, which language training cannot supply.
