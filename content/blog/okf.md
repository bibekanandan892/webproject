---
title: "OKF"
date: "2026-09-11T23:00"
category: "AI"
tags: ["okf", "metadata", "agents", "data-context", "markdown"]
summary: "An agent can work out a column's type by looking. It cannot work out that status 'H' means excluded from revenue, because that fact is in someone's head — and four rules out of five are like that."
draft: false
cover: "/blog/okf.svg"
---

The Open Knowledge Format is a standard for writing down what an organisation knows about its own data, as a folder of plain markdown files that any tool can read.

That description makes it sound like documentation, which undersells the specific problem it solves.

## Recoverable and unrecoverable

Point an agent at a database and it can find out a great deal by looking. Given a `shipments` table it can read the schema, sample rows, and establish every column's type, which ones are nullable, roughly how many distinct values each holds. All eighteen columns, no help needed.

What it cannot establish, by any amount of querying:

- A `status` of `'H'` means held for manual review, and those rows must be excluded from any revenue figure.
- `delivered_at` is populated by a nightly job, so today's rows are legitimately null rather than missing.
- There are two weight columns and the older one stopped being maintained in March.
- `region` uses internal zone codes, not the ones the reporting team uses.
- A carrier correction can arrive weeks later and rewrite a completed row.

None of those is visible in the data. A sample of `status` values yields `A`, `H`, `C`, `X` with plausible frequencies and no indication of what any of them means or which to exclude. The information exists only in a person.

| of 5 rules that change the answer | |
| --- | --- |
| inferable from the data with effort | 1 (20%) |
| not inferable at any cost | **4 (80%)** |

That ratio is the whole argument. Most of what an agent needs is not discoverable, so "give the agent database access" does not get it there. It will produce a confident, well-formed, wrong number — and the wrongness will be invisible, because the query was valid and the rows were real.

<figure>
<svg viewBox="0 0 560 284" width="560" role="img" aria-label="A split showing schema facts an agent can discover by sampling against business rules it cannot discover at all." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHAT LOOKING AT THE DATA CAN AND CANNOT TELL YOU</text>
<rect x="20" y="40" width="250" height="128" rx="6" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="var(--primary)" stroke-opacity="0.5"/>
<text class="b" x="34" y="62">discoverable by sampling</text>
<text class="l" x="34" y="86">column types · 18 of 18</text>
<text class="l" x="34" y="106">nullability · 18 of 18</text>
<text class="l" x="34" y="126">distinct value counts · 18 of 18</text>
<text class="l" x="34" y="146">which values occur</text>
<text class="b" x="34" y="162">free, and not what you needed</text>
<rect x="290" y="40" width="250" height="128" rx="6" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="304" y="62">not discoverable at all</text>
<text class="l" x="304" y="86">'H' must be excluded</text>
<text class="l" x="304" y="106">nulls today are expected</text>
<text class="l" x="304" y="126">the old weight column is dead</text>
<text class="l" x="304" y="146">region codes are internal</text>
<text class="l" x="304" y="162">4 of the 5 rules that matter</text>
<path d="M20 192 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="216">the query will be valid, the rows will be real, the number will be wrong</text>
<text class="l" x="20" y="238">and nothing in the result will indicate that</text>
<text class="l" x="20" y="262">the only fix is that someone writes the right-hand column down</text>
</svg>
<figcaption>Access to the data is not access to the knowledge. They are different things and only one of them can be granted.</figcaption>
</figure>

## What a bundle looks like

A folder of markdown files, arranged by what they describe:

```
logistics/
├── index.md
├── tables/
│   ├── shipments.md
│   └── carriers.md
└── metrics/
    └── on-time-rate.md
```

Each file opens with frontmatter. Exactly one field is required — `type`, saying what kind of thing this file describes — with a handful of conventional optional ones: a title, a description, a pointer to the actual resource, tags, a timestamp.

One required field is a deliberate choice. A format that demanded a rigorous taxonomy would not get filled in; a format that demands almost nothing gets filled in, and partial knowledge written down beats complete knowledge that only exists in conversation.

Files link to each other with ordinary markdown links. A foreign key in `shipments` becomes a link to `carriers.md`, which turns the folder into a graph an agent can walk: read the table, notice it references another, follow it.

## Why markdown, and why in the repository

Both halves of that matter.

**Plain text** means no server to run, no schema migration, no client library. Any agent that can read a file can consume it, which is the entire point of calling it a format rather than a product.

**In version control, next to the code** means the knowledge is reviewed in the same pull request as the change that invalidated it. This is the part that determines whether a knowledge base is trustworthy in a year. A wiki page drifts silently because nothing forces anyone to look at it. A file beside the migration that renamed the column shows up in the diff.

It also means the knowledge has a history. Why a rule exists is often more useful than the rule, and `git log` answers it for free.

## The cost of not having it

For the one rule in five that *is* recoverable, discovery is slow. Six exploratory queries at roughly a second each, with a model turn between them, is about **12.6 seconds** before the agent can write the query it actually wanted — against 1.5 seconds to read one 900-token file. An 8.4× difference, repeated every session, since nothing learned this way persists.

For the other four, there is no amount of time that helps.

## Where it sits next to other standards

Three different questions, easy to conflate:

- **What can the agent reach?** — a connectivity protocol, which exposes tools and data sources.
- **How should this be done?** — a procedure or skill, which describes a workflow.
- **What is this thing and what is true about it?** — this format.

An agent with connectivity and no knowledge can query anything and understand none of it. The three are complementary, and the knowledge layer is the one most often assumed to be unnecessary because the data is right there.

## What to take away

The reason to write this down is not tidiness. It is that four fifths of the context an agent needs cannot be obtained by giving it access to the data.

Which makes the useful test for any candidate fact simple: **could an agent work this out by looking?** If yes, it probably does not need to be written. If no, it will never be known unless someone writes it.
