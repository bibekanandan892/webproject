---
title: "Designing a real-time voice agent"
date: "2026-08-14T20:20"
category: "AI"
tags: ["voice-agents", "system-design", "latency", "stt", "tts"]
summary: "A voice agent is five components in a pipeline with a deadline. Assembled naively, the gap after the user stops speaking is 1,100 ms; people expect about 200. The design is mostly the work of taking those 900 milliseconds back."
draft: false
cover: "/blog/real-time-voice-agent-design.svg"
---

A voice agent is a program you talk to on a phone or in an app, which answers out loud and can take actions — book the appointment, check the order, transfer the call. Building one that works is not hard. Building one that feels like a conversation is, and the reason is time.

In conversation between people, the gap between one person finishing and the other starting is around 200 milliseconds. Gaps over about a second register as awkward; over two, as a failure. Every design choice in a voice agent is judged against that clock.

## The five components

**1. Audio transport.** Audio comes in from a phone line or a browser, usually over WebRTC or a telephony bridge. It must be streamed in small frames — 20 ms at a time — not uploaded as files. Compressed with Opus at about 24 kbps per direction, 10,000 concurrent calls are about 480 Mbps of traffic; uncompressed 16 kHz audio would be over 5 Gbps.

**2. Voice activity and turn detection.** Something has to decide that the user is speaking, and — much harder — that they have *finished*. This is endpointing, and it is the single largest delay in most agents.

**3. Speech-to-text (STT).** Streaming recognition turns the audio into text while the user is still talking, so that when they stop, only the last fraction of a second remains to be transcribed.

**4. The language model, with tools.** Reads the transcript and the conversation so far, decides what to say, and calls tools when it needs data or to take an action.

**5. Text-to-speech (TTS).** Turns the reply into audio — streaming, so that speech starts before the whole reply exists.

This arrangement, STT → LLM → TTS, is the **cascaded** design. The alternative is a single **speech-to-speech** model that takes audio in and produces audio out. Cascaded systems are easier to debug, can use any LLM and give a transcript for free; speech-to-speech models are faster and keep tone of voice, but are harder to control and to attach tools to. Most production systems today are cascaded, sometimes with speech-to-speech pieces.

## Where the time goes

Assemble the cascade straightforwardly and measure from the moment the user stops talking to the moment they hear audio:

| stage | naive | tuned |
| --- | --- | --- |
| network in | 40 ms | 40 ms |
| endpointing — waiting for silence | **300** | 150 |
| STT finalisation | 100 | 50 |
| LLM time to first token | 300 | 250 |
| LLM to the end of the first sentence | 160 | 160 |
| TTS time to first audio | 120 | 90 |
| network out and jitter buffer | 80 | 80 |
| **total** | **1,100 ms** | **820 ms** |

1.1 seconds is noticeably slow. Every row in the tuned column is a separate piece of engineering, and even after all of them the total is four times the human gap. That is why the remaining tricks exist.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Two stacked horizontal bars of latency by stage, naive totalling 1,100 ms and tuned 820 ms, with a marker at the 200 ms human gap." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">FROM "USER STOPS" TO "AGENT SPEAKS"</text>
<text class="l" x="20" y="54">naive</text>
<g stroke="var(--background)" stroke-width="1">
<rect x="80" y="40" width="17" height="22" fill="var(--muted-foreground)" fill-opacity="0.4"/>
<rect x="97" y="40" width="129" height="22" fill="var(--primary)" fill-opacity="0.8"/>
<rect x="226" y="40" width="43" height="22" fill="var(--muted-foreground)" fill-opacity="0.55"/>
<rect x="269" y="40" width="129" height="22" fill="var(--muted-foreground)" fill-opacity="0.7"/>
<rect x="398" y="40" width="69" height="22" fill="var(--muted-foreground)" fill-opacity="0.55"/>
<rect x="467" y="40" width="51" height="22" fill="var(--muted-foreground)" fill-opacity="0.4"/>
<rect x="518" y="40" width="34" height="22" fill="var(--muted-foreground)" fill-opacity="0.3"/>
</g>
<text class="l" x="20" y="98">tuned</text>
<g stroke="var(--background)" stroke-width="1">
<rect x="80" y="84" width="17" height="22" fill="var(--muted-foreground)" fill-opacity="0.4"/>
<rect x="97" y="84" width="64" height="22" fill="var(--primary)" fill-opacity="0.8"/>
<rect x="161" y="84" width="21" height="22" fill="var(--muted-foreground)" fill-opacity="0.55"/>
<rect x="182" y="84" width="107" height="22" fill="var(--muted-foreground)" fill-opacity="0.7"/>
<rect x="289" y="84" width="69" height="22" fill="var(--muted-foreground)" fill-opacity="0.55"/>
<rect x="358" y="84" width="39" height="22" fill="var(--muted-foreground)" fill-opacity="0.4"/>
<rect x="397" y="84" width="34" height="22" fill="var(--muted-foreground)" fill-opacity="0.3"/>
</g>
<path d="M166 30 V118" stroke="var(--primary)" stroke-dasharray="4 3"/>
<text class="b" x="170" y="130">200 ms — a human reply</text>
<text class="b" x="97" y="34">endpointing</text><text class="l" x="269" y="34">LLM first token</text>
<text class="l" x="520" y="78" text-anchor="end">1,100</text><text class="l" x="436" y="100">820</text>
<path d="M20 152 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="176">the biggest single block is waiting to be sure the user has finished</text>
<text class="l" x="20" y="196">the second biggest is the model starting to think</text>
<text class="l" x="20" y="216">neither can be removed — only overlapped with something else</text>
</svg>
<figcaption>Tuning every stage still leaves a gap four times longer than a person's. Overlap is the rest of the answer.</figcaption>
</figure>

## Closing the rest of the gap

The remaining tricks work by **overlapping** stages instead of shortening them.

- **Stream everything.** STT emits words as they are recognised; the LLM emits tokens as they are generated; TTS speaks sentence by sentence as soon as the first sentence is complete. No stage waits for the previous one to finish.
- **Start the LLM early.** Begin generating on the partial transcript when the user *seems* to be finishing, and discard the result if they keep talking. Wasted compute buys hundreds of milliseconds.
- **Fill when slow.** If a tool call will take a second, say "Let me check that for you" immediately. The user hears speech within the human gap while the slow work runs.
- **Smarter endpointing.** A model that listens to wording and intonation can tell "my number is four-one-five…" (not finished) from "that's all" (finished), and cut the silence wait on the clear cases.

## Interruptions

People interrupt. A voice agent must hear the user while it is speaking — *barge-in* — stop talking within a couple of hundred milliseconds, throw away the rest of its planned reply, and record in the conversation history only what was actually said aloud. Otherwise the model believes the user heard sentences they cut off.

The hard part is telling an interruption from a cough, a "mm-hmm", or the agent's own voice echoing back through the user's speaker. Echo cancellation and a classifier for backchannels sit in front of the barge-in logic.

## Everything else that makes it a system

**Tools.** Reading a balance, booking a slot, transferring to a human. Calls should be fast or masked with a filler phrase, and anything that changes state should be confirmed out loud first.

**Memory.** The conversation transcript, plus anything known about the caller. Long calls need summarisation like any other agent.

**Telephony.** Real phone lines bring 8 kHz audio, line noise, keypad tones and voicemail detection.

**Scaling.** Each call holds a stateful stream for minutes. Calls must be pinned to a worker, and the STT, LLM and TTS services scaled separately according to how much of each a minute of conversation consumes.

**Observability.** Record per-turn latency for every stage, interruptions, and transcripts. "It felt slow" is not debuggable; "endpointing p95 was 640 ms" is.

## What to take away

A voice agent is transport, turn detection, speech recognition, a language model with tools and speech synthesis — and a deadline. Built straightforwardly, it answers 1,100 ms after the user stops; careful tuning of each stage reaches about 820; people expect 200.

The design work is closing that gap by overlapping stages — streaming every component, starting generation early, filling silence while tools run — and by handling interruptions as a first-class event rather than an edge case.
