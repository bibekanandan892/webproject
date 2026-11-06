---
title: "Streaming TTS"
date: "2026-11-06T14:10"
category: "AI"
tags: ["voice-agents", "tts", "streaming", "latency", "speech-synthesis"]
summary: "A batch TTS engine synthesises a whole sentence before you hear any of it: 7.2 s of speech at 10× real time is a 0.72 s wait. A streaming engine starts speaking after a few words — but it has to commit to intonation before it knows how the sentence ends."
draft: false
cover: "/blog/streaming-tts.svg"
---

Text-to-speech used to work like printing a document: give it the whole text, wait, get the whole audio file back. That is fine for audiobooks. For a voice agent, every millisecond before the first sound is silence the user hears.

Streaming TTS starts producing audio before it has finished — and, in its fuller form, before it has even *received* all the text.

## Two kinds of streaming

**Streaming output.** The engine still receives a complete sentence, but returns audio in small pieces as it synthesises them, rather than one file at the end. The first piece can play while the rest is generated.

**Streaming input and output.** The engine accepts text incrementally — words or tokens as the language model produces them — and produces audio incrementally too. It can begin speaking the start of a sentence whose end has not been written yet.

The second is what voice agents need to get time-to-first-audio down, because it removes the wait for the language model to finish a sentence.

## What batch synthesis costs

An 18-word sentence spoken at 150 words a minute is **7.2 seconds** of audio. A fast TTS engine synthesising at 10× real time — a real-time factor of 0.1 — takes 0.72 seconds to produce it.

| | first audio after the text arrives |
| --- | --- |
| batch: synthesise all, then play | **0.72 s** |
| streaming output | the time to synthesise the first piece — tens to a couple of hundred ms |

And with streaming input, the engine does not wait for the 18-word sentence at all; it can start after the first few words, saving the 0.3–0.4 s the language model would have spent finishing it.

## The core difficulty: commitment

Speaking well needs to know what comes next. Intonation is shaped over a whole phrase: a question rises at the end, a list has a characteristic rhythm, emphasis depends on contrast with words that may not have arrived yet.

A streaming engine has to start speaking before it has that information. Whatever it has already played, it has committed to. If the sentence turns out to be a question, the opening words were already spoken with a statement's contour.

Engines handle this with a small **lookahead**: they wait for a few words beyond the current one before synthesising it, so they can see the immediate context. More lookahead gives better prosody and more delay; less gives faster first audio and flatter or occasionally wrong intonation. It is the same trade as sentence chunking, moved inside the model.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Three rows: text tokens arriving, a lookahead window of a few words ahead of the audio being synthesised, and audio playback trailing behind; a batch row waits for the whole sentence first." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SPEAK WITH A FEW WORDS OF LOOKAHEAD</text>
<text class="l" x="20" y="50">text in</text>
<g fill="var(--muted-foreground)" fill-opacity="0.4"><rect x="100" y="38" width="30" height="16" rx="2"/><rect x="134" y="38" width="30" height="16" rx="2"/><rect x="168" y="38" width="30" height="16" rx="2"/><rect x="202" y="38" width="30" height="16" rx="2"/><rect x="236" y="38" width="30" height="16" rx="2"/><rect x="270" y="38" width="30" height="16" rx="2"/></g>
<rect x="164" y="34" width="106" height="24" rx="4" fill="none" stroke="var(--primary)" stroke-dasharray="3 3"/>
<text class="b" x="276" y="50">lookahead</text>
<text class="l" x="20" y="88">audio out</text>
<path d="M100 82 l6 -10 l6 16 l6 -12 l6 8 l6 -12 l6 14 l6 -8 l6 6 l6 -10 l6 12 l6 -8" fill="none" stroke="var(--primary)" stroke-width="2"/>
<text class="l" x="20" y="132">batch</text>
<rect x="100" y="120" width="204" height="16" rx="3" fill="none" stroke="var(--muted-foreground)" stroke-dasharray="3 3"/>
<text class="l" x="110" y="132">wait for 18 words + 0.72 s</text>
<path d="M310 128 l6 -10 l6 16 l6 -12 l6 8 l6 -12 l6 14 l6 -8 l6 6" fill="none" stroke="var(--muted-foreground)" stroke-width="2"/>
<path d="M20 160 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="184">more lookahead: better intonation, later start</text>
<text class="l" x="20" y="204">audio must keep arriving faster than it plays — real-time factor below 1, with margin</text>
<text class="l" x="20" y="224">a stalled stream is a gap mid-sentence, which sounds worse than a slower start</text>
</svg>
<figcaption>Streaming moves the wait from "the whole sentence" to "a few words ahead".</figcaption>
</figure>

## Keeping the stream fed

Once playback starts, audio must keep arriving faster than it is played. That requires two things:

**A real-time factor comfortably below 1.** A model producing audio at 0.5× real time — two seconds of audio per second of compute — keeps up even with some variation. One at 0.95× will stall the moment the server is busy.

**Text arriving faster than it is spoken.** The language model must stay ahead of the voice. At 50 tokens a second against speech that consumes about 3 tokens a second, it normally does — unless the model pauses for a tool call mid-reply, which is a reason to finish a spoken sentence before calling tools.

A stall mid-sentence is worse than a slower start. Listeners tolerate a pause before an answer; a gap in the middle of a word sounds broken. Players usually keep a small buffer — a hundred milliseconds or so — to absorb jitter, which adds slightly to first-audio time in exchange for smooth playback.

## Interruption and alignment

Streaming TTS also has to support stopping. When the user barges in, the engine must abandon the rest of the utterance immediately, and the agent needs to know exactly how much was spoken. Engines that return **word-level timestamps** alongside the audio make this straightforward: the agent can cut its record of the reply to the last word actually played.

The same timestamps support lip-sync for avatars and highlighting of words on screen as they are spoken.

## Choosing an engine for a voice agent

The properties that matter, roughly in order:

1. **Time to first audio** for a short first chunk, measured at the client.
2. **Streaming text input** over a persistent connection, so per-request overhead is paid once.
3. **Real-time factor** with headroom at your expected concurrency.
4. **Prosody with little lookahead** — listen to questions and lists.
5. **Word timestamps** for interruption handling.
6. **Pronunciation control** for names, numbers and domain terms.

## What to take away

Batch TTS makes the user wait for an entire sentence to be synthesised — 0.72 s for 7.2 s of speech even at 10× real time. Streaming TTS starts playing after the first piece, and with streaming input it can begin before the language model has finished the sentence.

The cost is commitment: the engine speaks before it knows the end of the phrase, and uses a few words of lookahead to guess intonation. Keep the real-time factor well below 1, keep the text ahead of the voice, and use word timestamps so interruptions cut the record where the speech actually stopped.
