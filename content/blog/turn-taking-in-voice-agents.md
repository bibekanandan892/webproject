---
title: "Turn-taking in voice agents"
date: "2026-09-04T14:55"
category: "AI"
tags: ["voice-agents", "turn-taking", "endpointing", "barge-in", "conversation"]
summary: "Humans swap turns in about 200 ms without talking over each other. A voice agent that waits for silence has to pick a threshold — and in a simple model of real pauses, 300 ms cuts off 40.9% of turns while 1,200 ms still cuts 6.0% and adds over a second of dead air."
draft: false
cover: "/blog/turn-taking-in-voice-agents.svg"
---

In a conversation, people take turns speaking, and they are astonishingly good at it. Across languages, the typical gap between one person finishing and the next starting is about 200 milliseconds. That is shorter than the time it takes to plan a sentence, which means listeners are predicting the end of a turn before it arrives and preparing their reply in parallel.

Turn-taking is the set of decisions a voice agent makes to join in that rhythm: when to start talking, when to stop, and when a sound from the user is not a bid for the turn at all. Getting it wrong is the most noticeable failure a voice agent has — more noticeable than a wrong answer.

## The three decisions

**When the user has finished (endpointing).** The agent must decide that the user's turn is over before it replies. Too early and it cuts them off mid-thought. Too late and there is an awkward silence.

**When the user wants the turn back (barge-in).** If the user starts speaking while the agent is talking, the agent usually has to stop — quickly — and listen.

**When a sound is not a turn (backchannels and noise).** "Mm-hmm", "yeah", "right" while the agent is talking are signals of attention, not interruptions. Coughs, a door closing and the agent's own voice echoing through the user's speaker are not speech at all. None of them should end the agent's turn.

Each of these is a classification under time pressure, and each has a trade-off between two kinds of error.

## Why silence is a poor signal

The obvious way to detect the end of a turn is to wait for silence. The trouble is that people are silent *inside* their turns all the time — between clauses, while thinking, before a hard word, while reading out a number.

Suppose, as a simple model, that pauses within a turn are mostly brief — 85% of them averaging 120 ms — with the remaining 15% being hesitations averaging 600 ms, and that a typical turn contains three such pauses. A silence threshold of *t* milliseconds wrongly ends the turn whenever any of those pauses runs longer than *t*:

| silence threshold | a single pause exceeds it | turns cut off | dead air added to every reply |
| --- | --- | --- | --- |
| 200 ms | 26.8% | 60.8% | 200 ms |
| 300 ms | 16.1% | **40.9%** | 300 ms |
| 500 ms | 7.8% | 21.7% | 500 ms |
| 800 ms | 4.1% | 11.7% | 800 ms |
| 1,200 ms | 2.0% | **6.0%** | 1,200 ms |

The exact numbers depend on the speaker and the task, but the shape does not. There is no good threshold. Every value that rarely interrupts adds most of a second to every reply, and every value that feels responsive interrupts constantly. The two errors trade against each other along a single dial.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Two opposing curves against silence threshold: share of turns cut off falling, and added delay rising, with no point where both are low." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE DIAL, TWO FAILURES</text>
<path d="M60 36 V190 H500" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<path d="M60 96 L104 127 L192 156 L324 172 L500 181" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<text class="b" x="100" y="118">turns cut off</text>
<path d="M60 172 L500 46" stroke="var(--muted-foreground)" stroke-width="2.2" fill="none"/>
<text class="l" x="400" y="62">dead air per reply</text>
<g fill="var(--primary)"><circle cx="104" cy="127" r="3.5"/><circle cx="500" cy="181" r="3.5"/></g>
<text class="l" x="109" y="142">300 ms: 40.9%</text>
<text class="l" x="440" y="176">1,200 ms: 6.0%</text>
<text class="l" x="60" y="206">200 ms</text><text class="l" x="500" y="206" text-anchor="end">1,200 ms silence threshold</text>
<path d="M20 222 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="244">silence alone cannot separate "pausing" from "finished" — the fix is more signals</text>
</svg>
<figcaption>Lowering one curve raises the other. Better turn-taking needs information that silence does not carry.</figcaption>
</figure>

## What people use instead

Listeners do not wait for silence. They use:

- **Syntax and meaning.** "I'd like to book a table for" is obviously unfinished. "That's everything, thanks" is obviously finished.
- **Prosody.** Falling pitch and slowing speech mark an ending; a held, level pitch marks a pause mid-thought.
- **Context.** After "What's your phone number?", a string of seven digits is probably not done.
- **Gaze and gesture**, in person — unavailable on a phone line, which is part of why phone conversations have slightly longer gaps.

Voice agents improve turn-taking by adding these signals. **Model-based turn detection** listens to the words and the audio and predicts the probability the turn is over, so a clear ending can be answered after 150 ms of silence and an unfinished phrase can be given two seconds. **Dynamic endpointing** adjusts the waiting time to the speaker's pace and to what was asked.

## Overlap is normal — but expensive for machines

Human conversation has plenty of overlap: backchannels, finishing each other's sentences, starting a reply a fraction early. People resolve it effortlessly.

A machine has a harder time, because it is speaking through a loudspeaker the user is also listening through, and because stopping its speech means throwing away a reply it has already generated. So voice agents need explicit policies:

- **Stop on real interruptions**, within a couple of hundred milliseconds.
- **Ignore backchannels**, so "mm-hmm" does not halt the agent mid-sentence.
- **Remember what was actually said.** If the agent is cut off halfway, its conversation history should contain only the half the user heard.

Half-duplex designs avoid overlap entirely — only one side can talk at a time — at the cost of feeling like a walkie-talkie. Full-duplex designs listen and speak simultaneously and must make these decisions continuously.

## Hiding the remaining gap

Even with perfect endpointing, a cascaded agent needs time to transcribe, think and synthesise. Turn-taking design therefore also includes ways of taking the turn before the full answer is ready: a short acknowledgement ("Sure —"), a filler while a tool runs ("Let me check that"), or starting to generate a reply speculatively while the user is still finishing.

## What to take away

Turn-taking is three decisions: when the user has finished, when they want to interrupt, and when a sound is not a turn at all. People make them in about 200 ms using meaning, intonation and context.

Silence alone cannot make the first decision well: in a simple model of real pauses, a 300 ms threshold cuts off 40.9% of turns and a 1,200 ms one still cuts 6.0% while adding over a second of dead air. Good voice agents add the signals people use — words, prosody, context — and handle overlap deliberately.
