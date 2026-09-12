---
title: "HyDE in RAG"
date: "2026-09-11T19:00"
category: "AI"
tags: ["hyde", "rag", "retrieval", "embeddings", "search"]
summary: "A question and its answer barely resemble each other, which is a problem when retrieval works by resemblance. HyDE has the model write a fake answer first and searches with that instead."
draft: false
cover: "/blog/hyde.svg"
---

Retrieval in a RAG system works by similarity: embed the user's question, find the stored chunks whose embeddings are closest, put them in the prompt.

The assumption buried in that is that a question resembles its answer. It usually does not.

## Measuring the gap

Take a question and the document that answers it:

> **Question:** Why does my printer keep jamming?
>
> **Document:** Paper jams occur when the feed rollers lose their grip on the sheet. Clean the rollers with a lint-free cloth and replace them once the rubber has worn smooth.

They are about the same thing and share almost no language. The question contributes three content words — *printer*, *keep*, *jam* — and only one of those appears in the document.

Now have a model write what it *thinks* the answer is, without looking anything up:

> **Hypothetical answer:** Printer jams are usually caused by dirty or worn feed rollers losing grip on the paper. Clean the rollers and replace them if the rubber is worn.

This is not a citation. The model is guessing. But look at what it shares with the real document: *jam, worn, feed, roller, grip, paper, clean, replace, rubber*.

Scored on term overlap:

| | similarity to the right document |
| --- | --- |
| the question | 0.123 |
| the hypothetical answer | **0.636** |

A **5.2×** improvement, and the improvement came from text containing no new information — every fact in it was already in the model's weights, and some of it might be wrong.

(Term overlap is a cruder measure than a real embedding, which would score the question above 0.123. But the asymmetry is the same in embedding space and for the same reason: answers are declarative, full of domain nouns, and structurally like other answers. Questions are short, interrogative, and phrased in the words of someone who does not yet know the terminology.)

<figure>
<svg viewBox="0 0 560 288" width="560" role="img" aria-label="A question sitting apart from a cluster of answer documents, with a hypothetical answer landing inside the cluster." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="hy" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--primary)"/></marker></defs>
<text class="hd" x="20" y="18">QUESTIONS AND ANSWERS SIT IN DIFFERENT PLACES</text>
<ellipse cx="380" cy="110" rx="128" ry="72" fill="color-mix(in srgb, var(--muted-foreground) 10%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke-dasharray="6 5"/>
<text class="l" x="380" y="200" text-anchor="middle">where answers live</text>
<g fill="color-mix(in srgb, var(--muted-foreground) 55%, transparent)">
<circle cx="330" cy="84" r="6"/><circle cx="404" cy="72" r="6"/><circle cx="356" cy="128" r="6"/><circle cx="436" cy="120" r="6"/><circle cx="300" cy="130" r="6"/><circle cx="452" cy="88" r="6"/>
</g>
<circle cx="380" cy="102" r="8" fill="var(--muted-foreground)"/>
<text class="l" x="394" y="106">the one we want</text>
<circle cx="70" cy="150" r="8" fill="none" stroke="var(--primary)" stroke-width="2.5"/>
<text class="b" x="40" y="176">question</text>
<path d="M82 146 L364 106" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)" stroke-width="1.4" stroke-dasharray="4 4"/>
<text class="l" x="150" y="126">0.123</text>
<circle cx="250" cy="60" r="8" fill="var(--primary)"/>
<text class="b" x="196" y="46">hypothetical</text>
<path d="M259 68 L370 96" stroke="var(--primary)" stroke-opacity="0.8" stroke-width="2" marker-end="url(#hy)"/>
<text class="b" x="286" y="76">0.636</text>
<path d="M20 220 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="244">the fake answer is a better search key than the real question</text>
<text class="l" x="20" y="264">it adds no information — it only moves the query somewhere useful</text>
</svg>
<figcaption>The generated text is thrown away after the search. Only its position mattered.</figcaption>
</figure>

## The steps

1. The user asks a question.
2. A model writes a short hypothetical answer to it, from nothing.
3. That answer is embedded.
4. The search runs on that embedding.
5. The real chunks come back.
6. The final answer is written from the real chunks only.

Step 6 is what keeps this honest. The hypothetical answer never reaches the user and is never cited. It exists to point at a region of the index, and is discarded the moment it has done so.

## Where it goes wrong

The technique amplifies whatever the model guessed, in both directions.

If the guess uses the right vocabulary, retrieval improves sharply. If the guess is confidently wrong — the model invents a plausible mechanism that your documents never mention — the search goes looking for that wrong mechanism and returns chunks about it. The question, for all its vocabulary mismatch, at least could not be wrong about the subject.

Two specific danger zones:

**Unusual or private domains.** If the answer depends on your product's internal naming, the model has never seen it and will guess generic industry terms. The hypothetical answer then points at nothing.

**Queries that are not questions.** A user typing an error code or a part number is already using exactly the vocabulary the document uses. Generating prose around it moves the query *away* from a good match.

The mitigation for variance is to generate several hypothetical answers and average their embeddings. Averaging four independent guesses halves the standard deviation of the guessing noise, so an idiosyncratic single answer has less influence. It does not help with a bias the model holds consistently.

## The cost

One extra model call before every search, adding its own latency and tokens on every query — for a first token the user is still waiting on.

That is a real tax, and whether it is worth paying is an empirical question with a measurable answer. Run your evaluation set both ways and compare retrieval quality. The technique helps most where the gap it addresses is largest: conversational questions over technical documents. It helps least where queries already look like the corpus.

## What to take away

The insight is not that generated text is useful. It is that **the query and the index are not in the same dialect**, and the fix is to translate the query into the index's dialect before searching.

A fabricated answer happens to be an effective translator, because it is written in the register that answers are written in. Whether it is true is beside the point — it is never shown to anyone.
