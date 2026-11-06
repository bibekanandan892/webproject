---
title: "Sentence chunking for TTS"
date: "2026-11-06T14:00"
category: "AI"
tags: ["voice-agents", "tts", "streaming", "chunking", "latency"]
summary: "Between the LLM's token stream and the voice sits a small piece of code deciding when there is enough text to speak. Waiting for a full 18-word sentence costs 0.47 s; speaking at the first comma costs 0.18 s; four words, 0.10 s — each cut trading a little naturalness for speed."
draft: false
cover: "/blog/sentence-chunking-for-tts.svg"
---

A language model produces text a token at a time. A text-to-speech engine wants text to speak. Between them, in every cascaded voice agent, is a small and surprisingly consequential component: the chunker, which decides when enough text has arrived to send to the voice.

Send too little and the speech sounds broken — a voice reading two words at a time cannot place the stress or the intonation of a sentence it has not seen. Send too much and the user waits in silence for text that is already partly written.

## Why not one token at a time?

Speech depends on context in a way text does not. The word "read" is pronounced differently in "I will read" and "I have read". A question rises at the end; a statement falls. Emphasis in "*I* didn't say that" and "I didn't say *that*" changes the meaning.

A TTS model given a fragment has to guess all of this. Given a full sentence, it can see where the sentence goes and shape the whole thing. So chunking trades latency against prosody: the more text the TTS sees at once, the more natural it sounds and the longer the user waits for it.

## How long each choice costs

At a generation speed of 50 tokens per second and about 1.3 tokens per word:

| send to TTS when there is… | typical length | wait for the text |
| --- | --- | --- |
| a complete sentence | 18 words · 23 tokens | **0.47 s** |
| the first clause (comma, dash, colon) | 7 words · 9 tokens | 0.18 s |
| a minimum of 4 words | 4 words · 5 tokens | **0.10 s** |

This is added directly to time to first audio — on top of the model's time to first token and the TTS engine's own start-up. Moving from full sentences to clauses for the *first* chunk saves about 0.3 seconds, a large share of a voice agent's whole budget.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="A stream of tokens with three possible cut points: after 4 words at 0.10 s, at the first comma at 0.18 s, and at the full stop at 0.47 s." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHERE TO CUT THE FIRST CHUNK</text>
<g fill="var(--muted-foreground)" fill-opacity="0.35">
<rect x="20" y="50" width="18" height="18" rx="2"/><rect x="40" y="50" width="18" height="18" rx="2"/><rect x="60" y="50" width="18" height="18" rx="2"/><rect x="80" y="50" width="18" height="18" rx="2"/><rect x="100" y="50" width="18" height="18" rx="2"/>
<rect x="120" y="50" width="18" height="18" rx="2"/><rect x="140" y="50" width="18" height="18" rx="2"/><rect x="160" y="50" width="18" height="18" rx="2"/><rect x="180" y="50" width="18" height="18" rx="2"/>
<rect x="200" y="50" width="18" height="18" rx="2"/><rect x="220" y="50" width="18" height="18" rx="2"/><rect x="240" y="50" width="18" height="18" rx="2"/><rect x="260" y="50" width="18" height="18" rx="2"/><rect x="280" y="50" width="18" height="18" rx="2"/><rect x="300" y="50" width="18" height="18" rx="2"/><rect x="320" y="50" width="18" height="18" rx="2"/><rect x="340" y="50" width="18" height="18" rx="2"/><rect x="360" y="50" width="18" height="18" rx="2"/><rect x="380" y="50" width="18" height="18" rx="2"/><rect x="400" y="50" width="18" height="18" rx="2"/><rect x="420" y="50" width="18" height="18" rx="2"/><rect x="440" y="50" width="18" height="18" rx="2"/><rect x="460" y="50" width="18" height="18" rx="2"/><rect x="480" y="50" width="18" height="18" rx="2"/>
</g>
<g stroke="var(--primary)" stroke-width="2">
<path d="M119 40 V80"/><path d="M199 40 V80"/><path d="M499 40 V80"/>
</g>
<text class="b" x="119" y="98" text-anchor="middle">4 words</text><text class="l" x="119" y="112" text-anchor="middle">0.10 s</text>
<text class="b" x="199" y="98" text-anchor="middle">first comma</text><text class="l" x="199" y="112" text-anchor="middle">0.18 s</text>
<text class="b" x="499" y="98" text-anchor="end">full stop</text><text class="l" x="499" y="112" text-anchor="end">0.47 s</text>
<text class="l" x="20" y="36">tokens arriving at 50 / s →</text>
<path d="M20 138 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="162">earlier cut: faster first audio, less context for intonation</text>
<text class="l" x="20" y="182">common practice — cut the first chunk early, later chunks at sentence ends</text>
<text class="l" x="20" y="202">later chunks are produced while earlier ones play, so their wait is hidden</text>
</svg>
<figcaption>Only the first chunk's wait is heard. That is where to be aggressive.</figcaption>
</figure>

## The usual strategy: early first, full later

Only the first chunk's wait is directly heard. Once audio is playing, the next chunk is generated and synthesised while the user listens, and the model is many times faster than speech. So most systems:

1. **Cut the first chunk early** — at the first clause boundary, or after a small minimum number of words, whichever comes first.
2. **Cut later chunks at sentence boundaries**, giving the TTS full sentences for natural prosody, since their latency is hidden.
3. **Flush at the end** of the reply, whatever is left.

The first-chunk rule can also be helped by the prompt: replies that begin with a short, complete phrase — "Sure." "Got it." "Okay, so" — give the chunker a natural early cut.

## Where boundaries are not what they look like

A naive chunker that cuts on every full stop gets these wrong:

- **Abbreviations:** "Dr. Patel", "e.g. this", "Mr. and Mrs."
- **Numbers:** "3.5 percent", "version 2.1.4", "£1,250.00"
- **Lists and URLs:** "example.com/help", "1. Open the app"
- **Quotations:** a full stop inside quotation marks that does not end the outer sentence

Each wrong cut splits a phrase the voice should have read as one, producing an audible break in the middle: "Doctor. Patel will see you." Chunkers use rules for the common cases, look at what follows the full stop (a capital letter and a space is a stronger signal than a digit), and avoid cutting inside numbers and URLs entirely.

## Text normalisation belongs here too

The chunker is usually where text is also prepared for speaking: expanding "£1,250" to "one thousand two hundred and fifty pounds", "3pm" to "three p m", "Dr." to "Doctor", and removing anything a voice should not read — markdown asterisks, bullet characters, code blocks. A language model writing for the screen will happily produce all of these unless told it is writing for speech; a normaliser catches what slips through.

## Per-chunk costs

Every chunk is a separate request to the TTS engine, and each request has some fixed overhead before audio comes back. If chunks are synthesised one after another, very small chunks multiply that overhead. Streaming TTS engines that accept a continuous text stream over one connection avoid this, which is one reason they are preferred for voice agents.

There is also a quality cost at chunk boundaries: each chunk is synthesised with its own intonation contour, so the seams can be audible as a slight reset. Engines that accept preceding text as context — "this is what was just said" — can smooth the join.

## What to take away

The chunker decides when the LLM's text is enough to speak. Waiting for a full sentence costs about 0.47 s; a first clause about 0.18 s; four words about 0.10 s — and the first chunk's wait is added straight onto time to first audio.

Cut the first chunk early, later chunks at sentence ends where the latency is hidden, avoid false boundaries in abbreviations and numbers, and normalise the text for speech on the way through.
