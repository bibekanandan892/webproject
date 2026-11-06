---
title: "A latency budget for voice agents"
date: "2026-09-12T08:50"
category: "AI"
tags: ["voice-agents", "latency", "percentiles", "performance", "budget"]
summary: "Seven stages with medians adding up to 820 ms do not give an 820 ms agent. Simulated with realistic spread, the median turn takes 891 ms, the 95th percentile 1,407 ms, and a third of all replies take over a second. Adding up per-stage p95s would have predicted 1,890."
draft: false
cover: "/blog/voice-agent-latency-budget.svg"
---

A latency budget divides a target response time among the stages that make up a voice agent's reply, so that each component has a number to hit. It is the main planning tool for making an agent feel conversational.

It is also easy to get subtly wrong, because latencies are not fixed numbers. Each stage varies from turn to turn, and the way variable stages add up is not the way their averages suggest.

## The stages

Measured from the instant the user stops speaking to the instant they hear the first audio:

| stage | median | 95th percentile |
| --- | --- | --- |
| network in | 40 ms | 70 ms |
| endpointing | 150 | 400 |
| speech-to-text finalisation | 50 | 120 |
| LLM time to first token | 250 | 700 |
| LLM to end of first sentence | 160 | 260 |
| TTS time to first audio | 90 | 200 |
| network out and playback buffer | 80 | 140 |
| **sum** | **820 ms** | **1,890 ms** |

The medians are a well-tuned cascade. The 95th percentiles reflect what each stage looks like on a bad turn: a hesitant user making endpointing wait, a long conversation history slowing the model's first token, a busy TTS server.

## How the stages actually add up

Neither column's sum is the answer. To see what users experience, I modelled each stage as a skewed (log-normal) distribution matching those medians and 95th percentiles, and simulated 200,000 turns:

| | total latency |
| --- | --- |
| sum of stage medians | 820 ms |
| **actual median turn** | **891 ms** |
| **actual 95th percentile** | **1,407 ms** |
| actual 99th percentile | 1,782 ms |
| sum of stage 95th percentiles | 1,890 ms |
| turns over 800 ms | 67.6% |
| turns over 1,000 ms | **32.2%** |

Two lessons are in that table.

**The median total is worse than the sum of medians.** Latencies are skewed — they can be much slower than usual, but not much faster — so each stage's average sits above its median, and the averages add up. An agent built from 820 ms of medians gives a median turn of 891 ms, and two-thirds of turns miss an 800 ms target.

**The 95th percentile total is better than the sum of 95th percentiles.** It is unlikely that every stage has a bad turn at once. Budgeting each stage at its p95 and adding them up predicts 1,890 ms; the real p95 is 1,407 ms. A budget built that way is too pessimistic and leads to over-engineering the wrong stages.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A right-skewed distribution of simulated total latency with markers at the sum of medians 820, actual median 891, 1,000 ms, actual p95 1,407 and sum of p95s 1,890." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">200,000 SIMULATED TURNS</text>
<path d="M40 170 H540" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<path d="M60 170 C120 168 170 60 210 52 C240 46 262 80 300 110 C350 140 420 158 540 167 V170 H60 Z" fill="var(--muted-foreground)" fill-opacity="0.25"/>
<path d="M252 125 C312 148 420 158 540 167 V170 H252 Z" fill="var(--primary)" fill-opacity="0.25"/>
<g stroke-dasharray="3 3">
<path d="M194 40 V178" stroke="var(--muted-foreground)"/>
<path d="M217 40 V178" stroke="var(--primary)"/>
<path d="M252 40 V178" stroke="var(--primary)"/>
<path d="M382 40 V178" stroke="var(--primary)"/>
<path d="M537 40 V178" stroke="var(--muted-foreground)"/>
</g>
<text class="l" x="190" y="192" text-anchor="end">820 Σ medians</text>
<text class="b" x="221" y="36">891 median</text>
<text class="b" x="256" y="70">1,000 ms</text><text class="b" x="256" y="84">32.2% beyond</text>
<text class="b" x="386" y="120">1,407 p95</text>
<text class="l" x="533" y="192" text-anchor="end">1,890 Σ p95s</text>
<path d="M20 212 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="234">medians add up to too little; p95s add up to too much</text>
<text class="l" x="20" y="252">budget on simulated or measured totals, not on sums of per-stage numbers</text>
</svg>
<figcaption>Skew pushes the typical turn above the sum of typical stages; independence pulls the tail below the sum of tails.</figcaption>
</figure>

## Where to spend effort: the variance

The same model shows which stages make the tail. Ranked by how much they vary:

| stage | mean | standard deviation |
| --- | --- | --- |
| LLM time to first token | 304 ms | **211 ms** |
| endpointing | 179 ms | **117 ms** |
| TTS time to first audio | 101 ms | 52 ms |
| LLM to first sentence | 167 ms | 50 ms |
| speech-to-text finalisation | 58 ms | 33 ms |
| network out | 85 ms | 30 ms |
| network in | 42 ms | 15 ms |

Two stages account for most of the spread: the language model's time to first token and endpointing. That is where the slow turns come from, and where work pays off:

- **First token:** keep prompts short and stable so prompt caching works, use a smaller or faster model for simple turns, keep inference servers below saturation, start generating speculatively before the user finishes.
- **Endpointing:** model-based turn detection, so clear endings are answered quickly and only ambiguous ones wait.

Shaving 20 ms off network-in will never be noticed. Cutting the LLM's p95 from 700 ms to 400 ms will.

## Building the budget properly

1. **Set targets on the total, at a percentile.** For example: median under 800 ms, p95 under 1,200 ms. Users remember the slow turns.
2. **Measure every stage on every turn,** with timestamps, in production. Lab numbers on short prompts and idle servers are optimistic.
3. **Combine by simulation or from real totals,** not by adding columns.
4. **Attack variance first,** in the stages that have the most of it.
5. **Hide what you cannot remove.** Fillers, acknowledgements and speculative starts move the *perceived* response earlier even when the full answer is not ready.

## What to take away

A latency budget splits the time from "user stops" to "agent speaks" across seven or so stages. Because each stage varies, the totals behave unintuitively: medians summing to 820 ms gave a median turn of 891 ms and a third of turns over a second, while p95s summing to 1,890 ms gave a real p95 of 1,407 ms.

Set targets on the total at a percentile, measure every stage in production, and spend effort where the variance is — almost always the model's first token and endpointing.
