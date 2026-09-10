---
title: "GANs"
date: "2026-09-11T10:40"
category: "AI"
tags: ["gan", "generative", "adversarial", "training", "mode-collapse"]
summary: "Two networks trained against each other, one making fakes and one catching them. Because each is graded by the other, the loss numbers stop meaning what loss numbers usually mean."
draft: false
cover: "/blog/gans.svg"
---

A generative adversarial network is two networks with opposing jobs.

The **generator** turns random noise into an image. The **discriminator** looks at an image and outputs one number: how likely it thinks this is real.

Neither is told what a good image looks like. The generator never sees the training data at all — its only information about reality is the discriminator's reaction to what it produced.

## The loop

Show the discriminator some real images and some generated ones, and train it to tell them apart. Then train the generator to make images the discriminator scores as real. Alternate.

Each improvement on one side raises the bar for the other. The discriminator finds a tell, the generator learns to hide it, the discriminator has to find a subtler one.

## Where it is supposed to end up

At the point where the discriminator cannot do better than guessing — scoring everything around 0.5.

That has a consequence people find surprising: the losses have fixed target values, and lower is not better.

| D(real) | D(fake) | discriminator loss | generator loss | what is happening |
| --- | --- | --- | --- | --- |
| 0.99 | 0.01 | **0.0201** | 4.6052 | discriminator winning |
| 0.90 | 0.10 | 0.2107 | 2.3026 | discriminator ahead |
| 0.70 | 0.30 | 0.7133 | 1.2040 | close |
| **0.50** | **0.50** | **1.3863** | **0.6931** | **equilibrium** |
| 0.30 | 0.70 | 2.4079 | 0.3567 | generator ahead |

Healthy training converges on a discriminator loss of $2\ln 2 = 1.3863$ and a generator loss of $\ln 2 = 0.6931$.

Read the first row again. A discriminator loss of 0.02 looks excellent by every normal instinct about loss curves, and it means the run is failing — the discriminator has won so completely that the generator has nothing to learn from.

This is the thing that makes GANs awkward to train. In ordinary training, loss going down means progress. Here both losses are measured against a moving opponent, so a falling generator loss might mean the generator improved, or might mean the discriminator got worse. The number alone cannot distinguish those.

## Why the generator's loss had to be rewritten

There is a related problem hiding in the original formulation.

Stated as a minimax game, the generator minimises $\log(1 - D(G(z)))$. Early in training the generator is bad, $D(G(z))$ is near zero — and that is exactly where this function is flattest:

| D(fake) | gradient of $\log(1-D)$ | gradient of $-\log D$ | ratio |
| --- | --- | --- | --- |
| 0.500 | 2.00 | 2.00 | 1× |
| 0.100 | 1.11 | 10.00 | 9× |
| 0.010 | 1.01 | 100.00 | 99× |
| 0.001 | 1.00 | 1000.00 | **999×** |

The generator gets almost no gradient precisely when it is doing worst and most needs one.

So the loss is flipped: instead of minimising the probability of being caught, maximise the probability of being believed — $-\log D(G(z))$. Same direction, and the gradient grows as the generator falls behind rather than vanishing.

<figure>
<svg viewBox="0 0 560 230" width="560" role="img" aria-label="Two gradient curves against the discriminator's score on fakes. The original loss stays flat near a value of one across the whole range; the rewritten loss rises steeply as the score approaches zero." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">GRADIENT WHERE THE GENERATOR IS LOSING</text>
<path d="M70 180 H520" stroke="var(--border)" stroke-width="1"/>
<path d="M70 40 V180" stroke="var(--border)" stroke-width="1"/>
<path d="M84 44 L106 76 L128 100 L172 130 L260 156 L348 166 L436 172 L520 176" fill="none" stroke="color-mix(in srgb, var(--primary) 80%, transparent)" stroke-width="2.4"/>
<text class="v" x="120" y="38">rewritten: −log D</text>
<path d="M84 176.5 L128 176.3 L216 175.6 L304 174.6 L392 173.3 L520 170" fill="none" stroke="color-mix(in srgb, var(--muted-foreground) 70%, transparent)" stroke-width="2.4"/>
<text class="l" x="360" y="192">original: log(1 − D)</text>
<text class="l" x="70" y="210">D(fake) → 0</text>
<text class="l" x="520" y="210" text-anchor="end">D(fake) → 0.5</text>
<text class="l" x="62" y="46" text-anchor="end">steep</text>
<text class="l" x="62" y="178" text-anchor="end">flat</text>
</svg>
<figcaption>The grey line is nearly flat everywhere. The generator learns from the tinted one.</figcaption>
</figure>

## Mode collapse

The characteristic failure. The generator finds one output that reliably fools the discriminator and produces only variations of it.

Nothing in the objective forbids this. The generator is rewarded for fooling the discriminator, and producing the same convincing thing every time does that perfectly. Diversity is something we want and never asked for.

Trained on ten kinds of digit, a collapsed generator produces one kind — and its loss looks fine, because the loss only measures whether the discriminator was fooled.

The discriminator is supposed to punish this eventually, by learning that this exact output is always fake. Sometimes it does. Sometimes the generator simply moves to a different single output, and the two chase each other around the space forever without covering it.

## Keeping it balanced

Everything above is a symptom of the same thing: two networks that only work while they are matched.

If the discriminator gets too strong, its loss goes to zero and the generator has no signal. If the generator gets too strong, the discriminator's judgement becomes uninformative. Neither can be allowed to win, which is an unusual property for a training procedure and the reason GAN work involves so much tuning of learning rates and update ratios.

The later variants mostly attack this. Convolutional architectures made image GANs stable enough to be practical. Conditioning added control over what gets generated. Style-based designs separated coarse structure from fine detail. Cycle-consistent designs allowed translating between two domains with no paired examples.

And the reason diffusion largely displaced GANs for image generation is not that it produces better images in principle — it is that its training has a fixed correct answer at every step and no opponent to balance against.

## The short version

- A generator makes images from noise; a discriminator scores how real they look.
- The generator never sees real data — only the discriminator's reaction.
- Equilibrium is a discriminator scoring 0.5 on everything: losses of 1.3863 and 0.6931.
- Lower is not better. A discriminator loss near zero means the run has failed.
- Because both losses move against each other, neither is a reliable progress signal.
- The original generator loss vanishes exactly when the generator is losing, so it is rewritten as $-\log D$.
- Mode collapse is the generator producing one convincing thing forever — the objective never asked for variety.
- The whole method depends on neither network winning, which is why it is delicate.
