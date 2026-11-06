---
title: "Why LLMs hallucinate: the token-level view"
date: "2026-11-06T12:30"
category: "AI"
tags: ["hallucination", "llm", "sampling", "calibration", "reliability"]
summary: "A model does not look facts up; it picks the next token from a distribution. When it is unsure, that distribution is spread over plausible wrong answers, and one gets written with the same fluency as the truth. A 25-token citation right at 97% per token is fully right 46.7% of the time."
draft: false
cover: "/blog/why-llms-hallucinate.svg"
---

A hallucination is a fluent, confident statement that is false: a court case that never happened, a function that does not exist in a library, a plausible birth year that is wrong. It is the most discussed failure of language models, and it follows directly from the one thing they do — predict the next token.

## The model always produces a token

At every step, a language model outputs a probability for every token in its vocabulary. Then one token is chosen. There is no step at which the model checks a fact, consults a database or decides that it does not know. Whatever the distribution looks like, *something* is written.

When the model has seen a fact many times, the distribution is sharp. After *"The Eiffel Tower is in"*, almost all the probability is on " Paris". The right answer and the likely answer are the same.

When it has seen the fact rarely or not at all, the distribution is spread out over plausible candidates. Ask for the birth year of a minor historical figure and the model's knowledge might amount to:

| year | probability |
| --- | --- |
| 1847 | 30% |
| 1849 | 25% |
| 1851 | 20% |
| 1846 | 15% |
| 1852 | 10% |

These are all *plausible* — the model knows roughly when the person lived. It does not know which year is right. If the true year is 1847, greedy decoding gets it right and sampling gets it right 30% of the time. If the true year is 1849, greedy decoding is wrong every time.

Either way, the year is written in the same confident sentence: *"She was born in 1847."* Nothing in the text signals that the model was choosing among five options with no clear favourite. **That uncertainty existed inside the model, in the distribution, and was discarded the moment a token was sampled.**

## Long facts compound

A birth year is one or two tokens. A citation — author, title, journal, year, pages — is perhaps 25. Each token must be right for the citation to be real. If the model is right about each with probability *p*:

| per-token accuracy | tokens | all correct |
| --- | --- | --- |
| 99% | 25 | 77.8% |
| 97% | 25 | **46.7%** |
| 90% | 6 | 53.1% |

A model that is 97% sure of each piece of a citation produces a fully correct one less than half the time. The rest are partly real: a real author with an invented title, a real journal with the wrong year. That is exactly what fabricated references look like — plausible combinations of real parts.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A sharp distribution with one dominant token next to a flat distribution over five plausible years; both produce an equally confident sentence." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">KNOWS vs GUESSES — SAME OUTPUT</text>
<text class="b" x="20" y="44">well-known fact</text>
<path d="M20 140 H240" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<rect x="30" y="52" width="34" height="88" fill="var(--primary)" fill-opacity="0.8"/>
<g fill="var(--muted-foreground)" fill-opacity="0.4"><rect x="72" y="137" width="34" height="3"/><rect x="114" y="138" width="34" height="2"/><rect x="156" y="139" width="34" height="1"/></g>
<text class="l" x="30" y="156">Paris 97%</text>
<text class="b" x="300" y="44">rarely seen fact</text>
<path d="M300 140 H540" stroke="var(--muted-foreground)" stroke-opacity="0.4"/>
<g fill="var(--muted-foreground)" fill-opacity="0.55">
<rect x="350" y="114" width="34" height="26"/><rect x="392" y="119" width="34" height="21"/><rect x="434" y="123" width="34" height="17"/><rect x="476" y="127" width="34" height="13"/>
</g>
<rect x="308" y="108" width="34" height="32" fill="var(--primary)" fill-opacity="0.8"/>
<text class="l" x="308" y="156">1847 · 1849 · 1851 · 1846 · 1852</text>
<rect x="20" y="172" width="220" height="24" rx="4" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<text class="l" x="30" y="188">"It is in Paris."</text>
<rect x="300" y="172" width="240" height="24" rx="4" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<text class="l" x="310" y="188">"She was born in 1847."</text>
<path d="M20 214 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="238">the uncertainty is in the distribution and is thrown away by sampling</text>
</svg>
<figcaption>A 97% answer and a 30% answer are written in the same voice.</figcaption>
</figure>

## Once written, it is context

Generation conditions each token on everything before it — including tokens the model itself just produced. Once a wrong year is written, the model continues as if it were true: it may add a plausible birthplace consistent with that year, or an age at some later event computed from it. The error snowballs, because the most fluent continuation of a false statement is more statements consistent with it.

This is why asking a model to "check its answer" sometimes works: re-reading the claim as input, rather than continuing from it, gives the model a chance to notice the inconsistency.

## Why training encourages guessing

Pre-training rewards predicting the next token of real text, and real text rarely says "I don't know" where a fact belongs. Many fine-tuning and evaluation setups also score a confident wrong answer the same as an abstention — both get zero — so a model that always guesses scores at least as well as one that admits uncertainty. Systems that reward abstaining when unsure, or penalise confident errors more than "I'm not sure", produce models that hallucinate less, at the cost of answering less often.

## What actually reduces it

**Give it the facts.** Retrieval-augmented generation puts the source text in the context, so the answer is copied rather than recalled. A sharp distribution comes from the document instead of from memory.

**Lower the temperature for factual work.** Sampling at a high temperature deliberately picks lower-probability tokens; for facts those are mostly wrong ones.

**Let it abstain.** Instruct the model that "I don't know" is acceptable, and use models trained to do it.

**Use the probabilities.** Token log-probabilities expose the uncertainty that the text hides. A name generated with very low probabilities is a candidate for verification.

**Check outputs that matter.** Verify citations, run generated code, look up quoted figures. For high-stakes uses, hallucination rate is a reason for a checking step, not a reason to trust a better prompt.

## What to take away

A language model writes the most plausible next token whether or not it knows the answer. When knowledge is thin, probability spreads over plausible wrong options, sampling picks one, and the text gives no sign of the uncertainty — which lived only in the discarded distribution.

Long facts multiply small per-token errors: 97% per token makes a 25-token citation fully correct 46.7% of the time. Grounding, abstention, low temperatures and verification each attack a different part of that chain.
