---
title: "AI agent evaluation"
date: "2026-09-10T20:00"
category: "AI"
tags: ["agents", "evaluation", "trajectory", "reliability", "testing"]
summary: "Judging an agent by whether it finished is not enough, because per-step reliability compounds. A 95%-per-step agent completes a twenty-step task about a third of the time."
draft: false
cover: "/blog/ai-agent-evaluation.svg"
---

An agent does not produce one answer. It produces a sequence of decisions — which tool, which arguments, what to do with the result — and then an answer at the end.

Scoring only the answer therefore discards most of what happened, including whether it was earned or lucky.

## Why the steps have to be measured

Because per-step reliability compounds, and the compounding is brutal.

| per step | 5 steps | 10 steps | 20 steps | 50 steps |
| --- | --- | --- | --- | --- |
| 0.999 | 99.5% | 99.0% | 98.0% | 95.1% |
| 0.99 | 95.1% | 90.4% | 81.8% | 60.5% |
| 0.95 | 77.4% | 59.9% | **35.8%** | 7.7% |
| 0.90 | 59.0% | 34.9% | 12.2% | 0.5% |
| 0.80 | 32.8% | 10.7% | 1.2% | 0.0% |

<figure>
<svg viewBox="0 0 580 242" width="580" role="img" aria-label="Curves showing task completion rate falling as the number of steps grows, for several per-step reliabilities. At ninety-five percent per step the curve has fallen to about a third by twenty steps." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">RELIABILITY COMPOUNDS</text>
<path d="M70 180 H520" stroke="var(--border)" stroke-width="1"/>
<path d="M70 36 V180" stroke="var(--border)" stroke-width="1"/>
<path d="M70 38.9 L115 40.3 L160 41.8 L250 44.6 L340 47.5 L430 50.3 L520 53.1" fill="none" stroke="color-mix(in srgb, var(--primary) 80%, transparent)" stroke-width="2.2"/>
<text class="v" x="526" y="50">0.999</text>
<path d="M70 38.9 L115 45.9 L160 52.7 L250 65.6 L340 77.9 L430 89.4 L520 100.2" fill="none" stroke="color-mix(in srgb, var(--primary) 60%, transparent)" stroke-width="2.2"/>
<text class="v" x="526" y="102">0.99</text>
<path d="M70 38.9 L115 71.4 L160 100.6 L250 149.8 L340 169.3 L430 176.4 L520 178.9" fill="none" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-width="2.2"/>
<text class="l" x="526" y="150">0.95</text>
<path d="M70 38.9 L115 96.0 L160 133.4 L250 168.6 L340 177.9 L430 179.7 L520 180.0" fill="none" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)" stroke-width="2.2"/>
<text class="l" x="526" y="176">0.90</text>
<text class="l" x="70" y="198" text-anchor="middle">0</text>
<text class="l" x="250" y="198" text-anchor="middle">20</text>
<text class="l" x="430" y="198" text-anchor="middle">40</text>
<text class="l" x="280" y="218" text-anchor="middle">steps in the task</text>
<text class="l" x="62" y="44" text-anchor="end">100%</text>
<text class="l" x="62" y="184" text-anchor="end">0</text>
</svg>
<figcaption>The difference between 0.95 and 0.99 per step barely shows at five steps and dominates at fifty.</figcaption>
</figure>

A 95% success rate per step sounds respectable. Over twenty steps it finishes **35.8%** of the time. To complete twenty steps nine times out of ten you need to be right on **99.5%** of individual steps.

This is why a final-outcome number is not enough on its own. Two agents can both complete 60% of tasks while having quite different per-step reliabilities, and the one with the better steps will pull ahead as tasks get longer — which is exactly what happens as you deploy it on real work.

## What to measure

**The outcome.** Did it finish the task correctly? Simple to define, matches what a user cares about, and says nothing about why a failure happened.

**The trajectory.** Did it take sensible steps in a sensible order? This is where debugging lives, and where luck gets separated from skill. An agent that reached the right answer without calling the tool that would have told it the answer has guessed, and it will not guess right next time.

The trouble with trajectories is that there is rarely one correct path. Rather than demanding an exact sequence, it is usually more useful to check whether the required steps all happened (in order or not), what fraction of the steps taken were useful, and what fraction of the necessary ones were missed.

**The tool calls specifically.** Was the right tool picked, were the arguments valid, did the call succeed, was the result used correctly, and was a non-existent tool ever invented. These are structured and machine-checkable, and they are where a large share of failures actually are.

## One run tells you nothing

Agents are not deterministic. The same task twice produces different trajectories, and sometimes different outcomes.

| runs | interval on the success rate |
| --- | --- |
| 1 | ±78.4 pts |
| 3 | ±45.3 pts |
| 10 | ±24.8 pts |
| 30 | ±14.3 pts |
| 100 | ±7.8 pts |
| 250 | ±5.0 pts |

Three runs pins the success rate to about ±45 points, which is to say not at all. Telling an 80% agent from a 70% one needs roughly 145 runs of each.

Which puts a hard floor under the cost of evaluating a change. If a prompt tweak is reported to have improved success from 70% to 80% on five runs, that is noise.

The practical compromise is a fixed test set run several times, reporting the average *and the worst case*. For anything that takes real actions, the worst case is the number that matters.

## What else has to be tracked

Success rate alone will happily approve an agent that is unusable.

**Steps per task.** Fewer is better, and a rising step count is often the first sign of a prompt change gone wrong.

**Cost and latency per task.** An agent that succeeds 95% of the time at four dollars and ninety seconds a task may be worse than one at 88%, twenty cents and twelve seconds. Nothing in a quality metric surfaces that.

**Recovery.** When a tool errors, does the agent adapt or collapse? Real tools fail, so this is a property worth measuring on purpose by injecting failures.

**Loops.** The same call repeated forever. Cap steps and count how often the cap is hit — that number should be near zero and is easy to forget to look at.

## Testing safely

An agent under evaluation is taking real actions. Send an email during a test run and the email is sent.

So evaluation runs against a sandbox: fake tools with the same interfaces, seeded data, a database that gets reset. This also fixes reproducibility — an agent evaluated against the live web is being scored partly on what the web did that day.

And build the test set from **real tasks**, including the ones that go wrong: ambiguous requests, tools that fail, inputs designed to push it somewhere it should not go. Easy tasks confirm the agent works on easy tasks.

## The short version

- An agent produces a sequence of decisions, so scoring only the final answer discards most of the evidence.
- Per-step reliability compounds: 95% per step is 35.8% over twenty steps.
- Finishing twenty steps nine times in ten needs 99.5% per step.
- Outcome says whether it worked; trajectory says why, and separates skill from luck.
- Tool selection, arguments and result handling are structured and cheap to check automatically.
- Agents are non-deterministic — three runs measures nothing; distinguishing 80% from 70% takes about 145.
- Track steps, cost, latency, recovery from tool failures, and how often the step cap is hit.
- Evaluate in a sandbox, because a test run takes real actions and the live world is not reproducible.
