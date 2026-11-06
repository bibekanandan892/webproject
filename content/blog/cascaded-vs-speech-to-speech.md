---
title: "Cascaded vs speech-to-speech voice agents"
date: "2026-09-10T12:35"
category: "AI"
tags: ["voice-agents", "speech-to-speech", "stt", "tts", "architecture"]
summary: "A cascade chains speech-to-text, a text LLM and text-to-speech; a speech-to-speech model hears audio and speaks audio. The second keeps tone and cuts hand-offs, but a 10-minute call at 25 audio tokens a second is about 30,000 tokens of context against roughly 1,950 as text."
draft: false
cover: "/blog/cascaded-vs-speech-to-speech.svg"
---

There are two ways to build a voice agent, and the choice shapes everything after it.

A **cascaded** agent chains three models: speech-to-text turns the user's audio into words, a text language model writes a reply, and text-to-speech reads the reply aloud. Each piece can be chosen, tested and replaced on its own.

A **speech-to-speech** agent uses one model that takes audio in and produces audio out. There is no transcript in the middle, unless one is produced on the side.

## What the cascade does well

**It is built from the best parts.** The strongest reasoning and tool-calling models are text models. A cascade can use any of them, and switch when a better one appears, without touching the speech components.

**Everything is inspectable.** The transcript of what the user said and the text of what the agent decided to say are explicit, logged and searchable. When a call goes wrong, you can see whether recognition misheard, the model reasoned badly, or the voice mispronounced something.

**Control is easy.** Tool calls, guardrails, prompt rules, redaction of personal data, required disclosures — all of these are well-understood operations on text, applied between the speech stages.

**It is predictable to run.** Each component scales on its own and has a known cost per second of audio or per token.

## What the cascade loses

**Time.** Each hand-off costs latency: the recogniser must finalise, the language model must start, the voice must start. Streaming overlaps much of it, but a tuned cascade still typically answers in the region of 800 ms after the user stops.

**Everything that is not words.** The transcript of *"oh, great"* is the same whether it was said with delight or with sarcasm. Hesitation, frustration, a laugh, an accent — all discarded at the first stage. On the way out, the voice has to guess intonation from text alone.

**Natural overlap.** A cascade naturally works in turns. Backchannels, quick interjections and talking over each other have to be engineered around it.

## What speech-to-speech does well

**Lower latency.** Fewer hand-offs, and the model can begin producing audio as soon as it has decided how to respond.

**Paralinguistics both ways.** The model hears tone and can respond to it — slowing down for a confused caller, matching an excited one — and produces speech whose emphasis comes from understanding rather than from punctuation.

**More natural interaction.** Some speech-to-speech systems listen and speak at the same time, handling backchannels and interruptions as part of the model rather than as rules around it.

## What it costs

**Control and visibility.** With no text in the middle, there is less to inspect and fewer places to insert rules. Many speech-to-speech systems produce a transcript alongside the audio for this reason, but the transcript is now a side output, not the thing the model reasoned over.

**Reasoning and tools.** Speech-native models have generally trailed the strongest text models at complex reasoning and multi-step tool use, though the gap is closing.

**Context size.** Audio is represented as tokens too, and there are far more of them per second of conversation than text tokens. Speech tokenizers typically produce somewhere between about 12.5 and 50 tokens per second. For a 10-minute call, tokenising both sides continuously:

| audio tokens per second | 10-minute call, both directions |
| --- | --- |
| 12.5 | 15,000 tokens |
| 25 | **30,000 tokens** |
| 50 | 60,000 tokens |
| as text (~150 words per minute, both speakers) | **~1,950 tokens** |

At 25 tokens per second the conversation fills context about **15×** faster than its transcript would. Long calls need summarisation or truncation sooner, and each turn costs more to process.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Two pipelines: a cascade of three boxes with text between them, and a single speech-to-speech box; below, a bar comparison of context use for a 10-minute call." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THREE MODELS OR ONE</text>
<text class="l" x="20" y="52">cascade</text>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"><rect x="100" y="36" width="80" height="26" rx="5"/><rect x="250" y="36" width="80" height="26" rx="5"/><rect x="400" y="36" width="80" height="26" rx="5"/></g>
<text class="l" x="140" y="53" text-anchor="middle">STT</text><text class="l" x="290" y="53" text-anchor="middle">LLM</text><text class="l" x="440" y="53" text-anchor="middle">TTS</text>
<path d="M180 49 H250 M330 49 H400" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<text class="l" x="196" y="44">text</text><text class="l" x="346" y="44">text</text>
<text class="b" x="20" y="98">speech-to-speech</text>
<rect x="160" y="82" width="260" height="26" rx="5" fill="var(--primary)" fill-opacity="0.12" stroke="var(--primary)" stroke-width="1.6"/>
<text class="b" x="290" y="99" text-anchor="middle">audio in → audio out</text>
<text class="l" x="20" y="142">context for a 10-minute call</text>
<text class="l" x="20" y="166">as text</text><rect x="150" y="154" width="21" height="16" rx="3" fill="var(--muted-foreground)" fill-opacity="0.6"/><text class="l" x="178" y="167">~1,950</text>
<text class="b" x="20" y="190">audio, 25 tok/s</text><rect x="150" y="178" width="320" height="16" rx="3" fill="var(--primary)" fill-opacity="0.8"/><text class="b" x="478" y="191">30,000</text>
<path d="M20 212 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="234">one model keeps tone and saves hand-offs; it also spends ~15× the context</text>
<text class="l" x="20" y="252">the cascade's text is both its weakness (lost tone) and its strength (control)</text>
</svg>
<figcaption>Removing the text step removes its losses and its handles at the same time.</figcaption>
</figure>

## Hybrids

The choice is not strictly binary. Common middle grounds:

- **Cascade with an expressive voice.** A text LLM decides what to say and emits light markup for emotion or emphasis, and a modern TTS model renders it. Tone in the output, text control in the middle.
- **Cascade with audio features.** The recogniser passes along signals beyond words — detected emotion, speaking rate, confidence — so the LLM can respond to how something was said.
- **Speech-to-speech front, text back.** A speech-native model handles the conversation and turn-taking, and calls a text model as a tool for reasoning-heavy or high-stakes steps.

## How to choose

**Choose a cascade when** the agent has to follow procedures, call many tools, satisfy compliance rules, or be audited — customer service, bookings, finance, healthcare intake. Control and visibility matter more than the last few hundred milliseconds.

**Choose speech-to-speech when** the conversation itself is the product — companionship, language practice, casual assistants, interactive characters — and naturalness, emotion and speed matter more than strict procedure.

**Measure both** on your own calls if you can. Latency, task completion, and how often users repeat themselves usually decide it faster than architecture arguments do.

## What to take away

A cascade chains speech recognition, a text model and speech synthesis: more hand-offs and lost tone, but the best reasoning models, full transcripts and easy control. A speech-to-speech model hears and speaks audio directly: faster and more natural, but harder to steer and inspect, and it consumes context about 15× faster — roughly 30,000 tokens for a 10-minute call against about 1,950 as text.

Pick by what the agent must guarantee. Procedures and audits favour the cascade; conversation as the product favours speech-to-speech; hybrids are increasingly how systems get some of both.
