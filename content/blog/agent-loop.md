---
title: "The agent loop"
date: "2026-09-10T20:40"
category: "AI"
tags: ["agents", "loop", "cost", "context", "budgets"]
summary: "The loop is about twenty lines of ordinary code. Its cost is not ordinary — because the whole history is re-sent every turn, tokens grow with the square of the turn count."
draft: false
cover: "/blog/agent-loop.svg"
---

The loop is the part of an agent that is not a model. It calls the model, executes whatever the model asked for, appends the result, and calls again.

Written out it is unremarkable:

```python title="loop.py"
messages = [system_prompt, goal]

for step in range(MAX_STEPS):
    reply = model(messages, tools=TOOLS)
    messages.append(reply)

    if reply.final_answer:
        return reply.final_answer

    for call in reply.tool_calls:
        messages.append(run(call))

raise StepLimitReached()
```

One thing in there is worth stating plainly: **the model never runs a tool.** It emits a request, and the loop executes it. Everything the agent can actually do is defined by what that loop is willing to run.

## The cost is quadratic

A model keeps nothing between calls, so the loop keeps the history and re-sends all of it every turn. That is what makes an agent coherent across steps — and it means the cost does not grow the way people assume.

If each turn adds about 800 tokens, turn 10 is not sending 800 tokens. It is sending 8,000.

| turns | if it were linear | actually sent | ratio | cost |
| --- | --- | --- | --- | --- |
| 5 | 4,000 | 12,000 | 3.0× | $0.030 |
| 10 | 8,000 | 44,000 | 5.5× | $0.110 |
| 20 | 16,000 | 168,000 | **10.5×** | $0.420 |
| 40 | 32,000 | 656,000 | 20.5× | $1.640 |
| 60 | 48,000 | 1,464,000 | **30.5×** | $3.660 |

<figure>
<svg viewBox="0 0 560 240" width="560" role="img" aria-label="Two curves against turn count. The linear expectation rises gently while the actual tokens sent curve upward steeply, reaching about ten times the linear figure by twenty turns." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">WHAT IS ACTUALLY SENT</text>
<path d="M70 190 H500" stroke="var(--border)" stroke-width="1"/>
<path d="M70 40 V190" stroke="var(--border)" stroke-width="1"/>
<path d="M70 190 L142 189.2 L214 187.8 L286 185.9 L358 183.4 L430 180.4 L500 176.9" fill="none" stroke="color-mix(in srgb, var(--muted-foreground) 60%, transparent)" stroke-width="2"/>
<text class="l" x="440" y="170">linear guess</text>
<path d="M70 190 L142 186.3 L214 175.2 L286 156.6 L358 130.6 L430 97.2 L500 56.4" fill="none" stroke="color-mix(in srgb, var(--primary) 80%, transparent)" stroke-width="2.4"/>
<text class="v" x="430" y="48">actual</text>
<path d="M286 156.6 V190" stroke="var(--muted-foreground)" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="3 3"/>
<circle cx="286" cy="156.6" r="4" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="294" y="150">10.5x here</text>
<text class="l" x="70" y="208" text-anchor="middle">0</text>
<text class="l" x="286" y="208" text-anchor="middle">20</text>
<text class="l" x="500" y="208" text-anchor="middle">60</text>
<text class="l" x="285" y="228" text-anchor="middle">turns</text>
<text class="l" x="62" y="46" text-anchor="end">tokens</text>
</svg>
<figcaption>Turn n sends n times the per-turn size, so the total goes as N².</figcaption>
</figure>

The total is $T \cdot N(N+1)/2$. **Doubling the turn limit roughly quadruples the bill.**

This is the number that makes a step limit an economic decision rather than a safety afterthought. Raising `MAX_STEPS` from 20 to 40 sounds like giving the agent twice as long. It is closer to four times the cost.

## Trimming the history

The fix is not to re-send everything. Keep the recent turns in full and compress the older ones:

| turns | full history | recent 5 kept, older summarised | saved |
| --- | --- | --- | --- |
| 10 | 44,000 | 33,800 | 23% |
| 20 | 168,000 | 86,400 | 49% |
| 40 | 656,000 | **227,600** | 65% |
| 60 | 1,464,000 | 416,800 | 72% |

The saving grows with the length of the run, because it is the old turns — the ones there are most of — that get compressed.

What you lose is detail from earlier steps, and it matters which detail. The goal must survive intact, along with anything the agent might still need to refer back to. Summarising away a constraint the user gave at the start produces an agent that confidently violates it at turn 30.

## Stopping

Two exits, and both are required.

**The model says it is finished.** It returns an answer rather than a tool call. This is the intended one.

**The loop gives up.** A step counter runs out. This is not a failure mode to be engineered away — it is the only exit that is guaranteed to happen, because the first one depends on the model's judgement.

Production loops usually add two more, for the same reason: a time budget and a cost budget. A step limit does not bound spend if a single step can retrieve a very large document.

## What goes wrong

**It never stops.** Tool after tool, no answer. The step limit is the backstop; detecting a repeated identical call and telling the model it already tried that is the graceful version.

**It repeats itself.** The same call with the same arguments, getting the same result, expecting something different. Worth detecting explicitly, because it is invisible in aggregate metrics — the run completes, it just costs ten times what it should have.

**It overflows.** Given the quadratic growth above, this is not an edge case on a long run; it is the default outcome. Trimming has to be built in, not added when it first breaks.

**It stops too early.** Answers from partial information because nothing defined what finished means. That belongs in the instructions as a checkable condition.

## The short version

- The loop is ordinary code: call the model, run what it asked for, append the result, repeat.
- The model never executes anything — the loop does, which is where all the real control lives.
- Because the whole history is re-sent each turn, cost grows with the square of the turn count.
- Twenty turns sends 10.5× what a linear estimate suggests; doubling the limit quadruples the bill.
- Keeping the last few turns in full and compressing the rest saves 65% on a forty-turn run.
- Two exits are needed: the model finishing, and the loop giving up. Only the second is guaranteed.
- Add time and cost budgets, since a step limit does not bound spend.
