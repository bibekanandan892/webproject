---
title: "Semantic Caching"
date: "2026-09-11T19:40"
category: "AI"
tags: ["semantic-caching", "embeddings", "similarity", "llm", "cost"]
summary: "An exact cache is never wrong. A semantic cache answers a question nobody asked, which makes the similarity threshold a decision about how often you are willing to be confidently incorrect."
draft: false
cover: "/blog/semantic-caching.svg"
---

An ordinary cache matches keys exactly. Ask the same thing twice, get the stored answer the second time; ask it with one word changed, and it is a miss.

For a language-model application that is nearly useless. People do not repeat themselves verbatim. *When does my subscription renew*, *when will I be charged next*, and *renewal date?* all want one answer and share almost no characters.

A semantic cache matches by meaning instead: embed the incoming question, compare it against the embeddings of questions already answered, and if something is close enough, return the stored answer.

Which raises the question that this whole technique is really about — what counts as close enough.

## An error that exact caching cannot make

An exact cache has exactly one failure mode: it misses when it could have hit. That costs a model call. Nothing more.

A semantic cache has a second failure mode. It can decide that two different questions are the same question and hand back the wrong answer — confidently, instantly, with no indication that anything happened.

Those two errors do not cost the same, and the threshold is where you choose between them.

## What the threshold actually buys

Paraphrases of a cached question score high. Different questions about the *same topic* also score high — not as high, but the distributions overlap, and any single cutoff sits inside that overlap.

Sweeping a threshold over simulated traffic:

| threshold | paraphrases caught | different questions wrongly matched |
| --- | --- | --- |
| 0.85 | 99.6% | 59.9% |
| 0.88 | 95.2% | 31.0% |
| 0.90 | 84.1% | 16.0% |
| 0.93 | 50.0% | 4.0% |
| 0.95 | 25.3% | 1.2% |

Read the 0.85 row carefully. It catches almost every paraphrase — and wrongly matches **60%** of the topically-similar-but-different questions it sees. The frequently-recommended 0.85 floor is, on this distribution, close to "return something plausible".

Now attach traffic to it. Suppose 30% of queries are paraphrases of something cached and 10% are close-but-different:

| threshold | model calls avoided | wrong answers served | saves per wrong answer |
| --- | --- | --- | --- |
| 0.85 | 29.9% | 5.99% | 5 |
| 0.90 | 25.2% | 1.60% | 16 |
| 0.93 | 15.0% | 0.40% | 37 |
| 0.95 | 7.6% | 0.12% | 63 |

Moving from 0.85 to 0.90 gives up 4.7 points of savings and cuts wrong answers by 3.7×. That is almost always the right trade, because the two outcomes are not comparable: a miss costs a fraction of a cent, and a wrong answer about someone's billing costs their trust.

**Pick the threshold from the cost of being wrong, not from the hit rate.** The hit rate is the number that looks good in a report and the one that should not drive the decision.

<figure>
<svg viewBox="0 0 560 308" width="560" role="img" aria-label="Two overlapping similarity distributions, one for paraphrases and one for different questions, with a threshold line cutting through the overlap." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE TWO DISTRIBUTIONS OVERLAP</text>
<path d="M60 40 V186 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<path d="M60 167 L72 162 L83 156 L95 149 L106 141 L118 132 L129 122 L141 112 L152 101 L164 91 L175 80 L187 71 L198 62 L210 56 L221 50 L233 47 L244 46 L256 47 L267 50 L279 56 L290 62 L302 71 L313 80 L325 91 L336 101 L348 112 L359 122 L371 132 L382 141 L394 149 L405 156 L417 162 L428 167 L440 171 L451 175 L463 178 L474 180 L486 182 L497 183 L509 184 L520 184" fill="none" stroke="color-mix(in srgb, var(--muted-foreground) 60%, transparent)" stroke-width="2"/>
<path d="M60 186 L72 186 L83 186 L95 186 L106 186 L118 186 L129 186 L141 186 L152 186 L164 186 L175 185 L187 185 L198 184 L210 183 L221 182 L233 180 L244 177 L256 173 L267 167 L279 160 L290 151 L302 141 L313 128 L325 115 L336 101 L348 87 L359 74 L371 62 L382 54 L394 48 L405 46 L417 48 L428 54 L440 62 L451 74 L463 87 L474 101 L486 115 L497 128 L509 141 L520 151" fill="none" stroke="var(--primary)" stroke-opacity="0.85" stroke-width="2.2"/>
<text class="l" x="150" y="70">different questions</text>
<text class="b" x="392" y="36">paraphrases</text>
<path d="M336 40 V186" stroke="var(--primary)" stroke-opacity="0.6" stroke-width="1.8" stroke-dasharray="5 4"/>
<text class="b" x="292" y="34">0.90</text>
<text class="l" x="60" y="204">0.78</text>
<text class="l" x="290" y="204" text-anchor="middle">0.88</text>
<text class="l" x="520" y="204" text-anchor="end">0.98 similarity</text>
<path d="M20 224 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="248">right of the line: 84.1% of paraphrases — and 16.0% of different questions</text>
<text class="l" x="20" y="268">no cutoff separates them, because they genuinely are similar</text>
<text class="l" x="20" y="286">a miss costs a model call; a false hit costs a wrong answer</text>
</svg>
<figcaption>Any threshold sits inside the overlap. The only choice is which error you prefer.</figcaption>
</figure>

## The failure no threshold fixes

Here is the case that breaks this technique outright:

> What is the return window for orders shipped to Germany?
>
> What is the return window for orders shipped to Brazil?

These are nearly identical strings. Their embeddings are extremely close — far above any workable threshold — and the answers may be completely different. The similarity score is not wrong; the two questions really are similar. Similarity is simply the wrong tool for a difference that one word carries all of.

The same shape appears everywhere: two users asking "what is my balance", two tenants asking "what are our limits", the same question asked before and after a policy change.

So the fix is not a better threshold. It is to **partition the cache** by everything that changes the answer — user, account, tenant, locale, policy version, date — and match semantically only *within* a partition. Exact matching on what must match, similarity on what may vary.

Getting this partitioning wrong is the difference between a cache that saves money and one that leaks another customer's answer.

## The rest of the practicalities

**Cache the question, not the response format.** If the stored answer embeds a name or a number specific to the asker, it must never be shared. Only answers that are genuinely identical for everyone in the partition belong in it.

**Expiry means something here.** Unlike an embedding, which is a deterministic function of its input, a model's answer reflects the state of the world when it was produced. An answer about pricing is stale the day pricing changes, and nothing in the similarity score can tell.

**Log the near misses.** Every query that scored just below the threshold is data about whether the threshold is right. Reviewing a sample of matches slightly above it is the only honest way to know your false-hit rate — and it is worth doing, because every number in the table above depends on distributions that are specific to your traffic.

## What to take away

Semantic caching trades a guarantee for a hit rate.

Exact caching cannot be wrong. Semantic caching can, so the threshold is not a tuning parameter — it is a statement about how often serving a confidently wrong answer is acceptable. Set it high, partition by anything that changes the answer, and measure the false hits rather than assuming them.
