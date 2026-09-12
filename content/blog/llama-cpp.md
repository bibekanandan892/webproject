---
title: "llama.cpp"
date: "2026-09-11T21:20"
category: "AI"
tags: ["llama-cpp", "local-inference", "cpu", "gpu-offload", "memory-bandwidth"]
summary: "Running a model on a laptop CPU is a memory-bandwidth problem, not an arithmetic one — which sets a hard ceiling of about 12 tokens a second. It also explains why offloading half the layers to a GPU barely helps."
draft: false
cover: "/blog/llama-cpp.svg"
---

llama.cpp runs language models on ordinary machines: a laptop, a desktop with a modest graphics card, a phone. No cluster, no server, no network call.

Everything it does follows from one constraint, and that constraint is not what most people assume.

## The ceiling is bandwidth

Generating a token requires reading every weight once. That is the dominant cost, and it is a memory transfer, not a calculation.

A 4 GB quantized model on a desktop with about 50 GB/s of memory bandwidth:

| | time to read 4 GB | tokens per second |
| --- | --- | --- |
| CPU, ~50 GB/s | 80 ms | **12.5** |
| GPU, ~1,000 GB/s | 4 ms | 250 |

Twelve tokens a second is the ceiling on that CPU. Not the measured speed — the ceiling, the number you cannot beat with a better kernel, more cores, or perfect code, because the weights have to come out of memory and memory delivers 50 GB/s.

The 20× gap between CPU and GPU here is almost entirely bandwidth. The graphics card's arithmetic advantage is larger still, and mostly irrelevant: for generation the arithmetic was never the bottleneck.

This reframes the two optimizations people talk about most.

**Quantization is the main speed lever, not just a memory one.** Cutting a model from 14 GB to 4 GB cuts the bytes read per token by the same factor, and since the read is the cost, generation gets about that much faster. It is the rare optimization that improves both constraints at once.

**Hand-tuned CPU arithmetic — SIMD instructions doing eight multiply-adds at a time — matters much more for reading the prompt than for writing the answer.** Prompt processing handles hundreds of tokens per pass over the weights, so it is genuinely compute-bound and benefits enormously. Generation processes one token per pass and is waiting on memory either way.

## Which is why partial offload disappoints

A machine with a small graphics card can put some layers on it and leave the rest on the CPU. The obvious expectation is that offloading half the work halves the time.

It does not, and the arithmetic says why. For a 32-layer, 4 GB model:

| layers on the GPU | VRAM used | ms/token | tokens/s | speedup |
| --- | --- | --- | --- | --- |
| 0 | — | 80.0 | 12.5 | 1.00× |
| 8 | 1.0 GB | 61.0 | 16.4 | 1.31× |
| 16 | 2.0 GB | 42.0 | 23.8 | 1.90× |
| 24 | 3.0 GB | 23.0 | 43.5 | 3.48× |
| 28 | 3.5 GB | 13.5 | 74.1 | 5.93× |
| 32 | 4.0 GB | 4.0 | 250.0 | **20.00×** |

Half the layers buys 1.90×. The last four layers — going from 28 to 32 — buy 3.38× on their own.

The reason is that the CPU's per-layer cost is 30 times the GPU's, so whatever remains on the CPU dominates the total. Moving layers off it reduces that term linearly, but it stays the largest term until almost nothing is left. The payoff is concentrated entirely at the end.

The practical rule follows directly: **find the largest quantization that fits entirely in VRAM, rather than running a better quantization partially offloaded.** A 4-bit model fully on the card beats a 6-bit model with four layers on the CPU, by a wide margin, and it is not a close call.

<figure>
<svg viewBox="0 0 560 298" width="560" role="img" aria-label="A curve of tokens per second against layers offloaded to the GPU, nearly flat at first and rising steeply only near full offload." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE PAYOFF IS ALL AT THE END</text>
<path d="M60 40 V196 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="20" y="46">250</text>
<text class="l" x="20" y="120">125</text>
<text class="l" x="34" y="200">0</text>
<path d="M60 188 L175 186 L290 181 L405 169 L462 150 L491 125 L520 40" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="290" cy="181" r="4" fill="var(--muted-foreground)"/>
<text class="l" x="200" y="166">half the layers: 1.90×</text>
<circle cx="462" cy="150" r="4" fill="var(--muted-foreground)"/>
<circle cx="520" cy="40" r="4.6" fill="var(--primary)"/>
<text class="b" x="330" y="76">the last four layers: 3.38×</text>
<path d="M462 144 L500 84" stroke="var(--primary)" stroke-opacity="0.5" stroke-width="1.4"/>
<text class="l" x="60" y="216">0</text>
<text class="l" x="290" y="216" text-anchor="middle">16</text>
<text class="l" x="520" y="216" text-anchor="end">32 layers on the GPU</text>
<path d="M20 234 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="256">whatever is left on the CPU costs 30× per layer, so it dominates</text>
<text class="l" x="20" y="276">fit a smaller quantization entirely, rather than a better one partly</text>
</svg>
<figcaption>Tokens per second against layers offloaded. Nothing much happens until the CPU has almost nothing left to do.</figcaption>
</figure>

## What makes it start instantly

The model is one file laid out the way the runtime wants it, so loading is a memory-map rather than a read: the operating system makes the file appear at an address and fetches pages when they are first touched.

A 4 GB model therefore begins generating before 4 GB has been read from disk. The pages are also file-backed and clean, so under memory pressure the system can drop and re-read them instead of swapping, and two processes running the same model share one copy.

None of that is available if the weights need decompressing or rearranging on load. The format has to match the runtime's layout exactly, which is why the two were designed together.

## Reading the quantization names

A file marked `Q4_K_M` encodes four decisions: 4 nominal bits per weight, the k-quant family, which stores scales in a two-level arrangement over super-blocks rather than one flat scale per small block, and the medium variant, which keeps some tensors at higher precision than others.

That last letter is where the judgement lives. Attention projections and embeddings tolerate aggressive quantization far worse than the bulk feed-forward weights, so the S/M/L variants are different answers to which tensors get the extra bits. Given the offload arithmetic above, the right variant is usually the largest one that still fits in VRAM completely.

## What to take away

The project's reputation is for clever CPU code, and the clever CPU code is real. But the thing that decides your tokens per second is how many bytes have to move and how fast the memory holding them is.

Which is why quantization is the dominant lever, why prompt processing and generation respond to completely different optimizations, and why a partially offloaded model runs at nearly CPU speed until the CPU's share is almost gone.
