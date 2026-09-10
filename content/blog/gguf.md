---
title: "GGUF"
date: "2026-09-11T13:20"
category: "AI"
tags: ["gguf", "quantization", "local-inference", "mmap", "file-format"]
summary: "GGUF is one file holding the weights, the tokenizer and everything needed to run a model — laid out so the runtime can map it into memory instead of parsing it, and quantized in small blocks so 4 bits per weight is actually usable."
draft: false
cover: "/blog/gguf.svg"
---

GGUF is a file format for a trained model. One file contains the weights, the tokenizer, and the metadata describing how to run the thing — architecture, layer counts, context length, special token ids.

That "one file" is the whole design goal, and the two decisions that follow from it are the interesting part.

## What running a model locally needs

A model is a large collection of numbers arranged into named tensors. To run it you also need to know how those tensors connect, how text becomes token ids, and which ids mean *stop*.

Split that across a weights file, a tokenizer file and a couple of config files and every one of them can drift out of step with the others. A tokenizer from a slightly different revision produces ids the weights were never trained on — and nothing crashes. The model just answers slightly wrong, forever.

GGUF keeps them together because they are not separable in practice. The file starts with the four bytes `GGUF`, then a table of key–value metadata, then the tensor data. A reader can learn everything about the model from the header before touching a single weight.

## Why 4-bit is really 4.5-bit

Weights are trained at 16 bits each. A 7-billion-weight model is therefore 14 GB, which is more memory than most laptops will give a single process.

Quantization stores each weight in fewer bits. The naive version — pick one scale for the whole tensor, divide, round to the nearest of 16 levels — does not work, and it is worth seeing how badly.

Taking 32,768 weights drawn to look like a real tensor, mostly small with a scattering of large values:

| | error, as a share of the weights' own size |
| --- | --- |
| one scale for the whole tensor | 55.3% |
| one scale per block of 32 | 9.9% |

A single outlier stretches the scale to cover its own magnitude, and every ordinary weight then rounds to the same couple of levels. Almost all the information is gone.

The fix is to quantize in small **blocks**. Thirty-two weights share one scale, so an outlier only ruins its own block. The error drops 5.6×.

That scale has to be stored. A block of 32 costs 16 bytes of 4-bit values plus a 2-byte scale — 18 bytes, or **4.5 bits per weight**:

| | bits/weight | 7B model |
| --- | --- | --- |
| fp16 | 16.00 | 14.00 GB |
| Q8_0 | 8.50 | 7.44 GB |
| Q4_0 | 4.50 | 3.94 GB |

So a "4-bit" model is 3.56× smaller than fp16, not 4×. The missing half-bit is the scale, and it is the reason the format works at all.

<figure>
<svg viewBox="0 0 560 248" width="560" role="img" aria-label="One block of thirty-two weights drawn as nibbles followed by a two-byte shared scale, with a comparison of quantization error under one scale versus per-block scales." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE BLOCK: 32 SMALL NUMBERS AND THE SCALE THEY SHARE</text>
<g fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.55">
<rect x="20" y="40" width="11" height="24" rx="2"/><rect x="33" y="40" width="11" height="24" rx="2"/><rect x="46" y="40" width="11" height="24" rx="2"/><rect x="59" y="40" width="11" height="24" rx="2"/><rect x="72" y="40" width="11" height="24" rx="2"/><rect x="85" y="40" width="11" height="24" rx="2"/><rect x="98" y="40" width="11" height="24" rx="2"/><rect x="111" y="40" width="11" height="24" rx="2"/><rect x="124" y="40" width="11" height="24" rx="2"/><rect x="137" y="40" width="11" height="24" rx="2"/><rect x="150" y="40" width="11" height="24" rx="2"/><rect x="163" y="40" width="11" height="24" rx="2"/><rect x="176" y="40" width="11" height="24" rx="2"/><rect x="189" y="40" width="11" height="24" rx="2"/><rect x="202" y="40" width="11" height="24" rx="2"/><rect x="215" y="40" width="11" height="24" rx="2"/><rect x="228" y="40" width="11" height="24" rx="2"/><rect x="241" y="40" width="11" height="24" rx="2"/><rect x="254" y="40" width="11" height="24" rx="2"/><rect x="267" y="40" width="11" height="24" rx="2"/><rect x="280" y="40" width="11" height="24" rx="2"/><rect x="293" y="40" width="11" height="24" rx="2"/><rect x="306" y="40" width="11" height="24" rx="2"/><rect x="319" y="40" width="11" height="24" rx="2"/><rect x="332" y="40" width="11" height="24" rx="2"/><rect x="345" y="40" width="11" height="24" rx="2"/><rect x="358" y="40" width="11" height="24" rx="2"/><rect x="371" y="40" width="11" height="24" rx="2"/><rect x="384" y="40" width="11" height="24" rx="2"/><rect x="397" y="40" width="11" height="24" rx="2"/><rect x="410" y="40" width="11" height="24" rx="2"/><rect x="423" y="40" width="11" height="24" rx="2"/>
</g>
<rect x="440" y="40" width="52" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="466" y="57" text-anchor="middle">scale</text>
<text class="l" x="20" y="82">32 × 4 bits = 16 bytes</text>
<text class="l" x="440" y="82">+ 2 bytes</text>
<text class="b" x="20" y="104">= 18 bytes per 32 weights = 4.50 bits each</text>
<path d="M20 122 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="146">rounding error, relative to the weights themselves</text>
<rect x="20" y="158" width="200" height="20" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="228" y="173">55.3% — one scale for the whole tensor</text>
<rect x="20" y="186" width="36" height="20" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="64" y="201">9.9% — one scale per block of 32</text>
<text class="l" x="20" y="228">the extra half-bit is what buys the other 45 points</text>
</svg>
<figcaption>An outlier can only wreck the block it lives in.</figcaption>
</figure>

## Reading the names

A file marked `Q4_K_M` decodes as four separate choices:

- **Q** — quantized, as opposed to full precision
- **4** — the nominal bits per weight
- **K** — the k-quant family, which stores scales in a smarter two-level arrangement rather than one flat scale per block
- **M** — the medium variant, meaning some tensors are kept at higher precision than others

That last letter matters more than it looks. Not all tensors tolerate quantization equally — attention projections and embeddings are more sensitive than the bulk feed-forward weights. The S/M/L variants are different answers to which tensors get spent on.

## Why loading is instant

A GGUF file stores tensor data in exactly the layout the runtime uses, aligned, with no per-tensor decoding step.

So the runtime does not read the file. It calls `mmap` and asks the operating system to make the file *appear* at an address. Nothing is copied. The header is parsed, the tensor pointers are computed as offsets into that mapping, and the model is ready.

The pages arrive from disk when they are first touched, which is why a 4 GB model can start answering before 4 GB has been read. It also means the memory is file-backed and clean: under pressure the OS can drop those pages and re-read them later, rather than swapping. And two processes running the same model share one copy of the pages, because they are mapping the same file.

None of this is possible if the weights need to be decompressed or rearranged on load. The layout *is* the feature.

## What to take away

GGUF is unglamorous on purpose. A header, some key–value metadata, and tensor bytes arranged the way the runtime wants them.

What it gets right is that a model is not just weights — and that a "4-bit" model only works because it is not really 4 bits.
