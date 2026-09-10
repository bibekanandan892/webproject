---
title: "ReAct agents"
date: "2026-09-10T12:40"
category: "AI"
tags: ["agents", "react", "reasoning", "tools", "trace"]
summary: "ReAct makes an agent write down its reasoning before every action. The thought is not decoration — it is what the model reads back on the next step, and it is the only place you can see why anything happened."
draft: false
cover: "/blog/react-agents.svg"
---

ReAct is short for reasoning and acting. It is a pattern for building an agent where every step follows the same three beats: a **thought** about what to do, an **action** taken, and an **observation** of what came back.

The loop repeats those beats until the model decides it has enough to answer.

## Why write the thought down

The actions and observations are obviously necessary. The thought is the part that looks optional, and it is not.

It goes into the transcript. On the next step the model reads its own reasoning back, along with what the tool returned, and that is what keeps a sequence of calls coherent rather than each one being decided from scratch.

It is also the only record of *why*. When an agent takes a strange action, the observation tells you what it got and the action tells you what it did — the thought is the only thing that tells you what it believed at the time. Debugging without it means guessing.

## The parts

A model that decides what happens next. A **system prompt** that sets out the pattern, the tools, and the rules. **Tools**, each with a name, a description, and a schema. **Memory**, which here just means the running transcript. And a **loop controller** — ordinary code that calls the model, runs whatever tool it asked for, appends the result, and calls again.

The tool descriptions deserve more care than they usually get. They are the entire basis on which the model chooses, so two tools described similarly will be picked between at random.

## A trace

Three tools — `query_sales`, `calculate` — and the question: *did we ship more in Q3 than Q2, and by how much?*

| | |
| --- | --- |
| **Thought** | I need both quarters' totals, and I do not know either. |
| **Action** | `query_sales(quarter="Q2")` |
| **Observation** | 18,400 units |
| **Thought** | Now the other quarter. |
| **Action** | `query_sales(quarter="Q3")` |
| **Observation** | 21,850 units |
| **Thought** | Higher. The percentage change needs computing, not estimating. |
| **Action** | `calculate("(21850 - 18400) / 18400 * 100")` |
| **Observation** | 18.75 |
| **Final answer** | Q3 shipped 21,850 against Q2's 18,400 — up 18.75%. |

Two habits worth noticing.

It fetched both numbers before doing anything with them, because the second query did not depend on the first result. And it used a calculator rather than doing the arithmetic itself, which is what a well-written system prompt asks for — a model producing a percentage from inside its own weights is guessing at a digit level.

## What the transcript looks like

<figure>
<svg viewBox="0 0 560 300" width="560" role="img" aria-label="A vertical transcript of alternating thought, action and observation entries, with a bracket on the right indicating that the whole transcript is re-sent to the model at every step." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.t{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.o{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="30" y="18">THE TRANSCRIPT IS THE MEMORY</text>
<rect x="30" y="30" width="340" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="t" x="42" y="49">thought · need both quarter totals</text>
<rect x="30" y="66" width="340" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="t" x="42" y="85">action · query_sales(Q2)</text>
<rect x="30" y="102" width="340" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="o" x="42" y="121">observation · 18,400</text>
<rect x="30" y="138" width="340" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="t" x="42" y="157">thought · now the other quarter</text>
<rect x="30" y="174" width="340" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 36%, transparent)"/>
<text class="t" x="42" y="193">action · query_sales(Q3)</text>
<rect x="30" y="210" width="340" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="o" x="42" y="229">observation · 21,850</text>
<text class="l" x="42" y="262">· · ·</text>
<path d="M382 30 h8 V240 h-8" fill="none" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-width="1.4"/>
<text class="l" x="402" y="118">all of it goes</text>
<text class="l" x="402" y="134">back to the</text>
<text class="l" x="402" y="150">model on the</text>
<text class="l" x="402" y="166">next step</text>
</svg>
<figcaption>Nothing is summarised while the run is short. Each step reads everything the previous steps produced.</figcaption>
</figure>

That is also the pattern's main cost. The transcript only grows, and every step re-sends all of it, so a twenty-step run pays for its early steps twenty times over.

## The loop

```python title="react_loop.py"
messages = [SYSTEM_PROMPT, question]

for step in range(MAX_STEPS):
    reply = model(messages, tools=TOOLS)
    messages.append(reply)

    if reply.final_answer:
        return reply.final_answer

    for call in reply.tool_calls:
        try:
            observation = TOOLS[call.name](**call.arguments)
        except Exception as err:
            observation = f"tool failed: {err}"
        messages.append(observation)

raise StepLimitReached()
```

The `except` is the part people leave out. A tool that raises kills the run; a tool whose failure is handed back as an observation gives the model something to react to — and reacting to what came back is the entire pattern.

## What goes wrong

**It loops.** The same action with the same arguments, over and over. `MAX_STEPS` is the guaranteed exit; detecting a repeated action and injecting a nudge to try something else is the graceful one.

**It picks the wrong tool.** Almost always a description problem rather than a reasoning problem.

**It invents a tool or malformed arguments.** Validate before executing, and return the validation error as an observation.

**It runs out of context.** Inevitable on long runs, since the transcript only grows. Old observations get summarised or dropped, while the question and the recent steps stay intact.

**It stops too early.** It answers from two observations when it needed four. The fix is in the prompt: state what has to be true before answering, as something checkable.

## The short version

- ReAct runs thought, action, observation, repeatedly, until a final answer.
- The thought is written into the transcript, so the model reads its own reasoning back each step.
- It is also the only record of why an action was taken, which is what makes the run debuggable.
- Tool choice comes down to tool descriptions.
- The transcript is the memory, and it is re-sent whole on every step — which is the pattern's main cost.
- Tool failures should come back as observations, not exceptions.
- A step limit is the only guaranteed way out.
