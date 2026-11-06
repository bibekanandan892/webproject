---
title: "System One models"
date: "2026-11-06T10:20"
category: "AI"
tags: ["classification", "calibration", "decisions", "llm", "routing"]
summary: "Using a 70B language model to route a support ticket spends 241 times the arithmetic a small decision model needs — and returns a string that might not be one of the five queues. A System One model returns a typed answer with a calibrated probability instead."
draft: false
cover: "/blog/system-one-models.svg"
---

Psychology divides thinking into two modes. **System One** is fast and automatic — recognising a face, reading a word, judging whether a sentence sounds angry. **System Two** is slow and deliberate — long division, planning a trip, weighing an argument.

Language models are built like System Two. They answer by writing, one token at a time, and can reason step by step on the page. That makes them extraordinarily general. It also means every answer, however small, is a piece of generated text.

A **System One model** is the other kind: given a situation, it returns a *decision* — one option from a fixed list, a score, a yes or no — together with a probability that it is right. No text is generated. The output has a type.

## The problem with deciding by writing

A large share of what LLMs are used for in production is not writing at all. It is small decisions:

- Which of five queues should this ticket go to?
- Is this message spam?
- Does this transaction need review?
- Which tool should the agent call next?

Done with an LLM, each decision means building a prompt, generating a short answer, and parsing it. Three problems follow.

**Cost.** A routing decision with a 600-token prompt and a 20-token answer on a 70B model is about `2 × 70e9 × 620 = 8.7 × 10¹³` operations. A 300M-parameter model that reads the same 600 tokens and outputs one probability per queue needs `2 × 3e8 × 600 = 3.6 × 10¹¹`. That is **241×** less arithmetic for the same decision, and it shows up directly in latency and cost when the decision runs millions of times a day.

**The answer might not be an answer.** The LLM returns a string. It might be `"billing"`, or `"Billing"`, or `"billing_support"`, or `"I think this is a billing question"`, or the name of a queue that does not exist. Constrained decoding and output schemas reduce this; parsing code and retries absorb the rest. A typed model cannot do it at all: its output layer has exactly five positions, one per queue.

**The confidence is made up.** Ask an LLM how sure it is and it will write a number — "confidence: 0.9" — but that number is generated text like everything else. It is not, in general, true that the answers it labels 0.9 are right 90% of the time.

## What a System One model returns

Instead of text, the output is a typed structure:

| type | example | output |
| --- | --- | --- |
| choice | route a ticket | probabilities over a fixed list — billing 0.82, technical 0.11, … |
| score | rate urgency | a number in a fixed range, with an uncertainty |
| yes / no | needs human review? | one probability |

The list of options is part of the model's definition, not something the prompt asks it to respect. It can still be wrong — pick billing when the answer was technical — but it cannot answer with something outside the list.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Side by side: an LLM producing a free-text string that must be parsed, and a decision model producing a probability bar for each of five fixed queues." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WRITE AN ANSWER VS RETURN A DECISION</text>
<text class="b" x="20" y="48">LLM</text>
<rect x="20" y="58" width="240" height="60" rx="6" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<text class="l" x="30" y="80">"I think this is probably</text>
<text class="l" x="30" y="96">a billing_support issue,</text>
<text class="l" x="30" y="112">confidence: 0.9"</text>
<text class="l" x="20" y="140">→ parse, normalise, validate, retry</text>
<text class="l" x="20" y="158">8.7 × 10¹³ operations</text>
<text class="b" x="300" y="48">decision model</text>
<g fill="var(--primary)">
<rect x="380" y="60" width="131" height="12" rx="2" fill-opacity="0.8"/>
<rect x="380" y="78" width="18" height="12" rx="2" fill-opacity="0.45"/>
<rect x="380" y="96" width="6" height="12" rx="2" fill-opacity="0.45"/>
<rect x="380" y="114" width="5" height="12" rx="2" fill-opacity="0.45"/>
<rect x="380" y="132" width="3" height="12" rx="2" fill-opacity="0.45"/>
</g>
<text class="l" x="300" y="70">billing</text><text class="l" x="300" y="88">technical</text><text class="l" x="300" y="106">account</text><text class="l" x="300" y="124">sales</text><text class="l" x="300" y="142">other</text>
<text class="b" x="518" y="70">0.82</text>
<text class="l" x="300" y="158">3.6 × 10¹¹ operations — 241× fewer</text>
<path d="M20 180 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="204">the right side cannot answer outside the list, and its 0.82 can be calibrated</text>
<text class="l" x="20" y="224">the left side's 0.9 is text the model chose to write</text>
</svg>
<figcaption>A typed output removes parsing and makes the probability something you can test.</figcaption>
</figure>

## Calibration is the point

A probability is useful only if it means what it says. A model is *calibrated* if, among all the decisions it makes with probability 0.8, about 80% are correct.

Calibration is what turns a model into a policy. With calibrated probabilities you can say: automate every decision above 0.95, send the rest to a person — and know in advance what error rate the automated share will have. You can tune the threshold to trade cost against mistakes, and the trade is predictable.

Classifiers trained with a proper loss, such as cross-entropy, tend to be reasonably calibrated on data like their training data, and can be corrected with a simple rescaling fitted on held-out examples. They must be re-checked when the incoming data drifts. Text "confidence" from an LLM has no such guarantee and usually needs exactly the same held-out measurement before it can be trusted for anything.

## Where it works and where it does not

**Works:** high-volume decisions with a fixed set of outcomes and plenty of labelled history. Routing, triage, moderation, fraud flags, intent detection, choosing the next tool from a fixed set.

**Does not:** decisions where the options are not known in advance, where the answer needs explanation, or where the situation requires multi-step reasoning over new information. Those are System Two problems, and an LLM is the right tool.

The productive arrangement uses both. The System One model handles the confident majority instantly and cheaply. Anything it is unsure about — below the threshold — is escalated to an LLM that can reason about it, or to a human. The probability is what makes the hand-off possible.

## What to take away

A System One model answers with a typed decision and a probability rather than generated text. For a five-way routing decision it uses about 241× less arithmetic than a 70B LLM, cannot answer outside the allowed options, and produces a probability that can be calibrated and used to set automation thresholds.

Use it for fast, repeated, fixed-outcome decisions; keep the LLM for the cases that genuinely need thinking, and let the calibrated probability decide which is which.
