---
title: "Why voice agents cut people off"
date: "2026-11-06T17:40"
category: "AI"
tags: ["voice-agents", "turn-taking", "endpointing", "debugging", "ux"]
summary: "A 5% chance of interrupting on any single turn sounds tolerable. Over a 12-turn call it means 46.0% of callers are cut off at least once; at 10% it is 71.8%. Cut-offs have half a dozen distinct causes, and each needs its own fix."
draft: false
cover: "/blog/why-voice-agents-cut-people-off.svg"
---

The most common complaint about voice agents is not that they give wrong answers. It is that they do not let people finish. The caller is mid-sentence, the agent starts talking, the caller stops, the agent stops, both start again. It feels rude, and it wrecks the conversation's rhythm far more than a slightly slow reply would.

## Small per-turn rates, large per-call damage

Cut-offs are judged per turn by engineers and per call by users. The difference is large. If the agent interrupts on a fraction *p* of turns, the chance that a 12-turn call contains at least one interruption is `1 − (1 − p)¹²`:

| interrupted turns | calls with at least one interruption |
| --- | --- |
| 2% | 21.5% |
| 5% | **46.0%** |
| 10% | **71.8%** |

A per-turn rate of 5% — which looks fine on a dashboard — means nearly half of all callers experience being talked over. To keep that below one call in five, the per-turn rate must be under about 2%.

## The causes

Interruptions look identical from the caller's side but come from different places. Diagnosing them means finding which one is happening.

**1. Endpointing fires on a mid-turn pause.** The caller pauses to think or breathe; silence passes the threshold; the agent replies. The most common cause, and worst for slow, hesitant or non-native speakers. *Fix:* model-based turn detection, adaptive thresholds per speaker, longer waits after incomplete phrases.

**2. Structured input is spoken in chunks.** Phone numbers, card numbers, addresses and dates are read in groups with pauses between them. *Fix:* know what input is expected and wait until it is complete.

**3. The agent hears itself.** Its own audio leaks back through the caller's microphone — speakerphones and laptops are the worst — and is mistaken for speech, triggering barge-in logic or confusing the turn state. *Fix:* echo cancellation, and higher detection thresholds while the agent is speaking.

**4. Backchannels treated as turns.** The caller says "mm-hmm" or "yeah" while the agent speaks; the agent stops, then the system treats the "mm-hmm" as the caller's whole turn and replies to it. *Fix:* classify short acknowledgements as backchannels; keep talking.

**5. Transcription finalises too early.** Some speech recognisers emit a "final" result after a short silence on their own schedule. If the agent acts on the recogniser's final rather than its own endpointing decision, it inherits the recogniser's shorter timeout. *Fix:* make one component own the endpoint decision.

**6. Speculation leaks.** A speculative reply, generated early to save time, is played before endpointing has actually committed. *Fix:* speculate on generation, never on playback.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Curves of the share of 12-turn calls with at least one interruption for per-turn rates from 0 to 10 percent, marking 21.5% at 2%, 46.0% at 5% and 71.8% at 10%." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">PER TURN vs PER CALL (12 TURNS)</text>
<path d="M70 36 V176 H500" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="64" y="40" text-anchor="end">100%</text><text class="l" x="64" y="180" text-anchor="end">0%</text>
<path d="M70.0 176.0 L91.5 167.8 L113.0 160.1 L134.5 152.8 L156.0 145.9 L177.5 139.3 L199.0 133.1 L220.5 127.3 L242.0 121.8 L263.5 116.6 L285.0 111.7 L306.5 107.0 L328.0 102.6 L349.5 98.5 L371.0 94.6 L392.5 90.9 L414.0 87.5 L435.5 84.2 L457.0 81.1 L478.5 78.3 L500.0 75.5" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<g fill="var(--primary)"><circle cx="156.0" cy="145.9" r="3.5"/><circle cx="285.0" cy="111.7" r="3.5"/><circle cx="500.0" cy="75.5" r="3.5"/></g>
<text class="b" x="160" y="140">2% → 21.5%</text><text class="b" x="290" y="104">5% → 46.0%</text><text class="b" x="494" y="68" text-anchor="end">10% → 71.8%</text>
<text class="l" x="70" y="192">0%</text><text class="l" x="500" y="192" text-anchor="end">10% of turns interrupted</text>
<path d="M20 208 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="230">a dashboard-friendly 5% per turn interrupts nearly half of all callers</text>
</svg>
<figcaption>Users experience calls, not turns. Compounding makes small rates matter.</figcaption>
</figure>

## How to find which cause it is

**Label real interruptions.** Pull recordings where the agent began speaking while the caller was still talking — detectable by overlapping speech on both channels — and listen to a sample.

**Classify each one** by the list above. The pattern usually jumps out: interruptions clustered on number collection point at cause 2; on speakerphone calls at cause 3; right after the agent asks a question at cause 1.

**Look at the timeline per turn.** VAD segments, recogniser partial and final events, the endpoint decision, the moment the first audio was sent. The order of these events tells you which component fired first.

**Track the per-call rate**, not just the per-turn rate. It is the number that matches what users say about the product.

## Recovering when it still happens

No system gets to zero. What matters next is recovery:

- **Stop immediately** when the caller keeps talking — within a couple of hundred milliseconds.
- **Discard the interrupted reply** from the conversation history, keeping only what was actually spoken.
- **Merge the caller's speech** before and after the interruption into one turn, so the model sees the full sentence.
- **Do not apologise every time.** A brief yield — or just silence and listening — is more natural than "Sorry, go ahead" after every overlap.
- **Adapt.** After interrupting a caller once, lengthen the wait for the rest of that call.

## What to take away

Voice agents cut people off for at least six distinct reasons: mid-turn pauses, chunked structured input, hearing their own echo, misreading backchannels, transcription finalising early, and speculative replies leaking out. Each has a different fix.

Measure it per call, not just per turn: 5% of turns is 46.0% of 12-turn calls. Diagnose by labelling real overlaps and reading the per-turn timeline, and when an interruption does happen, yield quickly, discard the unsaid reply and merge the caller's words back together.
