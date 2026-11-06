---
title: "Data augmentation"
date: "2026-10-21T16:30"
category: "AI"
tags: ["data-augmentation", "training", "overfitting", "computer-vision", "regularisation"]
summary: "Teach a model what should not matter by showing it the same example changed in ways that keep the label. Random 4-pixel shifts and a horizontal flip turn each 32×32 image into 162 variants — 8.1 million from 50,000 — but flip the wrong thing and a 6 becomes a 9."
draft: false
cover: "/blog/data-augmentation.svg"
---

A model learns from examples, and it learns everything those examples make easy to learn — including things you did not intend. If every photo of a cat in the training set is centred and well lit, the model may learn that "cat" means "centred and well lit", and fail on a cat in the corner of a dark room.

Data augmentation fixes this by creating new training examples from existing ones, using transformations that change the input but not the correct answer. Each transformation tells the model: *this* does not matter.

## What augmentations say

| transformation | what it teaches the model to ignore |
| --- | --- |
| shift / crop | where the object is in the frame |
| horizontal flip | left–right orientation |
| rotation (small) | camera tilt |
| brightness, contrast, colour | lighting conditions |
| blur, noise | camera quality |
| scale | distance to the object |

These are **invariances**: properties the label should be independent of. Instead of hoping the model figures them out from enough natural variety, augmentation shows it the variety directly.

## How many examples it makes

Take a classic setup: 32 × 32 images, padded by 4 pixels on each side and randomly cropped back to 32 × 32, plus a random horizontal flip.

- Crop positions: `(2 × 4 + 1)² = 81`
- Flips: 2
- **Variants per image: 162**

A dataset of 50,000 images becomes, in effect, **8.1 million** distinct training inputs. Combine further transformations — colour jitter, small rotations — and the space becomes practically unbounded.

In practice augmentations are applied randomly **on the fly**: each time an image is loaded during training, a fresh random transformation is drawn. No enlarged dataset is stored, and every epoch sees slightly different versions. That is why augmented models can train for many more epochs before overfitting.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="One original image with variants around it — shifted, flipped, brightened, rotated — all keeping the label cat; beside it a digit 6 rotated 180 degrees becoming a 9 with the label now wrong." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME LABEL, DIFFERENT INPUT</text>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6">
<rect x="20" y="40" width="60" height="60" rx="4"/><rect x="90" y="40" width="60" height="60" rx="4"/><rect x="160" y="40" width="60" height="60" rx="4"/><rect x="230" y="40" width="60" height="60" rx="4"/>
</g>
<g fill="var(--primary)" fill-opacity="0.7">
<circle cx="50" cy="72" r="14"/><path d="M40 60 L44 50 L48 60 Z M52 60 L56 50 L60 60 Z"/>
<circle cx="126" cy="78" r="14"/><path d="M116 66 L120 56 L124 66 Z M128 66 L132 56 L136 66 Z"/>
<circle cx="190" cy="72" r="14"/><path d="M180 60 L184 50 L188 60 Z M192 60 L196 50 L200 60 Z"/>
</g>
<g fill="var(--primary)" fill-opacity="0.35"><circle cx="260" cy="72" r="14"/><path d="M250 60 L254 50 L258 60 Z M262 60 L266 50 L270 60 Z"/></g>
<text class="l" x="50" y="116" text-anchor="middle">original</text><text class="l" x="120" y="116" text-anchor="middle">shifted</text><text class="l" x="190" y="116" text-anchor="middle">flipped</text><text class="l" x="260" y="116" text-anchor="middle">darker</text>
<text class="b" x="20" y="136">all still "cat" → 162 crop × flip variants per image</text>
<rect x="360" y="40" width="60" height="60" rx="4" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<rect x="470" y="40" width="60" height="60" rx="4" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text x="390" y="86" text-anchor="middle" font-size="40" font-family="var(--font-geist-mono),ui-monospace,monospace" fill="var(--muted-foreground)">6</text>
<text x="500" y="86" text-anchor="middle" font-size="40" font-family="var(--font-geist-mono),ui-monospace,monospace" fill="var(--primary)" transform="rotate(180 500 72)">6</text>
<path d="M424 70 H466" stroke="var(--muted-foreground)"/><text class="l" x="445" y="64" text-anchor="middle">180°</text>
<text class="b" x="360" y="116">label "6", looks like 9</text>
<path d="M20 160 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="184">an augmentation is only valid if the true label survives it</text>
<text class="l" x="20" y="204">flipping text, rotating digits, cropping out the object: each teaches a falsehood</text>
<text class="l" x="20" y="224">50,000 images × 162 = 8.1 million training inputs, drawn fresh each epoch</text>
</svg>
<figcaption>Good augmentations encode what should not matter. Bad ones change what the answer is.</figcaption>
</figure>

## Augmentations can lie

An augmentation is only valid if the correct label survives it. Some that are harmless for one task are wrong for another:

- **Rotating a 6 by 180° makes a 9.** Rotation augmentation for digit recognition must be limited to small angles.
- **Flipping text** turns it into mirror writing; flipping a road scene swaps which side traffic drives on.
- **Cropping aggressively** can remove the object entirely, leaving an image of background labelled "cat".
- **Colour changes** are wrong where colour *is* the label — ripe versus unripe fruit, a medical stain, a traffic light.

Each of these teaches the model something false. Choosing augmentations is a statement about the task: which changes leave the answer alone.

## Beyond images

**Audio and speech:** adding background noise and room reverberation, changing speed and pitch slightly, masking short stretches of time or frequency. Speech recognisers trained this way cope far better with real phone lines.

**Text:** harder, because small changes alter meaning. Common methods include **back-translation** (translate to another language and back to get a paraphrase), synonym replacement, and — increasingly — generating paraphrases or new examples with a language model. Each needs checking that the label still holds.

**Tabular data:** usually least amenable; small noise on numeric features, or synthetic minority examples to balance rare classes.

**Mixing methods:** **mixup** blends two images and their labels in proportion; **cutmix** pastes a patch of one image into another and mixes the labels by area. They do not preserve labels exactly — they create soft labels — and act as strong regularisers.

## When it helps most

- **Small datasets**, where the model would otherwise memorise.
- **Deployment conditions unlike the training data** — different cameras, lighting, accents, noise.
- **Long training runs**, where repeated exposure to identical examples would overfit.

For very large datasets it matters less, though even large vision and speech models use it. And it never replaces real data from the conditions you deploy in; it widens what you have, it does not cover what you lack.

## What to take away

Data augmentation creates new training examples by applying transformations that should not change the label, teaching the model which variations to ignore. Random 4-pixel crops and a flip give each 32 × 32 image 162 variants — 8.1 million inputs from 50,000 — drawn fresh every epoch.

Choose augmentations by asking whether the true answer survives them: a flip is harmless for a cat and wrong for text, a 180° rotation turns a 6 into a 9. Done right, it is one of the cheapest ways to reduce overfitting and make models robust to the conditions they will meet.
