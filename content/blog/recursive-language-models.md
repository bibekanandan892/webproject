---
title: "Recursive language models"
date: "2026-09-10T18:40"
category: "AI"
tags: ["long-context", "recursion", "agents", "code-execution", "cost"]
summary: "Rather than reading a huge input, the model writes code that reads it — calling other models on the pieces and seeing only what comes back. What that buys is not fewer tokens."
draft: false
cover: "/blog/recursive-language-models.svg"
---

There is a limit to how much text can usefully go into one model call. Not just the hard context limit — well before that, quality falls off. Material in the middle of a very long input gets used less reliably than material at the ends.

A recursive language model works around that by never putting the input in front of the main model at all.

## The input becomes a variable

The full text sits in a code environment as a variable. The main model gets a short prompt saying that the variable exists, roughly what it contains, and that it has two things available: the ability to run code, and a function that calls another language model.

Then it writes code.

```python title="root_call.py"
tickets = context.split("\n---\n")

findings = [
    call_llm(f"What is the underlying cause here? One line.\n\n{t}")
    for t in tickets
]

print(findings)
```

Each `call_llm` sends one ticket to a separate model instance and gets back a single line. The main model never sees a ticket. It sees four hundred one-line answers, decides whether that is enough, and either answers or writes more code.

That last part is what makes it recursive rather than a fixed pipeline: the model chooses how to split the input, and it chooses differently depending on what is being asked. A question about one specific customer would produce a filter before the fan-out. A question about overall themes would produce grouping.

## What it actually buys

Four hundred support tickets, about 600 tokens each — 240,000 tokens of source.

| | one call | fan out per ticket | two levels |
| --- | --- | --- | --- |
| largest single context | 240,000 | **660** | **660** |
| what the root model sees | 240,000 | 16,060 | **860** |
| total tokens processed | 240,000 | 296,060 | 298,860 |
| model calls | 1 | 401 | 421 |

<figure>
<svg viewBox="0 0 560 242" width="560" role="img" aria-label="A tree. The root model sees only short summaries; the middle level sees groups of summaries; the leaves are the only calls that read the raw source text." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.g{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONLY THE LEAVES TOUCH THE SOURCE</text>
<rect x="215" y="36" width="130" height="34" rx="7" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<text class="b" x="280" y="58" text-anchor="middle">root</text>
<text class="g" x="360" y="58">sees 860 tokens</text>
<rect x="95" y="106" width="110" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="225" y="106" width="110" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="355" y="106" width="110" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="b" x="150" y="127" text-anchor="middle">group</text>
<text class="b" x="280" y="127" text-anchor="middle">group</text>
<text class="b" x="410" y="127" text-anchor="middle">group</text>
<path d="M255 70 L165 100" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.3"/>
<path d="M280 70 V100" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.3"/>
<path d="M305 70 L395 100" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.3"/>
<rect x="40" y="172" width="56" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="104" y="172" width="56" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="168" y="172" width="56" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="232" y="172" width="56" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="296" y="172" width="56" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="360" y="172" width="56" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="424" y="172" width="56" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<path d="M130 138 L100 166 M150 138 V166 M170 138 L200 166" stroke="var(--muted-foreground)" stroke-opacity="0.4" stroke-width="1.2"/>
<path d="M260 138 L250 166 M280 138 V166 M300 138 L324 166" stroke="var(--muted-foreground)" stroke-opacity="0.4" stroke-width="1.2"/>
<path d="M390 138 L388 166 M410 138 L440 166" stroke="var(--muted-foreground)" stroke-opacity="0.4" stroke-width="1.2"/>
<text class="g" x="490" y="192">660 each</text>
<text class="g" x="20" y="222">the 240,000 tokens of source exist only at the bottom row</text>
</svg>
<figcaption>Each call reads a little. Nothing in the tree ever reads all of it.</figcaption>
</figure>

The number that changed is the first row. No call has to handle more than 660 tokens — **364 times smaller** than the original problem — and every one of them is operating in the range where models are reliable.

The number that did *not* improve is the third row. Total tokens went **up**, by about 23%, because each sub-call repeats a prompt and produces output. This is not a technique for processing fewer tokens. It is a technique for never processing many at once.

## When it is cheaper, and when it is not

That distinction decides the economics, and the answer depends entirely on which model runs the leaves.

| | cost |
| --- | --- |
| one frontier call over the whole input | $0.606 |
| leaves on a small model, root on the frontier | **$0.067** |
| every call on the frontier model | $0.898 |

Nine times cheaper, or half again more expensive, from the same structure.

The saving does not come from recursion. It comes from the fan-out moving almost all the token volume onto a cheap model, and leaving only the small synthesis step on the expensive one. Run the whole tree on your best model and you pay a premium for the privilege of splitting the work up.

Which is the right way to think about it: recursion is what makes it *possible* to use a small model on a large problem, and that is where the money is.

## Against retrieving instead

Search picks the relevant pieces before the model sees anything. Its weakness is that it has to decide relevance from the question alone, which fails when what matters cannot be recognised by resemblance — counting, comparing across everything, or finding what is absent.

A recursive model visits everything and decides as it goes, and can change strategy after seeing partial results. That costs far more, since it touches the whole input rather than a retrieved slice.

Roughly: search when the answer is *in* a few places, recurse when the answer is *about* all of it.

## What it costs you

**Latency.** Four hundred calls fan out in parallel, but the levels are sequential, and the slowest leaf holds up its group.

**Errors compound.** A leaf that misreads its ticket returns a confident wrong line, and the root cannot tell — it never saw the source. Nothing downstream can catch it.

**It is hard to debug.** The model wrote the code that split the input. When an answer is wrong, the fault may be in a leaf, in the synthesis, or in a split that put related material in different groups. The transcript shows what happened without showing why.

**It needs real infrastructure.** A sandboxed environment that runs model-written code, with limits on time, calls and spend.

## The short version

- The input stays in a code environment; the main model gets the variable name, not the contents.
- It writes code that slices the input and calls other models on the pieces.
- Only short summaries come back, so the root's context stays small.
- On 400 tickets: largest single context 240,000 → 660 tokens, a 364× reduction.
- Total tokens go *up* about 23% — this does not reduce work, it redistributes it.
- It is 9× cheaper only if the leaves run on a small model; all-frontier is more expensive than one big call.
- Search when the answer sits in a few places; recurse when it is about the whole input.
- The costs are latency, uncatchable leaf errors, and debugging model-written code.
