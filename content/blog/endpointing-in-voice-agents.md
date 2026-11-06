---
title: "Endpointing in voice agents"
date: "2026-11-06T15:00"
category: "AI"
tags: ["voice-agents", "endpointing", "vad", "turn-detection", "evaluation"]
summary: "Endpointing is a classifier that fires on every pause and must say \"finished\" or \"still talking\". Over 1,000 real endings and 3,000 mid-sentence pauses, a 300 ms silence rule is right only 67.5% of the times it fires; 1,200 ms reaches 94.2% — and makes every reply 1.2 s late."
draft: false
cover: "/blog/endpointing-in-voice-agents.svg"
---

Endpointing is the decision that the user has finished speaking and it is the agent's turn. Every reply a voice agent gives starts with it, and every interruption it commits starts with it getting it wrong.

It helps to think of endpointing as what it actually is: a classifier. Each time the user goes quiet, it must answer one question — *is this the end of the turn, or a pause inside it?* — and it must answer quickly, because the time spent deciding is silence.

## The machinery

A typical endpointing pipeline has three layers.

**Voice activity detection (VAD).** The audio is cut into frames of 10–30 ms, and a small model scores each frame for the probability that it contains speech. VAD answers "is someone talking right now?", not "are they done?".

**Smoothing.** Raw frame scores flicker. A short burst of non-speech in the middle of a word should not count as silence, and a single noisy frame should not count as speech. Smoothing — requiring several consecutive frames to change state, and holding "speech" for a short period after it ends — turns flickering scores into stable speech and silence segments.

**The decision rule.** Given the current silence, decide whether the turn is over. The simplest rule is a timeout: *if silence has lasted T milliseconds, the turn has ended.* Better rules also consider what was said; that is model-based turn detection.

The speech-to-text system usually has its own idea of when an utterance is final, and the two must be coordinated. The agent should not act on a transcript that is still changing.

## Endpointing as a classifier

Score it like one. Suppose a test set contains 1,000 genuine ends of turns and 3,000 pauses *within* turns — people pause mid-sentence often, typically several times per turn. With pauses modelled as 85% short (averaging 120 ms) and 15% longer hesitations (averaging 600 ms), a silence timeout of *T* behaves as follows:

| timeout | false endpoints (of 3,000 pauses) | precision when it fires | delay added to every reply |
| --- | --- | --- | --- |
| 300 ms | 482 | **67.5%** | 300 ms |
| 500 ms | 235 | 81.0% | 500 ms |
| 800 ms | 122 | 89.1% | 800 ms |
| 1,200 ms | 61 | **94.2%** | 1,200 ms |

At 300 ms, one firing in three is a mistake — the agent starts talking while the user is mid-sentence. At 1,200 ms, it is right 94% of the time, but every single reply now starts more than a second late.

Recall here is always 100% — every real ending eventually exceeds any timeout — so the only dial is how long to wait, and waiting trades directly against precision.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Bar chart of endpoint precision for timeouts of 300, 500, 800 and 1,200 ms — 67.5%, 81.0%, 89.1%, 94.2% — with the added delay shown beside each bar." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">PRECISION BOUGHT WITH SILENCE</text>
<text class="l" x="20" y="54">300 ms</text><rect x="100" y="42" width="270" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.5"/><text class="l" x="378" y="55">67.5%</text>
<text class="l" x="20" y="84">500 ms</text><rect x="100" y="72" width="324" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.55"/><text class="l" x="432" y="85">81.0%</text>
<text class="l" x="20" y="114">800 ms</text><rect x="100" y="102" width="356" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.6"/><text class="l" x="464" y="115">89.1%</text>
<text class="b" x="20" y="144">1,200 ms</text><rect x="100" y="132" width="377" height="18" rx="3" fill="var(--primary)" fill-opacity="0.8"/><text class="b" x="485" y="145">94.2%</text>
<path d="M500 36 V156" stroke="var(--muted-foreground)" stroke-opacity="0.3"/>
<text class="l" x="503" y="40">100%</text>
<path d="M20 176 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="200">precision = real endings ÷ all the times the endpointer fired</text>
<text class="l" x="20" y="220">1,000 real endings, 3,000 mid-turn pauses, pauses modelled as 85% short / 15% hesitation</text>
<text class="l" x="20" y="240">every extra point of precision from a timeout is paid for by every reply</text>
</svg>
<figcaption>Silence-only endpointing has one dial. Each setting is a different compromise, never a good one.</figcaption>
</figure>

## How to evaluate an endpointer

1. **Build a labelled set from real calls.** Mark every pause longer than, say, 100 ms as *end of turn* or *mid-turn*. Include hesitations, lists, numbers and spelled-out names — the cases that break endpointers.
2. **Measure precision and latency together.** For each configuration: how often it fires on a mid-turn pause, and how long after a real ending it fires (median and p95).
3. **Weight by consequence.** Cutting someone off while they read a card number is worse than a slight delay after "thanks, bye". A single average hides that.
4. **Re-evaluate per channel.** Phone audio, browser audio and noisy environments behave differently; VAD in particular degrades in noise.

## Tuning without a better model

Within the silence-only approach, a few adjustments help:

- **Different timeouts for different moments.** After the agent asks for a phone number, wait longer; after a yes/no question, wait less.
- **Respect the transcript.** If the last word is "and", "the", "my", or a number, the turn is almost certainly not over; extend the timeout.
- **Adapt to the speaker.** Someone who pauses a lot early in the call will keep doing it.

Each of these is a step toward the real fix, which is to stop relying on silence alone: model-based turn detection, which reads the words and the intonation and predicts whether the turn is complete.

## Recovering from mistakes

No endpointer is perfect, so the agent must handle its own errors:

- **If it fires early and the user keeps talking,** stop immediately (barge-in), discard the reply, and keep listening. The partial reply should not be recorded as said.
- **If it fires late,** there is nothing to recover — the user simply waited. This asymmetry is why many systems err slightly toward waiting.

## What to take away

Endpointing classifies each pause as the end of a turn or a pause within one, under time pressure. With silence alone, the only control is the timeout, and it trades precision against delay: over 1,000 endings and 3,000 mid-turn pauses, 300 ms is right 67.5% of the times it fires and 1,200 ms is right 94.2% — at the cost of 1.2 s before every reply.

Evaluate endpointers like classifiers, on real labelled pauses, measuring precision and latency together; then add the signals — words, context, intonation — that silence does not carry.
