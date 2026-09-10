---
title: "AI agent memory"
date: "2026-09-10T11:40"
category: "AI"
tags: ["agents", "memory", "context-window", "retrieval", "personalisation"]
summary: "A language model remembers nothing between calls. Everything that looks like memory is machinery around it deciding what to write down and what to put back in front of the model."
draft: false
cover: "/blog/ai-agent-memory.svg"
---

A language model has no memory. Each call is complete on its own: you send text, it returns text, and nothing carries over.

Anything that looks like memory is machinery built around it — something deciding what to write down, and what to place back in front of the model next time.

## What it buys you

Without it, an agent cannot resolve a reference to anything that happened earlier.

A customer writes: *"I'm on the Studio plan and our exports keep failing at 4K."* The agent helps, and the session ends.

Three weeks later the same customer writes: *"It's happening again."*

With no memory that sentence is unanswerable. There is no *it*. The agent has to ask what is happening again, which is exactly the question that makes a support tool feel broken.

With memory, two facts were kept — the plan tier and the recurring fault — and they are retrieved and placed in the prompt before the model ever sees the new message. The pronoun resolves.

## Four layers

Memory is not one store. It is four, with different lifespans, and most confusion comes from putting something in the wrong one.

<figure>
<svg viewBox="0 0 620 250" width="620" role="img" aria-label="Four stacked layers of increasing width. The context window lasts one model call, short-term memory lasts one session, long-term memory persists per user, and external knowledge is not the agent's own store." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="40" y="16">SMALLER AND HOTTER AT THE TOP</text>
<rect x="40" y="30" width="170" height="42" rx="6" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="b" x="56" y="56">context window</text>
<text class="l" x="232" y="56">one model call</text>
<rect x="40" y="80" width="240" height="42" rx="6" fill="color-mix(in srgb, var(--primary) 21%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="b" x="56" y="106">short-term</text>
<text class="l" x="302" y="106">one session</text>
<rect x="40" y="130" width="310" height="42" rx="6" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 42%, transparent)"/>
<text class="b" x="56" y="156">long-term</text>
<text class="l" x="372" y="156">kept, scoped to a user</text>
<rect x="40" y="180" width="380" height="42" rx="6" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<text class="b" x="56" y="206">external knowledge</text>
<text class="l" x="442" y="206">not the agent's own</text>
</svg>
<figcaption>Only the top layer is actually visible to the model. Everything below it has to be fetched and placed there.</figcaption>
</figure>

The **context window** is the only thing the model ever sees. Everything else exists to decide what goes into it.

**Short-term memory** is the current session: the plan, the steps taken so far, intermediate results. It is thrown away when the session ends, and that is correct — almost none of it matters tomorrow.

**Long-term memory** survives across sessions and is tied to a particular user. Stable facts, strong preferences, outcomes worth not repeating.

**External knowledge** — documents, databases, APIs — is not memory at all. The agent reads it but does not own it, and it is the same for every user. Worth naming as a separate layer precisely because it is so often confused with the third one.

## Four operations

**Write** when something happens that will matter later. **Read** the small subset that is relevant to the message in hand, not everything stored. **Update** when a new fact contradicts an old one. **Forget** what has gone stale.

Update and forget are the two that get skipped, and skipping them is what makes a memory system get worse over time rather than better. A store that only ever appends will eventually hold two contradictory facts and retrieve whichever one the search happens to rank higher.

## What one turn looks like

1. The message arrives.
2. Search long-term memory for anything relevant to it.
3. Read the session state from short-term memory.
4. Build the prompt: instructions, retrieved facts, session state, message.
5. Run the model, letting it call tools as needed.
6. Write the session state back. If anything is worth keeping, write that to long-term memory too.
7. Reply.

Steps 2 and 6 are the whole system. Everything else is the ordinary agent loop.

Notice that step 2 is a search. Once there are more stored facts than fit in a prompt, the question stops being "what do we know?" and becomes "what is worth including this time?" — and a memory system's quality is mostly the quality of that judgement.

## What to keep

Keep stable facts: who the user is, what they work in, settled preferences. Keep decisions that constrain future work. Keep outcomes, particularly failures, so the same approach is not tried twice.

Drop the rest. Not every message needs storing — the conversation is already in the context window while it is happening. Acknowledgements and small talk carry nothing. Session scaffolding belongs in short-term memory and should die with the session.

The test is one question: will this be useful in a conversation next week? If not, it is noise, and noise in a memory store is not neutral — it competes with the useful entries at retrieval time.

## How it fails quietly

Almost nothing here fails loudly. The agent does not crash; it just answers slightly wrong, and it is easy not to notice.

**The prompt overflows.** Retrieved memories, session state and history together exceed the window, and something gets silently truncated — often the part that mattered.

**Retrieval misses.** The fact is stored and simply is not found, because the search matched words rather than meaning. From the outside this is indistinguishable from never having stored it.

**A memory goes stale.** The user changed roles a year ago and the agent still addresses the old one. Nothing contradicts it because nothing checked.

**The store bloats.** Everything was kept, so retrieval returns plausible-looking irrelevant entries, and the useful ones rank below them.

**Memories cross users.** The worst one, and the reason every entry should be scoped to a user ID at write time rather than filtered at read time.

Since none of these announce themselves, the only defence is to look: log what was retrieved on each turn, and read that log occasionally against what the agent actually said.

## The short version

- Models are stateless; memory is entirely machinery built around them.
- Four layers: context window, short-term session state, long-term per-user facts, and external knowledge that is not really memory.
- Only the context window is visible to the model — everything else has to be fetched into it.
- The operations are write, read, update and forget; skipping the last two makes the system decay.
- Each turn retrieves relevant facts before the call and writes new ones after it.
- Store what will matter next week, not what matters for the next minute.
- The failures are silent, so retrieval has to be logged and checked.
