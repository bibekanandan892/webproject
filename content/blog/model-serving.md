---
title: "How model serving works"
date: "2026-11-06T17:30"
category: "AI"
tags: ["serving", "inference", "batching", "latency", "cost"]
summary: "Serving turns a trained model into an API that answers within a deadline at an affordable price. The same $2-an-hour GPU costs $11.11 per million tokens serving one request at a time and $0.28 when batching — and pushing it from 50% to 95% busy multiplies queueing delay nineteen-fold."
draft: false
cover: "/blog/model-serving.svg"
---

A trained model is a file of weights. Model serving is everything needed to turn that file into something that answers requests: reliably, quickly enough, for many users at once, at a cost that makes sense.

It is mostly not about the model. It is about queues, batches, memory and hardware.

## The request path

A typical request to a served model goes through:

1. **A gateway** — authentication, rate limits, routing to the right model and version.
2. **A queue** — requests wait here when every worker is busy.
3. **A scheduler** — groups waiting requests into batches and assigns them to workers.
4. **A model worker** — a process holding the weights on one or more accelerators, running the forward passes.
5. **Pre- and post-processing** — tokenising input, applying safety filters, formatting and streaming output.

Each step adds latency, and any of them can be the bottleneck.

## Batching is the economics

A GPU running a model for one request at a time spends most of its time waiting for weights to arrive from memory, not computing. Serving many requests together lets each weight that is loaded be used for all of them. Throughput rises almost proportionally with batch size, until compute becomes the limit.

For a language model on a GPU rented at $2 an hour:

| tokens per second (whole GPU) | cost per million tokens |
| --- | --- |
| 50 — one request at a time | **$11.11** |
| 500 — modest batching | $1.11 |
| 2,000 — well-batched | **$0.28** |

A forty-fold difference in cost on the same hardware, from how requests are grouped. **Continuous batching** — adding new requests to a running batch the moment others finish, rather than waiting for a whole batch to complete — is what makes high utilisation possible for generation, where every request has a different length.

## Utilisation is the latency trap

There is a catch. A busy server makes requests wait. With random arrivals and service times, queueing theory gives the average wait as `ρ / (1 − ρ)` times the service time, where ρ is utilisation. For a 100 ms service time:

| utilisation | average queue wait | total response time |
| --- | --- | --- |
| 50% | 100 ms | 200 ms |
| 80% | 400 ms | 500 ms |
| 90% | 900 ms | 1,000 ms |
| 95% | **1,900 ms** | **2,000 ms** |

From 50% to 95% busy, the wait grows nineteen-fold. The last few points of utilisation are where latency explodes. Cost pushes toward running hot; latency targets push back. Real serving systems run well below 100% and **autoscale** — adding workers as load rises — to stay on the flat part of the curve.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Curve of total response time against utilisation, flat at 200 ms at 50% and rising steeply to 2,000 ms at 95%." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">BUSY GPUs ARE CHEAP AND SLOW</text>
<path d="M70 36 V196 H500" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="64" y="40" text-anchor="end">2,000 ms</text><text class="l" x="64" y="200" text-anchor="end">0</text>
<path d="M70.0 188.0 L74.2 187.9 L78.3 187.8 L82.5 187.8 L86.6 187.7 L90.8 187.6 L95.0 187.5 L99.1 187.4 L103.3 187.3 L107.4 187.2 L111.6 187.1 L115.8 187.0 L119.9 186.9 L124.1 186.8 L128.2 186.7 L132.4 186.6 L136.6 186.5 L140.7 186.4 L144.9 186.2 L149.0 186.1 L153.2 186.0 L157.4 185.9 L161.5 185.7 L165.7 185.6 L169.8 185.5 L174.0 185.3 L178.2 185.2 L182.3 185.0 L186.5 184.9 L190.6 184.7 L194.8 184.6 L199.0 184.4 L203.1 184.2 L207.3 184.1 L211.4 183.9 L215.6 183.7 L219.8 183.5 L223.9 183.3 L228.1 183.1 L232.2 182.9 L236.4 182.7 L240.6 182.4 L244.7 182.2 L248.9 182.0 L253.0 181.7 L257.2 181.5 L261.4 181.2 L265.5 180.9 L269.7 180.6 L273.8 180.3 L278.0 180.0 L282.2 179.7 L286.3 179.3 L290.5 179.0 L294.6 178.6 L298.8 178.2 L303.0 177.8 L307.1 177.4 L311.3 177.0 L315.4 176.5 L319.6 176.0 L323.8 175.5 L327.9 174.9 L332.1 174.4 L336.2 173.8 L340.4 173.1 L344.6 172.5 L348.7 171.8 L352.9 171.0 L357.0 170.2 L361.2 169.3 L365.4 168.4 L369.5 167.4 L373.7 166.4 L377.8 165.2 L382.0 164.0 L386.2 162.7 L390.3 161.2 L394.5 159.6 L398.6 157.9 L402.8 156.0 L407.0 153.9 L411.1 151.6 L415.3 148.9 L419.4 146.0 L423.6 142.7 L427.8 138.9 L431.9 134.5 L436.1 129.3 L440.2 123.3 L444.4 116.0 L448.6 107.1 L452.7 96.0 L456.9 81.7 L461.0 62.7 L465.2 36.0" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<g fill="var(--primary)"><circle cx="278.0" cy="180.0" r="3.5"/><circle cx="402.8" cy="156.0" r="3.5"/><circle cx="444.4" cy="116.0" r="3.5"/><circle cx="465.2" cy="36.0" r="3.5"/></g>
<text class="b" x="272" y="174" text-anchor="end">50% · 200</text><text class="b" x="397" y="150" text-anchor="end">80% · 500</text><text class="b" x="438" y="110" text-anchor="end">90% · 1,000</text><text class="b" x="459" y="44" text-anchor="end">95% · 2,000</text>
<text class="l" x="70" y="212">0%</text><text class="l" x="486" y="212" text-anchor="end">100% utilisation</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="250">wait = ρ / (1 − ρ) × service time — the last few points cost the most</text>
</svg>
<figcaption>Service time 100 ms, random arrivals. Cost falls with utilisation; latency rises without bound.</figcaption>
</figure>

## Fitting the model in memory

The weights must fit on the accelerators, with room left for working memory — for language models, mostly the KV cache that grows with every active conversation.

- **Quantization** stores weights in 8 or 4 bits instead of 16, halving or quartering their memory and speeding up memory-bound inference.
- **Tensor parallelism** splits each layer across several GPUs that work on it together; **pipeline parallelism** gives different layers to different GPUs.
- **Paged KV caches** allocate cache memory in small blocks, like virtual memory, so variable-length conversations do not waste space — which directly raises how many requests fit in a batch.

## Latency targets for language models

Generation has two latencies that matter separately:

- **Time to first token (TTFT)** — dominated by processing the prompt. Affected by prompt length, prompt caching and queueing.
- **Time per output token (TPOT)** — the streaming speed once generation starts. Affected by batch size and model size.

Larger batches improve cost and throughput but slow each request's tokens. Serving systems set targets for both, often at the 95th or 99th percentile, and tune batch sizes to meet them.

## Operating it

**Versioning and rollout.** Serve several model versions side by side; shift traffic gradually; roll back quickly.

**Cold starts.** Loading tens of gigabytes of weights takes time. Keep warm capacity and scale up before demand peaks rather than after.

**Observability.** Track queue depth, utilisation, TTFT and TPOT percentiles, error rates, and tokens per second per GPU. Cost per million tokens follows directly from the last.

**Graceful overload.** When demand exceeds capacity, reject or queue with a clear signal rather than letting every request slow down.

## What to take away

Model serving is gateways, queues, schedulers and workers wrapped around a model. Batching is the economics: the same $2-an-hour GPU costs $11.11 per million tokens one request at a time and $0.28 when well batched.

Utilisation is the trade-off: queueing delay grows as `ρ / (1 − ρ)`, nineteen-fold from 50% to 95% busy. Serving well means batching as much as latency targets allow, fitting more requests in memory, and autoscaling to stay off the steep part of the curve.
