---
title: "Embedding Cache"
date: "2026-09-11T15:00"
category: "AI"
tags: ["embeddings", "caching", "rag", "retrieval", "cost"]
summary: "The same text embeds to the same vector every time, so recomputing it is pure waste. What makes the cache worth building is that query traffic is wildly lopsided — a few megabytes of memory removes most of the calls."
draft: false
cover: "/blog/embedding-cache.svg"
---

An embedding model turns text into a fixed vector. It is deterministic: the same text through the same model produces the same numbers, today and next month.

So computing it twice is work you have already done. An embedding cache is the obvious response — store the vector under a key derived from the text, and look it up next time.

The obvious part is not the interesting part. The interesting part is how few entries you need.

## Traffic is not spread out

Suppose a search feature sees 200,000 queries a day across 100,000 distinct phrasings. If those were evenly spread, caching would be nearly pointless — each entry would be used twice.

They are never evenly spread. Real query traffic is heavily skewed: a small number of phrasings account for a large share of requests, and there is a long tail of things asked once and never again.

Under the usual skew:

| entries cached | share of traffic they cover |
| --- | --- |
| 100 | 42.9% |
| 1,000 | 61.9% |
| 5,000 | 75.2% |
| 10,000 | 81.0% |

One percent of the distinct queries covers 62% of the traffic.

Now price that. A 1,536-dimensional vector at 32-bit precision is 6,144 bytes, so a thousand entries is **6.1 MB** — a rounding error in any process's memory. Those 6 MB take the daily embedding calls from 200,000 to about 76,000.

Ten thousand entries costs 61 MB and covers 81%.

The returns flatten fast, which is the useful thing to know: past a certain point you are spending memory on queries that will be asked once. There is no reason to cache the tail.

<figure>
<svg viewBox="0 0 560 268" width="560" role="img" aria-label="A skewed traffic curve where a small number of frequent queries covers most requests, with a long flat tail." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">A FEW PHRASINGS CARRY MOST OF THE TRAFFIC</text>
<path d="M60 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<g fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" stroke-opacity="0.5">
<rect x="62" y="52" width="16" height="138"/><rect x="80" y="98" width="16" height="92"/><rect x="98" y="121" width="16" height="69"/><rect x="116" y="135" width="16" height="55"/><rect x="134" y="144" width="16" height="46"/><rect x="152" y="151" width="16" height="39"/><rect x="170" y="155" width="16" height="35"/><rect x="188" y="159" width="16" height="31"/>
</g>
<g fill="color-mix(in srgb, var(--muted-foreground) 26%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)">
<rect x="206" y="162" width="16" height="28"/><rect x="224" y="165" width="16" height="25"/><rect x="242" y="167" width="16" height="23"/><rect x="260" y="169" width="16" height="21"/><rect x="278" y="171" width="16" height="19"/><rect x="296" y="172" width="16" height="18"/><rect x="314" y="173" width="16" height="17"/><rect x="332" y="174" width="16" height="16"/><rect x="350" y="175" width="16" height="15"/><rect x="368" y="176" width="16" height="14"/><rect x="386" y="177" width="16" height="13"/><rect x="404" y="178" width="16" height="12"/><rect x="422" y="178" width="16" height="12"/><rect x="440" y="179" width="16" height="11"/><rect x="458" y="179" width="16" height="11"/><rect x="476" y="180" width="16" height="10"/><rect x="494" y="180" width="16" height="10"/>
</g>
<path d="M200 46 V190" stroke="var(--primary)" stroke-opacity="0.5" stroke-dasharray="5 4"/>
<text class="b" x="208" y="60">cache stops here</text>
<text class="l" x="60" y="208">most asked</text>
<text class="l" x="520" y="208" text-anchor="end">asked once</text>
<text class="b" x="20" y="232">1,000 entries — 6.1 MB — covers 61.9% of requests</text>
<text class="l" x="20" y="250">everything to the right of the line is memory spent on one-offs</text>
</svg>
<figcaption>The shape of the traffic is what makes a small cache worth having.</figcaption>
</figure>

## The key has to name the model

The cache key is a hash of the text. It must also include the model's identity and version, and this is not a detail.

Two embedding models produce vectors in *different spaces*. The same sentence embedded by version 2 and version 3 gives two unrelated points; their similarity to each other means nothing. Distances are only meaningful between vectors made by the same model.

If the key is the text alone, then upgrading the model leaves you with a cache full of vectors from the old space, silently mixed with new ones. Nothing errors. Searches simply return worse results, and the cause is invisible because every individual vector looks fine.

Putting the model name and version in the key makes an upgrade behave correctly on its own: the new model's keys miss, get computed and stored, and the old entries age out. No migration step, no flag day.

Normalisation belongs in the key too. If the pipeline lowercases and collapses whitespace before embedding, hash the *normalised* text — otherwise three spellings of the same query occupy three entries and produce three identical vectors.

## Getting rid of things

Two policies, doing different jobs.

**Least-recently-used** answers "the cache is full, what goes?" It suits this workload exactly, because the traffic skew means recently-used entries are overwhelmingly likely to be used again.

**Time-to-live** answers "how long may an entry live?" For a pure embedding cache the honest answer is *forever* — the function is deterministic, so an entry is never stale in the way a database row is. TTL is there for the things around it: bounding memory, letting a changed normalisation step wash through, and expiring keys after a model deprecation.

Do not set an aggressive TTL out of habit. Expiring a correct entry costs a model call and buys nothing.

## Where it pays besides queries

The larger win is often on the ingestion side.

Re-processing a corpus of 50,000 chunks where 2% have changed means 1,000 chunks genuinely need embedding. Without a cache keyed on content, all 50,000 get recomputed, every time, because the pipeline has no way to know which ones changed.

With a content hash as the key, the unchanged 98% are hits. Re-ingestion goes from a scheduled expense to something you can run whenever a document is touched.

## What to take away

An embedding cache is easy to build and easy to get subtly wrong.

Key it on the text *and* the model version, normalise before hashing, evict by recency, and size it for the head of the distribution rather than the whole corpus. A few megabytes gets you most of what is available; the rest of the tail is not worth paying for.
