---
title: "Cloud vs On-device"
date: "2026-09-12T02:00"
category: "AI"
tags: ["deployment", "on-device", "latency", "cost", "privacy"]
summary: "In the cloud the data travels to the model; on a device the model travels to the data. Three numbers decide which: the latency budget, the crossover request count, and the fraction of users who never take your update."
draft: false
cover: "/blog/cloud-vs-on-device.svg"
---

A trained model has to run somewhere. Either on a server the device talks to, or on the device itself.

The one-line summary is good: **in the cloud the data travels to the model; on a device the model travels to the data.** Everything else is a consequence of which direction that traffic goes, and three of those consequences are numbers rather than opinions.

## Latency, when it is a budget rather than a preference

Most of the time a network round trip of 50–200 ms is an annoyance. Sometimes it is disqualifying, and the test is whether there is a fixed budget.

A live camera overlay annotating each frame at 30 frames per second has **33.3 ms per frame**. A 90 ms round trip does not make it slower — it misses 2.7 frames, every frame, permanently. The work cannot be done in the cloud at all, at any bandwidth, because the budget is below the round trip.

That is the shape to look for. Continuous perception, anything driving a control loop, anything that must respond within one interaction tick — these have hard budgets, and the round trip either fits inside them or it does not. Answering a typed question has no such budget; 200 ms there is invisible.

## The cost crossover, and why it is further away than it looks

On-device inference is free per request. That makes it sound cheaper, and the up-front cost is substantial: compressing the model, integrating it, testing across device generations, maintaining the pipeline.

Put numbers on it — ₹0.04 per cloud request against ₹35,00,000 of engineering:

| | requests to break even |
| --- | --- |
| crossover | 87,500,000 |

| monthly volume | time to break even |
| --- | --- |
| 0.5 M | 175 months |
| 3 M | 29 months |
| 20 M | **4.4 months** |

At half a million requests a month, on-device pays back in fourteen years — which is to say never, because the model will be replaced first. At twenty million a month it pays back in under five.

Which means **cost is rarely the reason to go on-device** unless the volume is genuinely large. At moderate scale the honest reasons are latency, offline operation, and data that must not leave the device. Cost is the reason that gets cited and the one that usually does not hold.

## The number nobody plans for

This is the constraint that catches teams, and it has no cloud equivalent.

A cloud model is replaced by deploying it. Every user is on the new version within minutes, and the old one no longer exists.

An on-device model ships in an app update, and app updates roll out on the users' schedule. A realistic curve: 30% by day three, 70% by week two, 85% by month two, plateauing around 90%.

Suppose the new model scores 78 on your evaluation where the old one scored 71. What your users actually experience:

| | share updated | effective score |
| --- | --- | --- |
| day 3 | 30% | 73.10 |
| week 2 | 70% | 75.90 |
| month 2 | 85% | 76.95 |
| plateau | 90% | **77.30** |

You never ship 78. The fleet average tops out at 77.30, and **10% of users never get the improvement at all** — they stay on the old model indefinitely, including if it had a bug.

So an on-device model's quality is not the quality you measured. It is a weighted average over every version still in use, weighted by a distribution you do not control. Plan for it: keep old versions working, and never ship anything that depends on everyone having the same one.

<figure>
<svg viewBox="0 0 560 296" width="560" role="img" aria-label="A rollout curve of the share of users updated over two months, with the effective fleet score tracking below the new model's score and never reaching it." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE SCORE YOU SHIPPED IS NOT THE SCORE THEY HAVE</text>
<path d="M60 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="34" y="46">78</text>
<text class="l" x="34" y="130">74</text>
<text class="l" x="34" y="194">71</text>
<path d="M60 40 H520" stroke="var(--primary)" stroke-opacity="0.5" stroke-dasharray="5 4"/>
<text class="b" x="392" y="36">78 — what you measured</text>
<path d="M60 190 L78 145 L146 85 L428 62 L520 55" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="78" cy="145" r="4" fill="var(--primary)"/>
<text class="l" x="88" y="150">day 3 — 73.10</text>
<circle cx="146" cy="85" r="4" fill="var(--primary)"/>
<text class="l" x="156" y="90">week 2 — 75.90</text>
<circle cx="520" cy="55" r="4.4" fill="var(--primary)"/>
<text class="b" x="300" y="72">plateau — 77.30, and it stops there</text>
<text class="l" x="60" y="210">day 0</text>
<text class="l" x="520" y="210" text-anchor="end">month 2 and after</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="252">10% of users never take the update — including when it is a fix</text>
<text class="l" x="20" y="274">a cloud model has no such curve: deploying it replaces it</text>
</svg>
<figcaption>On-device quality is an average over versions you no longer control.</figcaption>
</figure>

## Privacy is the one clean argument

Everything above is a trade. Data locality is not.

If inference happens on the device, the input never leaves it. Not "is encrypted in transit", not "is deleted after 30 days" — never leaves. For health data, biometrics, or anything under a rule that forbids transmission, this is the whole reason to accept every cost on the other side of the ledger.

It is worth being precise about, because "more private" is often claimed for cloud deployments with good retention policies. A policy is a promise. Not transmitting is a property.

## The hybrid shape

Most shipped products do both, and the division is usually the same: a small model on the device handles the common, latency-sensitive, easy cases; anything it cannot handle confidently goes to a larger model in the cloud.

A voice assistant is the clearest example. Wake-word detection has to run continuously and locally — streaming audio to a server all day is unacceptable on both privacy and battery grounds. The subsequent request, once triggered, goes wherever it needs to.

What makes this work is that the on-device model can *decide to escalate*. It does not need to be good at everything; it needs to be good at knowing when it is out of its depth.

## What to take away

Three questions, in order.

**Is there a hard latency budget below the round trip?** If yes, on-device, and the rest does not matter. **Must the data not leave the device?** If yes, on-device, and cost is the price. **Otherwise:** cloud, until the volume actually clears a crossover you have calculated — and then remember that shipping an update is not the same as it arriving.
