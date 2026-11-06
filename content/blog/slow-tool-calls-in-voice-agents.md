---
title: "Hiding slow tool calls in voice agents"
date: "2026-11-06T14:50"
category: "AI"
tags: ["voice-agents", "tool-calls", "latency", "parallelism", "ux"]
summary: "Three lookups at a median 600 ms each take a median 1,984 ms one after another and 948 ms in parallel; the 95th percentile drops from 3,456 ms to 1,954. Parallelism, prefetching, fillers and honest timeouts are how a voice agent stays conversational while the backend is slow."
draft: false
cover: "/blog/slow-tool-calls-in-voice-agents.svg"
---

A text chatbot that takes three seconds to call an API shows a spinner. A voice agent that takes three seconds plays nothing — and three seconds of silence on a phone call is long enough for the caller to wonder if the line dropped.

Voice agents call tools constantly: look up the account, check availability, fetch the order, place the booking. The backends behind those tools were rarely designed for conversational latency. The work of a voice agent is to stay conversational anyway, and there are five main techniques.

## 1. Run independent calls in parallel

A language model handling "When is my next delivery, and can I change the address?" might call three tools: get the customer, get their orders, get the delivery options. If each takes a median 600 ms with a 95th percentile of 1.5 s, the order of execution matters a lot:

| | median | 95th percentile |
| --- | --- | --- |
| one after another | 1,984 ms | **3,456 ms** |
| all at once | **948 ms** | 1,954 ms |

In sequence, the waits add up. In parallel, the user waits only for the slowest one. Most model APIs can return several tool calls in one turn; the agent's runtime should execute them concurrently rather than one at a time. Where calls genuinely depend on each other — you need the customer ID before fetching orders — design the tools so the common chains are a single call.

## 2. Prefetch what you will probably need

Some data is needed on almost every call. If the caller's phone number identifies them, look up their account *as the call connects* — before they have said a word. By the time they ask about their order, it is already loaded.

More generally, start a tool call as soon as the intent is clear, even before the user has finished speaking: by "what's my balance on…" the balance lookup can begin. If the user turns out to want something else, discard the result. This is safe only for **read-only** tools; anything with side effects waits for confirmation.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Two timelines of three tool calls: sequential bars laid end to end finishing near 2 seconds, and parallel bars stacked finishing near 1 second; p95 values 3,456 and 1,954 ms." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WAIT FOR THE SLOWEST, NOT THE SUM</text>
<text class="l" x="20" y="54">sequential</text>
<rect x="110" y="42" width="72" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.45"/>
<rect x="182" y="42" width="90" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.6"/>
<rect x="272" y="42" width="76" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.45"/>
<text class="l" x="354" y="55">median 1,984 ms</text>
<text class="b" x="20" y="96">parallel</text>
<rect x="110" y="80" width="72" height="10" rx="2" fill="var(--primary)" fill-opacity="0.5"/>
<rect x="110" y="92" width="114" height="10" rx="2" fill="var(--primary)" fill-opacity="0.8"/>
<rect x="110" y="104" width="76" height="10" rx="2" fill="var(--primary)" fill-opacity="0.5"/>
<text class="b" x="232" y="101">median 948 ms</text>
<text class="l" x="20" y="146">95th percentile</text>
<text class="l" x="20" y="170">sequential</text><rect x="110" y="160" width="415" height="14" rx="3" fill="var(--muted-foreground)" fill-opacity="0.5"/><text class="l" x="520" y="171" text-anchor="end" fill="var(--background)">3,456</text>
<text class="b" x="20" y="194">parallel</text><rect x="110" y="184" width="235" height="14" rx="3" fill="var(--primary)" fill-opacity="0.8"/><text class="b" x="352" y="195">1,954</text>
<path d="M20 214 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="236">three lookups, each median 600 ms / p95 1.5 s</text>
<text class="l" x="20" y="254">bar scale: 1 px ≈ 8.3 ms</text>
</svg>
<figcaption>Independent calls should never queue behind each other.</figcaption>
</figure>

## 3. Speak while you wait

When a call will take noticeable time, say so immediately: *"Let me check your order."* A filler phrase turns silence into speech and tells the caller what is happening. Model-generated, specific fillers are best; a short pre-recorded one ("Sure —") can play instantly while the specific one is generated.

Prompt the model to speak *before* calling a slow tool rather than after, and have a second, different line ready if the call runs long: *"Still checking — the system's a little slow today."*

## 4. Set honest timeouts

Some calls will be very slow or never return. Pick a limit — say 3 seconds for an interactive lookup — and decide in advance what happens after it. In the example above, a single lookup exceeds 3 s only 0.22% of the time, so a timeout there almost never fires during normal operation, but when a backend degrades it fires on every call, and the agent needs a graceful line rather than an endless pause:

- *"I'm having trouble reaching that system right now. I can try again, or take a message."*
- Offer a callback or a follow-up message.
- Fall back to a cached or partial answer, clearly labelled as such.

Retrying silently inside the timeout is fine; retrying silently for twenty seconds is not.

## 5. Make it asynchronous

Some work does not belong in the conversation at all. Generating a document, processing a refund, a search that takes a minute. The agent can acknowledge it, continue the conversation, and deliver the result later — "I've started the refund; you'll get a text confirmation within a few minutes."

This changes the tool's contract: it returns *started*, not *done*, and the agent must not claim the outcome before it is known.

## Design the tools for voice

Many slow calls are slow because the tools were designed for something else:

- **Return less.** A tool that returns a 50 KB order history makes the model read it all, adding both latency and cost. Return what a spoken answer needs.
- **Combine common chains.** If "find customer, then orders" happens on most calls, make it one tool.
- **Cache aggressively** within a call. The same customer record should not be fetched three times in one conversation.
- **Measure tool latency separately** from model latency, per tool, at the 95th percentile.

## What to take away

Tool latency in a voice agent is silence. Running independent calls in parallel cuts three 600 ms lookups from a median 1,984 ms to 948 ms, and the 95th percentile from 3,456 ms to 1,954.

Prefetch read-only data as soon as intent is clear, speak a filler before slow calls, set timeouts with a graceful fallback line, move long work out of the conversation, and shape the tools themselves for the speed a conversation needs.
