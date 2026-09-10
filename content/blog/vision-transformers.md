---
title: "Vision transformers"
date: "2026-09-10T09:00"
category: "AI"
tags: ["vit", "transformers", "computer-vision", "patches", "attention"]
summary: "A vision transformer runs an image through the same machinery a language model runs text through. Almost all of the work is in turning a picture into something shaped like a sentence."
draft: false
cover: "/blog/vision-transformers.svg"
---

A vision transformer feeds an image through the same machinery a language model uses for text. Almost all of the work is in the conversion: turning a picture into something shaped like a sentence.

## Cutting the image into patches

The image is chopped into a grid of small squares. They do not overlap, and nothing is thrown away.

ViT-Base takes a 224×224 image and cuts it into 16×16 squares. Since 224 ÷ 16 = 14, the grid is 14 across and 14 down, which is 196 patches.

From here on, a patch plays the part a word plays in a sentence.

## Turning a patch into a vector

A patch is still raw pixels, and a transformer cannot read pixels.

A 16×16 patch of a colour image holds 16 × 16 × 3 = 768 numbers — three channels for red, green and blue. Those numbers are laid out flat into a single list.

One learned matrix then multiplies that list into a vector of the model's working width. The same matrix is used for every patch, so it learns one general way to read a square of image. After it runs, 196 patches have become 196 vectors.

## The token that carries the answer

Nothing so far stands for the whole image. There are only pieces of it.

So one extra vector is put at the front of the sequence. It does not come from the image at all — it is learned during training, and every image starts with the same one. It is usually called the class token.

<figure>
<svg viewBox="0 0 700 200" width="700" role="img" aria-label="A grid of image patches on the left becomes a row of tokens on the right. The row starts with a highlighted class token, followed by patch one, patch two and so on to patch 196, and a position vector is added to each." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.t{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="vt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">ONE IMAGE &#8594; 197 TOKENS</text>
<rect x="20" y="46" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="46" y="46" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="72" y="46" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="98" y="46" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="20" y="72" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="46" y="72" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="72" y="72" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="98" y="72" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="20" y="98" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="46" y="98" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="72" y="98" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="98" y="98" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="20" y="124" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="46" y="124" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="72" y="124" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="98" y="124" width="24" height="24" rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="l" x="71" y="168" text-anchor="middle">196 patches</text>
<text class="l" x="174" y="82" text-anchor="middle">flatten</text>
<path d="M134 97 H206" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#vt)"/>
<text class="l" x="174" y="116" text-anchor="middle">+ project</text>
<rect x="230" y="74" width="48" height="48" rx="6" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<text class="t" x="254" y="103" text-anchor="middle">cls</text>
<rect x="288" y="74" width="48" height="48" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<text class="t" x="312" y="103" text-anchor="middle">p1</text>
<rect x="346" y="74" width="48" height="48" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<text class="t" x="370" y="103" text-anchor="middle">p2</text>
<rect x="404" y="74" width="48" height="48" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<text class="t" x="428" y="103" text-anchor="middle">p3</text>
<text class="l" x="486" y="103" text-anchor="middle">&#183; &#183; &#183;</text>
<rect x="520" y="74" width="48" height="48" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<text class="t" x="544" y="103" text-anchor="middle">p195</text>
<rect x="578" y="74" width="48" height="48" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<text class="t" x="602" y="103" text-anchor="middle">p196</text>
<text class="l" x="428" y="146" text-anchor="middle">one learned position vector added to each</text>
</svg>
<figcaption>The grid becomes a sequence. The class token is prepended, not taken from the image.</figcaption>
</figure>

Because attention lets it read every patch, by the end of the stack that one token has collected a summary of the whole picture. It is the vector the prediction gets read from.

The sequence is therefore 197 tokens: the class token plus 196 patches.

## Telling the model where each patch was

Flattening a grid into a list throws the layout away. A patch from the top-left corner and one from the bottom-right arrive looking equally positionless.

So a position vector is added to every token — one learned vector per slot in the sequence, added element by element to what is already there.

Without it, an image and a shuffled version of the same image would look identical to the model.

## Through the encoder

Nothing exotic happens next. The 197 tokens go through an ordinary transformer encoder: multi-head self-attention, a feed-forward network, normalisation and residual connections, repeated for every layer. ViT-Base uses 12 of them.

Out come 197 vectors, the same shape as went in, each now carrying context from the rest.

The class token is then pulled out on its own and passed through a single linear layer that maps it to one score per class. Softmax turns those scores into probabilities, and the highest one is the answer.

## Choosing the patch size

Patch size is the dial that changes everything downstream, because it sets how long the sequence is — and attention work grows with the square of that.

On the same 224×224 image:

| patch | grid | patches | tokens | numbers per patch | attention pairs | vs 16×16 |
| --- | --- | --- | --- | --- | --- | --- |
| 8×8 | 28×28 | 784 | 785 | 192 | 616,225 | 15.9× |
| **16×16** | **14×14** | **196** | **197** | **768** | **38,809** | **1×** |
| 32×32 | 7×7 | 49 | 50 | 3,072 | 2,500 | 0.06× |

Halving the patch size quadruples the patch count, and squaring that is where the cost lands: 8×8 patches take about sixteen times the attention work of 16×16.

Going the other way is sixteen times cheaper, but a 32-pixel block is coarse. Anything finer than that has been averaged away before the transformer ever sees it.

For a 224-pixel image, 16×16 is where the trade settles.

## Why it needs so much data

A convolution has an assumption built into it: pixels near each other are related. That happens to be true of images, so a CNN starts out already knowing something useful.

A vision transformer knows no such thing. Attention treats every patch as equally related to every other one from the very first layer. That is more flexible, and it is also a far larger space to search — the model has to work out from examples that neighbouring patches matter.

The result is a crossover. On a mid-sized dataset the CNN's built-in assumption wins, because the transformer spends its capacity relearning something the CNN was given for free. On a very large one the transformer pulls ahead, because the assumption it was never given turns out to be a limit the CNN cannot shed.

Flexibility only pays once there is enough data to pay for it.

## The short version

- A vision transformer cuts an image into a grid of patches and treats each patch as a token.
- Every patch is flattened into a list of pixel values and projected by one shared learned matrix.
- An extra learned token is placed at the front; it ends up holding the summary the prediction is read from.
- Position vectors are added, because flattening the grid into a list loses the layout.
- The sequence then runs through an ordinary transformer encoder.
- Patch size sets the sequence length, and attention cost grows with the square of it.
- With modest data a CNN's built-in assumptions win; with enough data the transformer's flexibility does.
