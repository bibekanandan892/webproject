---
title: "Long pauses in voice agents"
date: "2026-11-06T16:10"
category: "AI"
tags: ["voice-agents", "turn-taking", "endpointing", "ux", "pauses"]
summary: "Ask \"what's your policy number?\" and the caller goes looking for it. If their thinking pauses run a median 2.5 s, a 2-second ceiling interrupts 61.0% of them and even 4 seconds interrupts 27.8%. The fix is not a longer timer but recognising that the user is still holding the turn."
draft: false
cover: "/blog/long-pauses-in-voice-agents.svg"
---

Most endpointing problems are about short pauses: the gap between clauses, a breath before the next word. Long pauses are a different situation. The user has not finished — they are *thinking*, or looking something up, or reading something off a screen — and the silence can last several seconds.

*"What's your policy number?"* … *"Um, hang on, it's on the letter somewhere…"* … four seconds of rustling … *"Okay, it's P-X-4…"*

An agent that treats that silence as the end of the turn either jumps in with "Sorry, I didn't catch that" or, worse, answers a question that has not been asked yet.

## How long thinking pauses are

Suppose pauses of this kind — searching for information, recalling something, deciding — have a median of 2.5 seconds with a wide spread (a log-normal distribution). Then the share of them that outlast a given wait is:

| agent waits up to | thinking pauses that last longer |
| --- | --- |
| 1 s | 87.4% |
| 2 s | **61.0%** |
| 4 s | 27.8% |
| 8 s | 7.3% |

Endpointing tuned for ordinary turns — under a second — interrupts nearly all of them. Even a generous 2-second ceiling interrupts most. And raising the ceiling to 8 seconds to cover them would make every ordinary reply unbearably slow.

So long pauses cannot be handled by the timer. They have to be recognised.

## Signs the user is holding the turn

People signal that they are keeping the floor, and those signals are detectable:

**Explicit holds.** "Hang on." "Let me check." "One sec." "Let me think." These are as clear as a request can be.

**Fillers before silence.** "Um…", "Uh…", "So…", "Well…" followed by a pause usually means the speaker is still composing.

**An incomplete answer.** "My date of birth is…", or the first half of a policy number, is not a turn ending.

**The question asked.** Requests for information the user may need to find — account numbers, dates, addresses, reference codes — invite long pauses. So do open questions like "What would you like to change?"

**Background activity.** Typing, paper rustling or a muffled side conversation suggest the user is busy, not gone.

When these appear, the agent should switch from "waiting for the end of a turn" to "waiting for the user to come back": a much longer ceiling, and no reply until speech resumes or the ceiling is reached.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="A falling curve of the share of thinking pauses still continuing after 1, 2, 4 and 8 seconds — 87.4%, 61.0%, 27.8% and 7.3% — with a marker at a typical sub-second endpointing threshold." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THINKING PAUSES STILL GOING AFTER…</text>
<path d="M60 36 V176 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="54" y="40" text-anchor="end">100%</text><text class="l" x="54" y="180" text-anchor="end">0%</text>
<path d="M60 36 L117 54 L175 91 L290 137 L520 166" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<g fill="var(--primary)"><circle cx="117" cy="54" r="3.5"/><circle cx="175" cy="91" r="3.5"/><circle cx="290" cy="137" r="3.5"/><circle cx="520" cy="166" r="3.5"/></g>
<text class="b" x="123" y="50">1 s · 87.4%</text><text class="b" x="181" y="88">2 s · 61.0%</text><text class="b" x="296" y="134">4 s · 27.8%</text><text class="b" x="514" y="158" text-anchor="end">8 s · 7.3%</text>
<path d="M90 36 V176" stroke="var(--muted-foreground)" stroke-dasharray="3 3"/>
<text class="l" x="94" y="172">usual endpointing</text>
<text class="l" x="60" y="192">0 s</text><text class="l" x="520" y="192" text-anchor="end">8 s</text>
<path d="M20 208 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="230">no single timer fits both a quick "yes" and a hunt for a policy number</text>
<text class="l" x="20" y="246">modelled as log-normal, median 2.5 s</text>
</svg>
<figcaption>A timer long enough for thinking is far too long for everything else. Recognise the hold instead.</figcaption>
</figure>

## What the agent should do during the pause

**Nothing, at first.** If the user said "hang on", silence is what they asked for. An agent that fills it with "Take your time!" every two seconds is worse than one that waits.

**One gentle check after a while.** If the pause goes on — ten or fifteen seconds — a short, low-pressure prompt helps: *"No rush — I'm still here."* It confirms the line is open without demanding an answer.

**Offer help if they seem stuck.** *"It's usually at the top of your renewal letter, starting with P-X."* This shortens the pause instead of just tolerating it.

**Offer a way out.** For information the user may not have, say what else would work: *"If you can't find it, I can look you up by your postcode instead."*

**Then close gracefully.** Only after a long ceiling with no response should the agent assume something is wrong — and even then ask, rather than hang up: *"Are you still there?"*

## Don't lose the partial answer

Users often give part of an answer, pause, then continue: "It's P-X-4… [three seconds] …7-2-9." The agent must treat the whole as one answer. If endpointing fires during the pause, the transcript gets split into two turns, and the agent may respond to "P-X-4" as if it were complete.

Two guards help. First, after a partial structured answer — part of a number, an address with no postcode yet — keep the turn open longer. Second, if the user resumes immediately after the agent started replying, treat it as a barge-in and *merge* the new speech with the previous fragment rather than starting a fresh turn.

## Prompting the model for it

Much of this behaviour can be shaped in the system prompt: tell the model that users may need time to find information, that "hang on" means wait without replying, and that a fragment of a number is not a full answer. Pair that with a turn-detection model that has seen hesitation patterns in its training data, and a long ceiling that activates on hold signals.

## What to take away

Long pauses are not slow endings; they are the user holding the turn while thinking or searching. With thinking pauses at a median of 2.5 s, a 2-second ceiling interrupts 61.0% of them and 4 seconds still interrupts 27.8% — so a longer global timer is not the answer.

Detect the hold — explicit "hang on", fillers, incomplete answers, questions that require looking something up — then wait quietly, check in gently after a long silence, offer help or an alternative, and keep split answers together as one.
