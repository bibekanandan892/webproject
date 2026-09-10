---
title: "Autoregressive models"
date: "2026-09-10T16:20"
category: "AI"
tags: ["autoregressive", "generation", "chain-rule", "sampling", "perplexity"]
summary: "Generate one token, append it to what you have, and use that to generate the next. The whole design follows from one identity in probability, and so does its main weakness."
draft: false
cover: "/blog/autoregressive-models.svg"
---

An autoregressive model predicts the next item in a sequence from everything before it, then treats its own prediction as part of the history and does it again.

*Auto* because it feeds on its own output. *Regressive* because each prediction is made from past values.

## Where the design comes from

It is not an arbitrary choice. It falls out of an identity that is true of any joint probability:

$$
P(x_1, x_2, \ldots, x_n) = P(x_1)\,P(x_2 \mid x_1)\,P(x_3 \mid x_1, x_2)\cdots P(x_n \mid x_1, \ldots, x_{n-1})
$$

The probability of a whole sequence is the product of the probability of each item given the ones before it.

That decomposition is the useful part. Modelling the probability of every possible sentence directly is hopeless. Modelling *one* conditional — given this prefix, what comes next — is a single manageable problem, and the identity says that solving it gives you the whole distribution for free.

So the training objective is next-token prediction, and it is not a simplification. It is the full thing, factorised.

## Generating

<figure>
<svg viewBox="0 0 560 220" width="560" role="img" aria-label="Four rows showing a prefix growing by one token at a time. Each row shows the tokens so far, an arrow, the predicted next token and its probability." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.t{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.n{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.p{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="40" y="20">THE PREFIX GROWS BY ONE EACH STEP</text>
<rect x="40" y="40" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="70" y="58" text-anchor="middle">rain</text>
<path d="M104 53 H126" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.3" marker-end="url(#ar2)"/>
<rect x="132" y="40" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="n" x="162" y="58" text-anchor="middle">fell</text>
<text class="p" x="200" y="58">0.55</text>
<rect x="40" y="76" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="70" y="94" text-anchor="middle">rain</text>
<rect x="104" y="76" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="134" y="94" text-anchor="middle">fell</text>
<path d="M168 89 H190" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.3" marker-end="url(#ar2)"/>
<rect x="196" y="76" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="n" x="226" y="94" text-anchor="middle">all</text>
<text class="p" x="264" y="94">0.40</text>
<rect x="40" y="112" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="70" y="130" text-anchor="middle">rain</text>
<rect x="104" y="112" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="134" y="130" text-anchor="middle">fell</text>
<rect x="168" y="112" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="198" y="130" text-anchor="middle">all</text>
<path d="M232 125 H254" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.3" marker-end="url(#ar2)"/>
<rect x="260" y="112" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="n" x="290" y="130" text-anchor="middle">night</text>
<text class="p" x="328" y="130">0.72</text>
<rect x="40" y="148" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="70" y="166" text-anchor="middle">rain</text>
<rect x="104" y="148" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="134" y="166" text-anchor="middle">fell</text>
<rect x="168" y="148" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="198" y="166" text-anchor="middle">all</text>
<rect x="232" y="148" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="t" x="262" y="166" text-anchor="middle">night</text>
<path d="M296 161 H318" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.3" marker-end="url(#ar2)"/>
<rect x="324" y="148" width="60" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="n" x="354" y="166" text-anchor="middle">&lt;end&gt;</text>
<text class="p" x="392" y="166">0.68</text>
<text class="p" x="40" y="204">each row is one full forward pass through the model</text>
</svg>
<figcaption>Four tokens, four passes. The right-hand column is the only new information each time.</figcaption>
</figure>

Multiply the conditionals and you get the sequence probability, with $P(\text{rain}) = 0.12$ to start:

$$
0.12 \times 0.55 \times 0.40 \times 0.72 \times 0.68 = 0.01292544
$$

## Why nobody uses that number

A sequence probability is a product of numbers below 1, so it shrinks as the sequence grows — regardless of how good the sequence is.

| per-token probability | 10 tokens | 50 tokens | 200 tokens |
| --- | --- | --- | --- |
| 0.9 | 3.5e−1 | 5.2e−3 | 7.1e−10 |
| 0.7 | 2.8e−2 | 1.8e−8 | 1.1e−31 |
| 0.5 | 9.8e−4 | 8.9e−16 | 6.2e−61 |

A model that is 90% confident at every step still assigns a 200-token passage a probability of about $10^{-9}$. Comparing that against a 10-token passage tells you which is shorter, not which is better.

So the useful quantity is the *average log probability per token*, which does not depend on length. For the sequence above that is −0.8697, and exponentiating its negative gives a perplexity of 2.39 — roughly, the model was as uncertain as if choosing between 2.4 equally likely options at each step.

## The cost that cannot be removed

Look at the diagram again. Each row is a complete forward pass, and row four cannot start until row three has produced its token.

A 500-token answer is 500 sequential passes. Not 500 units of work that could be spread across hardware — 500 steps that must happen in order, because each one's input includes the previous one's output.

This is why generation feels slow in a way that is unrelated to how much compute you have. Adding GPUs does not shorten a chain of dependencies.

There is a related cost that *can* be removed. Recomputing the attention keys and values for the entire prefix at every step is enormous waste — the prefix has not changed, only grown by one. Storing them and computing only for the new token turns quadratic redundant work into linear.

## Training on whole sentences

At generation time the future does not exist, so nothing can leak. Training is different: whole sentences are present at once, which is what makes training parallel and fast.

That creates a problem. If position three can attend to position five while learning to predict position four, it has read the answer.

The fix is to mask: before the softmax, set the attention scores from each position to every later position to negative infinity, so their weights come out as zero. Every position then sees only what precedes it, exactly as it will at generation time, while all positions are still processed in one pass.

## What the trade buys

**Coherence.** Every token is chosen with the entire preceding text available. Nothing is committed to before its context exists.

**A simple objective.** Next-token prediction on ordinary text. No labels, no special construction.

**Any length.** There is no fixed output size — the model emits a stop token when it is finished.

Against that: it is sequential, latency grows linearly with output length, and an early mistake conditions everything after it. The model cannot revise a token it has already emitted; it can only continue from it.

The alternative is producing many positions at once, which is faster and gives up the guarantee that each token saw the ones before it. Output tends to be less coherent — repetitions and contradictions across positions that never conditioned on each other.

## The short version

- Predict the next item from all previous ones, append, repeat.
- It follows from the chain rule: any joint probability factorises into conditionals.
- That is why next-token prediction is the whole objective and not an approximation.
- Sequence probabilities shrink with length, so per-token log probability and perplexity are what get reported.
- Generation is a chain of dependent forward passes — more hardware does not shorten it.
- Caching keys and values removes the redundant recomputation, which is the part that *is* waste.
- Causal masking makes parallel training behave like sequential generation.
- The trade is coherence and simplicity against sequential speed and unrevisable mistakes.
