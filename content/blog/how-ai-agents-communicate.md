---
title: "How AI agents communicate"
date: "2026-09-10T21:20"
category: "AI"
tags: ["agents", "messaging", "protocols", "topology", "multi-agent"]
summary: "Once several agents work on one task, they have to pass things to each other. The shape of who-talks-to-whom is the decision that matters, and the arithmetic makes it for you."
draft: false
cover: "/blog/how-ai-agents-communicate.svg"
---

Several agents on one task means results have to move between them. The research finds something the writer needs; the writer finds a gap the research has to fill.

What that requires is unremarkable — a sender, a receiver, an agreed format, something to carry it. The decision that actually matters is the topology: who is allowed to talk to whom.

## Why the topology is not a style choice

Let every agent talk to every other and you need $n(n-1)/2$ connections. Route everything through one hub and you need $n$.

| agents | everyone to everyone | through a hub |
| --- | --- | --- |
| 3 | 3 | 3 |
| 5 | 10 | 5 |
| 10 | 45 | 10 |
| 20 | **190** | **20** |

<figure>
<svg viewBox="0 0 560 230" width="560" role="img" aria-label="Two rings of six agents. On the left every agent is connected to every other, making fifteen crossing lines. On the right all six connect only to a central hub, making six lines." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">SIX AGENTS, TWO WIRINGS</text>
<path d="M120.0 58.0 L165.0 84.0 M120.0 58.0 L165.0 136.0 M120.0 58.0 L120.0 162.0 M120.0 58.0 L75.0 136.0 M120.0 58.0 L75.0 84.0 M165.0 84.0 L165.0 136.0 M165.0 84.0 L120.0 162.0 M165.0 84.0 L75.0 136.0 M165.0 84.0 L75.0 84.0 M165.0 136.0 L120.0 162.0 M165.0 136.0 L75.0 136.0 M165.0 136.0 L75.0 84.0 M120.0 162.0 L75.0 136.0 M120.0 162.0 L75.0 84.0 M75.0 136.0 L75.0 84.0" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)" stroke-width="1.1"/>
<circle cx="120" cy="58" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="165" cy="84" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="165" cy="136" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="120" cy="162" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="75" cy="136" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="75" cy="84" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="120" y="196" text-anchor="middle">15 links</text>
<text class="l" x="120" y="214" text-anchor="middle">direct</text>
<path d="M380 110 L380.0 58.0 M380 110 L425.0 84.0 M380 110 L425.0 136.0 M380 110 L380.0 162.0 M380 110 L335.0 136.0 M380 110 L335.0 84.0" stroke="color-mix(in srgb, var(--primary) 55%, transparent)" stroke-width="1.6"/>
<circle cx="380" cy="110" r="12" fill="color-mix(in srgb, var(--primary) 80%, transparent)"/>
<circle cx="380" cy="58" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="425" cy="84" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="425" cy="136" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="380" cy="162" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="335" cy="136" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<circle cx="335" cy="84" r="9" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="380" y="196" text-anchor="middle">6 links</text>
<text class="l" x="380" y="214" text-anchor="middle">through a hub</text>
</svg>
<figcaption>Adding a seventh agent costs six new connections on the left and one on the right.</figcaption>
</figure>

The maintenance cost is worse than the count suggests. Adding an agent to a direct topology means wiring it to every existing one; adding it to a hub means one connection. Six versus one, at six agents — and twenty versus one at twenty.

## The four shapes

**Direct.** Agent to agent, no intermediary. Lowest latency, nothing in the middle to fail, and it does not scale past a handful.

**Through a hub.** One agent receives everything and routes it. The others never talk to each other. Easy to log, easy to extend, and the hub is both a bottleneck and a single point of failure — every message pays for two hops instead of one.

**Broadcast.** One agent publishes; whoever cares subscribes. The sender does not know who is listening, which makes adding a consumer free. It also makes it hard to answer "who handled this?", and easy to generate more traffic than anyone intended.

**Shared memory.** Nobody sends anything. Agents read and write a common workspace. Each only needs to know the workspace, not the other agents — which is the same decoupling a hub gives without the hub. In exchange you inherit every concurrency problem: two agents writing the same key, one reading a half-finished result, no ordering guarantee.

Real systems mix them. A hub for control flow, shared state for the artefact being built, broadcast for events several agents care about.

## What a message should contain

Structure it. Free text between agents is where misreadings come from, and the failures are quiet because the output still looks plausible.

```json title="message.json"
{
  "sender": "research",
  "receiver": "writer",
  "type": "result",
  "task_id": "b-2291",
  "content": { "findings": ["..."], "sources": ["..."] }
}
```

The `task_id` is the field people leave out and then wish they had. With several agents, several messages in flight and possibly several tasks running at once, it is the only thing that lets you reconstruct what happened afterwards.

Keep the payload small. Everything sent becomes context the receiver has to read, and passing a whole transcript when a summary would do is how agent systems get expensive.

## What goes wrong

**Format drift.** One agent changes what it emits, and the receiver — which parsed the old shape — starts failing on some inputs. Validate on receipt rather than trusting the sender.

**Messages that never end.** Two agents pass work back and forth indefinitely, each doing something locally sensible. Cap the total messages per task, the same way a loop needs a step limit.

**Latency stacking.** Every hop is a round trip. A chain of five agents is five sequential waits before anything reaches the user, and a hub doubles the hop count.

**Errors travelling well.** A wrong figure from one agent is received as fact by the next, which builds on it confidently. Nothing downstream can detect it, because downstream only sees the message.

**No trace.** With four agents and branching, "the answer was wrong" does not localise. Log every message with its sender, receiver, task id and time — that log is the only view of the system as a whole.

## The short version

- Several agents on one task means passing results between them.
- Direct wiring needs $n(n-1)/2$ connections; a hub needs $n$ — 190 against 20 at twenty agents.
- Adding one agent costs $n$ new links in a direct topology and one through a hub.
- Four shapes: direct, hub, broadcast, shared memory. Real systems mix them.
- Messages should be structured, small, and carry a task id.
- Validate on receipt; senders change.
- Cap messages per task, or two agents will talk forever.
- Log every message, because nothing else shows the system as a whole.
