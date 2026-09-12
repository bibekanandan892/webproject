---
title: "Decoding Medusa"
date: "2026-09-12T06:00"
category: "AI"
tags: ["medusa", "speculative-decoding", "inference", "tree-attention", "throughput"]
summary: "Extra prediction heads on the same model replace a separate draft model — 134 MB instead of 2 GB. The acceptance chain multiplies, so the fourth head adds 0.044 tokens and the sixth adds 0.001."
draft: false
cover: "/blog/decoding-medusa.svg"
---

Generating a token requires one pass over the whole model, and that pass is dominated by moving weights out of memory rather than by arithmetic. The GPU does a small amount of work and waits.

Which means: if you could *check* several proposed tokens in the same pass, the extra checking would be nearly free. That is the idea behind every method in this family. Medusa's contribution is where the proposals come from.

## The problem with a separate drafter

The established approach uses a small draft model to propose tokens and the large model to verify them. It works, and it costs:

| | memory |
| --- | --- |
| a 1B draft model beside a 7B target | **2.0 GB** |
| four extra heads on the target itself | 134 MB |

**15× less** — and memory is the binding constraint on how many requests a serving GPU can hold.

The other costs are not measured in bytes. A separate model has to be chosen, trained, versioned and deployed alongside the target, and it has to stay behaviourally close to it — a drafter that drifts proposes tokens that get rejected, and a rejected proposal is wasted work.

## Heads instead

Medusa attaches small heads to the frozen base model, reading the same final hidden state.

The original head predicts the next token, as always. Head 1 predicts the token *after* that. Head 2 predicts the one after that. All of them read the same hidden state produced by the same forward pass, so the proposals cost almost nothing beyond a small matrix multiply each.

Each head is one transform at hidden size — reusing the base model's vocabulary projection, which is why it is 33 MB rather than 262 MB.

Nothing about the base model changes. The heads are trained on top of it, and the tokens they propose still have to be approved by the base model's own distribution, so the output is what the base model would have produced.

## The acceptance chain, and why four heads

Here is the arithmetic that decides how many heads are worth adding.

A proposal is accepted only if every proposal before it was. So the contributions multiply, and each head's realistic accept rate is lower than the last because it is predicting further ahead:

| | accept rate | chained | running total |
| --- | --- | --- | --- |
| base head | always | 1.000 | 1.000 |
| head 1 | 0.72 | 0.720 | 1.720 |
| head 2 | 0.55 | 0.396 | 2.116 |
| head 3 | 0.40 | 0.158 | 2.274 |
| head 4 | 0.28 | **0.044** | **2.319** |
| head 5 | 0.19 | 0.008 | 2.327 |
| head 6 | 0.12 | **0.001** | 2.328 |

Four heads yield **2.32 tokens per forward pass** — a 2.32× speedup, which matches the published range of roughly 2 to 3×.

And the reason head counts stop around four or five is right there in the column. The fourth head adds 0.044 tokens. The sixth adds 0.001. Each additional head costs memory and training and contributes the *product* of every accept rate before it, which collapses quickly.

<figure>
<svg viewBox="0 0 560 316" width="560" role="img" aria-label="Bars showing each Medusa head's chained contribution to tokens per pass, shrinking sharply after the third." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EACH HEAD CONTRIBUTES THE PRODUCT OF ALL BEFORE IT</text>
<text class="l" x="20" y="44">base</text>
<rect x="86" y="32" width="300" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.65"/>
<text class="b" x="394" y="45">1.000</text>
<text class="l" x="20" y="72">head 1</text>
<rect x="86" y="60" width="216" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 38%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="310" y="73">0.720</text>
<text class="l" x="20" y="100">head 2</text>
<rect x="86" y="88" width="119" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 32%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<text class="b" x="213" y="101">0.396</text>
<text class="l" x="20" y="128">head 3</text>
<rect x="86" y="116" width="48" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="l" x="142" y="129">0.158</text>
<text class="l" x="20" y="156">head 4</text>
<rect x="86" y="144" width="13" height="18" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 48%, transparent)"/>
<text class="l" x="107" y="157">0.044</text>
<text class="l" x="20" y="184">head 5</text>
<rect x="86" y="172" width="3" height="18" rx="1.5" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="l" x="97" y="185">0.008</text>
<text class="l" x="20" y="212">head 6</text>
<rect x="86" y="200" width="1" height="18" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="l" x="95" y="213">0.001</text>
<path d="M20 232 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="256">four heads: 2.32 tokens per forward pass</text>
<text class="l" x="20" y="278">a fifth adds 0.008 and costs memory, training and a deeper tree</text>
<text class="l" x="20" y="294">which is why the count stops where it does</text>
</svg>
<figcaption>Nothing is accepted unless everything before it was, so the contributions are a running product.</figcaption>
</figure>

## Checking many guesses in one pass

Each head produces a distribution, not a single token. Taking the top two from each gives 2⁴ = 16 possible four-token continuations.

Verifying those separately would be sixteen forward passes, which defeats the purpose. Instead the candidates are arranged as a **tree** — shared prefixes share nodes — and the whole tree goes through the model in one pass, with an attention mask that lets each node see only its own ancestors.

| | |
| --- | --- |
| distinct four-token paths | 16 |
| positions in the tree | ~30 |
| forward passes to verify them all | **1** |

Thirty positions in one pass, against one position per pass in ordinary generation. Since the pass was memory-bound anyway, processing thirty positions instead of one costs very little extra — and one of those sixteen paths is likely to be partly correct.

The mask is what makes this work. Without it, the candidates would attend to each other and the verification would be meaningless.

## What it left behind

Medusa's specific arrangement was superseded quickly, and the ideas were not.

**Proposals should come from the model already running.** A second model is memory and drift; extra heads are neither.

**Verification should be a tree, not a line.** Checking one guessed sequence wastes the pass if the first token is wrong; checking a branching set of them does not.

**Predicting several tokens ahead is a training objective, not only an inference trick.** Training a model to predict more than one position turns out to help the model itself, not just the decoder attached to it — which is why the idea now shows up during pretraining rather than as an attachment afterwards.

## What to take away

The speedup is one number: average tokens accepted per forward pass. Everything in the method exists to raise it, and everything about the method's limits comes from the fact that it is a **product** of accept rates rather than a sum.

Which is why a fourth head is worth adding, a sixth is not, and why getting each head's accept rate up matters more than adding another one.
