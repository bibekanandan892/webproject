---
title: "The future of software development"
date: "2026-08-20T20:10"
category: "AI"
tags: ["software-engineering", "ai-coding", "agents", "productivity", "verification"]
summary: "If writing code is 30% of the job, making it ten times faster makes the job 1.37× faster — and infinitely faster only 1.43×. The work that is left is deciding what to build and proving it works, and that is where the profession is heading."
draft: false
cover: "/blog/future-of-software-development.svg"
---

Coding agents can now read a repository, write a feature across a dozen files, run the tests and fix what fails. It is natural to ask what happens to software development when the writing of code costs almost nothing.

The answer is easier to reason about with a little arithmetic than with predictions, because the arithmetic is not new. It is Amdahl's law.

## Coding was never most of the job

Studies of how developers spend their time vary, but they agree on the shape: writing new code is a minority of the work. The rest is understanding the existing system, working out what should be built, reviewing, testing, debugging, coordinating with other people, and dealing with production.

Call writing code 30% of the job. If AI makes that part faster and nothing else changes:

| coding speed-up | whole job speed-up |
| --- | --- |
| 2× | 1.18× |
| 5× | 1.32× |
| 10× | **1.37×** |
| infinitely fast | **1.43×** |

Making the 30% free removes 30% of the time. Everything else still takes as long as it did. That is the ceiling on "AI writes the code" alone, and it is lower than the experience of using the tools suggests — because the tools feel fastest on exactly the part that was never the bottleneck.

## The bottleneck moves

When one stage of a pipeline gets much faster, the work piles up at the next one. With code generation nearly free, three stages become the constraint.

**Specification.** An agent builds what it is asked for. "Add export to CSV" leaves open which fields, what encoding, how to handle commas in values, who can use it, what happens with a million rows. A person used to resolve those questions while writing the code, often without noticing. Now they have to be resolved before — or the agent resolves them by guessing.

**Verification.** Generated code arrives faster than anyone can read it. Review becomes the slowest step, and reviewing code you did not write, in volume, is a different skill from writing it. Tests, types, and automated checks stop being good practice and become the only way to keep up.

**Integration and judgement.** Deciding which of three working approaches fits the system, what not to build, when to accept a trade-off. None of that is made faster by generating code faster.

If AI also speeds up testing and review — say 60% of the job made three times faster — the gain becomes **1.67×**. If everything except deciding, specifying and integrating — 40% of the job — were instantaneous, the ceiling is **2.5×**. The size of the remaining human share sets the limit, not the speed of the model.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Three stacked bars of a developer's time: today, with coding made free, and with coding, testing and review accelerated; the specification and decision share stays the same and becomes most of what is left." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHERE THE HOURS GO</text>
<text class="l" x="20" y="54">today</text>
<rect x="150" y="40" width="114" height="22" fill="var(--muted-foreground)" fill-opacity="0.45"/>
<rect x="264" y="40" width="114" height="22" fill="var(--muted-foreground)" fill-opacity="0.3"/>
<rect x="378" y="40" width="152" height="22" fill="var(--primary)" fill-opacity="0.8"/>
<text class="l" x="20" y="98">code free</text>
<rect x="150" y="84" width="114" height="22" fill="var(--muted-foreground)" fill-opacity="0.3"/>
<rect x="264" y="84" width="152" height="22" fill="var(--primary)" fill-opacity="0.8"/>
<text class="l" x="424" y="99">1.43×</text>
<text class="l" x="20" y="142">+ tests, review 3×</text>
<rect x="150" y="128" width="76" height="22" fill="var(--muted-foreground)" fill-opacity="0.3"/>
<rect x="226" y="128" width="152" height="22" fill="var(--primary)" fill-opacity="0.8"/>
<text class="l" x="386" y="143">1.67×</text>
<text class="l" x="150" y="34">code 30%</text><text class="l" x="264" y="34">test, review, debug 30%</text>
<text class="b" x="378" y="34">decide, specify, integrate 40%</text>
<path d="M20 172 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="196">the part nobody automates becomes most of the job</text>
<text class="l" x="20" y="216">its size — not the model's speed — sets the ceiling</text>
</svg>
<figcaption>Removing a stage does not shorten the others. It makes them the whole story.</figcaption>
</figure>

## What the work becomes

Follow the bottlenecks and the shape of the job comes out of them.

**Writing intent precisely.** The highest-leverage artefact becomes the description of what the software must do: requirements, constraints, edge cases, acceptance criteria. A clear definition of done is what lets an agent finish a task correctly without supervision — and its absence is what makes agents produce plausible code that solves the wrong problem.

**Building the checks.** Test suites, type systems, linters, property tests, staging environments, observability. These are what make it safe to accept code faster than it can be read. Teams that already had good automated verification get the largest gains from AI; teams that relied on careful reading get the smallest.

**Architecture and taste.** Agents are good at local changes and weaker at keeping a large system coherent over time. Someone has to decide boundaries, choose what to standardise, and say no to complexity that each individual change would happily add.

**Managing agents.** Splitting work into tasks an agent can finish, running several in parallel, reviewing their output, and knowing which kinds of task to trust them with. It resembles leading a team more than typing.

## What stays hard

Understanding the problem. Most failed software was not failed by bad code; it built the wrong thing, or the right thing for the wrong users, or something that could not be operated. Cheaper code makes it cheaper to build the wrong thing quickly.

Owning the result. When a system fails in production at 3 a.m., someone has to understand it well enough to fix it. Code nobody on the team has read is code nobody can debug quickly. Keeping understanding in the team — through review, documentation and deliberate ownership — becomes a real cost to plan for, not a side effect of writing it yourself.

## What to take away

AI is making code nearly free to write, and Amdahl's law limits what that alone can do: if coding is 30% of the job, even infinitely fast coding makes the job 1.43× faster.

The rest of the gain has to come from the stages that remain — specifying what to build, verifying that it works, and keeping the system coherent. Those become the core of the profession. The developers who do best will be the ones who can state intent precisely and prove that the result matches it.
