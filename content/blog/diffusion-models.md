---
title: "Diffusion models"
date: "2026-09-11T09:40"
category: "AI"
tags: ["diffusion", "generative", "noise-schedule", "unet", "image-generation"]
summary: "Destroy an image with noise in a thousand small steps, then train a network to undo one step at a time. Each individual step is easy, which is the entire reason the method works."
draft: false
cover: "/blog/diffusion-models.svg"
---

Generating an image directly is hard: millions of pixel values that all have to be right together. Diffusion sidesteps that by never generating an image in one go.

Instead there are two processes. One destroys an image by gradually adding noise, which requires no learning at all. The other undoes a single step of that destruction, which is what gets learned.

## The forward process erases everything

Start with a real image and add a small amount of noise. Add a bit more. Keep going for a thousand steps.

The mixture at any step is fixed by a schedule:

$$
x_t = \sqrt{\bar{\alpha}_t}\,x_0 + \sqrt{1 - \bar{\alpha}_t}\;\varepsilon
$$

$\bar{\alpha}_t$ is what fraction of the original survives. Under a standard linear schedule:

| $t$ | how much original is left | how much noise | signal-to-noise |
| --- | --- | --- | --- |
| 0 | 0.9999 | 0.0100 | 1.0e+4 |
| 100 | 0.9461 | 0.3238 | 8.5 |
| 200 | 0.8102 | 0.5862 | 1.9 |
| 400 | 0.4400 | 0.8980 | 0.24 |
| 600 | 0.1599 | 0.9871 | 0.026 |
| 999 | **0.0064** | 1.0000 | 4.0e−5 |

<figure>
<svg viewBox="0 0 560 240" width="560" role="img" aria-label="Bars showing how much of the original image survives at each timestep, falling from nearly all of it at step zero to almost nothing by step 999." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">HOW MUCH OF THE IMAGE SURVIVES</text>
<path d="M62 170 H540" stroke="var(--border)" stroke-width="1"/>
<rect x="70" y="50" width="58" height="120" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="140" y="56.5" width="58" height="113.5" rx="3" fill="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="210" y="72.8" width="58" height="97.2" rx="3" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="280" y="117.2" width="58" height="52.8" rx="3" fill="color-mix(in srgb, var(--primary) 38%, transparent)"/>
<rect x="350" y="150.8" width="58" height="19.2" rx="3" fill="color-mix(in srgb, var(--primary) 30%, transparent)"/>
<rect x="420" y="165.3" width="58" height="4.7" rx="2" fill="color-mix(in srgb, var(--primary) 24%, transparent)"/>
<rect x="490" y="168.5" width="58" height="1.5" rx="1" fill="color-mix(in srgb, var(--primary) 24%, transparent)"/>
<text class="l" x="99" y="186" text-anchor="middle">0</text>
<text class="l" x="169" y="186" text-anchor="middle">100</text>
<text class="l" x="239" y="186" text-anchor="middle">200</text>
<text class="l" x="309" y="186" text-anchor="middle">400</text>
<text class="l" x="379" y="186" text-anchor="middle">600</text>
<text class="l" x="449" y="186" text-anchor="middle">800</text>
<text class="l" x="519" y="186" text-anchor="middle">999</text>
<text class="l" x="300" y="206" text-anchor="middle">timestep</text>
<text class="v" x="519" y="222" text-anchor="end">0.6% left at the end</text>
</svg>
<figcaption>The forward process is arithmetic, not a model. Nothing is learned here.</figcaption>
</figure>

By the last step the original contributes **0.6%** of the signal — nothing recognisable. That matters more than it looks: it means the endpoint of destruction is indistinguishable from random noise, which is why generation can *start* from random noise. If the schedule stopped early, samples would begin from something that is not quite noise and not quite anything else.

## The reverse process learns one step

Undoing all of that at once would be the hard problem again. Undoing *one* step is not.

Give the network a noisy image and the timestep, and ask it for one thing: **which part of this is noise?** Subtract a portion of what it predicts, and you have a slightly cleaner image. Repeat a thousand times.

Training is correspondingly simple, and it is why this trains stably where earlier generative methods did not:

1. Take a real image.
2. Pick a random timestep.
3. Add exactly the noise that timestep calls for — noise you generated, so you know it exactly.
4. Ask the network to predict it.
5. Score the prediction against the noise you actually added.

There is a known correct answer at every step, because you created the corruption yourself. No adversary, no competing objective, nothing to balance.

## Why so many steps

The schedule is designed so consecutive steps are nearly identical. Signal-to-noise falls by more than eight orders of magnitude from start to finish, but per step that is a factor of about **1.02**.

Each individual denoising is therefore a small, local correction — the kind of thing a network can learn reliably. The difficulty of generation has been spread across a thousand easy problems rather than concentrated in one hard one.

That is also the method's main cost. Generating one image means a thousand forward passes through the network, which is why diffusion is slow compared to models that produce output in a single pass, and why much of the practical work in the area is about getting acceptable results in fifty steps instead of a thousand.

## Steering it

Left alone, this generates *something* — a plausible sample from whatever it was trained on, but not anything in particular.

To ask for something specific, the condition is encoded and fed into the network alongside the noisy image at every step. Now the question is not "which part of this is noise?" but "which part of this is noise, given that it is supposed to be a harbour at dusk?" — and the prediction differs accordingly.

The condition does not have to be text. A low-resolution image conditions super-resolution. A masked region conditions inpainting. A pose, a depth map, a sketch — anything encodable can steer the same reverse process, which is why one mechanism covers so many apparently different tasks.

## The short version

- Two processes: a fixed one that adds noise, and a learned one that removes it.
- The forward process needs no model — it is a scheduled mixture of image and noise.
- After the full schedule only 0.6% of the original survives, so the endpoint really is noise.
- That is what makes it valid to start generation from random noise.
- The network is only ever asked to predict the noise in one slightly-noisy image.
- Training always has an exact correct answer, because the corruption was applied deliberately.
- Consecutive steps differ by about 2%, so every individual step is easy — and there are a thousand of them.
- Conditioning on text, a sketch or a low-resolution image steers the same reverse process.
