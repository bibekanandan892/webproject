---
title: "The math behind cross-entropy loss"
date: "2026-09-10T09:40"
category: "AI"
tags: ["cross-entropy", "loss", "softmax", "training", "perplexity"]
summary: "Cross-entropy turns a set of predicted probabilities into one number saying how wrong they were. It is built so that being confidently wrong costs far more than being unsure."
draft: false
cover: "/blog/math-behind-cross-entropy-loss.svg"
---

A classifier does not output an answer. It outputs a probability for every possible answer.

Cross-entropy is how those probabilities get scored. It looks at the probability the model gave to the option that was actually correct, and turns it into a single number — small when that probability was high, large when it was low.

## The formula

$$
\text{CE} = -\sum_i y_i \log(p_i)
$$

$p_i$ is the probability the model gave to option $i$. $y_i$ is 1 for the correct option and 0 for all the others.

Those zeros do most of the work. Every term where $y_i = 0$ multiplies out to nothing, so the whole sum collapses to a single term:

$$
\text{CE} = -\log(p_{\text{correct}})
$$

The probabilities the model assigned to the wrong options never appear. Only one number matters: how much belief was placed on the right answer.

## Why the log

The log is what makes the penalty non-linear.

| probability on the right answer | $-\log(p)$ |
| --- | --- |
| 0.95 | 0.05 |
| 0.5 | 0.69 |
| 0.05 | 3.00 |
| 0.005 | 5.30 |

Notice the shape. Between 0.95 and 0.5 the loss rises by 0.64. Between 0.05 and 0.005 — the same tenfold drop in probability — it rises by 2.30 again, and it keeps rising without limit as the probability approaches zero.

A model that is merely unsure gets a mild penalty. A model that is confident and wrong gets an enormous one. That asymmetry is deliberate: it is far worse to rule out the truth than to hesitate about it.

The minus sign is bookkeeping. Probabilities are at most 1, so their logs are at most 0. Negating makes the loss positive, with 0 as perfection.

## Working one through

A model sorts a support ticket into one of four buckets. The ticket is really a **bug** report.

The model gives raw scores — logits — and softmax turns them into probabilities. Start with a model that is leaning the right way but not certain, with logits `[1.2, 2.8, 0.4, -0.6]`:

| bucket | probability |
| --- | --- |
| billing | 0.1523 |
| **bug** | **0.7542** |
| feature | 0.0684 |
| spam | 0.0252 |

Those sum to 1.0000. The loss is $-\log(0.7542) = 0.2822$.

Now sharpen the same model's opinion, so it puts 0.9696 on `bug`. The loss falls to 0.0309.

And now break it, so it puts 0.9608 on `billing` and only 0.0194 on `bug`. The loss jumps to 3.9399.

<figure>
<svg viewBox="0 0 600 300" width="600" role="img" aria-label="A curve of minus log p against the probability given to the correct answer. It is near zero on the right where the probability is high, and rises steeply towards the left as the probability approaches zero. Three points are marked: 0.97 giving a loss of 0.03, 0.75 giving 0.28, and 0.02 giving 3.94." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="70" y="20">LOSS AGAINST BELIEF IN THE RIGHT ANSWER</text>
<path d="M74.5 51.5 L79.5 81.3 L84.5 98.2 L89.4 110.1 L94.4 119.2 L99.4 126.6 L104.4 132.9 L109.3 138.3 L114.3 143.1 L119.3 147.3 L124.3 151.2 L129.3 154.7 L134.3 157.9 L139.2 160.9 L144.2 163.7 L149.2 166.3 L154.2 168.7 L159.1 171.0 L164.1 173.2 L169.1 175.3 L174.1 177.2 L179.1 179.1 L184.1 180.9 L189.0 182.6 L194.0 184.2 L199.0 185.8 L204.0 187.3 L209.0 188.8 L213.9 190.2 L218.9 191.5 L223.9 192.9 L228.9 194.1 L233.8 195.4 L238.8 196.6 L243.8 197.7 L248.8 198.9 L253.8 200.0 L258.8 201.0 L263.7 202.1 L268.7 203.1 L273.7 204.1 L278.7 205.0 L283.6 206.0 L288.6 206.9 L293.6 207.8 L298.6 208.7 L303.6 209.6 L308.5 210.4 L313.5 211.2 L318.5 212.0 L323.5 212.8 L328.5 213.6 L333.5 214.4 L338.4 215.1 L343.4 215.9 L348.4 216.6 L353.4 217.3 L358.4 218.0 L363.3 218.7 L368.3 219.3 L373.3 220.0 L378.3 220.7 L383.3 221.3 L388.2 221.9 L393.2 222.5 L398.2 223.2 L403.2 223.8 L408.2 224.4 L413.1 224.9 L418.1 225.5 L423.1 226.1 L428.1 226.6 L433.1 227.2 L438.0 227.7 L443.0 228.3 L448.0 228.8 L453.0 229.3 L458.0 229.9 L462.9 230.4 L467.9 230.9 L472.9 231.4 L477.9 231.9 L482.9 232.3 L487.8 232.8 L492.8 233.3 L497.8 233.8 L502.8 234.2 L507.8 234.7 L512.7 235.1 L517.7 235.6 L522.7 236.0 L527.7 236.5 L532.6 236.9 L537.6 237.3 L542.6 237.7 L547.6 238.2 L552.6 238.6 L557.5 239.0 L562.5 239.4 L567.5 239.8 L570.0 240.0" fill="none" stroke="color-mix(in srgb, var(--primary) 60%, transparent)" stroke-width="1.9"/>
<path d="M70 246 H578" stroke="var(--border)" stroke-width="1"/>
<text class="l" x="70" y="262">0</text>
<text class="l" x="320" y="262" text-anchor="middle">0.5</text>
<text class="l" x="570" y="262" text-anchor="end">1</text>
<text class="l" x="320" y="280" text-anchor="middle">probability given to the right answer</text>
<circle cx="79.7" cy="82.4" r="5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="98" y="79">3.94  confident and wrong</text>
<circle cx="447.1" cy="228.7" r="5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="447" y="220" text-anchor="middle">0.28</text>
<circle cx="554.8" cy="238.8" r="5" fill="color-mix(in srgb, var(--primary) 85%, transparent)"/>
<text class="v" x="562" y="228" text-anchor="end">0.03</text>
<text class="l" x="70" y="40">loss</text>
</svg>
<figcaption>The same curve throughout. Sliding left costs far more than sliding right saves.</figcaption>
</figure>

Between the second and third case the model's belief in the truth fell by a factor of about fifty, and the loss rose by a factor of about a hundred and thirty. That gap is the point of the whole function.

## The two-class version

With only two options, one probability determines the other — if the chance of yes is $p$, the chance of no is $1 - p$. So the formula is usually written as:

$$
\text{BCE} = -\left[\, y \log(p) + (1 - y)\log(1 - p) \,\right]
$$

It looks like two terms but only ever one runs. When the answer is yes, $y = 1$ kills the second half and the loss is $-\log(p)$. When it is no, $y = 0$ kills the first half and the loss is $-\log(1-p)$.

With the true answer being yes: a prediction of 0.85 costs 0.1625, and a prediction of 0.30 costs 1.2040.

## In a language model

A language model is a classifier whose options are every token in its vocabulary — often more than 50,000 of them.

The scoring is unchanged. At each position, find the probability it gave to the token that actually came next, take the negative log, and average over the sequence:

$$
L = \frac{1}{N}\sum_{t=1}^{N} -\log\bigl(p_t(\text{actual token})\bigr)
$$

That average is usually reported after exponentiating it, as **perplexity**:

$$
\text{perplexity} = e^{L}
$$

An average loss of 2.10 becomes a perplexity of 8.17. The exponential undoes the log, which puts the number back on a scale you can picture: roughly how many options the model was effectively torn between at each step. A perplexity of 8 means it was about as uncertain as someone guessing between eight equally likely tokens. Lower is better, and 1 would mean it was certain every time.

## Why the gradient is so simple

Cross-entropy is almost always applied straight to the output of a softmax, and that pairing produces something unusually clean. The derivative of the loss with respect to a raw logit is:

$$
\frac{\partial \text{CE}}{\partial z_i} = p_i - y_i
$$

Predicted minus actual. Nothing else.

For the first case above the four gradients are:

| bucket | $p_i - y_i$ |
| --- | --- |
| billing | +0.1523 |
| **bug** | **−0.2458** |
| feature | +0.0684 |
| spam | +0.0252 |

The correct class gets a negative gradient, so its logit is pushed up. Every wrong class gets a positive one, so their logits are pushed down, and by exactly the amount of belief each was wrongly given. They sum to zero, which is what keeps the probabilities summing to 1.

There is no division, no chain of intermediate terms, nothing that can blow up. That is why frameworks fuse softmax and cross-entropy into one operation instead of computing them separately.

## The short version

- Cross-entropy scores a set of predicted probabilities against the answer that was actually right.
- The zeros in the one-hot label collapse the sum to $-\log(p_{\text{correct}})$ — only belief in the truth counts.
- The log makes the penalty grow without limit as that belief approaches zero, so confident mistakes are punished hardest.
- The two-class version is the same formula with one of its two halves always switched off.
- Language models use it per token and report $e^{L}$ as perplexity.
- Paired with softmax, its gradient is just predicted minus actual, which is why the two are computed together.
