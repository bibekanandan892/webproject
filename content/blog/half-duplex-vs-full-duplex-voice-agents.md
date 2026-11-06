---
title: "Half-duplex vs full-duplex voice agents"
date: "2026-10-23T13:55"
category: "AI"
tags: ["voice-agents", "full-duplex", "turn-taking", "speech-to-speech", "architecture"]
summary: "A half-duplex agent takes turns: it listens, then speaks. A full-duplex one listens and speaks at once, deciding every 80 ms whether to talk. That makes overlap, backchannels and instant yielding natural — and means running the model 7,500 times in a 10-minute call instead of about 936."
draft: false
cover: "/blog/half-duplex-vs-full-duplex-voice-agents.svg"
---

The terms come from communications. A **half-duplex** channel carries one direction at a time, like a walkie-talkie: one side talks, says "over", and the other replies. A **full-duplex** channel carries both directions at once, like a phone call.

Voice agents can be built either way, and the choice shapes how natural they can feel.

## Half-duplex: taking turns

Most voice agents are, at heart, half-duplex. The conversation is a sequence of turns:

1. Listen until the user has finished.
2. Think.
3. Speak until done — or until interrupted.
4. Repeat.

Everything is organised around turn boundaries. Endpointing decides when a turn ends; barge-in logic decides when to abandon the agent's turn early. The language model sees a clean transcript of alternating turns, which is exactly the format it was trained on.

This is simple, debuggable, and works with any text LLM. Its limits all come from the turn structure:

- **Overlap is an error condition.** If the user speaks while the agent is speaking, the system must decide: interruption (stop) or noise (ignore). Real conversation is full of overlap that is neither.
- **Backchannels are awkward.** "Mm-hmm" mid-sentence either halts the agent or is discarded; it is never simply *heard*.
- **The agent cannot backchannel either.** It cannot say "right" while the user talks, because it is not allowed to speak during their turn.
- **Every decision is at a boundary.** Latency depends on detecting the boundary, so the system is always waiting for silence.

## Full-duplex: always listening, sometimes speaking

A full-duplex agent processes the incoming audio stream and its own outgoing stream continuously and simultaneously. There are no turns as such. At every moment — every frame, perhaps every 80 ms — the model decides what to output: silence, a backchannel, the start of a reply, or more of a reply in progress.

This is typically done with speech-native models that consume and produce audio tokens in parallel streams. The model learns turn-taking behaviour from data of real conversations, rather than having it imposed by endpointing rules.

What becomes possible:

- **Natural overlap.** Starting a reply a fraction before the user quite finishes, as people do.
- **Real backchannels.** The agent can say "mm-hmm" or "right" while the user speaks, signalling it is following.
- **Instant yielding.** If the user cuts in, the model hears it in the very next frame and can stop — no separate barge-in pipeline.
- **No silence threshold.** The decision to speak comes from what was said and how, not from a timer.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Two pairs of timelines: half-duplex with user and agent bars strictly alternating separated by gaps; full-duplex with bars overlapping, including short agent backchannels during the user's speech." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">TAKING TURNS vs TALKING TOGETHER</text>
<text class="b" x="20" y="44">half-duplex</text>
<text class="l" x="20" y="66">user</text><text class="l" x="20" y="86">agent</text>
<g fill="var(--muted-foreground)" fill-opacity="0.5"><rect x="80" y="56" width="120" height="14" rx="3"/><rect x="330" y="56" width="90" height="14" rx="3"/></g>
<g fill="var(--primary)" fill-opacity="0.75"><rect x="230" y="76" width="80" height="14" rx="3"/><rect x="450" y="76" width="80" height="14" rx="3"/></g>
<text class="l" x="200" y="104">gap</text><text class="l" x="420" y="104">gap</text>
<text class="b" x="20" y="134">full-duplex</text>
<text class="l" x="20" y="156">user</text><text class="l" x="20" y="176">agent</text>
<g fill="var(--muted-foreground)" fill-opacity="0.5"><rect x="80" y="146" width="160" height="14" rx="3"/><rect x="320" y="146" width="40" height="14" rx="3"/><rect x="400" y="146" width="100" height="14" rx="3"/></g>
<g fill="var(--primary)" fill-opacity="0.75"><rect x="150" y="166" width="16" height="14" rx="3"/><rect x="232" y="166" width="110" height="14" rx="3"/><rect x="470" y="166" width="60" height="14" rx="3"/></g>
<text class="l" x="146" y="196">"mm-hmm"</text><text class="l" x="300" y="196">overlap, yields</text>
<path d="M20 210 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="232">full-duplex decides every frame; half-duplex decides at the boundaries</text>
</svg>
<figcaption>Half-duplex conversation is a sequence of turns. Full-duplex is two streams that happen to interleave.</figcaption>
</figure>

## What full-duplex costs

**Compute that never stops.** A half-duplex agent does heavy work around each turn. A full-duplex model runs on every frame, including silences. At 12.5 frames a second, a 10-minute call is **7,500 model steps**. A half-duplex agent producing twelve replies of about 78 tokens generates roughly **936** tokens of output. Even allowing for its transcription and prefill work, the always-on model costs several times as much per call — about 8× in steps alone.

**Control.** There is no clean transcript between hearing and speaking for rules, tools and guardrails to act on. Production designs often pair a full-duplex speech front-end with a text model for reasoning and tool calls, which reintroduces some turn structure behind the scenes.

**Behaviour you have to train, not configure.** How often to backchannel, when to overlap, how assertive to be — these become properties of the model learned from data. Adjusting them means retraining or fine-tuning, not changing a threshold.

**Evaluation.** Overlap that is natural in one culture or context is rude in another. Measuring "good" turn-taking is harder than measuring latency.

## Between the two

Most production systems in practice sit in between: a half-duplex core with full-duplex features bolted on.

- **Barge-in** lets the user interrupt the agent's turn.
- **Backchannel detection** lets the agent keep talking through "mm-hmm".
- **Speculative generation** starts thinking before the turn boundary.
- **Filler phrases** let the agent take the turn before its answer is ready.

Each approximates something full-duplex models do natively. Together they get much of the naturalness while keeping the text pipeline's control.

## How to choose

**Half-duplex (with extensions)** for task-oriented agents: customer service, booking, support, anything with tools, rules and audits. Turn structure is an asset there — it gives clean points to check, log and constrain.

**Full-duplex** where conversational feel is the product: companions, language tutors, interactive characters, casual assistants. The cost and reduced control buy something users notice immediately.

## What to take away

Half-duplex agents take turns — listen, think, speak — and handle overlap as an exception through barge-in and backchannel rules. Full-duplex agents listen and speak at once, deciding every frame whether to talk, which makes overlap, backchannels and instant yielding natural.

The price is constant compute — about 7,500 model steps in a 10-minute call against roughly 936 generated tokens for a turn-based agent — and less room for explicit control. Most production systems today are half-duplex cores with full-duplex behaviours added piece by piece.
