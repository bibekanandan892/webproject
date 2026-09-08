---
title: "Harness engineering in AI"
date: "2026-09-07T21:23"
category: "AI"
tags: ["llm", "agents", "harness", "production", "evaluation"]
summary: "A model on its own can only turn text into more text. The harness is everything you build around it — tools, memory, guardrails, retries — and it is usually where most of the work lives."
draft: false
cover: "/blog/harness-engineering-in-ai.svg"
---

A language model does one thing: text in, text out. It cannot look anything up, cannot remember yesterday, cannot check whether it was right, and cannot do anything at all in the outside world.

Harness engineering is everything you build around the model to close that gap. The model is one component. The harness is the system that makes it useful.

## Why the model is not the product

Picture hiring someone genuinely brilliant, then giving them no logins, no access to your systems, no notebook, and no colleague to check their work. On day two they remember nothing about day one. They would still be brilliant, and still unable to do the job.

That is a raw model. Everything that turns it into something a user can rely on lives outside it:

- reaching real data and real systems
- remembering what was said earlier
- coping when something fails
- following instructions the same way every time
- knowing whether the output was any good
- seeing what is happening once real users arrive

A better model raises the ceiling. The harness decides how much of that ceiling you actually reach.

## The parts of a harness

Most harnesses end up with the same seven pieces.

| part | what it does |
| --- | --- |
| **Prompts** | Assembles the system instructions, templates and context sent on each call |
| **Tools** | Declares what the model may call, and actually runs it when it asks |
| **Memory** | Keeps conversation history, and compresses it before it overruns the context |
| **Errors** | Handles a failed tool, a malformed response, a timeout, a rate limit |
| **Input and output** | Validates what goes in, and parses and checks what comes back |
| **Guardrails** | Blocks unsafe or out-of-scope requests and responses |
| **Observability** | Logs, traces and metrics, so a production problem is diagnosable |

None of this is model work. All of it is engineering.

## The loop that makes an agent

An agent is a harness running a loop.

The model never executes anything itself. It reads what it has been given and says what it would like to happen next. Everything else is the harness's job:

<figure>
<svg viewBox="0 0 700 208" width="700" role="img" aria-label="The agent loop: build the prompt, send it to the model, and if the model asks for a tool, run it, append the result and go back to the model. When it stops asking for tools, return the answer." xmlns="http://www.w3.org/2000/svg">
<style>.b{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.m{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<rect x="0" y="24" width="150" height="46" rx="8" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="b" x="75" y="51" text-anchor="middle">build prompt</text>
<rect x="196" y="24" width="130" height="46" rx="8" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="b" x="261" y="51" text-anchor="middle">model</text>
<rect x="372" y="24" width="170" height="46" rx="8" fill="var(--secondary)" stroke="var(--border)"/>
<text class="b" x="457" y="51" text-anchor="middle">tool call?</text>
<path d="M150 47 L192 47" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.5" fill="none" marker-end="url(#ah)"/>
<path d="M326 47 L368 47" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.5" fill="none" marker-end="url(#ah)"/>
<rect x="372" y="148" width="170" height="46" rx="8" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="b" x="457" y="175" text-anchor="middle">run the tool</text>
<rect x="150" y="148" width="170" height="46" rx="8" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="b" x="235" y="175" text-anchor="middle">append result</text>
<path d="M457 70 L457 144" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.5" fill="none" marker-end="url(#ah)"/>
<text class="m" x="466" y="112">yes</text>
<path d="M372 171 L324 171" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.5" fill="none" marker-end="url(#ah)"/>
<path d="M235 148 L235 74" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.5" fill="none" marker-end="url(#ah)"/>
<text class="m" x="243" y="112">next turn</text>
<rect x="560" y="24" width="140" height="46" rx="8" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="b" x="630" y="51" text-anchor="middle">answer</text>
<path d="M542 47 L556 47" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.5" fill="none" marker-end="url(#ah)"/>
<text class="m" x="548" y="18">no</text>
</svg>
<figcaption>The model only ever answers. Every other step is code you write.</figcaption>
</figure>

Take a support agent asked: *has order 4172 shipped, and if not, tell the customer when it will?*

The harness assembles the prompt — the instructions, the available tools, the question — and sends it. The model replies asking for a tool:

```
lookup_order(id=4172)
```

The harness runs that against the real system, gets back `status: packing, ships: 9 September`, appends it to the conversation, and calls the model again. Now the model asks for the second tool:

```
send_message(to="customer", text="Your order is packed and ships on 9 September.")
```

The harness runs that too, appends the result, and calls the model once more. This time the model asks for nothing, so the loop ends and its final text is returned.

Three model calls, two tool executions, one answer. The model decided *what* to do. The harness did all of it.

## Knowing whether it works

You cannot improve what you cannot measure, and "it seemed fine when I tried it" does not survive contact with real users.

An evaluation harness is a second harness whose job is grading the first. It holds a fixed set of test inputs, runs them through the system, and scores the results.

How you score depends on the task. When there is a right answer — a lookup, a classification, an extraction — compare against it directly and count. When there isn't — a summary, an explanation, a reply to a customer — the usual approach is to have another model grade the output against written criteria.

The point of fixing the test set is that you can change a prompt, swap a model, or rewrite a tool, and see whether things got better or worse instead of guessing.

## What keeps it manageable

- **Keep the parts separate.** Prompt assembly, tool execution, and memory should be independently replaceable. They change at different rates.
- **Log everything.** Every prompt, every tool call, every response. When something goes wrong in production, the log is all you have.
- **Add guardrails early.** Retrofitting safety onto a system that already has users is far harder than building it in.
- **Assume tools fail.** Timeouts, bad input, rate limits. Decide what happens on each, rather than letting an exception escape.
- **Test the harness itself.** It is ordinary code with ordinary bugs, and most production incidents come from it rather than from the model.
- **Watch it after launch.** Real traffic finds inputs your test set never had.

## The short version

- A model only maps text to text. Everything else is the harness.
- The harness handles prompts, tools, memory, errors, I/O, guardrails and observability.
- An agent is the harness looping: call the model, run whatever tool it asks for, feed the result back, repeat until it stops asking.
- An evaluation harness with a fixed test set is how you tell whether a change helped.
- The harness is ordinary software, and it is usually most of the code.
