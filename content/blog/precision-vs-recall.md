---
title: "Precision vs Recall"
date: "2026-09-12T00:40"
category: "AI"
tags: ["precision", "recall", "base-rate", "evaluation", "classification"]
summary: "The trade-off everyone describes is real and it is not the main problem. When positives are rare, a 98%-accurate classifier produces alerts that are wrong 91% of the time — and the fix is not a better model."
draft: false
cover: "/blog/precision-vs-recall.svg"
---

Any system that flags things gets four outcomes: correctly flagged, wrongly flagged, correctly passed, wrongly passed.

**Precision** is how many of the things it flagged were right. **Recall** is how many of the things it should have flagged it found.

They pull against each other in the obvious way — a stricter threshold flags less and is right more often — and that is the version everyone learns. There is a bigger effect underneath it.

## What rarity does

Take 100,000 transactions of which 0.2% are fraudulent. Two hundred real cases.

A classifier catching 95% of fraud with a 2% false-positive rate sounds strong. It catches 190 of the 200 — and flags 2% of the 99,800 clean transactions, which is 1,996 of them.

| | |
| --- | --- |
| alerts raised | 2,186 |
| of which real | 190 |
| **precision** | **8.7%** |

Ninety-one percent of the alerts are wrong. Nothing about that classifier is bad; its recall is excellent and its false-positive rate is low. The problem is that **there are 499 clean transactions for every fraudulent one**, so even a small error rate on the clean ones buries the real cases.

## The rule this implies

Tightening the false-positive rate, holding recall at 95%:

| false-positive rate | alerts | real | precision |
| --- | --- | --- | --- |
| 2.0% | 2,186 | 190 | 8.7% |
| 0.5% | 689 | 190 | 27.6% |
| 0.2% | 390 | 190 | 48.8% |
| 0.1% | 290 | 190 | **65.6%** |

Precision crosses 50% almost exactly where the false-positive rate crosses the prevalence — 0.190% against a prevalence of 0.2%.

That is the rule worth remembering: **to get usable precision, the false-positive rate has to be smaller than the base rate.** With fraud at one in 500, an error rate of one in 500 is the *threshold of usefulness*, not a good result.

It also explains a common frustration. Improving recall from 90% to 95% moves precision barely at all, because precision is dominated by the false-positive count. The lever that matters is the one on the negatives, and it is the harder one to move.

<figure>
<svg viewBox="0 0 560 290" width="560" role="img" aria-label="Stacked bars showing alerts split into real and false cases at four false-positive rates, with precision rising as the false-positive rate falls." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE SAME 190 REAL CASES, BURIED TO DIFFERENT DEPTHS</text>
<text class="l" x="20" y="44">fpr 2.0%</text>
<rect x="88" y="32" width="38" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="126" y="32" width="394" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="l" x="20" y="80">fpr 0.5%</text>
<rect x="88" y="68" width="38" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="126" y="68" width="99" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="l" x="20" y="116">fpr 0.2%</text>
<rect x="88" y="104" width="38" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="126" y="104" width="40" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="l" x="20" y="152">fpr 0.1%</text>
<rect x="88" y="140" width="38" height="18" rx="2" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="126" y="140" width="20" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 42%, transparent)"/>
<text class="b" x="530" y="44" text-anchor="end">8.7%</text>
<text class="b" x="235" y="80">27.6%</text>
<text class="b" x="176" y="116">48.8%</text>
<text class="b" x="156" y="152">65.6%</text>
<text class="b" x="88" y="180">shaded = the 190 real cases, identical in every row</text>
<path d="M20 200 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="224">recall is 95% in all four — only the false-positive rate changed</text>
<text class="b" x="20" y="246">precision passes 50% where the false-positive rate passes the base rate</text>
<text class="l" x="20" y="268">which is 0.2%, so an error rate of 1 in 500 is merely the starting line</text>
</svg>
<figcaption>Precision is set by the false-positive count, and the false-positive count is set by how many negatives there are.</figcaption>
</figure>

## Deciding, without pretending it is symmetric

The standard advice — favour precision when false alarms are costly, recall when misses are — is correct and too vague to act on. The costs are usually knowable.

Say a missed fraud costs ₹18,000 and reviewing a false alert costs ₹150 of someone's time. The ratio is **120:1**, which means it is worth raising 120 false alerts to catch one more real case. That single number settles the threshold.

Total cost at four operating points:

| | cost |
| --- | --- |
| recall 95%, fpr 2.0% | ₹479,400 |
| recall 95%, fpr 0.2% | **₹209,940** |
| recall 70%, fpr 0.2% | ₹1,109,940 |
| recall 50%, fpr 0.1% | ₹1,814,970 |

The best point is not the one with the best precision, nor the one with the best recall. It is the one with the lowest cost, and at a 120:1 ratio that means holding recall high and pushing the false-positive rate down — sacrificing recall is catastrophically expensive here, and a few hundred extra reviews barely register.

This also shows why the single-number summary that averages precision and recall is the wrong tool. It weights the two equally, which is true only when a miss and a false alarm cost the same. If you know the ratio, use the ratio; if you genuinely do not know it, that is the thing to go and find out.

## What to take away

The tug of war between precision and recall is real and secondary.

The dominant effect is prevalence. When the thing you are looking for is rare, precision is governed by the error rate on everything else, and no amount of recall improvement helps. Work out the base rate first, then the cost of each kind of mistake, and only then pick a threshold — because a classifier that looks excellent on both its own metrics can still produce a queue of alerts that is 91% noise.
