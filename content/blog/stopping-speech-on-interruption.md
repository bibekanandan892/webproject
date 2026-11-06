---
title: "Stopping speech the instant the user interrupts"
date: "2026-11-06T20:00"
category: "AI"
tags: ["voice-agents", "barge-in", "streaming", "audio", "latency"]
summary: "Deciding to stop is only half of barge-in; the audio already on its way keeps playing. A server that pushed 3 s of speech ahead talks over the user for 3.2 s after it decides to stop. Pace the stream and flush the client and it is 280 ms; mute on the device itself and it is about 210."
draft: false
cover: "/blog/stopping-speech-on-interruption.svg"
---

When a user interrupts a voice agent, two things must happen. The system must **decide** that it was a real interruption — not a cough, not "mm-hmm", not its own echo. And then the speech must **actually stop**, at the user's ear, quickly.

The second part is often treated as trivial: stop the TTS, done. In practice the audio the user hears was generated well before they hear it, and it sits in a chain of buffers between the speech engine and the loudspeaker. Stopping the source does nothing about what is already in the pipe.

## Where the audio is when you decide to stop

Follow the audio from synthesis to sound:

1. **TTS engine** — generating audio, often faster than real time.
2. **Server send queue** — audio waiting to be written to the network.
3. **Network in flight** — packets travelling to the client.
4. **Client jitter buffer** — a small buffer that smooths out network variation, typically 40–200 ms.
5. **Client playback buffer** — audio handed to the operating system's audio output.
6. **Loudspeaker.**

Every buffer between the decision and the speaker keeps playing unless it is explicitly cleared. The worst offender is usually the server sending audio far ahead of real time. A fast TTS engine can produce a whole sentence in a fraction of a second, and a naive server forwards it immediately, so the client ends up holding several seconds of speech.

## Three designs, three stop times

Assume detecting a real interruption takes about 200 ms, and the network is 40 ms each way.

| design | how the stop happens | user hears the agent for |
| --- | --- | --- |
| server stops generating; audio pushed ahead as fast as produced (3 s queued at the client) | only new audio stops | 200 + 3,000 = **~3.2 s** |
| server paces audio near real time and sends a "clear" message; client flushes its buffers | detection → server → client | 200 + 40 + 40 = **~280 ms** |
| client detects speech locally and mutes immediately; server notified in parallel | on the device | 200 + ~10 = **~210 ms** |

Three seconds of the agent talking over someone who has said "stop" feels like being ignored. A quarter of a second feels like being heard.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="The chain from TTS to speaker with buffers along it, and three bars for how long the agent keeps talking after the decision to stop: 3.2 seconds, 280 ms and 210 ms." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE AUDIO IS ALREADY ON ITS WAY</text>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6">
<rect x="20" y="34" width="70" height="26" rx="4"/><rect x="110" y="34" width="80" height="26" rx="4"/><rect x="210" y="34" width="70" height="26" rx="4"/><rect x="300" y="34" width="90" height="26" rx="4"/><rect x="410" y="34" width="70" height="26" rx="4"/>
</g>
<text class="l" x="55" y="51" text-anchor="middle">TTS</text><text class="l" x="150" y="51" text-anchor="middle">send queue</text><text class="l" x="245" y="51" text-anchor="middle">network</text><text class="l" x="345" y="51" text-anchor="middle">jitter buffer</text><text class="l" x="445" y="51" text-anchor="middle">playback</text>
<path d="M90 47 H110 M190 47 H210 M280 47 H300 M390 47 H410 M480 47 H500" stroke="var(--muted-foreground)"/>
<path d="M500 38 L512 32 V62 L500 56 Z" fill="var(--muted-foreground)"/>
<text class="l" x="20" y="96">push ahead</text><rect x="120" y="86" width="400" height="14" rx="3" fill="var(--muted-foreground)" fill-opacity="0.5"/><text class="l" x="514" y="97" text-anchor="end" fill="var(--background)">~3.2 s</text>
<text class="b" x="20" y="122">pace + flush</text><rect x="120" y="112" width="35" height="14" rx="3" fill="var(--primary)" fill-opacity="0.7"/><text class="b" x="162" y="123">~280 ms</text>
<text class="b" x="20" y="148">mute on device</text><rect x="120" y="138" width="26" height="14" rx="3" fill="var(--primary)" fill-opacity="0.9"/><text class="b" x="153" y="149">~210 ms</text>
<path d="M20 172 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="196">stopping the generator does not stop the speaker</text>
<text class="l" x="20" y="216">keep little audio in flight, and make "clear" reach every buffer down to the device</text>
<text class="l" x="20" y="236">bars: time the user hears the agent after starting to interrupt (detection ~200 ms)</text>
</svg>
<figcaption>Whatever has left the server keeps playing unless something on the client throws it away.</figcaption>
</figure>

## How to make it fast

**Pace the stream.** Send audio to the client at roughly real-time speed, keeping only a small lead — a few hundred milliseconds — over what is playing. That bounds how much can ever be in flight. The TTS can still run ahead on the server, where its output can be discarded instantly.

**Make "clear" a first-class message.** The protocol between server and client needs an explicit instruction to drop all queued audio *now*, separate from simply sending no more. WebRTC-based and telephony stacks each need their own way of doing this; on a phone line, it may mean the media server cutting the outgoing stream.

**Detect on the device where possible.** A lightweight voice activity detector running on the client can duck or mute playback the moment the user starts talking, without waiting for a round trip. The server still makes the final decision — resume if it was only a backchannel, stop for good if it was a real interruption — but the user hears the response to their voice immediately.

**Duck before you stop.** Lowering the volume instantly on possible speech, then stopping or resuming once the classification is confident, gives the responsiveness of immediate action without the cost of stopping for every cough.

**Cancel everything upstream.** Stop the TTS, cancel the language model's generation, and abort any in-progress tool call that only existed to finish that reply. Leftover work wastes compute and, if not cancelled, can produce audio that leaks out later.

## Remember exactly what was said

Once stopped, the agent's record of its own turn must match what the user actually heard. If it generated 120 words and was cut off after 35, the conversation history should contain those 35 — otherwise the model will later refer to things the user never heard.

To do that precisely, the system needs to know which audio reached the speaker. **Word-level timestamps** from the TTS, combined with the playback position reported by the client at the moment of the stop, let the agent truncate its turn to the last word played. Marking the turn as interrupted helps the model respond naturally to whatever the user said.

## Test it end to end

Measure stop latency the way the user experiences it: record both the user's audio and what comes out of the client's speaker, interrupt at random moments, and measure from the start of the user's speech to the agent's silence. Do it on real networks and real devices — speakerphones, Bluetooth headsets and phone lines all add buffering that never shows up on a developer's laptop.

## What to take away

Deciding to stop is only half of handling an interruption; the other half is that audio is already in buffers between the TTS and the user's ear. A server that pushes speech ahead as fast as it is produced can keep talking for about 3.2 s after deciding to stop.

Pace audio near real time, send an explicit clear that reaches every buffer, mute or duck on the device itself — bringing the stop to about 280 ms, or about 210 with local detection — cancel all upstream work, and truncate the agent's turn to the words that were actually played.
