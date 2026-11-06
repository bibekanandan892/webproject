---
title: "Query rewriting and multi-query retrieval"
date: "2026-08-29T14:10"
category: "AI"
tags: ["rag", "retrieval", "query-rewriting", "rrf", "search"]
summary: "Users write bad search queries, and a retriever can only find what the query resembles. Rewriting the question three ways lifts recall from 60% to 93.6% if the rewrites fail independently — 76.8% if they fail together half the time — and reciprocal rank fusion decides which results win."
draft: false
cover: "/blog/query-rewriting-and-multi-query-retrieval.svg"
---

A RAG system is only as good as its first step: turning the user's question into a search. And user questions are bad searches. They are short, conversational, full of pronouns, and phrased in the user's vocabulary rather than the documents'.

*"and what about for contractors?"* is a perfectly clear follow-up in a conversation about holiday policy. As a search query, it is almost useless.

Query rewriting puts a language model in front of the retriever to fix the query before it is used. Multi-query retrieval goes a step further: it writes several versions and searches with all of them.

## Rewriting a single query

The simplest form takes the conversation and the latest message and produces a standalone search query:

| user wrote | rewritten |
| --- | --- |
| *and what about for contractors?* | *annual leave entitlement for contractors* |
| *why is it so slow lol* | *causes of slow page load times in the checkout service* |
| *the thing from the Q3 call about pricing* | *pricing changes announced in the Q3 earnings call* |

Three fixes happen at once: references are resolved from the conversation, filler is removed, and the wording moves toward how documents describe the topic. This is cheap — one short model call — and nearly always worth it in a conversational system.

## Multi-query: search several ways

A single rewrite still bets on one phrasing. Documents describe the same thing many ways: "annual leave", "paid time off", "holiday entitlement", "vacation days". A query that matches one phrasing may miss the others entirely.

Multi-query retrieval asks the model for several different rewrites — different vocabulary, different angles, sometimes a broader and a narrower version — runs a search for each, and merges the results.

If one query finds the relevant document with probability 0.6, and three rewrites each have that chance *independently*, the chance at least one finds it is:

`1 − 0.4³ = 93.6%`

| single-query recall | three independent rewrites |
| --- | --- |
| 50% | 87.5% |
| 60% | **93.6%** |
| 70% | 97.3% |

But rewrites of the same question are not independent. If a document is missed because it uses vocabulary none of the rewrites thought of, all three miss it together. Suppose that half the time the three queries succeed or fail as one:

`0.5 × 0.6 + 0.5 × 0.936 =` **76.8%**

Still a large gain over 60%, and much less than the independent estimate. The lesson is that rewrites should be *diverse*: different words and different angles, not three paraphrases of one sentence. Prompting explicitly for synonyms, for the more technical phrasing, and for a broader version of the question is what reduces that correlation.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A question fanning out into three rewritten queries, each returning a ranked list, merged by reciprocal rank fusion into one list." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">FAN OUT, THEN FUSE</text>
<rect x="20" y="96" width="110" height="34" rx="6" fill="none" stroke="var(--primary)" stroke-width="1.5"/>
<text class="b" x="75" y="117" text-anchor="middle">question</text>
<g stroke="var(--muted-foreground)" stroke-opacity="0.5"><path d="M130 113 L170 56"/><path d="M130 113 L170 113"/><path d="M130 113 L170 170"/></g>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"><rect x="170" y="40" width="140" height="30" rx="5"/><rect x="170" y="98" width="140" height="30" rx="5"/><rect x="170" y="155" width="140" height="30" rx="5"/></g>
<text class="l" x="180" y="59">"annual leave …"</text><text class="l" x="180" y="117">"paid time off …"</text><text class="l" x="180" y="174">"holiday policy …"</text>
<g stroke="var(--muted-foreground)" stroke-opacity="0.5"><path d="M310 55 L380 108"/><path d="M310 113 L380 113"/><path d="M310 170 L380 118"/></g>
<rect x="380" y="82" width="160" height="62" rx="6" fill="var(--primary)" fill-opacity="0.1" stroke="var(--primary)" stroke-width="1.5"/>
<text class="b" x="392" y="102">fused ranking</text>
<text class="l" x="392" y="120">score = Σ 1 / (60 + rank)</text>
<text class="l" x="392" y="136">agreement beats one #1</text>
<path d="M20 206 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="228">recall 60% → 93.6% if rewrites miss independently, 76.8% if half the misses are shared</text>
<text class="l" x="20" y="248">diverse rewrites, not paraphrases, are what move the real number toward the first</text>
</svg>
<figcaption>Several searches find more; fusion decides what to keep from them.</figcaption>
</figure>

## Merging the results: reciprocal rank fusion

Each search returns a ranked list, and the scores from different queries are not comparable. Reciprocal rank fusion ignores the scores and uses only the ranks:

`score(document) = Σ over lists of 1 / (60 + rank)`

The constant 60 damps the difference between rank 1 and rank 2 so that no single list dominates. Compare three documents:

| document | ranks in the three lists | fused score |
| --- | --- | --- |
| A | 1, missing, 3 | 0.0323 |
| B | 2, 2, 2 | **0.0484** |
| C | 1, missing, missing | 0.0164 |

B was never first, but every query found it near the top; it wins. A was first once and found twice; it comes second. C topped one list and nothing else; it comes last. That is usually the right judgement: a document that every phrasing finds is more likely relevant than one that a single phrasing happens to rank first.

## Related techniques

**Step-back queries.** Ask a more general question first — "what are the rules for leave entitlement?" — to retrieve background, then the specific one.

**Decomposition.** Split a compound question — "compare the leave policies of the UK and US offices" — into sub-questions, retrieve for each, and combine.

**HyDE.** Instead of rewriting the question, have the model write a hypothetical answer and search with that, since answers look more like documents than questions do.

These combine freely with multi-query; they are all ways of producing better queries than the one the user typed.

## What it costs

One extra model call to produce the rewrites — a few hundred milliseconds — and *n* searches instead of one, which run in parallel and are cheap. More retrieved chunks means more for a reranker or the generation model to read; deduplicate before passing them on.

For simple, keyword-like queries the gain is small. For conversational follow-ups, vague questions and corpora with inconsistent vocabulary, it is usually one of the highest-value changes to a RAG pipeline.

## What to take away

Rewrite every conversational query into a standalone search; it is cheap and fixes pronouns, filler and vocabulary. For harder cases, generate several diverse rewrites and search with all of them: recall rises from 60% toward 93.6%, reaching it only as far as the rewrites fail independently.

Merge with reciprocal rank fusion, which rewards documents that many queries agree on over documents one query happened to rank first.
