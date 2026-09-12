---
title: "Attention Sinks"
date: "2026-09-12T07:40"
category: "AI"
tags: ["attention-sinks", "softmax", "streaming", "kv-cache", "long-context"]
summary: "Attention weights must sum to exactly one, so \"nothing here is relevant\" cannot be expressed. The first token becomes where the surplus goes — and dropping it makes every remaining weight 2.63× sharper than the model intended."
draft: false
cover: "/blog/attention-sinks.svg"
---

Attention produces a set of weights over previous positions, and those weights sum to exactly 1. Always.

Which means there is no way for a position to say *none of these is relevant*. It has to distribute its full allocation somewhere, whether or not anything deserves it.

That constraint is the entire origin of attention sinks.

## Where the surplus goes

Under causal masking, the first token is visible to every later position — it is the one thing everything can see. It also tends to carry little semantic weight.

So the model learns to put its unused attention there. The first token becomes a drain.

Look at a typical distribution at position 6:

| position | weight |
| --- | --- |
| 1 (the sink) | **0.62** |
| 2 | 0.03 |
| 3 | 0.04 |
| 4 | **0.24** |
| 5 | 0.05 |
| 6 | 0.02 |

Position 4 is what this token genuinely cares about. Position 1 is receiving nearly two thirds of the attention and contributing almost nothing — it is absorbing the 0.62 that had nowhere else to go.

## Why dropping it is catastrophic

Now run a long conversation past the context limit and evict the oldest tokens. The sink goes first.

The weights have to be renormalised over what remains, so every one of them is multiplied by `1 / (1 − 0.62)` = **2.632**:

| position | before | after eviction |
| --- | --- | --- |
| 2 | 0.03 | 0.079 |
| 3 | 0.04 | 0.105 |
| 4 | 0.24 | **0.632** |
| 5 | 0.05 | 0.132 |
| 6 | 0.02 | 0.053 |

The genuinely relevant token jumps from 0.24 to 0.632 — **2.63× sharper than the model ever intended.** And the noise at position 3 nearly triples too.

Every attention distribution in the model is now differently shaped from anything it saw in training. The output degrades immediately and severely, and the cause looks nothing like the symptom: you removed a token that carried no information and the model fell apart.

<figure>
<svg viewBox="0 0 560 312" width="560" role="img" aria-label="Attention weights before and after removing the sink token, showing every remaining weight multiplied by 2.63." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">REMOVE THE SINK AND EVERYTHING ELSE TRIPLES</text>
<text class="l" x="20" y="42">with the sink</text>
<rect x="20" y="52" width="248" height="20" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="30" y="67">0.62 — position 1, carries nothing</text>
<rect x="270" y="52" width="12" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.4"/>
<rect x="284" y="52" width="16" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.4"/>
<rect x="302" y="52" width="96" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<rect x="400" y="52" width="20" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.4"/>
<rect x="422" y="52" width="8" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.4"/>
<text class="b" x="306" y="92">0.24 — what this token actually needs</text>
<text class="b" x="20" y="132">sink evicted</text>
<rect x="20" y="142" width="32" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.4"/>
<rect x="54" y="142" width="42" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.4"/>
<rect x="98" y="142" width="253" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<rect x="353" y="142" width="53" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.4"/>
<rect x="408" y="142" width="21" height="20" rx="2" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.4"/>
<text class="b" x="98" y="182">0.632 — 2.63× sharper than trained for</text>
<path d="M20 202 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="226">the weights must sum to 1, so removing one rescales all the others</text>
<text class="b" x="20" y="250">keep the first four tokens and the distributions stay the shape they were</text>
<text class="l" x="20" y="272">a token that carried no information was load-bearing anyway</text>
<text class="l" x="20" y="290">which is why the symptom looks nothing like the cause</text>
</svg>
<figcaption>Nothing in the sink's content mattered. Its share of the total did.</figcaption>
</figure>

## The fix, which is almost trivial

Keep the first few tokens permanently and slide the window over everything else. Four sinks is typically enough.

```
[ tokens 1-4, always ] + [ the most recent 4,096 ]
```

Everything in the middle is discarded. The distributions keep roughly the shape they had, because the drain is still there to absorb the surplus.

And the memory becomes fixed:

| | cache size |
| --- | --- |
| 4 sinks + 4,096 window | **537 MB, for any conversation length** |
| a growing cache at 32,768 tokens | 4.29 GB |
| at 131,072 | 17.18 GB |
| at 1,048,576 | **137.44 GB** |

A conversation can run indefinitely in a constant amount of memory. That is what makes streaming deployment possible at all.

## What the discovery changed

The sink began as an observed quirk — first tokens getting implausible amounts of attention for no semantic reason. Understanding *why* turned it into a design decision.

The deeper fix is to give the softmax the option it was missing. Add a learned logit to the denominator that belongs to no real token:

```
weight(i) = exp(l_i) / ( exp(sink) + Σ exp(l_j) )
```

Now the weights over real tokens sum to less than 1 — 0.38 in the example above — and a position with nothing relevant to attend to can output near-zero attention everywhere. The surplus has a home that is not a token.

Which means nothing is load-bearing by accident. Evicting old tokens redistributes nothing, because there was never any misplaced weight on them to redistribute. Recent architectures build this in rather than relying on the first few tokens to serve the purpose.

## What to take away

The whole phenomenon comes from one property of softmax: it normalises, so it cannot express *nothing*.

Given that constraint, the model needed somewhere to put unused attention, and it picked the one position every token can see. The practical consequence is that the first few tokens are structurally load-bearing regardless of what they say — and the principled fix is to stop making a real token do that job.
