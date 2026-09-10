---
title: "Function Calling in LLMs"
date: "2026-09-11T13:40"
category: "AI"
tags: ["function-calling", "tools", "json-schema", "llm", "agents"]
summary: "The model never runs anything. It writes a structured request and stops, and your code decides whether to honour it — which is both why function calling is safe and where every mistake with it comes from."
draft: false
cover: "/blog/function-calling.svg"
---

A language model predicts text. It has no network, no filesystem, no clock. Ask it how many units of a part are left in a warehouse and the best it can do is produce a plausible-looking number, because producing plausible text is the only thing it does.

Function calling closes that gap without changing what the model is.

## What actually happens

You send the model a list of functions it may request. Each one is a name, a sentence describing when to use it, and a JSON Schema for its arguments:

```json
{
  "name": "check_stock",
  "description": "Current on-hand quantity for one part in one warehouse.",
  "parameters": {
    "type": "object",
    "properties": {
      "sku": { "type": "string" },
      "warehouse": { "type": "string", "enum": ["north", "south", "central"] }
    },
    "required": ["sku", "warehouse"]
  }
}
```

The user asks how many of part `BR-4471` are left in the southern warehouse. Instead of answering, the model emits:

```json
{ "name": "check_stock", "arguments": { "sku": "BR-4471", "warehouse": "south" } }
```

and stops.

**That is the whole trick.** The model did not check anything. It produced text in a shape your code recognises. Your code runs the real lookup, gets `{"quantity": 62}`, appends that to the conversation, and asks the model to continue. Now it can answer, because the fact is in its context — the same as any other text you put there.

## The line this draws

The model proposes; the application disposes. Nothing the model emits reaches the outside world unless code you wrote decides to run it.

This is not a courtesy. It is the only reason function calling is usable in a system that touches real data. The model's output is *a request from an untrusted party*, and it deserves the treatment any such request gets:

- **Validate the shape.** Does it match the schema? Is `warehouse` one of the three allowed values?
- **Authorise separately.** A well-formed `issue_refund` call is still not permission to issue a refund. The schema proves the request is well-typed, never that it is allowed.
- **Assume it can be steered.** If the model read a document earlier in the conversation, the text of that document influenced what it proposes now. A tool call is downstream of everything the model has read.

The most common mistake is treating a schema-valid call as an approved one. Those are different questions, and only one of them the model can answer.

<figure>
<svg viewBox="0 0 560 240" width="560" role="img" aria-label="A loop: the model emits a structured request, the application validates and runs it, the result is appended to the conversation, and the model answers." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="fc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">THE MODEL WRITES THE REQUEST — YOUR CODE DECIDES</text>
<rect x="20" y="60" width="120" height="56" rx="7" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="80" y="86" text-anchor="middle">model</text>
<text class="l" x="80" y="102" text-anchor="middle">proposes</text>
<path d="M146 88 H206" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#fc)"/>
<text class="l" x="176" y="80" text-anchor="middle">json</text>
<rect x="212" y="60" width="130" height="56" rx="7" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="b" x="277" y="86" text-anchor="middle">your code</text>
<text class="l" x="277" y="102" text-anchor="middle">validate · authorise</text>
<path d="M348 88 H408" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#fc)"/>
<rect x="414" y="60" width="126" height="56" rx="7" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="b" x="477" y="86" text-anchor="middle">the real system</text>
<text class="l" x="477" y="102" text-anchor="middle">db · api · disk</text>
<path d="M477 122 V152 H80 V122" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4" fill="none" marker-end="url(#fc)"/>
<text class="l" x="277" y="146" text-anchor="middle">the result goes back in as ordinary text</text>
<path d="M20 178 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="200">nothing crosses the middle box that the middle box did not allow</text>
<text class="l" x="20" y="220">a schema-valid call is not an authorised call</text>
</svg>
<figcaption>Two separate checks live in the middle box: is this well-formed, and is this permitted.</figcaption>
</figure>

## Loops and rounds

Some work needs several calls. Look up an order, then look up the customer on that order, then check their refund history. Each step needs the previous step's answer, so each one is a full round trip: model, tool, model again.

At roughly 1.2 s per model turn and 0.3 s per tool, four dependent calls take about 7.2 seconds.

Other work does not have that dependency. Checking the same part across four warehouses needs four lookups that know nothing about each other. Here the model can emit all four requests in one response, your code runs them together, and all four results come back in one message — about 2.7 seconds, or 2.7× faster.

Being able to tell these apart is most of the performance work in a tool-using system. The question is always: does this call need an earlier call's *answer*, or just its own arguments?

## What the tools cost you

The schemas are part of the prompt. Twelve tools at roughly 180 tokens of schema each is a 2,160-token block sitting in front of every request in the conversation — 10,800 tokens across a five-turn loop.

That is the direct cost, and it is the smaller one. The real cost is that choosing correctly gets harder as the list grows. Twelve tools with overlapping descriptions produce wrong choices in a way four crisp ones do not.

Description quality matters more than tool count. `Current on-hand quantity for one part in one warehouse` tells the model when *not* to use it. `Gets stock info` does not.

## The relationship to structured output

Function calling and plain JSON output are the same mechanism used for different purposes.

Both constrain the model to emit text matching a schema. The difference is what happens next: structured output is the answer, and you parse it. A function call is a *request*, and you act on it and come back.

Which is why the same reliability tricks apply to both — keep schemas small, use enums instead of free strings wherever the set is known, and mark required fields required. Every constraint you express in the schema is one the model cannot violate, rather than one you have to catch afterwards.

## What to take away

Function calling does not give the model abilities. It gives it a vocabulary for asking.

Everything that makes it safe follows from that: the request is text, the text is untrusted, and the code in the middle is where the decision actually gets made.
