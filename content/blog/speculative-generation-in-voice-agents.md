---
title: "Speculative generation in voice agents"
date: "2026-11-06T14:30"
category: "AI"
tags: ["voice-agents", "latency", "speculation", "endpointing", "llm"]
summary: "Start writing the reply when the user merely seems to have finished, and throw it away if they keep talking. Starting at 150 ms of silence instead of 500 saves 350 ms on every turn it guesses right — at the cost of about half again as many generated tokens."
draft: false
cover: "/blog/speculative-generation-in-voice-agents.svg"
---

A cascaded voice agent normally works in sequence: wait until it is confident the user has finished, then send the transcript to the language model, then speak. The waiting is the problem. To avoid cutting people off, endpointing has to hold out for a fairly long silence — and the model does nothing during it.

Speculative generation uses that time. As soon as the user *might* have finished, the agent starts generating a reply from the transcript so far. If the user really has finished, the reply is already under way. If they carry on, the draft is thrown away and the agent tries again at the next pause.

## The saving

Suppose the agent's endpointing commits after 500 ms of silence, and the language model needs about 410 ms — first token plus the first sentence — before there is anything to speak.

| | reply ready after the user stops |
| --- | --- |
| wait, then generate | 500 + 410 = **910 ms** |
| start speculatively at 150 ms of silence | 150 + 410 = **560 ms** |

**350 ms** earlier, on every turn where the guess was right — which is a large share of a voice agent's entire budget. The audio is not played until endpointing actually commits, so the user is never interrupted; the reply is simply ready the moment it is allowed to start.

The expected saving depends on how often the early guess holds:

| early guess correct | average saving per turn |
| --- | --- |
| 60% | 210 ms |
| 80% | 280 ms |
| 90% | 315 ms |

## The cost: discarded work

Every wrong guess is generation that gets thrown away. If a typical turn contains two pauses that look like endings but are not, and each speculative run gets about 20 tokens in before being cancelled, that is 40 discarded tokens per turn — against a reply of around 78. Roughly **half again** as much generation.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Timeline of a user turn with two mid-turn pauses that trigger and then cancel speculative drafts, and a final pause whose draft is kept and ready 350 ms earlier than waiting." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">DRAFT EARLY, DISCARD OFTEN</text>
<text class="l" x="20" y="54">user</text>
<g fill="var(--muted-foreground)" fill-opacity="0.5"><rect x="80" y="42" width="90" height="18" rx="3"/><rect x="190" y="42" width="110" height="18" rx="3"/><rect x="320" y="42" width="70" height="18" rx="3"/></g>
<text class="l" x="20" y="94">drafts</text>
<g fill="none" stroke="var(--muted-foreground)" stroke-dasharray="3 3"><rect x="174" y="82" width="16" height="16" rx="2"/><rect x="304" y="82" width="16" height="16" rx="2"/></g>
<g stroke="var(--muted-foreground)"><path d="M174 82 L190 98 M190 82 L174 98"/><path d="M304 82 L320 98 M320 82 L304 98"/></g>
<rect x="398" y="82" width="70" height="16" rx="2" fill="var(--primary)" fill-opacity="0.75"/>
<text class="b" x="474" y="95">kept</text>
<text class="l" x="20" y="134">speech</text>
<rect x="456" y="122" width="84" height="16" rx="2" fill="var(--primary)" fill-opacity="0.35"/>
<path d="M390 36 V150" stroke="var(--primary)" stroke-dasharray="3 3"/>
<path d="M456 110 V150" stroke="var(--primary)"/>
<text class="l" x="392" y="164">user stops</text>
<text class="b" x="456" y="176">plays when endpointing commits</text>
<path d="M20 196 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="218">ready at 560 ms instead of 910 ms — 350 ms saved when the guess holds</text>
<text class="l" x="20" y="238">two cancelled drafts ≈ 40 tokens of wasted work for a 78-token reply</text>
</svg>
<figcaption>Speculation decides when to start thinking, not when to start talking.</figcaption>
</figure>

How much that matters depends on where the cost lands:

- **Prefill is mostly cached.** Each speculative run shares the long prefix — system prompt and conversation so far — with the previous one. With prompt caching, only the new words of the transcript are processed again.
- **Decode stops early.** A cancelled run is stopped the moment the user speaks again, so it rarely produces more than a sentence.
- **Capacity is the real cost.** Under heavy load, speculative runs compete with real ones for GPU time. Systems often speculate less, or not at all, when servers are busy.

## When the transcript changes

The subtle case is a user who stops, the agent speculates, and the *final* transcript differs slightly from the partial one used — a word corrected by the recogniser, a last word that arrived late. Two options:

1. **Discard and regenerate** whenever the final transcript differs at all. Safe, and gives up the saving on those turns.
2. **Keep the draft if the difference is immaterial** — punctuation, casing, a filler word. Requires a judgement about what "immaterial" means, which is easy to get wrong for numbers and names.

Most systems take option 1 for anything beyond trivial differences.

## Making the guesses better

The value of speculation rises with the accuracy of the early guess, so it pairs naturally with better turn detection:

- A **turn-detection model** that reads the partial transcript can tell "I'd like to book a table for" (clearly unfinished — do not speculate) from "that's all, thanks" (clearly finished — speculate immediately).
- Speculate **only above a confidence threshold**, trading a little saving for much less waste.
- Allow **more than one speculative run at once** only when capacity is plentiful.

## Speculation beyond the reply

The same idea applies to other slow steps. If the user's intent is clear early — "what's my balance" — the agent can start the account lookup before they finish speaking. If they say something else, the result is discarded. Tool calls with no side effects are ideal for this; anything that changes state must never be started speculatively.

## What to take away

Speculative generation starts the language model when the user seems to have stopped, and discards the draft if they continue. Starting at 150 ms of silence instead of 500 ms has the reply ready 350 ms sooner on every correct guess — about 280 ms on average at 80% accuracy.

The price is discarded generation, roughly half again as many tokens, softened by prompt caching and early cancellation. Use a turn-detection model to decide when to speculate, never speculate actions with side effects, and scale speculation back when the servers are busy.
