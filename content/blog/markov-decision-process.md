---
title: "Markov decision processes"
date: "2026-11-06T19:50"
category: "AI"
tags: ["mdp", "reinforcement-learning", "value-iteration", "bellman", "fundamentals"]
summary: "An MDP is the mathematical frame for decisions whose effects ripple forward. In a tiny machine that earns 2 for running fast but overheats if pushed when warm, always-slow is worth 10, always-fast −4.55 — and value iteration finds the policy \"fast when cool, slow when warm\" worth 15.5."
draft: false
cover: "/blog/markov-decision-process.svg"
---

Many decisions do not just earn a reward now; they change what happens next. Running a machine hard earns more today and risks breaking it tomorrow. A Markov decision process (MDP) is the standard mathematical description of that kind of problem, and the foundation of reinforcement learning.

## The five parts

An MDP is defined by:

1. **States** — the situations the agent can be in.
2. **Actions** — what the agent can do in each state.
3. **Transitions** — for each state and action, the probability of each next state.
4. **Rewards** — the immediate payoff for taking an action in a state.
5. **A discount factor γ** between 0 and 1 — how much a reward one step later is worth compared with one now.

The **Markov** part is an assumption: the next state depends only on the current state and action, not on the history of how you got there. Everything relevant must be captured in the state.

The goal is a **policy** — a rule saying which action to take in each state — that maximises the expected total discounted reward.

## A small example

A machine can be **cool** or **warm**, or it can **overheat**, which ends everything. Each step you choose to run it **slow** or **fast**:

| state | action | reward | what happens next |
| --- | --- | --- | --- |
| cool | slow | +1 | stays cool |
| cool | fast | +2 | 50% stays cool, 50% becomes warm |
| warm | slow | +1 | 50% cools down, 50% stays warm |
| warm | fast | **−10** | overheats — game over |

Discount factor γ = 0.9.

Fast is tempting: it pays double. But it heats the machine up, and running fast when warm is a disaster. The right choice in each state depends on its effect on the future.

## Value: what a state is worth

The **value** of a state under a policy is the expected total discounted reward from there on. Two simple policies are easy to evaluate:

- **Always slow:** +1 every step for ever, never at risk. Value `1 / (1 − 0.9) =` **10** in either state.
- **Always fast:** from cool, +2 and a coin flip between staying cool and becoming warm — and from warm, −10 and the end. Solving `V = 2 + 0.9 × (0.5 V + 0.5 × −10)` gives **−4.55**.

Greed loses badly. Caution earns a steady 10. Is there anything better?

## The Bellman equation and value iteration

The best achievable value satisfies the **Bellman optimality equation**: a state's value is the best, over actions, of the immediate reward plus the discounted expected value of where that action leads:

`V(s) = max over a of [ R(s, a) + γ × Σ P(s′ | s, a) × V(s′) ]`

**Value iteration** solves it by starting with all values at zero and repeatedly applying the equation:

| iteration | V(cool) | V(warm) | best action when cool | when warm |
| --- | --- | --- | --- | --- |
| 1 | 2.00 | 1.00 | fast | slow |
| 2 | 3.35 | 2.35 | fast | slow |
| 3 | 4.56 | 3.56 | fast | slow |
| 10 | 10.27 | 9.27 | fast | slow |
| 50 | 15.42 | 14.42 | fast | slow |
| 200 | **15.50** | **14.50** | **fast** | **slow** |

The values converge to 15.5 for cool and 14.5 for warm, and the optimal policy is: **run fast when cool, slow when warm.** It earns the extra reward whenever it is safe and backs off exactly when the risk appears — worth 15.5 against 10 for always-slow and −4.55 for always-fast.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="State diagram: cool and warm states with arrows for slow and fast actions labelled with rewards and probabilities, and an overheated terminal state reached by running fast when warm; the optimal actions are highlighted." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">FAST WHEN COOL, SLOW WHEN WARM</text>
<circle cx="110" cy="110" r="38" fill="none" stroke="var(--primary)" stroke-width="2"/>
<text class="b" x="110" y="106" text-anchor="middle">cool</text><text class="b" x="110" y="122" text-anchor="middle">V 15.5</text>
<circle cx="300" cy="110" r="38" fill="none" stroke="var(--primary)" stroke-width="2"/>
<text class="b" x="300" y="106" text-anchor="middle">warm</text><text class="b" x="300" y="122" text-anchor="middle">V 14.5</text>
<rect x="440" y="88" width="100" height="44" rx="6" fill="var(--muted-foreground)" fill-opacity="0.15" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<text class="l" x="490" y="114" text-anchor="middle">overheated</text>
<path d="M148 96 C200 70 220 70 262 96" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<text class="b" x="205" y="66" text-anchor="middle">fast +2 · 50%</text>
<path d="M262 126 C220 152 200 152 148 126" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<text class="b" x="205" y="166" text-anchor="middle">slow +1 · 50%</text>
<path d="M90 76 C60 30 140 30 120 74" stroke="var(--muted-foreground)" stroke-width="1.6" fill="none"/>
<text class="l" x="110" y="32" text-anchor="middle">slow +1 / fast 50%</text>
<path d="M290 74 C270 30 340 30 316 76" stroke="var(--primary)" stroke-opacity="0.6" stroke-width="1.6" fill="none"/>
<text class="l" x="306" y="32" text-anchor="middle">slow +1 · 50%</text>
<path d="M338 110 H438" stroke="var(--muted-foreground)" stroke-dasharray="4 3" stroke-width="1.6"/>
<text class="l" x="388" y="102" text-anchor="middle">fast −10</text>
<path d="M20 196 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="218">optimal 15.5 · always slow 10 · always fast −4.55 (from cool, γ = 0.9)</text>
<text class="l" x="20" y="238">the best action depends on the state, because each action changes the next one</text>
</svg>
<figcaption>Dark arrows: the optimal policy found by value iteration.</figcaption>
</figure>

## What the discount factor does

γ controls how far ahead the agent cares. With γ near 0, only the immediate reward matters and the agent becomes greedy. With γ near 1, distant consequences matter almost as much as immediate ones. In this example a very short-sighted agent would see that fast pays 2 and slow pays 1 everywhere — and run fast when warm, right into the −10.

## From MDPs to reinforcement learning

Value iteration needs the transition probabilities and rewards written down. Reinforcement learning tackles the same problem when they are **unknown**: the agent learns by trying actions and observing what happens.

- **Q-learning** learns the value of each state–action pair directly from experience.
- **Policy gradient methods** — including PPO — adjust a policy's parameters in the direction that increases expected reward.
- **Deep RL** replaces the table of values with a neural network when there are too many states to list.

Language model training with RLHF fits the same frame: the state is the conversation so far, the action is the next token or response, and the reward comes from a learned model of human preferences.

## What to take away

A Markov decision process describes sequential decisions with states, actions, transition probabilities, rewards and a discount factor, assuming the current state contains everything relevant. The Bellman equation defines the best value of each state, and value iteration finds it by repeated updates.

In the overheating-machine example, always slow is worth 10 and always fast −4.55, while the optimal policy — fast when cool, slow when warm — is worth 15.5. Reinforcement learning solves the same problem when the rules must be discovered by experience.
