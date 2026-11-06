---
title: "Measuring voice-to-voice latency"
date: "2026-09-16T16:25"
category: "AI"
tags: ["voice-agents", "latency", "measurement", "percentiles", "telephony"]
summary: "Voice-to-voice latency is the gap a person actually hears. A server that logs 620 ms is delivering about 800 ms over WebRTC and 1,020 ms over a phone line — and estimating the 95th percentile from 50 calls can land anywhere from 1,154 to 1,578 ms."
draft: false
cover: "/blog/voice-to-voice-latency.svg"
---

Voice-to-voice latency is the time from the moment a user stops speaking to the moment they hear the agent begin to reply. It is the single number that most determines whether a voice agent feels like a conversation or like a phone menu.

It is also easy to measure wrongly. The usual mistakes are measuring at the wrong place, defining the start and end inconsistently, and drawing conclusions from too few turns.

## Measure at the ears, not the server

The convenient measurement is server-side: log when the speech-to-text stream says the user stopped, log when the first TTS audio packet goes out, subtract. That number leaves out everything between the user's mouth and the server, and between the server and the user's ear:

| segment | WebRTC in a browser | phone call (PSTN) |
| --- | --- | --- |
| microphone capture and encoding | 20 ms | 20 ms |
| uplink network | 40 | 150 |
| **server-side, as logged** | **620** | **620** |
| downlink network | 40 | 150 |
| client jitter buffer | 60 | 60 |
| decoding and playback | 20 | 20 |
| **what the user hears** | **800 ms** | **1,020 ms** |

The server reports 620 ms in both cases. The user on a browser experiences 800 and the user on a phone line over a second. Phone networks add substantial delay in each direction through carriers, gateways and transcoding — a cost that never appears in server logs.

Server-side timings are still essential for finding *which* component is slow. But the headline number must be measured end to end.

## How to measure end to end

**Record both sides of real calls**, as two separate audio channels, with a shared clock. Then, for each turn:

1. Find where the user's speech ends on the user channel.
2. Find where the agent's speech begins on the agent channel.
3. Subtract.

For testing, a simulated caller works well: a script that plays recorded user utterances into the agent over the same path a real caller uses — through the phone network or a real browser — and records what comes back.

## Define "stopped speaking" once

The end of the user's speech is not a sharp event. Speech trails off into breath and room noise. Different detectors place the end at different points, often tens to hundreds of milliseconds apart.

That matters because the same definition must be used for every measurement you compare. An energy-threshold detector with a long tail will make every agent look 100 ms faster than one that marks the last syllable. Pick one method — ideally marking the end of the last word, which is what a listener perceives — and use it everywhere, including when comparing against vendors' claims.

The start of the agent's reply has the same problem in reverse: some TTS outputs begin with a few milliseconds of near-silence. Mark the first audible sound, not the first packet.

## Report distributions, and enough of them

Latency varies turn to turn, so a single average hides what users experience. Report at least the median and the 95th percentile, and ideally the 99th: one or two long silences in a call are what people remember.

The 95th percentile needs a lot of turns to estimate. Simulating an agent whose true p95 is 1,423 ms and estimating it from samples of different sizes:

| turns measured | range of p95 estimates (middle 90%) |
| --- | --- |
| 50 | **1,154 – 1,578 ms** |
| 200 | 1,299 – 1,536 ms |
| 1,000 | 1,368 – 1,475 ms |

With 50 turns, the estimate can be off by over 250 ms in either direction — larger than most of the improvements a team is trying to detect. Comparing two configurations on 50 turns each is mostly comparing noise. A few hundred turns per configuration is the minimum for decisions; a thousand for confidence in the tail.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A path from the user's mouth to the server and back to their ear, with the server-logged span covering only the middle; below, ranges of p95 estimates narrowing as the number of measured turns grows." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHERE AND HOW MUCH TO MEASURE</text>
<rect x="20" y="36" width="9" height="18" fill="var(--muted-foreground)" fill-opacity="0.5"/>
<rect x="29" y="36" width="68" height="18" fill="var(--muted-foreground)" fill-opacity="0.35"/>
<rect x="97" y="36" width="282" height="18" fill="var(--muted-foreground)" fill-opacity="0.6"/>
<rect x="379" y="36" width="68" height="18" fill="var(--muted-foreground)" fill-opacity="0.35"/>
<rect x="447" y="36" width="27" height="18" fill="var(--muted-foreground)" fill-opacity="0.5"/>
<rect x="474" y="36" width="9" height="18" fill="var(--muted-foreground)" fill-opacity="0.5"/>
<text class="l" x="238" y="49" text-anchor="middle" fill="var(--background)">server logs 620 ms</text>
<path d="M20 62 H483" stroke="var(--primary)" stroke-width="2"/>
<text class="b" x="20" y="78">phone caller hears 1,020 ms</text>
<text class="l" x="20" y="116">p95 estimate, true value 1,423 ms</text>
<path d="M298 124 V196" stroke="var(--primary)" stroke-dasharray="3 3"/>
<text class="l" x="20" y="142">50 turns</text><rect x="170" y="133" width="194" height="12" rx="3" fill="var(--muted-foreground)" fill-opacity="0.5"/>
<text class="l" x="20" y="166">200 turns</text><rect x="235" y="157" width="108" height="12" rx="3" fill="var(--muted-foreground)" fill-opacity="0.6"/>
<text class="b" x="20" y="190">1,000 turns</text><rect x="272" y="181" width="49" height="12" rx="3" fill="var(--primary)" fill-opacity="0.8"/>
<path d="M20 210 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="232">measure at the ear, on hundreds of turns, with one definition of "stopped"</text>
</svg>
<figcaption>Upper bar drawn to scale for the phone path. Lower bars: middle 90% of simulated p95 estimates.</figcaption>
</figure>

## Break it down per turn

Alongside the end-to-end number, log a timestamp at every stage boundary for every turn — end of speech detected, transcript final, first token, first sentence, first audio sent. When the end-to-end p95 moves, the per-stage breakdown shows which stage moved it. Without that, a regression in the LLM provider and a regression in the telephony route look identical.

Also slice by condition: phone versus browser, region, time of day, conversation length. Latency on the tenth turn of a long call — with a long prompt for the model to process — is often noticeably worse than on the first.

## What to take away

Voice-to-voice latency is the silence the user hears, measured from the end of their speech to the start of the agent's audio at their ear. Server logs leave out capture, network and playback: 620 ms on the server is about 800 ms in a browser and 1,020 ms on a phone line.

Measure end to end with recordings or a simulated caller, use one consistent definition of when speech ended, and collect enough turns: a p95 from 50 turns can be 250 ms off in either direction.
