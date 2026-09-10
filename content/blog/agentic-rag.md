---
title: "Agentic RAG"
date: "2026-09-10T13:00"
category: "AI"
tags: ["rag", "retrieval", "agents", "multi-hop", "vector-search"]
summary: "Ordinary retrieval searches once and hopes the result was good. Agentic RAG puts an agent in charge of searching, so it can judge what came back, rewrite the query, and go again."
draft: false
cover: "/blog/agentic-rag.svg"
---

Ordinary retrieval-augmented generation is a straight line. Take the question, search for passages that look like it, hand those to the model, get an answer.

It works when one search is enough. Agentic RAG is what you do when it is not: put an agent in charge of the searching, so the number of searches, the queries, and the sources are all decided as it goes.

## Where one search runs out

**The answer is spread across two documents.** Ask which supplier made the part that failed in a recall, and no single passage contains both the recall and the supplier. Searching for the question retrieves things that look like the question, which is not the same as things that answer it.

**The question is vague.** "What changed in the new policy?" matches almost everything and nothing. A fixed pipeline cannot narrow it; it just retrieves badly and proceeds.

**The answer is not in the documents.** Some questions want a number from a database, or something only on the web. One vector store is one kind of source.

**The retrieval was poor and nothing noticed.** This is the worst of the four. A fixed pipeline hands over whatever ranked highest, including when nothing relevant was found, and the model writes a confident answer on top of it.

## What changes

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="Two flows compared. Standard RAG runs question to retrieve to answer in one pass. Agentic RAG puts an agent between the question and the answer, with the agent calling tools and reading results repeatedly before answering." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="30" y="24">STANDARD</text>
<rect x="30" y="40" width="86" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="b" x="73" y="60" text-anchor="middle">question</text>
<rect x="150" y="40" width="96" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="b" x="198" y="60" text-anchor="middle">retrieve</text>
<rect x="280" y="40" width="86" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="b" x="323" y="60" text-anchor="middle">answer</text>
<path d="M116 56 H144" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ar)"/>
<path d="M246 56 H274" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ar)"/>
<text class="l" x="400" y="60">one pass</text>
<text class="hd" x="30" y="116">AGENTIC</text>
<rect x="30" y="132" width="86" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="b" x="73" y="152" text-anchor="middle">question</text>
<rect x="150" y="132" width="96" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 56%, transparent)"/>
<text class="b" x="198" y="152" text-anchor="middle">agent</text>
<rect x="150" y="196" width="96" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="b" x="198" y="216" text-anchor="middle">tools</text>
<rect x="400" y="132" width="86" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="b" x="443" y="152" text-anchor="middle">answer</text>
<path d="M116 148 H144" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ar)"/>
<path d="M246 148 H394" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ar)"/>
<path d="M186 164 V190" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ar)"/>
<path d="M210 190 V166" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ar)"/>
<text class="l" x="262" y="204">search, read,</text>
<text class="l" x="262" y="220">judge, repeat</text>
<text class="l" x="400" y="116">when it is satisfied</text>
</svg>
<figcaption>The pipeline does not change shape. What changes is who decides how many times it runs.</figcaption>
</figure>

The agent decides whether to retrieve at all, which source to use, what query to send, whether what came back is any good, and whether to go again. Standard RAG has none of those decisions in it.

## One running

*Which supplier made the component that failed in the March recall?*

| step | what it does | what comes back |
| --- | --- | --- |
| 1 | recognises two unknowns; starts with the recall — `sql_query` on the recall records | batch B-2291, failed part: pressure valve, revision C |
| 2 | `vector_search("pressure valve supplier")` | chunks about the valve — but revision B |
| 3 | judges these wrong and re-queries: `vector_search("pressure valve revision C supplier")` | the revision C entry, supplier named |
| 4 | enough to answer | Halvern Industrial |

Step 3 is the whole point.

The retrieval at step 2 was not a failure in any way a pipeline could detect. It returned relevant-looking passages about the right component, ranked confidently. A fixed pipeline hands those straight to the model, which writes a fluent answer naming the wrong supplier — and nothing anywhere reports a problem.

What caught it was the agent reading the chunks against a fact it had picked up at step 1: the revision is C, these say B. Then it rewrote the query with the revision pinned.

That is the difference between retrieving and researching.

## Three ways it usually shows up

**Think, act, observe.** The general loop: reason about what is needed, search, read the result, decide whether to go again. This is what the trace above does.

**Grading its own retrieval.** Before answering, score the chunks on two questions — are they relevant, and do they actually support the answer being written? Low scores mean searching again or dropping the chunk rather than using it.

**Falling back.** When one source comes up empty, try a different kind. Vector search finds nothing, so go to the web; the web is unhelpful, so query the database. Robustness through having more than one place to look.

These overlap in practice. A real system usually does all three.

## What it costs

| | standard | agentic |
| --- | --- | --- |
| retrievals | one | as many as it decides |
| sources | usually one | several |
| query rewriting | no | yes |
| checks what it retrieved | no | yes |
| multi-hop questions | fails | handles |
| latency | one round | several |
| cost | one model call | one per step |
| same question, same path | yes | not guaranteed |

The last row causes the most trouble in practice. Two runs of the same question can take different routes and produce differently-worded answers, which makes both testing and debugging harder than for a pipeline that always does the same thing.

And the loop needs a way out. Stop when the agent says it has enough, when a confidence threshold is met, or when the step count runs out — but something has to stop it, or a question with no answer in the corpus becomes an expensive infinite search.

## When to use which

Use the agent when questions genuinely need more than one lookup, when the answers live in several different kinds of store, when queries arrive vague, or when being right matters more than being fast.

Use the straight pipeline when questions are direct, the data is in one place, and latency and cost matter. Most questions really are one search, and paying an agent to work that out each time is a bad trade.

## The short version

- Standard RAG retrieves once and generates; agentic RAG lets an agent decide the retrieval.
- One search fails on multi-hop questions, vague queries, several sources, and bad results nothing checks.
- The agent chooses the source, writes the query, judges what came back, and decides whether to search again.
- Judging the result is the part that matters — plausible wrong chunks are invisible to a fixed pipeline.
- Common shapes: the think-act-observe loop, grading retrievals, and falling back to another source.
- It costs latency, tokens, and determinism.
- Something must stop the loop.
