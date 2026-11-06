---
title: "Stop tokens in LLMs"
date: "2026-08-24T20:50"
category: "AI"
tags: ["stop-tokens", "eos", "decoding", "streaming", "llm"]
summary: "A model keeps generating until something tells it to stop. When that fails, a 200-token answer runs to the 4,096-token cap — 20.5× the cost and 82 seconds instead of 4. With a 1% miss rate, that is ten runaways in every thousand replies."
draft: false
cover: "/blog/stop-tokens-in-llms.svg"
---

Generation is a loop: predict a token, append it, predict the next. Nothing in that loop ends it. A model will continue for as long as it is asked to, so every generation needs a rule for stopping.

There are three, and production systems use all of them at once.

## 1. The end-of-sequence token

During training, every example ends with a special token — often written `<eos>`, `</s>` or `<|endoftext|>` — that never appears in ordinary text. The model learns to predict it where documents end. At inference time, when the model generates that token, the loop stops and the token itself is not shown.

Chat models have a richer version. Conversations are formatted with special tokens marking the start and end of each turn:

```text title="chat template"
<|im_start|>user
What is 2 + 2?<|im_end|>
<|im_start|>assistant
4<|im_end|>
```

The model learns that after it finishes its turn, it produces the end-of-turn token. That is how a chat model knows to stop at the end of its own reply instead of writing the user's next message as well.

This is why chat templates matter so much. A model fine-tuned on one template that is served with another may never see the pattern it learned to end on, and simply keeps writing — often producing a fake "User:" turn and answering it.

## 2. Stop sequences

The caller can also pass strings that end generation when they appear in the output: `"\n\n"`, `"User:"`, `"</answer>"`.

Stop sequences are matched against *text*, but the model produces *tokens*, and a stop string can be split across several of them. `"User:"` might arrive as `"\n"`, `"User"`, `":"`. The server cannot know `"\nUser"` is the start of a stop sequence until the `":"` arrives.

For a streaming response this forces a small buffer: any output that could be the beginning of a stop sequence is held back until it is either completed (stop, discard it) or ruled out (release it). Without the buffer, the first part of the stop string leaks to the user before generation halts.

## 3. The token limit

`max_tokens` is the backstop: stop after this many tokens no matter what. It does not end the answer gracefully — it cuts it off mid-sentence — and responses that hit it are usually reported with a finish reason like `"length"` rather than `"stop"`, so the caller can tell.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Two token streams: one ending at an end-of-sequence token after 200 tokens, the other missing it and running on to the 4,096-token limit." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHAT A MISSED STOP COSTS</text>
<text class="l" x="20" y="52">stops</text>
<rect x="90" y="40" width="22" height="18" rx="3" fill="var(--primary)" fill-opacity="0.75"/>
<rect x="114" y="40" width="34" height="18" rx="3" fill="none" stroke="var(--primary)" stroke-width="1.5"/>
<text class="b" x="118" y="53">eos</text>
<text class="l" x="160" y="53">200 tokens · 4.0 s</text>
<text class="l" x="20" y="96">misses</text>
<rect x="90" y="84" width="22" height="18" rx="3" fill="var(--primary)" fill-opacity="0.75"/>
<rect x="112" y="84" width="428" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.4"/>
<path d="M540 78 V108" stroke="var(--primary)" stroke-width="2"/>
<text class="l" x="536" y="122" text-anchor="end">max_tokens: 4,096 · 81.9 s · 20.5×</text>
<text class="l" x="118" y="97">repeats, invents a "User:" turn, answers it…</text>
<path d="M20 150 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="174">at a 1% miss rate: 10 runaways per 1,000 replies</text>
<text class="l" x="20" y="194">they are 1% of replies and about 17% of all tokens generated</text>
<text class="l" x="20" y="214">set max_tokens near the longest answer you expect, not at the model's maximum</text>
</svg>
<figcaption>A missed stop is rare per reply and expensive in aggregate.</figcaption>
</figure>

## What a missed stop costs

Suppose a typical answer is 200 tokens, the limit is 4,096, and decoding runs at 20 ms per token.

| | tokens | time |
| --- | --- | --- |
| stops correctly | 200 | 4.0 s |
| misses the stop | 4,096 | **81.9 s** |

A runaway costs **20.5×** a normal reply. Now suppose the end token is missed 1% of the time — through sampling at high temperature, a template mismatch, or an unusual prompt. In 1,000 replies, 10 run away. Those 10 replies generate `10 × 4,096 = 40,960` tokens, against `990 × 200 = 198,000` for all the others: one per cent of replies, **about 17%** of everything generated. At a 10% miss rate, 100 runaways would make up over two-thirds of the tokens.

Runaways also hurt latency for everyone else, since a long generation occupies its slot in the batch for the whole 82 seconds.

## Getting it right

**Use the model's own chat template.** It contains the end-of-turn token the model was trained to produce. Serving libraries usually apply it from the model's configuration; custom prompt formats are where things go wrong.

**Register every end token.** Some models have more than one — an end-of-sequence token and an end-of-turn token. If the server only stops on one, the model ends its turn correctly and generation continues anyway.

**Set `max_tokens` to the task.** A classifier needs a handful of tokens; a summary perhaps a few hundred. Setting it to the model's maximum turns every missed stop into the most expensive possible failure.

**Use stop sequences for structure.** When asking for output in a delimited format, stopping on the closing delimiter is cheaper and more reliable than hoping the model ends there.

**Watch the finish reason.** Track the share of responses that end with `"length"`. A rise usually means a template or configuration change broke stopping, and it shows up there before it shows up on the bill.

## What to take away

Nothing in the generation loop stops it. Models stop because they were trained to emit an end token, because the caller's stop sequence appeared, or because the token limit was reached — and the last one is a failure, not an ending.

Missed stops are rare and expensive: a 200-token answer that runs to 4,096 costs 20.5× as much, and a 1% miss rate turns into about 17% of all tokens generated. Correct templates, every end token registered, and a `max_tokens` sized to the task keep them rare and cheap.
