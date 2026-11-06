---
title: "How a vision-language model works"
date: "2026-10-14T08:35"
category: "AI"
tags: ["vlm", "multimodal", "vision-transformer", "image-tokens", "llm"]
summary: "A VLM cuts an image into 14-pixel patches, encodes them, and feeds them to a language model as if they were words. A 336-pixel image becomes 576 tokens — about as much context as 443 words — and a minute of video at one frame a second is 34,560."
draft: false
cover: "/blog/vision-language-models.svg"
---

A vision-language model — VLM — takes images and text together and responds in text. Show it a photo of a receipt and ask for the total; give it a chart and ask what changed; hand it a screenshot and ask which button to press.

Most VLMs are not built from scratch. They are a language model that has been taught to read a new kind of token: pieces of an image.

## The three parts

**1. A vision encoder.** Usually a vision transformer (ViT), often one pre-trained to match images with captions. It cuts the image into a grid of small square patches — commonly 14 × 14 pixels — and turns each patch into a vector, with attention letting each patch take in context from the others.

**2. A projector.** The vision encoder's vectors live in a different space from the language model's word embeddings. A small network — sometimes just a linear layer or two-layer MLP — maps each patch vector into the language model's embedding space. After this, an image patch looks to the language model like a token.

**3. A language model.** The projected image tokens are placed into the sequence alongside the text tokens, and the language model processes them all together with ordinary attention. Its answer is generated as text, one token at a time, exactly as for a text-only prompt.

That is the whole architecture. The language model does not "see" in any special way: it reads a sequence where some tokens came from words and some came from patches.

## How many tokens an image costs

With 14-pixel patches, an image of side *s* pixels becomes `(s / 14)²` tokens:

| image size | patch grid | image tokens | after 2×2 merging |
| --- | --- | --- | --- |
| 224 × 224 | 16 × 16 | 256 | 64 |
| 336 × 336 | 24 × 24 | **576** | 144 |
| 448 × 448 | 32 × 32 | 1,024 | 256 |
| 1,008 × 1,008 | 72 × 72 | 5,184 | 1,296 |

A modest 336-pixel image is 576 tokens — about the context cost of **443 words** of text. A high-resolution image is several thousand. Many models therefore merge neighbouring patches, typically 2 × 2 into one token, cutting the count four-fold at some cost to fine detail.

Video multiplies it. Sampling one frame per second, a one-minute clip at 576 tokens a frame is **34,560 tokens**; even with merging, 8,640. Video understanding is, to a large extent, a context-length and token-budget problem.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="An image divided into a grid of patches, each patch becoming a vector through the vision encoder and projector, then placed in a sequence with text tokens entering a language model." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">PATCHES BECOME TOKENS</text>
<rect x="20" y="36" width="96" height="96" fill="var(--muted-foreground)" fill-opacity="0.2" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<g stroke="var(--muted-foreground)" stroke-opacity="0.4"><path d="M44 36 V132 M68 36 V132 M92 36 V132 M20 60 H116 M20 84 H116 M20 108 H116"/></g>
<rect x="20" y="36" width="24" height="24" fill="var(--primary)" fill-opacity="0.5"/>
<text class="l" x="20" y="148">336 px → 24 × 24 patches</text>
<path d="M120 84 H150" stroke="var(--muted-foreground)"/>
<rect x="150" y="66" width="80" height="36" rx="5" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.7"/>
<text class="l" x="190" y="88" text-anchor="middle">vision enc.</text>
<path d="M230 84 H250" stroke="var(--muted-foreground)"/>
<rect x="250" y="66" width="70" height="36" rx="5" fill="none" stroke="var(--primary)" stroke-width="1.5"/>
<text class="b" x="285" y="88" text-anchor="middle">projector</text>
<path d="M320 84 H340" stroke="var(--muted-foreground)"/>
<g fill="var(--primary)" fill-opacity="0.6"><rect x="340" y="76" width="12" height="16" rx="2"/><rect x="354" y="76" width="12" height="16" rx="2"/><rect x="368" y="76" width="12" height="16" rx="2"/><rect x="382" y="76" width="12" height="16" rx="2"/></g>
<text class="l" x="398" y="88">…</text>
<g fill="var(--muted-foreground)" fill-opacity="0.5"><rect x="412" y="76" width="12" height="16" rx="2"/><rect x="426" y="76" width="12" height="16" rx="2"/><rect x="440" y="76" width="12" height="16" rx="2"/></g>
<text class="b" x="340" y="68">576 image tokens</text><text class="l" x="412" y="110">"what's the total?"</text>
<path d="M456 84 H476" stroke="var(--muted-foreground)"/>
<rect x="476" y="66" width="64" height="36" rx="5" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text class="b" x="508" y="88" text-anchor="middle">LLM</text>
<path d="M20 172 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="196">a 336-px image costs about as much context as 443 words</text>
<text class="l" x="20" y="216">1,008 px: 5,184 tokens · a minute of video at 1 fps: 34,560</text>
<text class="l" x="20" y="236">2 × 2 patch merging divides each by four, at the cost of fine detail</text>
</svg>
<figcaption>Encode the patches, map them into the language model's space, and let ordinary attention do the rest.</figcaption>
</figure>

## How it is trained

Typically in stages:

1. **Alignment.** Freeze the vision encoder and the language model, and train only the projector on image–caption pairs, so image tokens land where the language model can make sense of them.
2. **Instruction tuning.** Unfreeze some or all of the model and train on image-and-question examples with good answers: describing, counting, reading text, reasoning about charts, following visual instructions.
3. **Preference training.** As with text models, refine behaviour with human or automated feedback — including penalising descriptions of things that are not in the image.

## Handling real images

Real images are not 336-pixel squares. Documents are tall, screenshots wide, and small text needs high resolution. Common approaches:

- **Tiling.** Cut a large image into several tiles at the encoder's native resolution, encode each, and add a low-resolution thumbnail of the whole for context.
- **Native resolution.** Encoders that accept variable image sizes and aspect ratios, with position encodings that handle any grid.
- **Token budgets.** Let the caller choose detail level, trading accuracy on fine print against cost and latency.

## What VLMs are good and bad at

**Good:** describing scenes, reading printed text, answering questions about documents, charts and screenshots, comparing images, following visual instructions.

**Weaker:** precise counting of many objects, exact spatial relationships ("is the cup left of the plate from the person's viewpoint?"), reading tiny or stylised text at low resolution, and anything requiring pixel-level measurement. And like text models, they can hallucinate — confidently describing details that are not there, especially when the question presumes them.

## What to take away

A vision-language model cuts an image into patches, encodes them with a vision transformer, projects them into a language model's embedding space, and lets the language model read them alongside text. The language model is otherwise unchanged.

Images are expensive in tokens: 576 for a 336-pixel image, over 5,000 at high resolution, 34,560 for a minute of video at one frame per second. Patch merging, tiling and resolution choices are how VLMs balance detail against context and cost.
