---
title: "Backchannels in voice agents"
date: "2026-11-02T12:50"
category: "AI"
tags: ["voice-agents", "backchannels", "barge-in", "turn-taking", "conversation"]
summary: "\"Mm-hmm\" means keep going. Over four minutes of agent speech a caller might say it 24 times; a barge-in rule that stops for any 300 ms of sound halts the agent about 15.6 times in that call. Recognising backchannels as words brings it to about 1.2 — and a good agent says them too."
draft: false
cover: "/blog/backchannels-in-voice-agents.svg"
---

While one person talks, the other keeps up a quiet stream of small signals: "mm-hmm", "yeah", "right", "okay", "uh-huh", "I see". Linguists call these **backchannels**. They are not attempts to take the turn. They mean the opposite: *I'm following, carry on.*

Voice agents get this badly wrong in both directions. They stop talking when the caller backchannels, and they never backchannel themselves.

## Mistaking "mm-hmm" for an interruption

A voice agent with barge-in stops speaking when it detects the user talking. A backchannel is the user talking. So unless the agent can tell the difference, every "mm-hmm" interrupts it.

Suppose the agent speaks for four minutes in total during a call, and the caller backchannels about six times a minute — a modest rate for someone listening attentively to an explanation. That is around **24 backchannels**. With a barge-in rule that stops after 300 ms of continuous speech, about 65% of typical backchannels last long enough to trigger it:

`24 × 0.65 ≈` **15.6 false stops in one call**

Fifteen times, the agent halts mid-sentence, waits, and then either repeats itself, asks "Sorry, did you say something?", or treats "mm-hmm" as the caller's complete answer and replies to it. The caller learns to keep silent — which makes the conversation stilted — or gives up.

With a classifier that recognises backchannel words and ignores them correctly 95% of the time, the same call has about **1.2** false stops.

## Recognising them

Backchannels are a small, recognisable vocabulary, which makes them easier to handle than most turn-taking problems:

**The words.** "Mm-hmm", "uh-huh", "yeah", "yep", "right", "okay", "sure", "I see", "got it". A streaming transcript of the first few hundred milliseconds identifies most of them.

**The shape.** Short — usually under half a second — often quieter than the speaker's normal voice, and with little or nothing following.

**The timing.** They tend to fall at the agent's phrase boundaries and pauses, not in the middle of words.

**The context.** "Yeah" in reply to the agent's direct question is an answer. "Yeah" while the agent is mid-explanation is a backchannel. "Okay" after the agent finishes a list may mean "go on" or "that's enough" — context and intonation decide.

When a sound is classified as a backchannel, the agent should simply carry on — no pause, no repeat — and it should **not** add the backchannel to the conversation history as a user turn. At most, it might note that the user is engaged.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="A long agent speech bar with small user backchannel marks beneath it; above, a version where each mark causes a gap in the agent's speech, and below, a version where the agent continues uninterrupted." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">"MM-HMM" MEANS KEEP GOING</text>
<text class="l" x="20" y="54">naive barge-in</text>
<g fill="var(--muted-foreground)" fill-opacity="0.55"><rect x="140" y="42" width="80" height="16" rx="3"/><rect x="246" y="42" width="70" height="16" rx="3"/><rect x="342" y="42" width="90" height="16" rx="3"/><rect x="458" y="42" width="72" height="16" rx="3"/></g>
<text class="l" x="20" y="84">user</text>
<g fill="var(--primary)" fill-opacity="0.7"><rect x="222" y="74" width="20" height="10" rx="2"/><rect x="318" y="74" width="20" height="10" rx="2"/><rect x="434" y="74" width="20" height="10" rx="2"/></g>
<text class="l" x="20" y="124">recognised</text>
<rect x="140" y="112" width="390" height="16" rx="3" fill="var(--primary)" fill-opacity="0.75"/>
<g fill="var(--muted-foreground)" fill-opacity="0.7"><rect x="222" y="134" width="20" height="10" rx="2"/><rect x="318" y="134" width="20" height="10" rx="2"/><rect x="434" y="134" width="20" height="10" rx="2"/></g>
<text class="l" x="244" y="102">gap, "sorry?", repeat</text>
<path d="M20 162 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="186">24 backchannels in a call: ~15.6 false stops at a 300 ms rule, ~1.2 with recognition</text>
<text class="l" x="20" y="206">assumes 4 minutes of agent speech, 6 backchannels per minute</text>
</svg>
<figcaption>The same three "mm-hmm"s: a stuttering agent above, a fluent one below.</figcaption>
</figure>

## Agents that backchannel

The other half is the agent's own listening behaviour. When the caller speaks at length — explaining a problem, giving an address, telling a story — a human listener produces backchannels, and the speaker relies on them. Long silence on the line makes people wonder whether they are being heard, and they start repeating themselves or asking "hello?".

An agent can provide the same signal: a brief, quiet "mm-hmm" or "right" at the caller's natural pauses during a long turn. Doing this well is delicate:

- **Timing:** at phrase boundaries, never on top of the caller's words.
- **Rate:** occasional. Too frequent sounds impatient; too regular sounds mechanical.
- **Volume and length:** short and soft, clearly not an attempt to take the turn.
- **Not as a reply:** it must not reset endpointing or make the caller think the agent has started answering.

In a half-duplex pipeline this needs a separate path — a small set of pre-synthesised clips triggered by pause detection while the agent is listening. Full-duplex speech models can learn to do it natively from conversational data, which is one of their clearer advantages.

## Edge cases

- **"Yeah, but…"** starts as a backchannel and becomes an interruption. Keep classifying as more audio arrives rather than deciding once.
- **"Okay okay okay"** — repeated, rapid backchannels often mean *hurry up* or *I've got it*. Some agents shorten the rest of their explanation in response.
- **"No"** is never a backchannel when the agent has just stated something the caller disagrees with.
- **Non-English backchannels** differ by language and culture, both in form and in how often they are used. Classifiers need data from the populations they serve.

## What to take away

Backchannels — "mm-hmm", "yeah", "right" — are listening signals that mean *carry on*. An agent that treats them as interruptions stops constantly: about 15.6 times in a call with 24 backchannels under a 300 ms barge-in rule, against about 1.2 with word-level recognition.

Recognise them by vocabulary, length, timing and context; keep talking through them and keep them out of the conversation history. And let the agent produce them itself, sparingly and at pauses, so callers speaking at length know someone is listening.
