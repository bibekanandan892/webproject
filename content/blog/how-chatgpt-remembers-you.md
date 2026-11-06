---
title: "How ChatGPT remembers you"
date: "2026-11-06T12:20"
category: "AI"
tags: ["memory", "chatgpt", "personalisation", "retrieval", "context"]
summary: "The model itself remembers nothing between conversations. What feels like memory is text placed into the prompt: a list of saved facts, and snippets retrieved from past chats. A 1,000-token memory block rides along with every message — 30,000 tokens a day for a moderate user."
draft: false
cover: "/blog/how-chatgpt-remembers-you.svg"
---

Tell ChatGPT you are vegetarian, and a week later in a new conversation it suggests vegetarian recipes without being asked. It feels like the model learned something about you.

It did not. The model's weights do not change when you talk to it; they are the same for every user. A language model also has no state between requests — each one starts from nothing but the text it is given. Everything that feels like memory is the application putting the right text into the prompt before the model sees your message.

OpenAI describes two kinds of memory in ChatGPT, and they work differently.

## 1. Saved memories

These are short facts the assistant decided — or you asked it — to keep: *"Is vegetarian." "Works as a data engineer." "Prefers answers in British English." "Has a dog called Biscuit."*

When something in a conversation looks worth remembering, the assistant can call a memory tool that writes a new entry, much like any other tool call. You can see the list, edit it and delete from it in settings. And at the start of each conversation, the saved list is included in the model's context, typically as part of the system-level instructions, so every reply is written with those facts in view.

Because the list is injected into every conversation, it has to stay small. Fifty facts at around 20 tokens each is about **1,000 tokens** added to every request. A moderate user sending 30 messages a day sends that block 30 times — **30,000 tokens a day** of the same text. Prompt caching makes that cheaper, but the cost is why memories are stored as terse facts and why the list has a capacity limit.

## 2. Referencing chat history

The second kind uses your past conversations directly. Instead of a short curated list, the system can draw on what you discussed before — that you were planning a trip to Japan, that you were debugging a particular service — even if nobody explicitly saved it.

The exact implementation is not public, but the shape of any such system is retrieval: past conversations are summarised and indexed, and when you write a new message, the most relevant pieces are found and added to the context alongside the saved memories. It is RAG where the documents are your own chat history.

That brings RAG's usual trade-off. Retrieve 5 snippets of which 3 are relevant, and 60% of what was added helps; retrieve 10 with the same 3 relevant, and 30% does. Irrelevant past context is not harmless — it can steer a reply toward a topic you have moved on from.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="Diagram of a prompt being assembled: system instructions, a saved-memories block, retrieved snippets from past chats, the current conversation and the new message, all feeding an unchanged model." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">MEMORY IS PROMPT ASSEMBLY</text>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.55">
<rect x="20" y="36" width="280" height="26" rx="5"/>
<rect x="20" y="132" width="280" height="26" rx="5"/>
<rect x="20" y="164" width="280" height="26" rx="5"/>
</g>
<rect x="20" y="68" width="280" height="26" rx="5" fill="var(--primary)" fill-opacity="0.15" stroke="var(--primary)" stroke-width="1.5"/>
<rect x="20" y="100" width="280" height="26" rx="5" fill="var(--primary)" fill-opacity="0.08" stroke="var(--primary)" stroke-dasharray="4 3"/>
<text class="l" x="30" y="53">system instructions</text>
<text class="b" x="30" y="85">saved memories · ~1,000 tokens, every request</text>
<text class="b" x="30" y="117">retrieved from past chats · varies</text>
<text class="l" x="30" y="149">this conversation so far</text>
<text class="l" x="30" y="181">your new message</text>
<path d="M300 113 H370" stroke="var(--primary)" stroke-width="2"/>
<path d="M362 107 L372 113 L362 119" fill="none" stroke="var(--primary)" stroke-width="2"/>
<rect x="380" y="88" width="150" height="50" rx="8" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text class="b" x="455" y="110" text-anchor="middle">model</text>
<text class="l" x="455" y="126" text-anchor="middle">weights unchanged</text>
<path d="M20 214 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="236">the model forgets everything; the application re-tells it every time</text>
<text class="l" x="20" y="256">30 messages a day × 1,000 tokens of memory = 30,000 tokens of the same text</text>
</svg>
<figcaption>Two of the five blocks are "memory". Both are just text chosen before the model runs.</figcaption>
</figure>

## What follows from "memory is text in the prompt"

**It can be wrong or stale.** A saved fact is true when written. If you stop being vegetarian and never say so, the memory keeps steering suggestions. Good memory systems update or delete entries when new information contradicts them, but they can only do that when the contradiction is visible in a conversation.

**It can be seen and controlled.** Because memories are text, they can be shown to you, edited and deleted — something impossible if they lived inside model weights. Temporary or incognito chats simply skip the injection and the saving.

**It shapes every answer.** A remembered preference is always in context, so it influences replies even when it should not — the vegetarian fact surfacing in a question about the history of farming. Systems mitigate this by instructing the model to use memories only when relevant.

**It does not make the model better at anything.** Memory personalises; it does not teach. If the model gets something wrong for you, remembering your correction may help in your future chats but changes nothing for anyone else.

## How this compares with agent memory in general

ChatGPT's design is a specific, consumer-facing instance of the general agent-memory stack: a small **always-included profile** (saved memories), plus **retrieved long-term memory** (past chats), plus the **working memory** of the current conversation. Agents built for other tasks use the same layers with different contents — a project's conventions instead of a diet, a ticket history instead of a holiday plan.

## What to take away

ChatGPT does not learn from you; its weights are unchanged. It remembers by placing text in the prompt: a compact list of saved facts that rides along with every message — about 1,000 tokens each time — and snippets retrieved from your past conversations when they look relevant.

That makes memory visible, editable and deletable, and also means it can be stale, can intrude where it is not wanted, and costs tokens on every request. It is retrieval and prompt assembly, done well — not a model that knows you.
