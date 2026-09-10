---
title: "Continuous batching"
date: "2026-09-10T16:00"
category: "AI"
tags: ["inference", "batching", "throughput", "serving", "gpu"]
summary: "Waiting for every request in a batch to finish leaves most of the GPU's slots idle most of the time. Refilling each slot the moment it empties is a scheduling change, and it roughly doubles what the same hardware serves."
draft: false
cover: "/blog/continuous-batching.svg"
---

A GPU serving one request at a time is mostly idle. The arithmetic for a single token uses a fraction of what the hardware can do, so requests are processed in batches — several at once, at almost the same cost as one.

The question is when a batch begins and ends, and the obvious answer is the expensive one.

## The problem with fixed batches

Take a batch of four. Run all four together, one decode step at a time, until every one of them is done. Then start the next four.

The trouble is that requests are not the same length. One reply runs to fifteen tokens and another to two hundred and forty. The short one finishes at step fifteen and its slot then sits empty for two hundred and twenty-five steps, because the batch does not end until the longest request does.

Meanwhile new requests wait in a queue for a slot that is empty and unusable.

## Refilling as you go

Continuous batching changes one thing: when a request finishes, its slot is given to the next queued request immediately, in the middle of the batch.

Nothing about the model changes. It is purely a decision about scheduling — the batch stops being a group of requests that start and end together, and becomes a set of slots that are kept full.

## What that is worth

Twelve requests, four slots, and reply lengths of 240, 30, 90, 15, 60, 45, 20, 180, 25, 35, 120 and 40 decode steps. That is 900 steps of actual work.

<figure>
<svg viewBox="0 0 580 252" width="580" role="img" aria-label="Two timelines on the same scale. Under static batching the four slots have large empty gaps and the run takes 540 steps. Under continuous batching the slots are kept full and the run finishes in 255 steps." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">SAME WORK, SAME SCALE</text>
<text class="l" x="80" y="80" text-anchor="end">static</text>
<rect x="90" y="36" width="195.6" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="90" y="57" width="24.4" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="90" y="78" width="73.3" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="90" y="99" width="12.2" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="285.6" y="36" width="48.9" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="285.6" y="57" width="36.7" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="285.6" y="78" width="16.3" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="285.6" y="99" width="146.7" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="432.2" y="36" width="20.4" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="432.2" y="57" width="28.5" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="432.2" y="78" width="97.8" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="432.2" y="99" width="32.6" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<path d="M530 30 V120" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.2" stroke-dasharray="4 3"/>
<text class="v" x="527" y="27" text-anchor="end">540 steps</text>
<text class="l" x="80" y="176" text-anchor="end">continuous</text>
<rect x="90" y="132" width="195.6" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="90" y="153" width="24.4" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="90" y="174" width="73.3" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="90" y="195" width="12.2" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="102.2" y="195" width="48.9" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="114.4" y="153" width="36.7" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="151.1" y="153" width="16.3" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="151.1" y="195" width="146.7" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="163.3" y="174" width="20.4" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="167.4" y="153" width="28.5" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="183.7" y="174" width="97.8" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<rect x="195.9" y="153" width="32.6" height="16" rx="2" fill="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<path d="M297.8 126 V216" stroke="var(--primary)" stroke-opacity="0.75" stroke-width="1.4" stroke-dasharray="4 3"/>
<text class="v" x="302" y="226">255 steps</text>
<text class="l" x="20" y="234">four slot rows in each panel; gaps are idle slots</text>
</svg>
<figcaption>Both panels are drawn to the same scale. The white space in the top one is the entire argument.</figcaption>
</figure>

| | static | continuous |
| --- | --- | --- |
| steps to clear everything | 540 | **255** |
| at 50 ms a step | 27.0 s | **12.8 s** |
| slot utilisation | 41.7% | **88.2%** |
| throughput | 33 tokens/s | **71 tokens/s** |

Same requests, same model, same hardware. **2.12× the throughput**, from changing when a slot is refilled.

The utilisation figure is the honest way to see it. Under fixed batching the slots do useful work 42% of the time; the rest is waiting for stragglers. Continuous batching takes that to 88%, and the remaining gap is the tail — near the end there is not enough queued work left to keep four slots busy.

## What it does to individual requests

Throughput is the headline, but the effect on waiting is larger and less obvious:

| reply length | finishes at, static | finishes at, continuous |
| --- | --- | --- |
| 20 steps | 260 | **95** |
| 45 steps | 285 | **75** |
| 60 steps | 300 | **75** |
| 25 steps | 445 | **115** |
| 240 steps | 240 | 240 |

The short requests gain most. A twenty-step reply that was queued behind a batch finished at step 260 under fixed batching and at 95 under continuous — and almost all of that wait was queuing, not generating.

The longest request is unchanged. Nothing sped it up; it was never the one waiting.

## What it does not fix

It is scheduling only. The model, the attention, the arithmetic per token are all identical — this is a change to when work is admitted, nothing more.

The batch size is still capped by memory. Every request in flight holds a KV cache proportional to its length, so the number of slots is limited by how much cache fits, and keeping slots full means holding more caches at once. Continuous batching increases memory pressure precisely because it succeeds at keeping the machine busy.

Which is why it is normally paired with a scheme that stops the cache being allocated in wasteful contiguous blocks. Better scheduling exposes the memory limit; the memory work is what raises it.

## The short version

- Requests are batched because a GPU running one at a time is mostly idle.
- With fixed batches, a slot stays empty from when its request finishes until the longest one in the batch does.
- Continuous batching refills each slot the moment it empties.
- On twelve mixed-length requests across four slots: 540 steps to 255, and 42% slot utilisation to 88%.
- Short requests benefit most; the longest request is unaffected.
- It changes scheduling only — no change to the model.
- Keeping slots full raises memory pressure, which is why it pairs with better KV cache allocation.
