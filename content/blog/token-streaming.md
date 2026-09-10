---
title: "Token Streaming"
date: "2026-09-11T12:40"
category: "AI"
tags: ["token-streaming", "sse", "llm-inference", "latency", "http"]
summary: "A model produces its answer one token at a time, so the answer exists in pieces long before it is finished. Streaming is the decision to send those pieces instead of holding them, and it works because reading is far slower than generating."
draft: false
cover: "/blog/token-streaming.svg"
---

A language model does not compose an answer and then hand it over. It produces one token, appends it to what it has written so far, and produces the next. The answer exists as a growing prefix from the very first step.

Token streaming is the decision to send that prefix as it grows rather than waiting for the last token.

## What the waiting actually is

Suppose the model needs 0.8 seconds before the first token appears — reading the prompt, filling its working state — and then produces about 45 tokens per second. A 600-token answer is finished 14.1 seconds after the request.

Without streaming the reader sees nothing for 14.1 seconds and then everything at once.

With streaming they see the first words at 0.8 seconds. The wait shrinks by 17.7×, and nothing about the model changed. The same tokens were produced at the same speed. Only the moment of sending moved.

## Why it doesn't feel like reading a slow typewriter

The interesting part is what happens after the first token.

That 600-token answer is roughly 450 words. A person reading at a normal pace takes about 112 seconds to get through it. The model wrote it in 13.3.

So the text is arriving about 8 times faster than anyone can read it. After the opening moment the reader is permanently behind the stream, which means they never wait again — there is always more text on screen than they have got to.

This is the real reason streaming works so well here. It is not that people are patient about partial output. It is that generation comfortably outruns reading, so a partial answer behaves like a complete one.

The margin is not infinite. If generation dropped below about 5 words per second the reader would catch up and start waiting between words, and the effect would invert — a stall you can watch is worse than a wait you cannot.

## Sending it

The transport does not need to be clever. The server has a sequence of small pieces to send over time and the client needs to receive them in order. That is what **Server-Sent Events** does.

The server answers with `Content-Type: text/event-stream` and then simply does not finish the response. It writes a line, flushes it, and keeps the connection open. Each event is a `data:` line followed by a blank line:

```
data: {"delta":"Re"}

data: {"delta":"new"}

data: {"delta":" it"}

data: {"delta":" online."}

data: [DONE]
```

The blank line is the delimiter — it is how the client knows an event is complete rather than half-received. The final marker exists because the client otherwise cannot distinguish a finished answer from a connection that is merely quiet, and would sit there waiting or retrying.

<figure>
<svg viewBox="0 0 560 230" width="560" role="img" aria-label="A timeline comparing a buffered response that shows nothing until the end with a streamed response that shows text from the first token." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME TOKENS, SAME SPEED, DIFFERENT MOMENT OF SENDING</text>
<text class="l" x="20" y="52">buffered</text>
<rect x="90" y="40" width="380" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 28%, transparent)"/>
<text class="l" x="280" y="58" text-anchor="middle">blank screen</text>
<rect x="470" y="40" width="70" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="505" y="58" text-anchor="middle">all of it</text>
<text class="l" x="20" y="106">streamed</text>
<rect x="90" y="94" width="22" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 28%, transparent)"/>
<rect x="114" y="94" width="426" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="327" y="112" text-anchor="middle">text on screen, growing</text>
<path d="M90 138 V150 M540 138 V150" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<path d="M90 144 H540" stroke="var(--muted-foreground)" stroke-opacity="0.3"/>
<text class="l" x="90" y="166" text-anchor="middle">0.8s</text>
<text class="l" x="540" y="166" text-anchor="end">14.1s</text>
<text class="l" x="20" y="198">the reader needs 112s to read what took 13.3s to write</text>
<text class="l" x="20" y="216">so after the first token there is always more text than they have read</text>
</svg>
<figcaption>Streaming does not make generation faster. It removes the gap before anything is visible.</figcaption>
</figure>

## Why not a WebSocket

A WebSocket gives you a two-way channel. Streaming an answer needs one direction: the server has tokens, the client displays them. The client has nothing to say until it asks a new question, and that is an ordinary request.

SSE is plain HTTP, so it passes through proxies, load balancers and CDNs without special handling, and the browser reconnects on its own. A WebSocket asks for a protocol upgrade and its own connection lifecycle in exchange for a direction you were not going to use.

If the client genuinely needs to interrupt mid-answer, that is a separate small request to cancel, not a reason to change the transport.

## The failure everyone hits

Streaming breaks silently when something in the middle buffers.

A proxy, a compression layer or a server framework that collects the response before forwarding it will hold every token until the connection closes and then release them together. The server streams correctly, the client handles events correctly, and the user sees the whole answer appear at once after fourteen seconds.

Nothing errors. There is no failed request to find in a log. The check is to watch when bytes arrive, not whether they arrive — if the first byte and the last byte land at the same moment, something between the two ends is holding them.

## What to take away

Streaming is not an optimisation of the model. It changes nothing about how the answer is produced.

It is a decision about when to send what already exists, and it is worth making because generation is much faster than reading. The first token arrives quickly, and from then on the text stays ahead of the person reading it.
