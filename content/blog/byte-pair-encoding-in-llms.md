---
title: "Byte pair encoding in LLMs"
date: "2026-09-07T21:15"
category: "AI"
tags: ["llm", "tokenization", "bpe", "vocabulary"]
summary: "A model cannot read text, only numbers, so text has to be cut into pieces first. Byte pair encoding decides where to cut by repeatedly merging the most common pair of neighbours."
draft: false
cover: "/blog/byte-pair-encoding-in-llms.svg"
---

A language model does not read text. It reads numbers. So before anything else happens, the text has to be cut into pieces, and each piece looked up as a number. Those pieces are tokens, and deciding where to cut is the job of the tokenizer.

Byte pair encoding, or BPE, is how most modern models decide. It is worth understanding because the cuts it makes shape everything downstream.

## The two obvious approaches, and why both fail

**Cut on words.** Give every word in your training text its own number. This reads nicely, but it breaks the moment a word shows up that was not in the training text. A brand name, a typo, a new bit of slang — the model has no number for it, and the whole word becomes a single "unknown" placeholder. Every meaning it carried is gone.

**Cut on characters.** Give every character its own number. Now nothing is ever unknown, because any word can be spelled out. But the sequences become enormous — a short sentence turns into hundreds of tokens, and each one carries almost no meaning on its own. That is slow, and it makes the model work harder to learn anything.

One approach can't handle new words. The other drowns in tiny pieces. BPE lands in between.

## What BPE does

Start with every word split into individual characters. Then repeat one simple move: find the pair of neighbouring symbols that occurs most often across the whole text, and glue that pair into a single new symbol.

Do it once and you might learn `in`. Do it again and you might learn `ing`. Keep going and you build a vocabulary of pieces that are bigger than characters but smaller than words — and crucially, the common pieces get learned first, because they are the ones that occur most.

You stop when the vocabulary reaches whatever size you decided on. Real models use somewhere between about 32,000 and 256,000.

## A worked example

Take a small training text of five words, with how many times each appears:

| word | count |
| --- | --- |
| `walk` | 11 |
| `singing` | 10 |
| `salt` | 8 |
| `paint` | 6 |
| `talking` | 2 |

Split each into characters, with a marker `</w>` on the end so the tokenizer knows where a word finishes:

| word | | symbols |
| --- | --- | --- |
| `walk` | ×11 | `w` `a` `l` `k` `</w>` |
| `singing` | ×10 | `s` `i` `n` `g` `i` `n` `g` `</w>` |
| `salt` | ×8 | `s` `a` `l` `t` `</w>` |
| `paint` | ×6 | `p` `a` `i` `n` `t` `</w>` |
| `talking` | ×2 | `t` `a` `l` `k` `i` `n` `g` `</w>` |

That is 11 distinct symbols to start with.

Now count every neighbouring pair across the whole text, weighting each word by how often it appears. The winner is `i` followed by `n`, seen 28 times — 10 from `singing` twice over, 6 from `paint`, 2 from `talking`. Merge it.

Then count again, and merge again. The first three rounds:

| round | most common pair | seen | becomes |
| --- | --- | --- | --- |
| 1 | `i` + `n` | 28 | `in` |
| 2 | `in` + `g` | 22 | `ing` |
| 3 | `a` + `l` | 21 | `al` |

Carrying on the same way gives `t</w>` (14), then `alk` (13), then `ing</w>` (12).

Watching one word collapse as its merges land makes the shape of it clear:

<figure>
<svg viewBox="0 0 690 212" width="690" role="img" aria-label="The word singing collapsing from eight character tokens to three, as each merge rule is applied in turn." xmlns="http://www.w3.org/2000/svg">
<style>.l{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.s{font:600 13px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.c{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="l" x="0" y="21">characters</text>
<rect x="132" y="0" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="149" y="22" text-anchor="middle">s</text>
<rect x="172" y="0" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="189" y="22" text-anchor="middle">i</text>
<rect x="212" y="0" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="229" y="22" text-anchor="middle">n</text>
<rect x="252" y="0" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="269" y="22" text-anchor="middle">g</text>
<rect x="292" y="0" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="309" y="22" text-anchor="middle">i</text>
<rect x="332" y="0" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="349" y="22" text-anchor="middle">n</text>
<rect x="372" y="0" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="389" y="22" text-anchor="middle">g</text>
<rect x="412" y="0" width="52" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="438" y="22" text-anchor="middle">&lt;/w&gt;</text>
<text class="c" x="476" y="21">8 tokens</text>
<text class="l" x="0" y="71">after i + n</text>
<rect x="132" y="50" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="149" y="72" text-anchor="middle">s</text>
<rect x="172" y="50" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="s" x="189" y="72" text-anchor="middle">in</text>
<rect x="212" y="50" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="229" y="72" text-anchor="middle">g</text>
<rect x="252" y="50" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="s" x="269" y="72" text-anchor="middle">in</text>
<rect x="292" y="50" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="309" y="72" text-anchor="middle">g</text>
<rect x="332" y="50" width="52" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="358" y="72" text-anchor="middle">&lt;/w&gt;</text>
<text class="c" x="396" y="71">6 tokens</text>
<text class="l" x="0" y="121">after in + g</text>
<rect x="132" y="100" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="149" y="122" text-anchor="middle">s</text>
<rect x="172" y="100" width="43" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="s" x="194" y="122" text-anchor="middle">ing</text>
<rect x="221" y="100" width="43" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="s" x="242" y="122" text-anchor="middle">ing</text>
<rect x="270" y="100" width="52" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="296" y="122" text-anchor="middle">&lt;/w&gt;</text>
<text class="c" x="334" y="121">4 tokens</text>
<text class="l" x="0" y="171">after ing + &lt;/w&gt;</text>
<rect x="132" y="150" width="34" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 9%, transparent)" stroke="color-mix(in srgb, var(--primary) 28%, transparent)"/>
<text class="s" x="149" y="172" text-anchor="middle">s</text>
<rect x="172" y="150" width="43" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="s" x="194" y="172" text-anchor="middle">ing</text>
<rect x="221" y="150" width="79" height="34" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="s" x="260" y="172" text-anchor="middle">ing&lt;/w&gt;</text>
<text class="c" x="312" y="171">3 tokens</text>
</svg>
<figcaption>The word <code>singing</code> as each merge that touches it lands.</figcaption>
</figure>

Eight tokens down to three, and the pieces it ended up with — `ing`, and `ing</w>` for a word actually ending in *ing* — are exactly the ones that earned their place by being common.

## Tokenizing text it has never seen

Here is the part that matters. The merges are saved, **in the order they were learned**. That ordered list is the tokenizer.

To tokenize new text, split it into characters and replay the list from the top. Not "find the longest matching piece" — replay, in order.

So take `walking`, a word that never appeared in the training text at all:

```
w a l k i n g </w>      split into characters
w a l k in g </w>       rule 1:  i + n
w a l k ing </w>        rule 2:  in + g
w al k ing </w>         rule 3:  a + l
w alk ing </w>          rule 5:  al + k
w alk ing</w>           rule 6:  ing + </w>
```

Result: `w` `alk` `ing</w>` — three tokens. No unknown placeholder anywhere. The model has never seen this word, but it recognises the `alk` it learned from `walk` and `talking`, and the `ing</w>` ending it learned from `singing` and `talking`.

That is the whole trick. New words are not a special case; they are just words that need more pieces.

## Why this won

- **Nothing is ever unknown.** In the worst case a word falls back to characters, which are always in the vocabulary. There is no cliff.
- **The vocabulary stays small.** Tens of thousands of entries covers essentially any input, instead of one entry per word and still missing some.
- **Common things stay whole.** Frequent words end up as single tokens because their pairs merged early. Only rare words get broken up, which is the right trade.
- **It does not care about language.** The algorithm counts pairs of symbols. It has no notion of English, or of spaces, so it works on any script.

## The short version

- Models read numbers, so text has to be cut into tokens first.
- Word-level cutting cannot handle unseen words; character-level cutting makes sequences far too long.
- BPE starts from characters and repeatedly merges the most common neighbouring pair.
- It stops once the vocabulary hits a target size, typically 32k–256k.
- The saved merges are replayed **in learning order** to tokenize new text.
- Unseen words simply decompose into known pieces, so nothing is ever unknown.
