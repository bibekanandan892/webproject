---
title: "LoRA"
date: "2026-09-10T10:40"
category: "AI"
tags: ["lora", "fine-tuning", "adapters", "low-rank", "training"]
summary: "Fine-tuning normally means updating every weight in the model. LoRA freezes them all and learns a pair of thin matrices alongside, which turns out to be enough."
draft: false
cover: "/blog/lora.svg"
---

Fine-tuning a model normally means updating every weight it has. LoRA leaves all of them frozen and learns a small pair of matrices next to each one instead.

The frozen model still does the work. The pair adds a correction on top.

## Why the normal way is expensive

The parameter count is not the problem on its own — it is what training drags along with it.

Every trainable parameter needs a gradient, and an optimiser like Adam keeps two running averages per parameter on top of that. In fp32, with a master copy of the weights, that comes to roughly 16 bytes for every parameter you intend to train.

For a model of 3.62 billion parameters that is **54 GiB** before a single activation is stored. The weights themselves are the small part.

Then there is what you are left with. Fine-tuning produces a whole new model, so a second task means a second 6.75 GiB file, and ten tasks means ten of them.

## The bet

LoRA rests on one claim: the *change* a model needs in order to learn a task is much simpler than the model itself.

The weights are a $d \times d$ matrix. The update you would apply to them is also $d \times d$, but it need not be a full-rank one — the useful part of it may live in a far smaller space. If that is true, the update can be written as a product of two thin matrices and nothing important is lost.

$$
\Delta W = BA
$$

$A$ is $r \times d$ and $B$ is $d \times r$, where $r$ is small — 8, 16, 32. Multiplying them gives something back at full $d \times d$ size, but built from only $2rd$ numbers.

<figure>
<svg viewBox="0 0 620 245" width="620" role="img" aria-label="A large square frozen weight matrix, plus the product of a tall thin matrix B and a wide thin matrix A, which together produce an update of the same square shape but built from far fewer numbers." xmlns="http://www.w3.org/2000/svg">
<style>.b{font:600 14px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.op{font:600 18px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.n{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<rect x="30" y="46" width="150" height="150" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="b" x="105" y="126" text-anchor="middle">W</text>
<text class="op" x="196" y="132" text-anchor="middle">+</text>
<rect x="212" y="46" width="16" height="150" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="b" x="220" y="38" text-anchor="middle">B</text>
<text class="op" x="244" y="132" text-anchor="middle">×</text>
<rect x="260" y="113" width="150" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="b" x="335" y="105" text-anchor="middle">A</text>
<text class="op" x="426" y="132" text-anchor="middle">=</text>
<rect x="444" y="46" width="150" height="150" rx="4" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-dasharray="5 4"/>
<text class="b" x="519" y="126" text-anchor="middle">ΔW</text>
<text class="l" x="105" y="214" text-anchor="middle">3072 × 3072, frozen</text>
<text class="n" x="105" y="232" text-anchor="middle">9,437,184</text>
<text class="l" x="311" y="214" text-anchor="middle">3072×16 and 16×3072, trained</text>
<text class="n" x="311" y="232" text-anchor="middle">98,304</text>
<text class="l" x="519" y="214" text-anchor="middle">full size again</text>
</svg>
<figcaption>The update comes out the same shape as the weights, but there are 96 times fewer numbers behind it.</figcaption>
</figure>

## How it trains

Freeze $W$. It never receives a gradient and never changes.

Initialise $A$ randomly and $B$ to **zeros**. That detail matters: $BA$ is zero at the start, so before any training the model behaves exactly as it did before, and the fine-tune begins from the pretrained behaviour rather than from a jolt.

The forward pass runs both paths and adds them:

$$
h = Wx + \frac{\alpha}{r}(BA)x
$$

The $\alpha/r$ term is a scale factor. It exists so that changing the rank does not silently change how strongly the adapter speaks — pick $\alpha = 2r$ and the scale stays at 2 whatever rank you choose.

Only $A$ and $B$ get gradients. Everything else is along for the ride.

## What it saves

Take a 32-layer model with $d = 3072$, applying LoRA at rank 16 to the query and value projections only — which is usually enough.

| | full fine-tuning | LoRA |
| --- | --- | --- |
| trainable parameters | 3,623,878,656 | 6,291,456 |
| share of the model | 100% | **0.174%** |
| optimiser + gradient memory | 54.0 GiB | **96 MiB** |
| what you ship afterwards | 6.75 GiB | **12 MiB** |

The memory line is what changes who can do this. 54 GiB of optimiser state needs several datacentre GPUs; 96 MiB needs none of them, and the frozen weights can sit in a compressed form because nothing is writing to them.

The shipping line changes what you can distribute. Ten fine-tunes of the same base model are ten 12 MiB files, not ten copies of a 6.75 GiB one.

## Merging and swapping

After training you have a choice.

Fold the adapter in — $W_{\text{merged}} = W + \frac{\alpha}{r}BA$ — and you get an ordinary weight matrix of the usual shape. Inference costs exactly what it did before, because there is no extra path left to run. This is one-way, though: once merged, that adapter cannot be peeled back off.

Or leave it separate, and the base model can serve many tasks at once. Load one set of weights, keep several adapters beside it, and switch which one is active per request. That only works while they are unmerged, which is why serving systems usually keep them that way and accept the small cost of the second path.

## The short version

- Full fine-tuning is expensive because of optimiser state, not the weights — roughly 16 bytes per trainable parameter.
- LoRA freezes the original weights and learns $\Delta W = BA$, with $A$ and $B$ thin.
- $B$ starts at zero, so training begins from the pretrained model's exact behaviour.
- The forward pass adds the two paths, scaled by $\alpha/r$ so rank changes stay neutral.
- At rank 16 on a 3.6B model, 0.174% of the parameters are trained and optimiser memory drops from 54 GiB to 96 MiB.
- Merge the adapter for free inference, or keep it separate to swap tasks on one loaded model.
