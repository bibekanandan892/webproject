---
title: "Jailbreaking in LLMs"
date: "2026-11-06T19:20"
category: "AI"
tags: ["jailbreaking", "llm-safety", "guardrails", "red-teaming", "security"]
summary: "A jailbreak is an input crafted to get a model to do what its training told it not to. Attackers get unlimited retries: a trick that works 2% of the time succeeds within 100 attempts 86.7% of the time. That is why defence is layered — three independent filters that each miss 10% let through 0.1%."
draft: false
cover: "/blog/jailbreaking-in-llms.svg"
---

Models are trained to refuse certain requests — detailed instructions for serious harm, content that targets individuals, material the deployer has ruled out. A **jailbreak** is an input designed to get the model to comply anyway, by exploiting gaps between the behaviour it was trained on and the situations it can be put in.

It is related to, but different from, **prompt injection**. Prompt injection hides instructions in content the model reads — a web page, an email, a document — so that it acts against its user. Jailbreaking is usually the user themselves trying to get past the model's own limits. Both exploit the same fact: a language model's instructions and its data arrive as the same kind of text.

This post describes the categories at a high level and focuses on defence. It does not include working prompts.

## Why jailbreaks work at all

Safety behaviour is learned, not hard-coded. During training, a model sees many examples of harmful requests and learns to decline them. Jailbreaks look for inputs that are unlike those examples while still carrying the harmful request:

- **Reframing** the request as fiction, role-play, a hypothetical or a research exercise, so it no longer resembles the refused examples.
- **Obfuscation** — encodings, other languages, deliberate misspellings, or splitting a request into innocent-looking pieces.
- **Many-shot pressure** — filling a long context with fabricated examples of the model complying, so the pattern to continue is compliance.
- **Gradual escalation** across many turns, each step only slightly beyond the last.
- **Optimised inputs** — strings found by automated search that happen to shift the model's behaviour, often meaningless to a human reader.

Each exploits generalisation: the model learned "refuse things that look like this", and the attack makes the request not look like this.

## The attacker's advantage: retries

A jailbreak that works only occasionally is still a jailbreak, because the attacker can keep trying at almost no cost. If a technique succeeds with probability *p* per attempt, the chance of at least one success in *n* attempts is `1 − (1 − p)ⁿ`:

| per-attempt success | within 100 attempts | within 1,000 attempts |
| --- | --- | --- |
| 2% | **86.7%** | ~100% |
| 0.5% | 39.4% | 99.3% |

A defence that blocks 98% of attempts sounds strong and, against a determined attacker, is close to useless. What matters is how hard it is to find *any* working input — and what happens when one is found.

## Defence in depth

No single layer is reliable, so systems stack independent ones. If three layers each miss 10% of attempts and fail independently, the combined miss rate is `0.1³ =` **0.1%**. Independence is the key word: three filters built the same way fail on the same inputs, and give little more than one.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Three stacked defence layers — input classifier, the model's own training, output classifier — each letting through 10% of attempts, combining to 0.1% if independent." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">INDEPENDENT LAYERS MULTIPLY</text>
<g fill="var(--muted-foreground)" fill-opacity="0.18" stroke="var(--muted-foreground)" stroke-opacity="0.5">
<rect x="120" y="36" width="80" height="120" rx="6"/><rect x="250" y="36" width="80" height="120" rx="6"/><rect x="380" y="36" width="80" height="120" rx="6"/>
</g>
<text class="l" x="160" y="172" text-anchor="middle">input check</text><text class="l" x="290" y="172" text-anchor="middle">model training</text><text class="l" x="420" y="172" text-anchor="middle">output check</text>
<rect x="20" y="56" width="100" height="80" fill="var(--primary)" fill-opacity="0.25"/>
<text class="b" x="30" y="100">100%</text>
<rect x="200" y="88" width="50" height="16" fill="var(--primary)" fill-opacity="0.5"/>
<text class="b" x="206" y="84">10%</text>
<rect x="330" y="94" width="50" height="4" fill="var(--primary)" fill-opacity="0.7"/>
<text class="b" x="340" y="88">1%</text>
<rect x="460" y="95" width="60" height="2" fill="var(--primary)"/>
<text class="b" x="466" y="88">0.1%</text>
<path d="M20 194 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="216">only if they fail on different inputs — copies of one filter add little</text>
<text class="l" x="20" y="236">and against retries, what matters is the cost of finding any input that passes all three</text>
</svg>
<figcaption>Layers built differently — classifiers, training, monitoring — fail differently, which is what makes stacking them work.</figcaption>
</figure>

The layers commonly used:

**Model training.** Safety training on diverse adversarial examples, including role-play, multi-turn and encoded variants, so that refusals generalise to unseen phrasings. Training the model to recognise *intent* rather than surface wording is what makes reframing attacks harder.

**Input classifiers.** A separate, smaller model screens requests for harmful intent before they reach the main model. It can be updated quickly when new attack patterns appear.

**Output classifiers.** A second check on what the model actually produced, catching harmful content regardless of how the request was phrased. Output checks are robust to obfuscated inputs because they judge the result.

**System design.** Limit what the model can do — tools, data access, actions — to what the application needs. A jailbroken model with no dangerous capabilities can do little harm.

**Monitoring and rate limits.** Repeated refused or flagged requests from one account are a signal. Since attackers rely on retries, making retries visible and costly removes their main advantage.

**Red-teaming.** Deliberately attacking your own system — with people and automated tools — before release and continuously after, feeding what is found back into training and filters.

## For application builders

- Do not rely on the system prompt alone to enforce policy; it is guidance to the model, not a security boundary.
- Treat any content the model reads from outside sources as untrusted.
- Add output-side checks for the specific harms your application could cause.
- Log and review refusals and flagged outputs; they show what people are trying.
- Assume some jailbreaks will succeed, and limit the damage a successful one can do.

## What to take away

A jailbreak is an input that gets a model to do what its safety training was meant to prevent, usually by making a harmful request look unlike anything it learned to refuse. Because attackers can retry freely, a 2% success rate becomes 86.7% within 100 attempts, so per-attempt block rates are a weak measure of safety.

Defence is layered and diverse: robust safety training, input and output classifiers, minimal capabilities, monitoring of repeated attempts, and continuous red-teaming. Three independent layers that each miss 10% let through 0.1% — provided they really fail independently.
