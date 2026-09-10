---
title: "Continual learning in LLMs"
date: "2026-09-11T10:20"
category: "AI"
tags: ["continual-learning", "forgetting", "fine-tuning", "adapters", "replay"]
summary: "Teaching a trained model something new tends to erase what it already knew. Every fix for that is a different way of deciding which weights are allowed to move."
draft: false
cover: "/blog/continual-learning.svg"
---

A model's knowledge is its weights. There is no separate place where facts are stored — the same numbers that let it write a sentence also encode what it knows.

Which creates a problem the moment you want to teach it something new. Training updates weights, and the weights being updated are the ones already holding everything else.

## Catastrophic forgetting

Take a model that handles maths, history and science, and fine-tune it on nothing but sports. It becomes good at sports. It also becomes noticeably worse at the other three, and not gradually — the loss can be severe and fast.

The reason is that gradient descent has no notion of *preserving* anything. It moves whichever weights reduce the current loss, and the current loss only measures sports. Weights that were doing important work for history are, as far as this training run is concerned, just numbers in the wrong place.

Nothing is deleted deliberately. The old capability is simply not being scored, so nothing defends it.

Every approach below is a different answer to the same question: **which weights are allowed to move, and by how much?**

## Mix the old data back in

The obvious fix. Keep some of the original data and include it in every batch, so the loss measures both the new material and the old.

It works well, and it has a cost that is easy to underrate. To keep a fraction $r$ of each batch as old data while learning $N$ tokens of new material, you have to process $N/(1-r)$ tokens:

| replay share | total processed | vs no replay |
| --- | --- | --- |
| 20% | 1.25 N | 1.25× |
| 50% | 2.00 N | 2.00× |
| 80% | 5.00 N | 5.00× |
| 90% | **10.00 N** | **10×** |

At a high replay ratio you are processing ten times the new material in order to learn it — most of the way back to the retraining cost that fine-tuning was meant to avoid. And it assumes you still have the original data, which for a pre-trained model you usually do not.

## Protect the weights that matter

The second approach keeps all the weights trainable but not equally.

Work out which weights were important to the old capability, and add a penalty for moving *those* specifically. Unimportant weights stay free; important ones become stiff.

No old data needs storing, which is the main appeal. The difficulty is the premise — deciding which weights matter is an estimate, and knowledge in a network is distributed rather than filed. Get it wrong and you either protect the wrong things or leave the right ones exposed.

There is also a ceiling built in. Every weight you stiffen is capacity removed from learning the new task. Protect enough to prevent forgetting and you may have protected enough to prevent learning.

## Freeze everything and add

The third approach sidesteps the question. Freeze the original weights entirely and add a small set of new ones alongside, training only those.

The old capability cannot degrade because nothing that encodes it changed — this is a guarantee rather than a tendency. And the new parameters are small enough to train cheaply.

<figure>
<svg viewBox="0 0 560 220" width="560" role="img" aria-label="Three strategies shown as bars: replay retrains the whole model with mixed data, regularisation locks part of the model, and isolation freezes all of it and adds a small trainable strip." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.t{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHICH WEIGHTS ARE ALLOWED TO MOVE</text>
<text class="l" x="130" y="56" text-anchor="end">replay</text>
<rect x="140" y="40" width="380" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="t" x="330" y="58" text-anchor="middle">all of it, on old and new data together</text>
<text class="l" x="130" y="112" text-anchor="end">protect</text>
<rect x="140" y="96" width="150" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="t" x="215" y="114" text-anchor="middle">stiffened</text>
<rect x="292" y="96" width="228" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="t" x="406" y="114" text-anchor="middle">free to move</text>
<text class="l" x="130" y="168" text-anchor="end">isolate</text>
<rect x="140" y="152" width="340" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="t" x="310" y="170" text-anchor="middle">frozen</text>
<rect x="484" y="152" width="36" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 60%, transparent)" stroke="color-mix(in srgb, var(--primary) 75%, transparent)"/>
<text class="t" x="20" y="202">tinted = trainable · grey = held in place</text>
</svg>
<figcaption>Three strategies, one question. The bar is the model's weights.</figcaption>
</figure>

The cost arrives later, as accumulation. One adapter per task:

| tasks | adapters | full copies instead |
| --- | --- | --- |
| 5 | 60 MB | 33.8 GB |
| 20 | 240 MB | 135.0 GB |
| 50 | **600 MB** | 337.5 GB |

Storage is clearly not the problem — fifty adapters is under a gigabyte against three hundred for fifty full copies. The problem is that it is fifty *things*: something has to decide which one a given request needs, they do not compose with each other, and knowledge learned in one is unavailable to the others.

Strictly, this is not one model that has learned fifty things. It is one model and fifty attachments.

## Not learning at all

There is a fourth option that avoids the question entirely: leave the weights alone and supply new knowledge at request time, retrieved from a store that can be edited freely.

Updating means writing to a database. Nothing can be forgotten because nothing is being overwritten. Corrections are immediate and reversible.

What it does not do is teach the model anything. The knowledge is available to it, not part of it — so it cannot reason from it as fluently as from what it actually learned, and every answer depends on the retrieval finding the right thing.

For facts that change — prices, events, documentation — that trade is usually correct, and it is why most systems that need current information use this rather than continual training. For a new *skill* rather than a new fact, it does not help.

## What makes this hard

The tension has a name: **stability against plasticity**. Total stability is a model that cannot learn. Total plasticity is a model that forgets. Every method above picks a point between them, and no method removes the trade.

Evaluation is the other difficulty, and it is underrated. Measuring the new capability is easy. Detecting what quietly got worse means re-testing everything the model could previously do, which means having kept a way to test all of it — and if you had that coverage, you would probably have noticed the problem before shipping.

## The short version

- Knowledge lives in the weights, so training on new data overwrites it.
- Nothing defends the old capability because the current loss does not measure it.
- Replay mixes old data back in — effective, and at 90% replay you process 10× the tokens.
- Regularisation stiffens the weights judged important, needing no old data but resting on a hard estimate.
- Isolation freezes everything and trains a small addition — a guarantee, but the additions accumulate and do not compose.
- Retrieval avoids the problem by never updating weights, at the cost of the model never actually knowing the thing.
- Stability against plasticity is a trade, not a bug, and no method removes it.
- The hard part in practice is noticing what got worse.
