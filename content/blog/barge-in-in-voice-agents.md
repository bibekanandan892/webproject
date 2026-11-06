---
title: "Barge-in in voice agents"
date: "2026-11-06T12:50"
category: "AI"
tags: ["voice-agents", "barge-in", "interruptions", "tts", "echo-cancellation"]
summary: "Barge-in is the user talking over the agent and the agent yielding. Detection takes ~200 ms; whatever audio is already buffered keeps playing — 500 ms of buffer means 700 ms of both talking at once. And the agent must forget the 85 words it planned but never said."
draft: false
cover: "/blog/barge-in-in-voice-agents.svg"
---

The agent is halfway through reading out three appointment slots when the user says *"the second one"*. A person would stop at once. An agent without barge-in carries on reading the third slot, then answers a question nobody is asking any more.

Barge-in is the ability to be interrupted: detect that the user has started speaking while the agent is talking, stop the agent's speech, and hand the turn back. It sounds like a single feature. In practice it is four separate problems, each of which can fail on its own.

## 1. Hearing the user over yourself

While the agent talks, its own voice comes out of the user's speaker — and, on a phone or a laptop, goes straight back into the user's microphone. To a voice activity detector, that echo looks exactly like the user speaking. Without handling it, the agent interrupts itself.

**Acoustic echo cancellation** subtracts the known outgoing audio from the incoming audio, leaving only what the user said. Browsers and phones provide it, with varying quality; speakerphones and cheap headsets are the hard cases. Some systems also raise the detection threshold while the agent is speaking, accepting slower barge-in for fewer false ones.

## 2. Deciding it is a real interruption

Not every sound from the user is a request to take the turn:

- **Backchannels** — "mm-hmm", "yeah", "okay" — mean *keep going*.
- **Noise** — a cough, a laugh, someone else in the room, traffic.
- **Real interruptions** — "wait", "no, the other one", "stop", or simply a new question.

Stopping on everything makes the agent fragile: it halts every time the user agrees with it. Stopping on nothing makes it rude. The usual approach waits for a short stretch of confirmed speech — a few hundred milliseconds, or the first recognised words — and classifies it before yielding. That classification is where most of the detection delay comes from.

## 3. Actually stopping

Once the decision is made, the audio has to stop. That is harder than it sounds, because audio is buffered at several points: the TTS engine has generated ahead, the server has queued frames, the network is carrying them, and the client keeps a jitter buffer to play smoothly.

Everything already in those buffers keeps playing unless it is explicitly flushed. With detection taking about 200 ms, the user hears the agent talking over them for:

| audio already buffered | overlap the user hears |
| --- | --- |
| 100 ms | 300 ms |
| 250 ms | 450 ms |
| 500 ms | **700 ms** |

700 milliseconds of both talking at once feels like the agent did not hear. Good barge-in sends a "clear" signal all the way to the client so it discards what it has queued, and keeps server-side buffers short while the agent is speaking.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Timeline: the agent speaking, the user starting to talk, a 200 ms detection window, then buffered audio continuing to play before silence; total overlap 700 ms with a 500 ms buffer." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHY THE AGENT KEEPS TALKING</text>
<text class="l" x="20" y="54">agent</text>
<rect x="80" y="40" width="200" height="22" rx="4" fill="var(--muted-foreground)" fill-opacity="0.5"/>
<rect x="280" y="40" width="60" height="22" fill="var(--primary)" fill-opacity="0.35"/>
<rect x="340" y="40" width="150" height="22" fill="var(--primary)" fill-opacity="0.75"/>
<text class="l" x="20" y="98">user</text>
<rect x="280" y="84" width="260" height="22" rx="4" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text class="b" x="290" y="99">"the second one"</text>
<path d="M280 32 V116" stroke="var(--primary)" stroke-dasharray="3 3"/>
<path d="M490 32 V116" stroke="var(--primary)" stroke-dasharray="3 3"/>
<text class="l" x="282" y="132">detect 200 ms</text>
<text class="l" x="350" y="132">buffered audio 500 ms</text>
<text class="b" x="385" y="150" text-anchor="middle">700 ms talking over the user</text>
<path d="M20 172 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="196">flush every buffer down to the client, not only the generator</text>
<text class="l" x="20" y="216">then record only the words that were actually played</text>
</svg>
<figcaption>Detection is only the first part of the delay. Buffers decide the rest.</figcaption>
</figure>

## 4. Remembering what was really said

This is the part most often missed. The language model generated a complete reply — say 120 words — and the conversation history records it. But the user interrupted 14 seconds in. At a speaking rate of 150 words per minute, they heard **35 words**. The other 85 were never spoken.

If the history keeps all 120, the model believes the user heard the third appointment slot, the cancellation policy and the closing question. Its next reply will refer to things the user never heard: *"As I mentioned, there's a £10 fee…"*

The fix is to truncate the agent's turn in the history to what was actually played, using timestamps from the audio output, and often to mark it as interrupted. The model then knows it was cut off and can respond to the interruption naturally: *"The second one — Tuesday at 3pm. Shall I book it?"*

## Tuning the trade-off

Barge-in has the same two-sided error as every turn-taking decision:

- **Too sensitive:** stops on coughs, echoes and "mm-hmm". The agent never finishes a sentence in a noisy room.
- **Too sluggish:** the user has to shout "STOP" twice. People hang up.

The right setting depends on context. When the agent reads a long list or legal text, users should be able to cut in easily. When it is collecting a card number, a cough should not abandon the flow. Some agents also allow certain utterances — confirmations, required disclosures — to be marked as non-interruptible.

## What to take away

Barge-in is four problems: cancelling the agent's own echo, classifying whether the user's sound is a real interruption, stopping every buffered byte of audio, and rewriting the history to contain only what was heard.

Detection takes around 200 ms; buffered audio adds the rest — with 500 ms buffered, 700 ms of talking over the user. And if the history is not truncated, the agent will refer to the 85 words it planned and never said.
