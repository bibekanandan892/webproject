---
title: "Telling an interruption from a cough"
date: "2026-10-28T11:55"
category: "AI"
tags: ["voice-agents", "barge-in", "vad", "backchannels", "classification"]
summary: "While a voice agent speaks, the user's microphone picks up interruptions, coughs, \"mm-hmm\"s and the TV. Stop after 150 ms of sound and the agent halts for 98.3% of backchannels and 84.7% of coughs; wait 700 ms and those fall to 4.2% and 2.0% — but every real interruption takes 700 ms to obey."
draft: false
cover: "/blog/interruption-vs-background-noise.svg"
---

Barge-in lets a user interrupt a voice agent mid-sentence. Implemented naively — stop speaking whenever the microphone picks up sound — it makes the agent unusable anywhere but a silent room. It stops when the user coughs, when a car passes, when someone in the background talks, when the user says "mm-hmm" to show they are following.

The task is a classification problem with a deadline: while the agent is speaking, decide whether each sound from the user's side is a genuine attempt to take the turn.

## What the microphone hears

During the agent's speech, the incoming audio contains:

| sound | should the agent stop? |
| --- | --- |
| "Wait — no, the Tuesday one" | **yes** — a real interruption |
| "Mm-hmm", "yeah", "right" | no — a backchannel; keep going |
| cough, sneeze, laugh, sigh | no |
| TV, traffic, other people talking | no |
| the agent's own voice echoing back | no — and the most dangerous |

Only the first should stop the agent. It is also the only one that typically keeps going.

## Duration: the first, crude signal

Most non-interruptions are short. A backchannel is a word or two; a cough is a burst. A real interruption is a phrase or a sentence. So the simplest discriminator is to wait: require a certain amount of continuous speech before stopping.

Model backchannel durations as log-normal around a median of 350 ms, and coughs around 250 ms. The share of each that would still trigger a stop after waiting *t* ms:

| wait before stopping | backchannels that trigger | coughs that trigger | delay on real interruptions |
| --- | --- | --- | --- |
| 150 ms | **98.3%** | 84.7% | 150 ms |
| 300 ms | 65.0% | 35.8% | 300 ms |
| 500 ms | 18.6% | 8.3% | 500 ms |
| 700 ms | **4.2%** | 2.0% | **700 ms** |

The trade is plain. Responding quickly to real interruptions means stopping for nearly every "mm-hmm". Ignoring backchannels reliably means making the user talk over the agent for most of a second before it yields — which feels like not being listened to.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Two falling curves of the share of backchannels and coughs that outlast a waiting threshold, from 150 to 700 ms, against a rising line of delay for real interruptions." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WAITING FILTERS NOISE AND DELAYS YIELDING</text>
<path d="M70 36 V186 H500" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="64" y="40" text-anchor="end">100%</text><text class="l" x="64" y="190" text-anchor="end">0%</text>
<path d="M70 38.6 L187 88.5 L343 158.1 L500 179.7" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<text class="b" x="192" y="84">backchannels</text>
<path d="M70 59 L187 132.3 L343 173.6 L500 183" stroke="var(--muted-foreground)" stroke-width="2.2" fill="none"/>
<text class="l" x="120" y="112">coughs</text>
<g fill="var(--primary)"><circle cx="70" cy="38.6" r="3.5"/><circle cx="500" cy="179.7" r="3.5"/></g>
<text class="b" x="78" y="36">150 ms · 98.3%</text><text class="b" x="494" y="170" text-anchor="end">700 ms · 4.2%</text>
<text class="l" x="70" y="202">150 ms</text><text class="l" x="500" y="202" text-anchor="end">700 ms wait</text>
<path d="M20 218 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="240">the wait is paid by every genuine interruption — duration alone is not enough</text>
</svg>
<figcaption>Durations modelled log-normal: backchannels median 350 ms, coughs median 250 ms.</figcaption>
</figure>

## Better signals than duration

Duration is a starting point. Systems that get this right combine several signals:

**Is it speech at all?** A voice activity detector trained to separate speech from non-speech rejects most coughs, laughter, music and traffic regardless of duration. Model-based VADs do this far better than energy thresholds.

**Is it the user's voice?** Background conversations and TVs are speech but not the user's. Near-field versus far-field cues — loudness, reverberation — help, and some systems use the caller's voice characteristics from earlier in the call.

**Is it the agent's own voice?** Acoustic echo cancellation removes the agent's playback from the microphone signal. Residual echo is a major source of false barge-ins on speakerphones; raising detection thresholds while the agent speaks is a common backstop.

**What are the words?** A streaming transcript of the first few hundred milliseconds is often decisive. "Mm-hmm", "yeah", "okay", "right" are backchannels. "Wait", "stop", "no", "hang on", or a question word are interruptions. A small classifier on the partial transcript separates them far faster than waiting for duration to settle it.

**Where is the agent?** Users interrupt more at natural points — the end of a list item, after a question. Context changes how likely each interpretation is.

## A practical policy

1. **Duck, don't stop, at first.** When possible user speech begins, lower the agent's volume immediately. It signals attention without committing.
2. **Classify quickly** on the first 200–300 ms: is it speech, the user's voice, a backchannel phrase or an interrupting phrase?
3. **Stop** on a confident interruption — or on any continued speech past a longer limit.
4. **Resume** at full volume if it was a backchannel or noise, without repeating anything.
5. **Log every decision** with audio, so false stops and missed interruptions can be reviewed and the thresholds tuned.

## What to take away

While a voice agent speaks, most sounds from the user's side are not interruptions: backchannels, coughs, background speech and echo. Waiting for sustained sound filters them but delays real interruptions — at 150 ms the agent stops for 98.3% of backchannels, at 700 ms only 4.2%, but every genuine interruption then waits 700 ms.

Combine duration with speech detection, echo cancellation, speaker cues and a quick look at the first words; duck the volume while deciding, stop on confident interruptions and carry on through everything else.
