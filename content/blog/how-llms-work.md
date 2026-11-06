---
title: "How a large language model works"
date: "2026-11-06T16:00"
category: "AI"
tags: ["llm", "transformer", "pretraining", "inference", "fundamentals"]
summary: "An LLM does one thing — predict the next token — and repeats it. Learning to do that well on 15 trillion tokens takes about 6.3 × 10²⁴ operations for a 70B model, roughly 18 days on 10,000 GPUs; answering one question with what it learned takes 70 trillion."
draft: false
cover: "/blog/how-llms-work.svg"
---

A large language model is a program that, given some text, predicts what comes next. Everything it appears to do — answer questions, write code, summarise, translate, reason — is that prediction, repeated one piece at a time.

That sounds too simple to explain what these systems can do. The explanation is in the scale at which the prediction is learned, and in what a model has to absorb to predict well.

## Step 1: text becomes tokens

The model never sees characters. A tokenizer cuts text into pieces from a fixed vocabulary — common words whole, rarer words in parts — and replaces each with an integer. "The cat sat on the" becomes five token IDs.

## Step 2: tokens become vectors

Each token ID is looked up in an embedding table and replaced by a vector of a few thousand numbers. From here on the model works only with vectors.

## Step 3: a stack of transformer layers

The vectors pass through dozens of layers. Each layer does two things:

- **Attention** lets each position look at every earlier position and pull in information from the ones that matter. This is how "it" gets connected to the noun it refers to, or a closing bracket to its opening one.
- **A feed-forward network** transforms each position's vector on its own. Much of what the model "knows" is stored in these weights.

Residual connections carry each layer's input forward alongside its output, so information is refined layer by layer rather than replaced.

## Step 4: a distribution over the next token

The final vector at the last position is multiplied by an output matrix to give one score — a logit — for every token in the vocabulary. A softmax turns the scores into probabilities. After "The cat sat on the", the model might put 40% on " mat", 15% on " floor", 10% on " sofa", and tiny amounts on tens of thousands of others.

## Step 5: pick one, append, repeat

One token is chosen — the most likely, or a sample — appended to the text, and the whole process runs again to predict the token after that. A 500-token answer is 500 passes. This loop is called **autoregressive generation**, and nothing else is happening: no separate reasoning module, no database lookup, no plan held outside the text.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="Pipeline from text to tokens to vectors through a stack of transformer layers to a probability distribution over the next token, with a loop arrow appending the chosen token back to the input." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE PREDICTION, REPEATED</text>
<rect x="20" y="40" width="150" height="26" rx="5" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<text class="l" x="30" y="57">"The cat sat on the"</text>
<path d="M170 53 H200" stroke="var(--muted-foreground)"/>
<rect x="200" y="40" width="90" height="26" rx="5" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<text class="l" x="210" y="57">tokens → vectors</text>
<path d="M290 53 H316" stroke="var(--muted-foreground)"/>
<g fill="var(--primary)" fill-opacity="0.12" stroke="var(--primary)" stroke-opacity="0.6">
<rect x="316" y="36" width="80" height="12" rx="2"/><rect x="316" y="50" width="80" height="12" rx="2"/><rect x="316" y="64" width="80" height="12" rx="2"/><rect x="316" y="78" width="80" height="12" rx="2"/>
</g>
<text class="b" x="356" y="104" text-anchor="middle">N layers</text>
<path d="M396 60 H420" stroke="var(--muted-foreground)"/>
<g fill="var(--primary)">
<rect x="424" y="40" width="64" height="12" rx="2" fill-opacity="0.8"/><rect x="424" y="56" width="24" height="12" rx="2" fill-opacity="0.5"/><rect x="424" y="72" width="16" height="12" rx="2" fill-opacity="0.4"/>
</g>
<text class="b" x="494" y="50">mat 40%</text><text class="l" x="454" y="66">floor 15%</text><text class="l" x="446" y="82">sofa 10%</text>
<path d="M456 92 C456 150 95 150 95 72" stroke="var(--primary)" stroke-width="1.6" fill="none"/>
<path d="M89 80 L95 70 L101 80" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text class="b" x="200" y="146">append " mat", run again</text>
<path d="M20 176 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="200">learning it: ~6.3 × 10²⁴ operations · using it: ~140 billion per token</text>
<text class="l" x="20" y="220">70B parameters, 15 trillion training tokens, one answer of 500 tokens = 70 trillion</text>
<text class="l" x="20" y="240">training costs about 90 billion such answers</text>
</svg>
<figcaption>Tokens in, a distribution out, one token chosen, and round again.</figcaption>
</figure>

## How it learns: pretraining

The model starts with random weights and predicts garbage. Training shows it vast amounts of text and, at every position, compares its predicted distribution with the token that actually came next. Backpropagation adjusts all the weights slightly to make the actual next token more likely. Repeat for trillions of tokens.

The cost is easy to estimate: about **6 × parameters × training tokens** operations. For a 70B model trained on 15 trillion tokens:

`6 × 70 × 10⁹ × 15 × 10¹² = 6.3 × 10²⁴ operations`

At 40% utilisation of an H100-class GPU, that is about 184,000 GPU-days — **18 days on 10,000 GPUs**.

Why does predicting the next token teach anything beyond grammar? Because good prediction requires it. To predict the next word of a physics textbook, it helps to model physics. To predict the next line of a program, it helps to model what the program does. To predict the rest of a sentence about a historical event, it helps to know the event. The training objective is simple; what the model must internalise to satisfy it is not.

## From predictor to assistant: post-training

A model trained only on internet text continues documents. Ask it a question and it may produce three more questions, because that is what often follows a question on a web page.

Post-training turns it into an assistant. **Supervised fine-tuning** on examples of instructions and good responses teaches the format. **Reinforcement learning from human feedback** — or from AI feedback, or from verifiable rewards such as passing tests and correct maths answers — teaches it to prefer responses people rate as helpful, honest and safe. Reasoning models are further trained to produce long chains of thought before answering, rewarded for reaching correct results.

Post-training uses far less compute than pretraining. It shapes behaviour; the knowledge comes from pretraining.

## Using it: inference

Generating each token costs about **2 × parameters** operations — 140 billion for a 70B model — plus attention over the context. A 500-token answer is about 70 trillion operations. Training cost about 90 billion times that.

Inference has its own engineering: a KV cache so earlier tokens are not reprocessed, batching many users' requests together, quantization to shrink the weights, speculative decoding to produce several tokens per step.

## What follows from how it works

- **It has no memory between requests.** Each conversation is text fed in again; "memory" features place stored text in the prompt.
- **Its knowledge stops at its training data**, unless current information is provided in the context.
- **It can be fluently wrong.** When it does not know, the next-token distribution is spread over plausible options, and one is written with the same confidence as a fact.
- **Context is its working memory.** Everything it can use for a given answer must fit in the context window.

## What to take away

An LLM turns text into tokens, tokens into vectors, runs them through a stack of attention and feed-forward layers, and outputs a probability for every possible next token. One is chosen and appended, and the process repeats.

Pretraining on trillions of tokens — about 6.3 × 10²⁴ operations for a 70B model — is what makes those predictions knowledgeable; post-training makes them helpful. Each generated token then costs about twice the parameter count in arithmetic.
