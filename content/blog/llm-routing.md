---
title: "LLM routing"
date: "2026-09-10T15:00"
category: "AI"
tags: ["routing", "cost", "inference", "serving", "models"]
summary: "Sending every request to the largest model means paying premium prices for questions a small model answers perfectly. Routing picks a model per request — and it tolerates being wrong far more than you would expect."
draft: false
cover: "/blog/llm-routing.svg"
---

Most requests to a language model are easy. Reformat this, summarise that, answer a factual question. A small model handles them indistinguishably from a large one.

Routing puts a decision in front of the model pool: look at the request, pick the cheapest model that will do it properly, send it there.

## What the gap actually is

Prices differ by more than an order of magnitude between tiers. Take two million requests a month, 500 tokens in and 400 out:

| | share | monthly cost |
| --- | --- | --- |
| everything on the frontier model | 100% | **$12,100** |
| small | 70% | $210 |
| mid | 22% | $532 |
| frontier | 8% | $968 |
| **routed total** | | **$1,710** |

<figure>
<svg viewBox="0 0 580 180" width="580" role="img" aria-label="Two cost bars. Sending every request to the frontier model fills the full width; the routed mix is a small fraction of it, made up of small, mid, frontier and router segments." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.vi{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--background)}</style>
<text class="hd" x="20" y="18">MONTHLY COST, SAME TRAFFIC</text>
<text class="l" x="100" y="70" text-anchor="end">one model</text>
<rect x="110" y="48" width="420" height="32" rx="3" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="v" x="518" y="69" text-anchor="end">$12,100</text>
<text class="l" x="100" y="130" text-anchor="end">routed</text>
<rect x="110" y="108" width="7.3" height="32" fill="color-mix(in srgb, var(--primary) 22%, transparent)"/>
<rect x="117.3" y="108" width="18.5" height="32" fill="color-mix(in srgb, var(--primary) 38%, transparent)"/>
<rect x="135.8" y="108" width="33.6" height="32" fill="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<rect x="169.4" y="108" width="2.3" height="32" fill="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<text class="v" x="182" y="129">$1,775</text>
<rect x="110" y="158" width="12" height="12" fill="color-mix(in srgb, var(--primary) 22%, transparent)"/>
<text class="l" x="128" y="168">small</text>
<rect x="190" y="158" width="12" height="12" fill="color-mix(in srgb, var(--primary) 38%, transparent)"/>
<text class="l" x="208" y="168">mid</text>
<rect x="260" y="158" width="12" height="12" fill="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<text class="l" x="278" y="168">frontier</text>
<rect x="350" y="158" width="12" height="12" fill="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<text class="l" x="368" y="168">router</text>
</svg>
<figcaption>The frontier model still answers 8% of requests. It is just no longer answering the other 92%.</figcaption>
</figure>

That is 86% less, and the frontier model is still there for the requests that need it.

## The router has to be cheap

This is the part that decides whether any of it works, and it is easy to get wrong.

If the router is itself a language model, it reads every request — so its input cost scales with total traffic, not with the traffic it sends anywhere.

| router | monthly cost | net saving |
| --- | --- | --- |
| rules or a small classifier | $0 | $10,390 |
| a tiny model | $65 | $10,325 |
| **the frontier model** | **$2,692** | $7,698 |

Using a strong model to decide costs a quarter of the entire saving, and it does so on every single request including the ones going straight to the cheapest tier. The router must be dramatically cheaper than the thing it is choosing between, or it becomes the expense.

## How the decision gets made

**Rules.** Keywords, length, request type. Free and instant, and brittle — a hard question phrased briefly goes to the small model because nothing in the rule looked at difficulty.

**A classifier.** Train a small model on past requests labelled with which tier handled them well. Learns patterns rules cannot express, and needs labelled data plus retraining as traffic shifts.

**Embeddings.** Keep reference vectors for the kind of request each tier suits, and send each request to its nearest. No training, and it depends entirely on picking good references.

**A small model as the router.** Ask a cheap model which tier to use. The most flexible, since changing the policy means editing a prompt, and it adds a call to every request.

**Cascade.** Skip the decision. Send everything to the cheapest model, and escalate only when the answer comes back weak. Lowest average cost, at the price of latency on exactly the hard requests where latency is already worst.

## Being wrong is cheaper than you would think

The obvious risk is misrouting: a request goes to a model too small, produces a poor answer, and has to be redone on the frontier model. That costs the small attempt plus the full price.

The surprise is how much of that the arithmetic absorbs:

| misrouted | monthly cost | still saves |
| --- | --- | --- |
| 5% | $2,380 | 80.3% |
| 10% | $2,985 | 75.3% |
| 20% | $4,195 | 65.3% |
| 40% | $6,615 | 45.3% |

Routing does not break even until **85% of requests are misrouted**. At that point the router is essentially choosing at random and the scheme is still not losing money.

The reason is the asymmetry: a wasted small-model call costs a rounding error, while a correctly-routed one saves the full difference. So a mediocre router is fine, and effort spent making it slightly more accurate is usually better spent making it cheaper or faster.

That is only true of *cost*. A misrouted request still produced a bad answer, and if nothing catches it the user simply gets that answer. Which is why a cascade — where weak output triggers escalation automatically — is often worth more than a smarter router.

## When it is worth doing at all

Routing pays when the volume is large, the requests genuinely vary in difficulty, and the bill is big enough to care about. At a few thousand requests a month, an 86% saving on a small number is still a small number, and you have added a component that can fail.

It also pays when several models are already in use and the choice is scattered through the codebase as ad-hoc conditionals. Routing at least puts that decision in one place where it can be logged and changed.

If requests are uniformly hard, there is nothing to route — everything goes to the frontier model and the router is pure overhead.

## What to watch

The router must stay under roughly a tenth of the latency of the model it selects; past that, users feel it on every request including the fast ones.

Every routing decision should be logged with what was chosen, what it cost, and how it turned out. Without that there is no way to tell a good router from a lucky one, or to notice when a traffic shift has quietly made the policy wrong.

And there needs to be a fallback. If the router fails, or the chosen model errors, requests should escalate rather than fail.

## The short version

- Price differences between tiers are large, and most requests do not need the top one.
- A 70/22/8 split across small, mid and frontier cut a $12,100 month to $1,710.
- The router reads every request, so it must be far cheaper than what it is choosing — a frontier model as router burns a quarter of the saving.
- The options run from free rules to a cascade that escalates only on weak answers.
- Cost-wise, routing survives being wrong about 85% of the time; accuracy matters for quality, not for the bill.
- A cascade catches bad routing automatically, which a smarter router does not.
- Log every decision, keep the router under a tenth of the model's latency, and always have a fallback.
