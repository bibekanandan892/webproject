---
title: "Tokenization in LLMs"
date: "2026-08-23T18:50"
category: "AI"
tags: ["tokenization", "tokens", "vocabulary", "multilingual", "llm"]
summary: "A model never sees text, only token IDs, and the split decides what it costs and what it can do. At 1.3 tokens per word a 128k window holds 100,824 words; at 4 tokens per word — common for languages the tokenizer under-trained on — it holds 32,768, at 3.08× the price."
draft: false
cover: "/blog/tokenization-in-llms.svg"
---

A language model does not read characters or words. Before any text reaches it, a tokenizer cuts the text into pieces from a fixed vocabulary and replaces each piece with an integer. The model reads integers and writes integers; the tokenizer turns them back into text at the end.

`"Tokenization is surprisingly important."` might become something like:

`["Token", "ization", " is", " surprisingly", " important", "."]` → `[3404, 2065, 374, 29392, 3062, 13]`

Common words are single tokens. Rarer words are split into familiar pieces. Spaces are usually attached to the following word. Everything the model knows, it knows in terms of these pieces.

## Why not characters, or words?

**Characters** give a tiny vocabulary and can spell anything, but sequences become five times longer. Attention cost grows with the square of length, and the model has to learn to assemble meaning from letters before it can do anything else.

**Words** give short sequences, but the vocabulary is unbounded — every name, typo, number, and inflection is a new word — and anything not in the list cannot be represented at all.

**Subwords** sit between: a vocabulary of tens of thousands of pieces that covers common words whole and builds rare ones from parts. Algorithms like byte-pair encoding learn the pieces from data by repeatedly merging the most frequent adjacent pair. Working at the level of bytes means any string at all can be encoded, even if inefficiently.

## Tokens are the unit of everything

Context limits, prices and speeds are all quoted in tokens, so how many tokens a piece of text becomes matters directly.

For English, a typical modern tokenizer produces about 1.3 tokens per word. For a language that was rare in the tokenizer's training data, the same sentence can take several times as many tokens, because words are broken into small, generic fragments.

| tokens per word | words in a 131,072-token window | relative cost |
| --- | --- | --- |
| 1.3 | **100,824** | 1.00× |
| 2.0 | 65,536 | 1.54× |
| 4.0 | **32,768** | 3.08× |

The same model, the same advertised context and the same per-token price give a user writing in an under-represented language a third of the context at three times the cost. They also get slower output — generation speed is tokens per second — and often worse quality, since meaning is spread across more, less informative pieces. Larger, more multilingual vocabularies in newer tokenizers are largely a response to this.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="The same sentence split into few tokens for a well-covered language and many small tokens for a poorly covered one, with the resulting context capacity." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME MEANING, DIFFERENT TOKEN COUNT</text>
<text class="b" x="20" y="48">1.3 tokens / word</text>
<g fill="var(--primary)" fill-opacity="0.18" stroke="var(--primary)" stroke-opacity="0.6">
<rect x="20" y="58" width="78" height="22" rx="4"/><rect x="102" y="58" width="58" height="22" rx="4"/><rect x="164" y="58" width="48" height="22" rx="4"/><rect x="216" y="58" width="96" height="22" rx="4"/><rect x="316" y="58" width="22" height="22" rx="4"/>
</g>
<text class="l" x="350" y="74">5 tokens → 100,824 words fit</text>
<text class="b" x="20" y="112">4.0 tokens / word</text>
<g fill="var(--muted-foreground)" fill-opacity="0.18" stroke="var(--muted-foreground)" stroke-opacity="0.6">
<rect x="20" y="122" width="18" height="22" rx="3"/><rect x="40" y="122" width="22" height="22" rx="3"/><rect x="64" y="122" width="14" height="22" rx="3"/><rect x="80" y="122" width="20" height="22" rx="3"/><rect x="102" y="122" width="16" height="22" rx="3"/><rect x="120" y="122" width="22" height="22" rx="3"/><rect x="144" y="122" width="14" height="22" rx="3"/><rect x="160" y="122" width="18" height="22" rx="3"/><rect x="180" y="122" width="20" height="22" rx="3"/><rect x="202" y="122" width="14" height="22" rx="3"/><rect x="218" y="122" width="22" height="22" rx="3"/><rect x="242" y="122" width="16" height="22" rx="3"/><rect x="260" y="122" width="18" height="22" rx="3"/><rect x="280" y="122" width="14" height="22" rx="3"/><rect x="296" y="122" width="20" height="22" rx="3"/><rect x="318" y="122" width="20" height="22" rx="3"/>
</g>
<text class="l" x="350" y="138">16 tokens → 32,768 words fit</text>
<path d="M20 170 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="194">one window, one price per token: a third of the content at 3.08× the cost</text>
<text class="l" x="20" y="214">and slower, because generation speed is counted in tokens too</text>
</svg>
<figcaption>Token counts are the hidden exchange rate between languages.</figcaption>
</figure>

## The vocabulary-size trade

A bigger vocabulary means fewer tokens per text, but every entry needs a row in the input embedding matrix and a row in the output layer. At a model width of 4,096:

| vocabulary | embedding + output parameters |
| --- | --- |
| 32,000 | 262M |
| 128,000 | 1,049M |
| 256,000 | 2,097M |

For a 70B model, a billion parameters of vocabulary is a small price for shorter sequences across many languages. For a 1B model it would be most of the model. Vocabulary size is chosen with the model size in mind.

## The odd failures tokenization explains

Several well-known LLM weaknesses come from the model never seeing letters.

**Spelling and counting letters.** Asked how many r's are in "strawberry", the model sees perhaps `["str", "aw", "berry"]`. The letters are inside the tokens, not visible as separate symbols. It has to have memorised the spelling of each token.

**Arithmetic.** Depending on the tokenizer, `"1234567"` might be split as `"123" "456" "7"` or into single digits. If the chunks do not line up with place value, carrying digits across chunk boundaries is hard. Tokenizers that split numbers into individual digits make arithmetic noticeably more reliable.

**Leading spaces.** `" hello"` and `"hello"` are usually different tokens. A prompt ending in a trailing space can push the model toward an unusual continuation, because in training text a space was almost always attached to the word after it.

**Code indentation.** Runs of spaces can be single tokens or many, depending on whether the tokenizer learned them. Tokenizers trained with lots of code handle indentation compactly; others spend tokens on whitespace.

## What to take away

Tokenization turns text into integers from a fixed vocabulary of subword pieces, and the model only ever sees those integers. Every limit and price is in tokens, so the tokens-per-word rate is effectively an exchange rate: at 1.3 a 128k window holds about 100,824 words, at 4.0 it holds 32,768, at 3.08× the cost.

Many puzzling behaviours — miscounting letters, shaky arithmetic, sensitivity to trailing spaces — are a model reasoning about text it has only seen in chunks.
