---
title: "AI agents"
date: "2026-09-10T11:20"
category: "AI"
tags: ["agents", "tools", "llm", "loop", "automation"]
summary: "An agent is a language model wrapped in a loop that lets it call tools and see what happened. The loop is the whole difference between answering a question and doing a job."
draft: false
cover: "/blog/ai-agents.svg"
---

A language model on its own reads text and writes text. Ask it something it cannot know and it will guess.

An agent is that same model wrapped in a loop that lets it call tools, see what came back, and decide what to do next. It keeps going until the job is done.

## What actually changes

Three things get called AI, and it is worth separating them.

A **plain model call** takes a prompt and returns a completion. One in, one out, nothing else happens.

A **chatbot** is the same thing with the conversation kept and replayed each turn. It remembers, but it still only produces text.

An **agent** can act. It is given a set of tools it may call, and something outside the model actually runs them and hands back the results.

The loop is what makes it an agent. Without it the model could ask for a tool once and never learn what the tool returned.

## The parts

**The model.** It decides what to do next. Worth being precise: it never runs anything itself. It emits a request — this tool, these arguments — and something else carries it out.

**Instructions.** The system prompt: what the job is, which tools exist, what the rules are, and what counts as finished.

**Tools.** Each one is a name, a description of when to use it, and a schema for its arguments. The description matters more than it looks — it is the only thing the model has to go on when choosing.

**Memory.** Short-term is the running history replayed each turn. Long-term is anything kept outside the conversation and looked up when needed.

**The loop.** Ordinary code. It calls the model, executes whatever tool the model asked for, appends the result, and calls the model again.

## The loop

<figure>
<svg viewBox="0 0 620 260" width="620" role="img" aria-label="A cycle: goal and history feed into the model, which chooses an action, the tool runs, its observation is appended to the history, and the cycle repeats. A separate arrow leaves the model when it decides the task is done, producing the answer." xmlns="http://www.w3.org/2000/svg">
<style>.b{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}</style>
<defs><marker id="ag" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="40" y="20">UNTIL IT SAYS IT IS FINISHED</text>
<rect x="40" y="40" width="150" height="52" rx="8" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="115" y="71" text-anchor="middle">goal + history</text>
<rect x="250" y="40" width="150" height="52" rx="8" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 58%, transparent)"/>
<text class="b" x="325" y="71" text-anchor="middle">model chooses</text>
<rect x="250" y="160" width="150" height="52" rx="8" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="325" y="191" text-anchor="middle">tool runs</text>
<rect x="40" y="160" width="150" height="52" rx="8" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="b" x="115" y="191" text-anchor="middle">observation</text>
<rect x="460" y="40" width="120" height="52" rx="8" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-dasharray="5 4"/>
<text class="b" x="520" y="71" text-anchor="middle">answer</text>
<path d="M198 66 H242" stroke="var(--muted-foreground)" stroke-opacity="0.65" stroke-width="1.5" marker-end="url(#ag)"/>
<path d="M325 100 V152" stroke="var(--muted-foreground)" stroke-opacity="0.65" stroke-width="1.5" marker-end="url(#ag)"/>
<path d="M242 186 H198" stroke="var(--muted-foreground)" stroke-opacity="0.65" stroke-width="1.5" marker-end="url(#ag)"/>
<path d="M115 152 V100" stroke="var(--muted-foreground)" stroke-opacity="0.65" stroke-width="1.5" marker-end="url(#ag)"/>
<path d="M408 66 H452" stroke="var(--muted-foreground)" stroke-opacity="0.65" stroke-width="1.5" marker-end="url(#ag)"/>
<text class="l" x="430" y="56" text-anchor="middle">done</text>
<text class="l" x="325" y="132" text-anchor="middle">one tool call</text>
<text class="l" x="115" y="132" text-anchor="middle">appended</text>
<text class="l" x="40" y="244">The model never runs anything. It asks; the loop executes.</text>
</svg>
<figcaption>Four steps, repeated. Everything an agent does comes out of going round this.</figcaption>
</figure>

Written out, the runtime is unremarkable:

```python title="agent_loop.py"
history = [system_prompt, goal]

for step in range(MAX_STEPS):
    reply = model(history, tools=TOOLS)
    history.append(reply)

    if reply.is_final:
        return reply.text

    for call in reply.tool_calls:
        result = TOOLS[call.name](**call.arguments)
        history.append(result)

raise StepLimitReached()
```

That is the entire idea. The intelligence is in the model's choices; the loop is plumbing.

## Watching one run

Give an agent three tools — `list_orders`, `get_delivery`, `calculate` — and this goal: *which suppliers delivered late last month, and by how many days?*

| step | what the model asks for | what comes back |
| --- | --- | --- |
| 1 | `list_orders(month="August")` | A-104, A-107, A-111, A-118, A-125 |
| 2 | `get_delivery` on all five at once | promised and actual dates for each |
| 3 | `calculate` on the five date differences | 0, +3, 0, +9, −1 |
| 4 | *finished* | Verrell 3 days late, Casswell 9 days late |

Two things in there are worth noticing.

At step 2 it issued five calls together rather than one at a time. Nothing in the loop forbids that, and when calls do not depend on each other it is simply faster.

And at no point did it decide in advance that there would be four steps. It asked for the orders, and what came back determined what it asked for next. That is the part a fixed script cannot do.

## When not to use one

An agent is the right shape when later steps depend on earlier results and the path cannot be known up front.

If the sequence is always the same, write the sequence. A fixed pipeline is faster, cheaper, and does the same thing every time — none of which an agent can promise. Paying a model to rediscover a path you already know is a bad trade, and it will occasionally rediscover a different one.

The same goes for anything a single call answers. Wrapping it in a loop adds latency and failure modes and buys nothing.

## What goes wrong

The happy path is easy. Nearly all the engineering is in the rest.

**It loops.** The same tool, the same arguments, forever — usually because the result never satisfies whatever it is waiting for. A hard step limit is not optional; it is the only guaranteed exit.

**It picks the wrong tool.** The model chooses from descriptions alone, so two tools described similarly will be confused with each other. Fixing this is writing better descriptions, not prompting harder.

**It invents a tool, or invalid arguments.** Validate arguments before executing and hand the error back as an observation. A well-phrased error is something the model can recover from; a crash is not.

**It runs out of context.** Every step appends to the history, so a long run eventually exceeds the window. Older steps have to be summarised while the goal and the recent steps are kept intact.

**It stops early.** It reports success on something half done, because nothing told it precisely what finished means. That belongs in the instructions, stated as a checkable condition.

## The short version

- An agent is a model, instructions, tools, memory, and a loop.
- The loop is what separates it from a chatbot: it can act and then see the result.
- The model never executes anything — it requests a tool call and the runtime carries it out.
- Independent calls can be issued together; dependent ones force another turn.
- The path is decided as it goes, which is the reason to use one and the reason it is unpredictable.
- If the steps are always the same, write a script instead.
- Step limits, argument validation, context trimming and a clear finish condition are the actual work.
