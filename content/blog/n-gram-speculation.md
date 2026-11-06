---
title: "N-gram speculation"
date: "2026-08-09T12:00"
category: "AI"
tags: ["inference", "speculative-decoding", "prompt-lookup", "latency", "decoding"]
summary: "Speculative decoding without a draft model: guess the next tokens by finding the last few tokens earlier in the context and copying what followed. On a code edit that is 4.59 tokens per step; in open chat it is 1.10 — and it never makes anything slower."
draft: false
cover: "/blog/n-gram-speculation.svg"
---

Speculative decoding speeds up generation by guessing several tokens ahead and having the large model check all the guesses in one pass. Checking is cheap — decode is limited by memory bandwidth, so verifying five tokens costs about the same as producing one. The question is always where the guesses come from.

The usual answer is a small draft model. N-gram speculation needs nothing of the kind. It takes the guesses from text that is already in the context.

## The observation

A great deal of what a model writes, it has just read.

Ask it to fix a bug in a 200-line function and the reply is mostly the function, copied, with three lines changed. Ask it to answer from a document and it quotes names, figures and phrases from that document. Ask it to rewrite an email and most of the sentences survive. In all of these, the next few tokens are very often a continuation of something that appears verbatim earlier in the prompt.

## The mechanism

At each step:

1. Take the last *n* tokens generated — say the last 3.
2. Search the context for an earlier occurrence of those 3 tokens.
3. If found, propose the *k* tokens that followed it there as the draft.
4. Run the large model once over the draft. Keep the longest prefix it agrees with, plus one token of its own.
5. If nothing matched, decode one token normally.

The lookup is a string search over a few thousand tokens — microseconds. There is no second model to load, train, keep in memory, or keep in sync with the main one.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="A context containing a function; the last three generated tokens match an earlier position, and the tokens that followed are proposed as the draft." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">COPY WHAT FOLLOWED LAST TIME</text>
<text class="l" x="20" y="48">prompt</text>
<rect x="80" y="34" width="460" height="24" rx="4" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<text class="l" x="90" y="50">… for item in</text>
<rect x="178" y="38" width="128" height="16" rx="3" fill="var(--primary)" fill-opacity="0.18"/>
<text class="b" x="182" y="50">order.items :</text>
<rect x="310" y="38" width="196" height="16" rx="3" fill="var(--primary)" fill-opacity="0.08" stroke="var(--primary)" stroke-dasharray="3 3"/>
<text class="l" x="316" y="50">total += item.price * qty</text>
<text class="l" x="20" y="98">output</text>
<rect x="80" y="84" width="460" height="24" rx="4" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<text class="l" x="90" y="100">… for item in</text>
<rect x="178" y="88" width="128" height="16" rx="3" fill="var(--primary)" fill-opacity="0.18"/>
<text class="b" x="182" y="100">order.items :</text>
<text class="l" x="316" y="100">?</text>
<path d="M240 58 V84" stroke="var(--primary)" stroke-width="1.5"/>
<path d="M408 58 C408 120 340 120 340 136" stroke="var(--primary)" stroke-width="1.5" fill="none"/>
<text class="l" x="20" y="152">draft</text>
<rect x="250" y="138" width="196" height="20" rx="3" fill="var(--primary)" fill-opacity="0.15"/>
<text class="b" x="256" y="152">total += item.price * qty</text>
<path d="M20 180 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="204">one forward pass checks all of it; the model edits only where it disagrees</text>
<text class="l" x="20" y="224">no match → one normal step, nothing lost</text>
</svg>
<figcaption>The draft is a lookup, not a model. It is only as good as the overlap between input and output.</figcaption>
</figure>

## How much it gains

If each drafted token is accepted with probability α, and *k* are drafted, the expected number of tokens produced per large-model step is:

`(1 − α^(k+1)) / (1 − α)`

| acceptance α | k = 4 | k = 8 |
| --- | --- | --- |
| 0.3 | 1.43 | 1.43 |
| 0.5 | 1.94 | 2.00 |
| 0.7 | 2.77 | 3.20 |
| 0.9 | **4.10** | **6.13** |

At high acceptance, drafting longer pays — 6.13 tokens a step with 8 drafted. At low acceptance it is pointless: past the first couple of guesses, the chain has almost certainly broken.

But that formula only applies on steps where a match was found. The real gain depends on how often the context offers one:

| workload | steps with a match | acceptance | tokens per step |
| --- | --- | --- | --- |
| editing code (k = 8) | 70% | 0.9 | **4.59** |
| open-ended chat (k = 8) | 10% | 0.5 | 1.10 |

On a code edit, generation runs more than four times faster. In free conversation, 10% faster. The method is only as good as the overlap between what was read and what is written.

## Why it is safe to leave on

Two properties make n-gram speculation an easy default.

**It never changes the output.** Verification accepts a drafted token only if it is the token the large model would have chosen anyway (or, with sampling, accepts in a way that preserves the model's distribution exactly). The text is the same text, produced sooner.

**It rarely makes anything slower.** When there is no match, no draft is made and the step is an ordinary step. When a draft is rejected at the first token, the step still produces one token — the large model's own — at the cost of a slightly longer forward pass, which in the bandwidth-bound regime is close to free.

The one case to watch is large batches. When a server is already processing many sequences per step, it is no longer purely bandwidth-bound, and verifying 8 extra tokens per sequence is real compute. Serving systems typically reduce *k* or switch speculation off as batch size grows.

## Compared with a draft model

A trained draft model guesses well on any text, including text that has never appeared in the context. N-gram lookup guesses perfectly on repeated text and not at all on new text.

That makes them complementary rather than competing. Some systems try the n-gram lookup first and fall back to the draft model when it finds nothing — the lookup is so cheap that trying it costs nothing.

## What to take away

N-gram speculation drafts tokens by finding the last few generated tokens earlier in the context and proposing what came after them. It needs no extra model, never changes the output, and costs almost nothing when it misses.

Its speed-up is set entirely by how much of the output is copied from the input: 4.59 tokens per step when editing code, 1.10 in open chat. For editing, summarising-with-quotes and retrieval-grounded answers, it is the cheapest speed-up available.
