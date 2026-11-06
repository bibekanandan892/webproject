---
title: "CUDA kernels"
date: "2026-11-06T11:00"
category: "AI"
tags: ["cuda", "gpu", "kernels", "fusion", "performance"]
summary: "A kernel is a function run by thousands of GPU threads at once. Whether it is fast depends on one ratio — arithmetic per byte moved. An element-wise add reaches 0.056% of an H100's peak; a 4,096-square matrix multiply can use nearly all of it. Fusing three element-wise ops is a free 3×."
draft: false
cover: "/blog/cuda-kernels.svg"
---

Every operation a neural network runs on a GPU — each matrix multiply, each activation, each normalisation — is a **kernel**: a function the CPU launches, which the GPU then runs across thousands of threads in parallel. A forward pass through a large model is a sequence of hundreds of kernel launches.

Most people never write one. But the reasons some operations are fast and others are slow, why "fused" kernels exist, and why Flash Attention was such a large improvement all come from how kernels work.

## The shape of a kernel

A kernel is written from the point of view of a single thread. The programmer says what one thread does, and launches a grid of them:

```cuda title="add.cu"
__global__ void add(const half* x, const half* y, half* out, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;   // which element am I?
    if (i < n) out[i] = x[i] + y[i];
}

// launch: enough blocks of 256 threads to cover n elements
add<<<(n + 255) / 256, 256>>>(x, y, out, n);
```

The hierarchy has three levels:

- **Threads** each handle a small piece of the work — here, one element.
- **Blocks** group threads (here 256) that run on the same streaming multiprocessor and can share a small, very fast on-chip memory.
- The **grid** is all the blocks needed to cover the problem.

The hardware runs threads in groups of 32 called **warps**, which execute the same instruction in lockstep. Threads in a warp that take different branches run one branch after the other, so divergent code is slower.

## The one ratio that decides speed

A GPU has two limits: how fast it can compute and how fast it can move data from its main memory. For an H100, roughly 989 trillion 16-bit operations per second against 3.35 TB per second of memory bandwidth.

Divide one by the other: **295 operations per byte.** A kernel that does fewer than 295 operations for every byte it reads or writes cannot keep the arithmetic units busy — it is waiting on memory. This ratio is a kernel's **arithmetic intensity**, and it predicts performance better than anything else.

| kernel | operations per byte | bound by | share of peak compute |
| --- | --- | --- | --- |
| element-wise add (fp16) | 0.17 | memory | **0.056%** |
| matrix multiply, 4,096 × 4,096 | 1,365 | compute | up to ~100% |

The add reads two 2-byte numbers, writes one, and does one addition: 1 operation per 6 bytes. It uses about one two-thousandth of the chip's arithmetic. Nothing about the code can fix that; the kernel is waiting on memory by construction.

The matrix multiply does `2n³` operations on `3n²` numbers. At n = 4,096 that is 1,365 operations per byte, well past the 295 needed. The arithmetic takes about 139 µs and the memory traffic only 30 µs. This is why GPUs are built around matrix multiplication — it is the operation that can actually feed them.

<figure>
<svg viewBox="0 0 560 280" width="560" role="img" aria-label="Roofline chart: achievable performance rises with arithmetic intensity until the ridge at 295 operations per byte, then flattens at peak; an element-wise add sits far down the slope and a matrix multiply sits on the flat roof." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE ROOFLINE</text>
<path d="M60 36 V200 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<path d="M60 200 L340 60 H520" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<path d="M340 60 V200" stroke="var(--muted-foreground)" stroke-dasharray="3 3"/>
<text class="l" x="344" y="196">295 ops/byte</text>
<text class="l" x="160" y="120" transform="rotate(-26 160 120)">memory-bound</text>
<text class="l" x="400" y="54">compute-bound — 989 TFLOPS</text>
<circle cx="80" cy="190" r="5" fill="var(--muted-foreground)"/>
<text class="l" x="90" y="186">add — 0.17</text>
<circle cx="470" cy="60" r="5" fill="var(--primary)"/>
<text class="b" x="438" y="80">matmul — 1,365</text>
<text class="l" x="60" y="216">operations per byte moved (log scale) →</text>
<path d="M20 232 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="254">left of the ridge, speed is bandwidth × intensity; right of it, speed is peak</text>
<text class="l" x="20" y="272">fusion and tiling move kernels rightward by moving fewer bytes</text>
</svg>
<figcaption>Most of a model's kernels sit on the sloped part. The work of kernel engineering is moving them right.</figcaption>
</figure>

## Fusion: stop moving the same data

A transformer layer contains many memory-bound operations in a row: add a bias, apply an activation, multiply by a scale, add the residual. Done as separate kernels, each one reads the whole tensor from memory and writes it back:

`x → [kernel 1] → memory → [kernel 2] → memory → [kernel 3] → out`

A fused kernel does all three on each element while it is in registers, reading `x` once and writing `out` once. For three element-wise operations on a 64-million-element tensor:

| | memory traffic | time |
| --- | --- | --- |
| three kernels | 3 reads + 3 writes | 240 µs |
| one fused kernel | 1 read + 1 write | **80 µs** |

Exactly 3× faster, with the same arithmetic. Compilers like `torch.compile` and XLA find these fusions automatically; hand-written fused kernels exist for the combinations that matter most.

## Tiling: reuse what you loaded

Fusion avoids writing intermediate results. Tiling avoids reading the same input repeatedly. A matrix multiply loads a tile of each input into the block's shared memory once, and every thread in the block reuses it many times. That reuse is what pushes the intensity to 1,365.

Flash Attention is this idea applied to attention. The naive version writes the full sequence-by-sequence score matrix to main memory and reads it back for the softmax and again for the weighted sum. Flash Attention computes attention in tiles that stay in on-chip memory, never materialising the full matrix. The arithmetic is unchanged; the memory traffic collapses.

## Launch overhead

Each kernel launch costs a few microseconds on the CPU side. For large tensors this is negligible. For small ones it dominates: adding two million-element vectors moves 6 MB, which takes about 1.8 µs — less than the ~5 µs it takes to launch the kernel. During decoding, where each step touches small tensors through hundreds of kernels, launch overhead can be a fifth of the step. CUDA graphs fix this by recording the whole sequence of launches once and replaying it as a single unit.

## What to take away

A CUDA kernel is a function written for one thread and run across thousands. Its speed is governed by arithmetic intensity: below about 295 operations per byte on an H100 it waits on memory, above it it uses the compute. An element-wise add reaches 0.056% of peak; a large matrix multiply can reach nearly all of it.

The main tools for making kernels faster all reduce bytes moved, not operations: fusing chains of element-wise work (3× for three ops), tiling to reuse data in on-chip memory (the idea behind Flash Attention), and graph capture to amortise launch costs.
