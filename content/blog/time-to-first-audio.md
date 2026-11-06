---
title: "Time to first audio"
date: "2026-09-15T19:50"
category: "AI"
tags: ["voice-agents", "latency", "streaming", "tts", "ttfa"]
summary: "A 60-word spoken reply lasts 24 seconds. Generating it takes 1.56 s and synthesising it 2.4 s — so a non-streaming agent stays silent for 4.21 s, while a streaming one can start talking in under one. Users judge the silence, not the total."
draft: false
cover: "/blog/time-to-first-audio.svg"
---

For a chat interface, the usual latency number is how long the whole answer takes. For a voice agent, that number barely matters. What the user experiences is the silence between finishing their sentence and hearing the agent start — **time to first audio**, or TTFA.

Once the agent is speaking, the user is listening, and listening takes far longer than any of the computation behind it.

## Speech is slow; computers are fast

A 60-word reply is a normal conversational answer — three or four sentences. Spoken at a natural 150 words per minute, it lasts:

`60 ÷ 150 × 60 =` **24 seconds** of audio.

Now the work to produce it:

| step | time |
| --- | --- |
| LLM time to first token | 0.25 s |
| LLM generating ~78 tokens at 50 tokens/s | 1.56 s |
| TTS synthesising 24 s of audio at 10× real time | 2.40 s |
| **everything, done one after another** | **4.21 s** |

If the agent waits for all of that before playing anything, the user sits in 4.21 seconds of silence — long enough to say "hello?" — and then listens for 24 seconds. If the agent streams, it can start speaking once the *first sentence* is generated and synthesised, typically well under a second, and produce the rest while the first sentence plays.

The total work is identical. The experience is completely different. Time-to-first-audio is the number that decides it.

## Why streaming is safe: the generator is far ahead

Streaming only works if the pipeline produces audio faster than it is played; otherwise playback would catch up and stutter.

Speech at 150 words a minute, at about 1.3 tokens per word, consumes **3.25 tokens per second**. An LLM generating 50 tokens a second is more than **15×** faster than the listener needs. TTS at 10× real time is likewise far ahead of playback.

So once the first chunk is playing, the rest of the reply arrives with plenty of margin. Every millisecond of the user's waiting is in getting that first chunk out.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Two timelines of the same reply: non-streaming, with 4.21 seconds of silence before 24 seconds of speech; streaming, with under a second of silence before speech while generation continues underneath." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME WORK, DIFFERENT SILENCE</text>
<text class="l" x="20" y="54">wait for all</text>
<rect x="110" y="42" width="76" height="18" rx="3" fill="none" stroke="var(--muted-foreground)" stroke-dasharray="3 3"/>
<text class="l" x="114" y="55">4.21 s silent</text>
<rect x="186" y="42" width="350" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.45"/>
<text class="l" x="196" y="55">speaking 24 s</text>
<text class="b" x="20" y="98">stream</text>
<rect x="110" y="86" width="16" height="18" rx="3" fill="none" stroke="var(--primary)" stroke-dasharray="3 3"/>
<rect x="126" y="86" width="350" height="18" rx="3" fill="var(--primary)" fill-opacity="0.75"/>
<text class="b" x="136" y="99" fill="var(--background)">speaking 24 s</text>
<rect x="126" y="110" width="58" height="6" rx="2" fill="var(--primary)" fill-opacity="0.35"/>
<text class="l" x="190" y="117">generation + synthesis, running ahead underneath</text>
<path d="M110 132 V36" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<text class="l" x="112" y="146">user stops</text>
<path d="M20 166 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="190">the listener needs 3.25 tokens/s; the model makes 50 — 15× headroom</text>
<text class="l" x="20" y="210">all of the user's waiting is getting the first sentence out</text>
<text class="l" x="20" y="228">timeline scale: 1 px ≈ 70 ms</text>
</svg>
<figcaption>Total time is the same. Only the gap before the first sound changes.</figcaption>
</figure>

## What TTFA is made of

With full streaming, time to first audio is:

`endpointing + speech-to-text finalisation + LLM first token + tokens to the first speakable chunk + TTS first audio + network`

Each piece can be pushed down:

- **Endpointing:** decide sooner that the user has finished, using a turn-detection model rather than a long silence timer.
- **First token:** short, cache-friendly prompts; a model sized to the task.
- **First chunk:** do not wait for a full sentence if a clause will do. "Sure, " or "Okay — so " is speakable after two tokens.
- **TTS first audio:** a streaming TTS that emits audio for the first words before it has the rest of the sentence.
- **Network:** keep the TTS and LLM close to each other and to the telephony or WebRTC edge.

## Shaping the first words

Because the first chunk is what the user waits for, the content of the reply's opening matters for latency, not just style.

An answer that begins *"Your appointment on Tuesday the 14th at 3pm has been confirmed"* cannot start until the model has decided all of that. An answer that begins *"Done — "* or *"Let me check. "* can start almost immediately while the substance is still being generated. Many voice agents are prompted to open with a short acknowledgement for exactly this reason.

The same idea extends to slow tools: say *"One moment while I look that up"* the instant a tool call starts, so the silence the user hears is short even when the work is not.

## Measuring it properly

TTFA should be measured from the end of the user's speech to the first audio sample *the user hears* — after network transit and client buffering — not from when the server sent the first audio packet. Server-side timestamps routinely under-report the real gap by a hundred milliseconds or more. And it should be tracked at a high percentile: a handful of four-second silences shapes a user's opinion far more than a good median.

## What to take away

A voice reply takes much longer to listen to than to produce: 24 seconds of speech from about 4 seconds of computation. If the agent waits for all of it, the user waits 4.21 seconds in silence; if it streams, the wait is just the time to the first speakable chunk.

Since generation runs 15× faster than speech is consumed, everything after the first chunk is easy. Time to first audio is the latency that users experience — optimise it, design the reply's first words around it, and measure it where the user hears it.
