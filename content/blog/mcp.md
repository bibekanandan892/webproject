---
title: "MCP"
date: "2026-09-11T23:40"
category: "AI"
tags: ["mcp", "protocol", "agents", "integrations", "security"]
summary: "A protocol turns an N×M integration problem into N+M, which is 8.6× less work at a dozen apps and thirty systems. The part that needs more attention is that a server's own text reaches the model's context."
draft: false
cover: "/blog/mcp.svg"
---

The Model Context Protocol is a standard for how an AI application talks to external systems — files, databases, issue trackers, whatever the work requires.

Two things about it are worth understanding properly: the arithmetic that makes a protocol worth having, and the trust boundary it creates.

## The arithmetic

Without a shared protocol, every application that wants to reach a system writes its own integration. Five applications and ten systems means fifty separate pieces of work, and any two applications reaching the same system have written the same thing twice.

With a protocol, each application implements the protocol once and each system exposes itself once. Fifteen pieces of work.

| applications × systems | pairwise | with a protocol | reduction |
| --- | --- | --- | --- |
| 5 × 10 | 50 | 15 | 3.3× |
| 8 × 20 | 160 | 28 | 5.7× |
| 12 × 30 | 360 | 42 | 8.6× |
| 20 × 60 | 1,200 | 80 | 15.0× |

The reduction grows because the pairwise cost is a **product** and the protocol cost is a **sum**. There is no ecosystem size at which the gap stops widening.

The marginal case is more persuasive than the total. Adding one new system to a world of twelve applications costs twelve integrations pairwise, or one with a protocol. That is the number that decides whether a small team's tool ever gets used.

<figure>
<svg viewBox="0 0 560 284" width="560" role="img" aria-label="Two connection diagrams: every application wired to every system, against each wired once to a shared protocol." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">A PRODUCT, OR A SUM</text>
<text class="l" x="20" y="42">every pair wired by hand</text>
<g stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)" stroke-width="1">
<path d="M40 62 L40 140 M40 62 L100 140 M40 62 L160 140 M40 62 L220 140"/>
<path d="M100 62 L40 140 M100 62 L100 140 M100 62 L160 140 M100 62 L220 140"/>
<path d="M160 62 L40 140 M160 62 L100 140 M160 62 L160 140 M160 62 L220 140"/>
</g>
<g fill="color-mix(in srgb, var(--muted-foreground) 45%, transparent)">
<circle cx="40" cy="58" r="6"/><circle cx="100" cy="58" r="6"/><circle cx="160" cy="58" r="6"/>
<circle cx="40" cy="144" r="6"/><circle cx="100" cy="144" r="6"/><circle cx="160" cy="144" r="6"/><circle cx="220" cy="144" r="6"/>
</g>
<text class="l" x="20" y="170">12 lines for 3 apps and 4 systems</text>
<text class="b" x="320" y="42">each wired once</text>
<g stroke="var(--primary)" stroke-opacity="0.6" stroke-width="1.2">
<path d="M340 62 L430 96 M400 62 L430 96 M460 62 L430 96"/>
<path d="M430 112 L340 144 M430 112 L400 144 M430 112 L460 144 M430 112 L520 144"/>
</g>
<rect x="392" y="94" width="76" height="20" rx="4" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="430" y="108" text-anchor="middle">protocol</text>
<g fill="var(--primary)" fill-opacity="0.8">
<circle cx="340" cy="58" r="6"/><circle cx="400" cy="58" r="6"/><circle cx="460" cy="58" r="6"/>
<circle cx="340" cy="144" r="6"/><circle cx="400" cy="144" r="6"/><circle cx="460" cy="144" r="6"/><circle cx="520" cy="144" r="6"/>
</g>
<text class="b" x="320" y="170">7 lines for the same seven things</text>
<path d="M20 192 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="216">at 12 apps and 30 systems: 360 becomes 42</text>
<text class="l" x="20" y="238">one more system costs 12 integrations, or one</text>
<text class="l" x="20" y="262">the gap widens for ever, because one side is a product</text>
</svg>
<figcaption>The marginal cost is what decides whether anyone bothers exposing a system at all.</figcaption>
</figure>

## The part that is not just an API

An ordinary HTTP API requires a person to read documentation and write a binding. The knowledge of what the API can do lives in a human's head and then in code.

An MCP server is **self-describing**. On connecting it announces what it offers: each tool's name, a plain-language description of when to use it, and a schema for its arguments. Data sources and prompt templates are announced the same way.

That changes who reads the documentation. The descriptions go into the model's context, and the model decides which tool fits the request — so adding a capability to a server makes it available to every connected application without anyone writing integration code for it.

This is the actual content of the standard. Without the self-description it would be a message format; with it, the set of available actions is discovered at run time rather than compiled in.

## Three parts and one rule

- The **host** is the application the person is using.
- A **client** lives inside the host, one per connected server, handling that connection.
- A **server** exposes some system's capabilities.

Transport is either a local process communicating over standard input and output — nothing leaves the machine — or HTTP for a remote server shared by many users. Messages are JSON-RPC in both cases.

And the rule that matters: **the model requests, the host decides.** A model emitting a tool call has produced text, not an action. The host validates it, checks whether it is permitted, and runs it or refuses. That separation is the whole safety architecture, and it is the same separation whether the tool reads a file or transfers money.

## The trust boundary

This deserves more weight than it usually gets.

Everything an MCP server sends — tool descriptions at connect time, and content returned from calls — lands in the model's context as text. The model cannot tell that text apart from the user's own instructions by any structural means.

Two consequences follow.

**Returned content is untrusted input.** A document fetched through a server, an issue description, a web page — any of these can contain text addressed to the model, instructing it to do something the user never asked for. It will read exactly like a legitimate instruction. The defence is not to hope the model notices, but to keep destructive and outward-facing actions behind an approval the user gives, so a redirected agent cannot complete the loop on its own.

**A server is code you are trusting.** A local server runs on the machine with the user's permissions. Installing one is closer to installing a program than to adding a URL, and the same caution applies — which is easy to forget when it is one line in a configuration file.

Neither of these is an argument against the protocol. They are the cost of the capability, and they are worth naming precisely because the convenience makes them easy to skip past.

## What to take away

The protocol is worth having for a plain arithmetic reason: it converts a product into a sum, and the advantage compounds as the ecosystem grows.

Its real innovation is self-description, which moves the integration knowledge from a developer's code into the model's context. And its real risk follows from the same property — text from a server reaches the model on equal footing with the user, so the decision to act has to stay with the host.
