---
title: "How Ollama works"
date: "2026-08-25T17:20"
category: "AI"
tags: ["ollama", "local-llm", "gguf", "quantization", "inference"]
summary: "Ollama packages a quantized model, an inference engine and an HTTP server behind one command. On a laptop, the speed you get is set by one division: memory bandwidth over model size — 20.6 tokens a second for an 8B model at 100 GB/s, 2.4 for a 70B."
draft: false
cover: "/blog/ollama.svg"
---

Running a language model on your own machine used to mean choosing a model format, compiling an inference engine, picking a quantization, and writing a server around it. Ollama turns all of that into:

```bash title="terminal"
ollama run llama3.1
```

The first time, it downloads the model. Then you are talking to it. Under that single command there are four separate pieces, and knowing what they are explains what Ollama can and cannot do for you.

## The four pieces

**1. A model registry.** `llama3.1` is a name in Ollama's library, like an image name in Docker. Pulling it fetches a set of layers — the weights, a prompt template, default parameters, a licence — and stores them locally by content hash, so models that share layers share disk.

**2. Quantized weights in GGUF.** The weights are not the original 16-bit release. They are quantized, typically to about 4–5 bits per weight, and stored as GGUF: a single file holding the tensors, the tokenizer and the metadata needed to run them. This is what makes models fit on ordinary hardware.

**3. An inference engine.** Ollama's runtime is built on the llama.cpp lineage of engines: optimised CPU code, plus GPU back-ends for Apple Metal, NVIDIA CUDA and AMD ROCm. It detects the hardware, puts as many layers on the GPU as will fit, and runs the rest on the CPU.

**4. A local server.** Ollama runs a background service on port 11434 with a REST API, including an OpenAI-compatible endpoint. Anything that can call an LLM API can be pointed at `http://localhost:11434` instead.

## The Modelfile

Customising a model is done with a Modelfile, deliberately modelled on a Dockerfile:

```text title="Modelfile"
FROM llama3.1
PARAMETER temperature 0.2
PARAMETER num_ctx 8192
SYSTEM You are a terse assistant that answers in one sentence.
```

`ollama create terse -f Modelfile` produces a new named model that shares the base weights and adds the new layers on top. Nothing is retrained; it is the same weights with a different default prompt and settings.

## What decides the speed

Generating each token means reading every weight once. On a laptop or desktop that is limited not by arithmetic but by how fast weights can be streamed from memory. So the ceiling is easy to estimate:

`tokens per second ≈ memory bandwidth ÷ model size in bytes`

| model | quantization | size | 100 GB/s | 400 GB/s | 1,000 GB/s |
| --- | --- | --- | --- | --- | --- |
| 8B | ~4.85 bits | 4.8 GB | **20.6** | 82.5 | 206 |
| 8B | 8-bit | 8.5 GB | 11.8 | 47.1 | 118 |
| 8B | 16-bit | 16.0 GB | 6.2 | 25.0 | 62.5 |
| 70B | ~4.85 bits | 42.4 GB | **2.4** | 9.4 | 23.6 |

100 GB/s is a typical laptop with ordinary RAM. 400 GB/s is a high-end unified-memory laptop. 1,000 GB/s is a desktop GPU. Real speeds land somewhat below these ceilings.

Two consequences follow. First, quantization is not only about fitting: a 4-bit model is about **3.3×** faster than the same model at 16 bits, because there are fewer bytes to read. Second, a 70B model on a laptop is possible but slow — a couple of tokens a second, slower than reading speed.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Bar chart of estimated tokens per second at 100 GB/s memory bandwidth: 8B at 4.85 bits 20.6, 8B at 8 bits 11.8, 8B at 16 bits 6.2, 70B at 4.85 bits 2.4." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">TOKENS PER SECOND ON A 100 GB/S LAPTOP</text>
<text class="b" x="20" y="54">8B · 4.85-bit</text><rect x="140" y="42" width="371" height="18" rx="3" fill="var(--primary)" fill-opacity="0.8"/><text class="b" x="518" y="55">20.6</text>
<text class="l" x="20" y="84">8B · 8-bit</text><rect x="140" y="72" width="212" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.55"/><text class="l" x="359" y="85">11.8</text>
<text class="l" x="20" y="114">8B · 16-bit</text><rect x="140" y="102" width="112" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.55"/><text class="l" x="259" y="115">6.2</text>
<text class="l" x="20" y="144">70B · 4.85-bit</text><rect x="140" y="132" width="43" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.55"/><text class="l" x="190" y="145">2.4</text>
<path d="M20 172 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="196">speed ≈ bandwidth ÷ bytes of weights</text>
<text class="l" x="20" y="216">fewer bits are faster, not just smaller; more parameters are slower in proportion</text>
<text class="l" x="20" y="236">a model that spills from GPU to CPU memory runs at the slower memory's speed</text>
</svg>
<figcaption>On local hardware, the size of the file is the speed limit.</figcaption>
</figure>

## Memory: what must fit

The weights must fit, plus the KV cache for the context, plus some working space. An 8B model at 4-bit needs roughly 5 GB for weights and a few hundred megabytes to a few gigabytes of cache depending on context length. Ollama's context default is modest for exactly this reason; raising `num_ctx` raises memory use.

When a model does not fit entirely on the GPU, Ollama splits it: some layers on the GPU, the rest on the CPU. That works, but the CPU layers run at system-RAM bandwidth, and the whole token waits for the slowest part. A model that is 80% on the GPU is often much closer to CPU speed than GPU speed.

## Loading and unloading

Loading a model means reading it from disk into memory: an 8B 4-bit model is about 1.6 seconds from a 3 GB/s SSD, a 70B model tens of seconds. To avoid paying that on every request, Ollama keeps a model loaded after use — five minutes by default, adjustable with `keep_alive` — and unloads it afterwards to free memory. The first request after a pause is slow; the rest are not.

Several models can be loaded at once if memory allows, and requests to the same model can be processed in parallel, which is what lets a local server back a small team or a set of agents.

## When to use it, and when not

**Use it** for private data that should not leave the machine, offline work, development against a local API, experimenting with many open models, and running small models for cheap, frequent tasks.

**Do not expect** server-grade throughput. Ollama is optimised for a single machine and a modest number of users. Serving many concurrent users at high throughput is the job of engines built for batching on data-centre GPUs, like vLLM or SGLang.

## What to take away

Ollama is a registry, a set of quantized GGUF models, a llama.cpp-style inference engine and a local HTTP server, wrapped in one command. The Modelfile customises a model without retraining it.

Locally, speed is bandwidth divided by model size: an 8B model at about 4.85 bits runs near 20 tokens a second on a 100 GB/s laptop, a 70B model near 2. Pick the model size and quantization from that division, and keep the model entirely on the GPU if you can.
