---
title: "Dynamic endpointing"
date: "2026-10-05T11:05"
category: "AI"
tags: ["voice-agents", "endpointing", "turn-detection", "adaptation", "latency"]
summary: "A fixed 500 ms silence rule is a different rule for every speaker: it cuts off 13.7% of a quick talker's turns and 39.0% of a slow one's. Scaling the wait to each person's own pauses — 350 ms for one, 800 ms for the other — gives both the same 21.7%, and the quick talker faster replies."
draft: false
cover: "/blog/dynamic-endpointing.svg"
---

Endpointing decides when a user has finished speaking. The simplest rule waits for a fixed stretch of silence. Dynamic endpointing replaces the fixed number with one that changes — per speaker, per question, per moment in the conversation.

The case for it starts with an observation: a fixed silence rule is not actually fixed. It means something different for every person who talks to it.

## People pause at different rates

Some people speak quickly with short gaps. Others speak slowly, pausing to think between phrases. The same person pauses more when reading out a number, answering a hard question, or speaking a second language.

Model a speaker's pauses within a turn as before — mostly short gaps, with occasional longer hesitations — and scale them by a factor *k* for that speaker: 0.7 for a quick talker, 1.0 for a typical one, 1.6 for a slow one. With three pauses per turn, a fixed 500 ms threshold cuts off:

| speaker | pause scale | fixed 500 ms: turns cut off |
| --- | --- | --- |
| quick | 0.7× | 13.7% |
| typical | 1.0× | 21.7% |
| slow | 1.6× | **39.0%** |

The slow speaker is interrupted in two turns out of five. The quick speaker is interrupted less — but waits 500 ms after every turn when 350 ms would have done. The rule is too impatient for one and too patient for the other.

## Adapting to the speaker

Scale the threshold by the same factor — measure how long *this* person's pauses tend to be, and wait proportionally:

| speaker | adaptive threshold | turns cut off |
| --- | --- | --- |
| quick | 350 ms | 21.7% |
| typical | 500 ms | 21.7% |
| slow | 800 ms | 21.7% |

Every speaker now gets the same interruption rate, and the quick speaker gets replies 150 ms sooner. The slow speaker waits longer for a reply — but stops being cut off nearly twice as often as everyone else.

In practice the factor is estimated as the call goes on: track the lengths of this caller's mid-turn pauses (pauses after which they kept talking), and set the threshold at a percentile of that distribution. Start from a population default and move toward the speaker's own pattern as evidence accumulates.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Grouped bars for quick, typical and slow speakers: with a fixed 500 ms rule the share of turns cut off is 13.7%, 21.7% and 39.0%; with adaptive thresholds it is 21.7% for all three." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE RULE, THREE DIFFERENT EXPERIENCES</text>
<path d="M40 170 H540" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<g fill="var(--muted-foreground)" fill-opacity="0.55">
<rect x="80" y="122" width="40" height="48"/><rect x="240" y="94" width="40" height="76"/><rect x="400" y="34" width="40" height="136"/>
</g>
<g fill="var(--primary)" fill-opacity="0.8">
<rect x="124" y="94" width="40" height="76"/><rect x="284" y="94" width="40" height="76"/><rect x="444" y="94" width="40" height="76"/>
</g>
<text class="l" x="100" y="116" text-anchor="middle">13.7%</text><text class="l" x="260" y="88" text-anchor="middle">21.7%</text><text class="l" x="420" y="28" text-anchor="middle">39.0%</text>
<text class="b" x="144" y="88" text-anchor="middle">21.7%</text><text class="b" x="464" y="88" text-anchor="middle">21.7%</text>
<text class="l" x="122" y="186" text-anchor="middle">quick · 350 ms</text><text class="l" x="282" y="186" text-anchor="middle">typical · 500 ms</text><text class="l" x="442" y="186" text-anchor="middle">slow · 800 ms</text>
<path d="M20 204 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="226">grey: fixed 500 ms · dark: threshold scaled to the speaker</text>
<text class="l" x="20" y="244">equal fairness across speakers, and faster replies for the ones who don't need the wait</text>
</svg>
<figcaption>A fixed threshold is fixed in milliseconds, not in how it treats people.</figcaption>
</figure>

## Adapting to the moment

Speaker rate is one signal. The conversation itself supplies others:

**What the agent just asked.** After "Can I have your phone number?" or "What's the address?", users read out long strings with natural pauses between groups of digits or lines. Extend the wait. After "Shall I go ahead?", a one-word answer is expected; shorten it.

**What the user just said.** A transcript ending in "and", "but", "so", "my", or partway through a number signals more to come. A complete sentence that answers the question signals the end. This is where dynamic endpointing shades into model-based turn detection.

**What happened last time.** If the agent cut this user off a moment ago, it has direct evidence that its threshold is too short for them. Back off — and keep the longer wait for the rest of the call.

**Noise and channel.** On a noisy line, VAD is less certain about what is silence; slightly longer waits avoid treating noise gaps as endings.

## Keeping it bounded

Adaptation needs limits, or a few outliers will push it somewhere unhelpful:

- **A floor**, perhaps 200 ms, so the agent never responds to a breath.
- **A ceiling**, perhaps 2 seconds, so a user who has stopped — or walked away — is not left in silence indefinitely.
- **Slow adjustment**, so one unusually long pause does not double the threshold for the rest of the call.
- **Reset on context change**: a longer wait for a card number should not persist once the card number is done.

## How it fits with the rest

Dynamic endpointing is usually one layer in a stack:

1. VAD detects speech and silence frame by frame.
2. A turn-detection model estimates whether the words so far form a complete turn.
3. Dynamic endpointing sets the silence threshold from that estimate, the speaker's own pause pattern, and the conversational context.
4. Barge-in handling recovers when the decision is still wrong.

Each layer is simple. Together they replace one number that is wrong for most people with a wait that fits the person and the moment.

## What to take away

A fixed silence threshold treats every speaker differently: 500 ms cuts off 13.7% of a quick talker's turns and 39.0% of a slow talker's. Scaling the threshold to each speaker's own pauses — 350 ms and 800 ms — gives both the same 21.7%, and gives the quick talker faster replies.

Adapt to the speaker, to what was just asked, to what was just said and to mistakes already made; bound the adaptation with a floor, a ceiling and slow adjustment.
