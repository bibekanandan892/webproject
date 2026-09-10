---
title: "Multimodal AI"
date: "2026-09-10T15:20"
category: "AI"
tags: ["multimodal", "embeddings", "vision", "alignment", "clip"]
summary: "A picture and the sentence describing it are completely different kinds of data. Multimodal models work by turning both into vectors that land in the same place."
draft: false
cover: "/blog/multimodal-ai.svg"
---

A photograph is a grid of pixel values. The sentence describing that photograph is a sequence of token ids. There is nothing in either representation that resembles the other.

A multimodal model is one that handles more than one of these at once. The whole trick is getting them into a form where they can be compared.

## Modalities

A modality is a kind of data: text, images, audio, video, and less common ones like sensor readings or 3D geometry.

One thing worth pinning down, because it causes confusion. A model that reads an image and outputs a label — cat, not-cat — is not multimodal. Its output is a choice from a fixed set, not a modality. Multimodal means more than one modality in play as actual input or actual output.

## The problem

Suppose you want to answer a question about a photograph. You have pixels and you have words, and no way to relate them, because they have no common representation.

The solution is to build one. Each modality gets its own encoder — a network that turns its kind of input into a vector — and the encoders are trained *together* so that their outputs land in the same space.

Same space means something precise: a photograph of a bicycle and the words "a bicycle" should produce vectors that point in nearly the same direction, even though one came from pixels and the other from text.

## What alignment looks like

Take three photographs and three captions, encoded into a shared space, and measure the cosine similarity of every image against every caption:

| | "bicycle" | "kitchen" | "harbour" |
| --- | --- | --- | --- |
| photo of a bicycle | **0.990** | 0.424 | 0.441 |
| photo of a kitchen | 0.411 | **0.993** | 0.365 |
| photo of a harbour | 0.403 | 0.408 | **0.997** |

<figure>
<svg viewBox="0 0 480 280" width="480" role="img" aria-label="A three by three grid of similarity scores between photographs and captions. The diagonal, where each photograph meets its own caption, is around 0.99, while every other cell is around 0.4." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.hi{font:600 13px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.lo{font:500 13px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE DIAGONAL IS THE WHOLE POINT</text>
<text class="l" x="212" y="46" text-anchor="middle">bicycle</text>
<text class="l" x="274" y="46" text-anchor="middle">kitchen</text>
<text class="l" x="336" y="46" text-anchor="middle">harbour</text>
<text class="l" x="172" y="96" text-anchor="end">bicycle</text>
<text class="l" x="172" y="158" text-anchor="end">kitchen</text>
<text class="l" x="172" y="220" text-anchor="end">harbour</text>
<rect x="182" y="60" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 55%, transparent)" stroke="color-mix(in srgb, var(--primary) 70%, transparent)"/>
<text class="hi" x="212" y="96" text-anchor="middle">0.99</text>
<rect x="244" y="60" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 8%, transparent)" stroke="color-mix(in srgb, var(--border) 90%, transparent)"/>
<text class="lo" x="274" y="96" text-anchor="middle">0.42</text>
<rect x="306" y="60" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 8%, transparent)" stroke="color-mix(in srgb, var(--border) 90%, transparent)"/>
<text class="lo" x="336" y="96" text-anchor="middle">0.44</text>
<rect x="182" y="122" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 8%, transparent)" stroke="color-mix(in srgb, var(--border) 90%, transparent)"/>
<text class="lo" x="212" y="158" text-anchor="middle">0.41</text>
<rect x="244" y="122" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 55%, transparent)" stroke="color-mix(in srgb, var(--primary) 70%, transparent)"/>
<text class="hi" x="274" y="158" text-anchor="middle">0.99</text>
<rect x="306" y="122" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 8%, transparent)" stroke="color-mix(in srgb, var(--border) 90%, transparent)"/>
<text class="lo" x="336" y="158" text-anchor="middle">0.37</text>
<rect x="182" y="184" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 8%, transparent)" stroke="color-mix(in srgb, var(--border) 90%, transparent)"/>
<text class="lo" x="212" y="220" text-anchor="middle">0.40</text>
<rect x="244" y="184" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 8%, transparent)" stroke="color-mix(in srgb, var(--border) 90%, transparent)"/>
<text class="lo" x="274" y="220" text-anchor="middle">0.41</text>
<rect x="306" y="184" width="60" height="60" rx="4" fill="color-mix(in srgb, var(--primary) 55%, transparent)" stroke="color-mix(in srgb, var(--primary) 70%, transparent)"/>
<text class="hi" x="336" y="220" text-anchor="middle">1.00</text>
<text class="l" x="20" y="262">photos down the side, captions across the top</text>
</svg>
<figcaption>Matched pairs average 0.99, mismatched 0.41. That gap is what training produces.</figcaption>
</figure>

The diagonal averages 0.993 and everything else averages 0.409 — a gap of 0.58 between "this caption describes this photo" and "it does not".

That gap is the entire achievement. It is not a property of pixels or of words; it is what the two encoders were trained to produce, by being shown matched pairs and pushed to make them agree while pushing mismatched pairs apart.

Once it exists, comparing an image to a sentence is just a dot product.

## The pipeline

**Encode.** Each input goes through the encoder for its modality. Images are typically cut into patches and run through a transformer; text goes through a text encoder; audio through an audio one.

**Align.** All of those land in the shared space. This is what joint training bought.

**Reason.** The combined vectors go into a model that attends across all of them at once. At this point it does not particularly matter which vector came from which modality — they are all just vectors in the same space, and attention relates them the same way it relates words to words.

**Generate.** Out comes text, or an image, or audio, depending on what the model is for.

So: *photo of a workbench + "which tool is missing from the rack?"* — the image encoder produces vectors for the patches, the text encoder produces vectors for the question, both sets go into the same stack, and attention lets the question's tokens attend to the image's patches.

## Three shapes it takes

**Several modalities in, text out.** The common one — show it an image, a document, a chart, and ask about it.

**One modality in, a different one out.** Text to image, text to video, audio to text. The encoder and the generator are for different modalities, joined through the shared space.

**Alignment as the product.** No generation at all: encode both kinds of thing and compare them. This is what makes it possible to search a photo library with a sentence, or check whether an image matches a description.

## Where it goes wrong

**Alignment is only as good as the pairs.** The whole thing rests on training data where the caption really describes the image. Loosely matched pairs teach a loosely aligned space, and nothing downstream can recover from that.

**It is not free.** An image becomes hundreds of vectors. A modality that seemed cheap to add can dominate the context and the cost.

**More modalities is not automatically better.** Each one added has to earn its place; if it carries no information the task needs, it is noise competing for attention.

**Every modality needs its own evaluation.** A model that reads text well and images poorly can look fine on an average score. The failure hides in whichever modality was tested least.

**Bias arrives through every channel.** Each modality's training data brings its own, and aligning them can compound rather than cancel.

## The short version

- A modality is a kind of data; multimodal means more than one as real input or output.
- Classifying an image into a label is not multimodal — the output is not a modality.
- Each modality has its own encoder, and the encoders are trained together.
- Training makes matched pairs land close together — 0.99 against 0.41 for mismatches in the example above.
- Once they share a space, attention treats them uniformly and comparison is a dot product.
- Three shapes: many modalities in and text out, one in and another out, or alignment itself as the product.
- Quality of the paired training data sets the ceiling for everything else.
