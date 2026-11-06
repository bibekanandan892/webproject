---
title: "Unfinished input in voice agents"
date: "2026-11-06T17:10"
category: "AI"
tags: ["voice-agents", "endpointing", "structured-input", "phone-numbers", "turn-detection"]
summary: "People read phone numbers in groups — 415, pause, 555, pause, 0134. If those pauses run a median 450 ms, a 500 ms endpointer cuts 66.0% of phone numbers in half and 80.1% of card numbers. Knowing how many digits are expected fixes it; a longer timer barely does."
draft: false
cover: "/blog/unfinished-input-in-voice-agents.svg"
---

*"What's the best number to reach you on?"*

*"It's four one five…"* — the caller pauses, the agent decides they have finished, and replies: *"Sorry, that number seems too short."*

Structured input — phone numbers, card numbers, postcodes, email addresses, booking references — is where general-purpose endpointing fails most often and most visibly. People do not say these things in one breath. They chunk them, and the gaps between chunks look exactly like the end of a turn.

## How badly it fails

People read a ten-digit phone number in groups, typically 3-3-4, with a short pause between groups. Suppose those pauses are log-normally distributed with a median of 450 ms. A general endpointer that ends the turn after 500 ms of silence will cut the number off if *either* gap runs long:

| endpointing timeout | each gap exceeds it | phone number cut off (2 gaps) |
| --- | --- | --- |
| 500 ms | 41.7% | **66.0%** |
| 800 ms | 12.5% | 23.4% |
| 1,500 ms | 0.80% | 1.60% |

Two phone numbers in three are interrupted at a timeout that works fine for ordinary sentences. A 16-digit card number read in four groups has three gaps and is cut off **80.1%** of the time at 500 ms.

Raising the timeout to 1.5 s for everything would fix this and make every other reply sluggish. The answer is to know when the user is giving structured input and what complete input looks like.

## Know what you asked for

The agent usually knows exactly what kind of answer is coming, because it just asked for it. That knowledge can drive endpointing:

| expected input | complete when |
| --- | --- |
| phone number | the expected number of digits for the country |
| card number | 15 or 16 digits, passing a checksum |
| postcode / ZIP | the format matches |
| email | "at" and a plausible domain with a "dot" have been heard |
| date of birth | day, month and year are all present |
| booking reference | the known length and character pattern |

While the input is incomplete, the agent waits much longer — a couple of seconds — between chunks. Once it is complete, it can respond immediately, often faster than ordinary endpointing would.

The same check helps after the fact. If the turn did end with an incomplete value — nine digits — the agent should not reject it; it should ask for the rest: *"I've got 415 555 013 — what's the last digit?"*

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="A phone number spoken in three groups separated by two pauses, with a general endpointer firing in the first pause and a structure-aware endpointer waiting until ten digits are heard." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">GROUPS, NOT A SENTENCE</text>
<g fill="var(--muted-foreground)" fill-opacity="0.45"><rect x="40" y="44" width="110" height="26" rx="5"/><rect x="200" y="44" width="110" height="26" rx="5"/><rect x="360" y="44" width="140" height="26" rx="5"/></g>
<g font-family="var(--font-geist-mono),ui-monospace,monospace"><text class="l" x="95" y="62" text-anchor="middle">four one five</text><text class="l" x="255" y="62" text-anchor="middle">five five five</text><text class="l" x="430" y="62" text-anchor="middle">zero one three four</text></g>
<text class="l" x="175" y="40" text-anchor="middle">pause</text><text class="l" x="335" y="40" text-anchor="middle">pause</text>
<path d="M175 76 V112" stroke="var(--muted-foreground)" stroke-width="2"/>
<text class="l" x="20" y="128">500 ms timer: ends the turn here, 66.0% of the time</text>
<path d="M505 76 V150" stroke="var(--primary)" stroke-width="2"/>
<text class="b" x="500" y="166" text-anchor="end">digit count: complete at 10 — reply now</text>
<path d="M20 186 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="208">know the shape of the answer, and wait until it is complete</text>
<text class="l" x="20" y="226">gaps modelled log-normal, median 450 ms; a 16-digit card (3 gaps) is cut 80.1%</text>
</svg>
<figcaption>Silence cannot tell a finished number from a pause between groups. A digit count can.</figcaption>
</figure>

## Speech recognition makes it harder

Structured input is also where transcription is weakest:

- **Homophones.** "for" vs "four", "to" vs "two", "oh" vs "zero", "ate" vs "eight".
- **Grouped numbers.** "Double five" means 55; "fifteen hundred" may mean 1500 or "15 100". "Twenty twenty-four" is a year or two numbers.
- **Letters.** B, D, E, P, T and V sound alike on a phone line; M and N too.
- **Emails.** "john dot smith at gmail dot com" has to be reassembled, and "underscore", "hyphen" and spelled-out names complicate it.

Mitigations: bias the recogniser toward digits and letters when a number or code is expected; normalise spoken forms into the expected format; validate with checksums where they exist; and always **read the value back** — *"That's 415 555 0134, is that right?"* — before acting on it.

## Let people correct naturally

Users fix mistakes mid-stream: *"four one five, sorry, four one six…"*. Or they correct after the read-back: *"no, the last bit is three four, not four three."* The agent should handle both without starting over — keep the partial value, apply the correction, read back again.

For long values, chunked confirmation works better than one long read-back: confirm each group as the user gives it. It is slower but much less error-prone than repeating sixteen digits and asking whether all of them were right.

## When voice is the wrong channel

Some input is better not spoken at all. Card numbers raise compliance issues when spoken and recorded; long reference codes are error-prone. Offering keypad entry (DTMF) on phone calls, or sending a secure link by text message, is often the more reliable and more private design.

## What to take away

Structured input is spoken in chunks, and chunk gaps look like turn endings: with gaps at a median 450 ms, a 500 ms endpointer cuts 66.0% of phone numbers and 80.1% of card numbers. A longer global timer helps only by slowing everything down.

Use what the agent asked for: wait while the input is incomplete, respond as soon as it matches the expected shape, bias recognition toward digits and letters, validate and read back, and offer non-voice entry where accuracy or privacy demands it.
