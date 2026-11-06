---
title: "Silence-based vs model-based turn detection"
date: "2026-09-30T19:25"
category: "AI"
tags: ["voice-agents", "turn-detection", "endpointing", "vad", "latency"]
summary: "A fixed 500 ms silence rule answers every turn after 500 ms and cuts off 21.7% of turns. A model that reads the words can answer clear endings after 150 ms and wait a full second on doubtful ones — 405 ms on average, with turns cut off 12.9% of the time. Faster and politer at once."
draft: false
cover: "/blog/silence-vs-model-based-turn-detection.svg"
---

Every voice agent has to decide when the user has finished speaking. There are two broad ways to do it.

**Silence-based** detection waits for a fixed stretch of silence — say 500 ms — and declares the turn over. It looks only at the absence of sound.

**Model-based** detection uses a model that looks at *what* has been said, and often *how*, to estimate the probability that the turn is complete. The silence threshold then depends on that estimate: short when the model is confident the user is done, long when it thinks they are mid-thought.

## Why silence is a blunt instrument

Silence-based detection has one dial, and it is a bad trade at every setting. A short threshold interrupts people who pause to think; a long one makes every reply slow — including the replies to turns that were obviously over.

The waste is in that last part. "Yes, that's right." does not need 500 ms of silence to be recognised as finished. Neither does "Thanks, that's everything." A silence rule treats them exactly like "My account number is four, seven, two…", which plainly needs more time.

## What a turn-detection model sees

**The words.** A sentence ending in "and", "the", "my", "because", or in the middle of a number is unfinished. A complete answer to the agent's question — a date after "which day?", a yes after a yes/no question — is probably finished.

**The context.** What the agent just asked shapes what a complete answer looks like.

**The prosody.** Falling pitch and lengthened final syllables mark endings; level pitch and a cut-off mid-word mark a pause. Models that take audio as well as text can use these cues.

The model outputs a probability that the turn is over. The system maps that to a wait: for example, **150 ms** if the probability is above 0.8, **1,000 ms** otherwise.

## Comparing the two

Using the same model of pauses as before — mid-turn pauses 85% short (averaging 120 ms) and 15% longer hesitations (averaging 600 ms), three per turn — and assuming the turn-detection model:

- is confident (above 0.8) on 70% of genuine endings, and
- is wrongly confident on 5% of mid-turn pauses,

the two policies compare like this:

| | average wait after a real ending | mid-turn pauses cut off | turns cut off |
| --- | --- | --- | --- |
| silence, 500 ms | 500 ms | 7.8% | **21.7%** |
| model-based, 150 / 1,000 ms | **405 ms** | 4.5% | **12.9%** |

The model-based policy is faster *and* interrupts less. It responds sooner on the 70% of endings that are clear, and waits longer on the uncertain pauses where a silence rule would have jumped in. Silence-only detection cannot do both, because it cannot tell those cases apart.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Scatter of two policies on axes of average wait and turns cut off: silence at 500 ms and 21.7%, model-based at 405 ms and 12.9%, the model point lower-left of the silence point." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">BETTER ON BOTH AXES</text>
<path d="M80 36 V176 H500" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<text class="l" x="76" y="40" text-anchor="end">25%</text><text class="l" x="76" y="180" text-anchor="end">0%</text>
<text class="l" x="80" y="194">300 ms</text><text class="l" x="500" y="194" text-anchor="end">600 ms average wait</text>
<text class="l" x="20" y="110" transform="rotate(-90 20 110)">turns cut off</text>
<circle cx="360" cy="54" r="7" fill="var(--muted-foreground)"/>
<text class="l" x="372" y="50">silence 500 ms</text><text class="l" x="372" y="64">500 ms · 21.7%</text>
<circle cx="227" cy="104" r="7" fill="var(--primary)"/>
<text class="b" x="239" y="100">model-based</text><text class="b" x="239" y="114">405 ms · 12.9%</text>
<path d="M352 58 L236 100" stroke="var(--primary)" stroke-dasharray="3 3"/>
<path d="M20 212 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="234">down and left: faster replies and fewer interruptions, from the same pauses</text>
</svg>
<figcaption>A silence threshold can only slide along one curve. Knowing which pauses are which moves you off it.</figcaption>
</figure>

## What model-based detection costs

**Latency of its own.** The model must run on every pause, quickly — tens of milliseconds. That rules out large models; turn detectors are small classifiers, often running on partial transcripts as they stream in.

**Dependence on the transcript.** A text-based detector is only as good as the live transcription. If the recogniser has not yet emitted the last word, the detector judges an incomplete sentence. Audio-based detectors avoid this but are harder to build.

**Its own mistakes.** In the example, 5% of mid-turn pauses fool the model into confidence, and those are cut off quickly. A confidently wrong detector can be worse than a cautious silence rule on specific patterns — so evaluate it on your own call types.

**Language and domain.** What sounds finished differs across languages and tasks. A detector trained on English chat may misjudge Hindi, or a dictated address.

## Using both together

In practice the approaches are layered:

1. **VAD** still detects speech and silence frame by frame.
2. **The turn-detection model** sets how long the silence must be, per pause.
3. **Hard bounds** remain: never respond before a minimum (to avoid answering a breath), and always respond after a maximum (so a user who has walked away does not leave the agent waiting forever).
4. **Context overrides** — extended waits after the agent asks for a number or an address — catch what the model misses.

## What to take away

Silence-based detection waits a fixed time after every pause, so it is equally slow on obvious endings and equally hasty on obvious mid-sentence pauses. Model-based detection reads the words, context and intonation, waits briefly when the turn is clearly over and longer when it is not.

In a simple model of real pauses, that moves a 500 ms silence rule's 500 ms wait and 21.7% interrupted turns to 405 ms and 12.9% — better on both counts, at the cost of running a small classifier on every pause.
