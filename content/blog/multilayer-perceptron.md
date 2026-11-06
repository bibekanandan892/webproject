---
title: "The multilayer perceptron"
date: "2026-09-25T11:05"
category: "AI"
tags: ["mlp", "neural-networks", "relu", "fundamentals", "transformer"]
summary: "Stack layers of neurons with a bend between them and you can approximate any reasonable function. Each ReLU adds one kink: 4 of them fit a sine wave to within 0.21, 32 to within 0.0048. Inside every transformer, an MLP holds two-thirds of each layer's parameters."
draft: false
cover: "/blog/multilayer-perceptron.svg"
---

The multilayer perceptron — MLP — is the original deep neural network and still one of the most used. It is a stack of fully connected layers: every neuron in one layer is connected to every neuron in the next, and each layer's output passes through a non-linear activation before the next layer sees it.

`h₁ = activation(x W₁ + b₁)`
`h₂ = activation(h₁ W₂ + b₂)`
`y = h₂ W₃ + b₃`

There is nothing else in it: no convolutions, no attention, no memory. Yet it can learn almost any input-output mapping, and it is a core component of every large language model.

## What each layer adds

A single layer computes weighted sums, which can only describe flat relationships: straight lines, planes. The activation function is what adds shape. With ReLU — `max(0, z)` — each hidden neuron contributes a function that is zero on one side of a threshold and rises linearly on the other: a single **kink**.

Add those kinked pieces together with different thresholds and slopes and you can build any **piecewise-linear** curve. And piecewise-linear curves can follow any smooth curve as closely as you like, given enough pieces.

## How many neurons a curve needs

Take one period of a sine wave. A hidden layer of *N* ReLU units can produce a curve with *N* straight segments — kinks at chosen points — and the best such curve follows the sine with an error that shrinks as segments are added:

| ReLU units | maximum error |
| --- | --- |
| 4 | 0.2105 |
| 8 | 0.0704 |
| 16 | 0.0188 |
| 32 | **0.0048** |

Each doubling of the units cuts the error by about four. That is the intuition behind the **universal approximation theorem**: a network with one hidden layer and enough units can approximate any continuous function on a bounded range to any desired accuracy.

The theorem says it is *possible*. It does not say the number of units is small, or that training will find the weights. For complicated functions, a single wide layer can need astronomically many units. Depth helps: a second layer can fold and combine the first layer's pieces, so deep MLPs represent many functions with far fewer total neurons than shallow ones.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A sine curve approximated by a polyline of 4 segments and by one of 16 segments, the second much closer, with maximum errors 0.21 and 0.019." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EACH RELU IS ONE KINK</text>
<path d="M40 110 H260 M300 110 H520" stroke="var(--muted-foreground)" stroke-opacity="0.3"/>
<path d="M40.0 110.0 L43.4 103.1 L46.9 96.3 L50.3 89.7 L53.8 83.2 L57.2 77.0 L60.6 71.1 L64.1 65.6 L67.5 60.5 L70.9 55.9 L74.4 51.8 L77.8 48.3 L81.2 45.3 L84.7 43.0 L88.1 41.3 L91.6 40.3 L95.0 40.0 L98.4 40.3 L101.9 41.3 L105.3 43.0 L108.8 45.3 L112.2 48.3 L115.6 51.8 L119.1 55.9 L122.5 60.5 L125.9 65.6 L129.4 71.1 L132.8 77.0 L136.2 83.2 L139.7 89.7 L143.1 96.3 L146.6 103.1 L150.0 110.0 L153.4 116.9 L156.9 123.7 L160.3 130.3 L163.8 136.8 L167.2 143.0 L170.6 148.9 L174.1 154.4 L177.5 159.5 L180.9 164.1 L184.4 168.2 L187.8 171.7 L191.2 174.7 L194.7 177.0 L198.1 178.7 L201.6 179.7 L205.0 180.0 L208.4 179.7 L211.9 178.7 L215.3 177.0 L218.8 174.7 L222.2 171.7 L225.6 168.2 L229.1 164.1 L232.5 159.5 L235.9 154.4 L239.4 148.9 L242.8 143.0 L246.2 136.8 L249.7 130.3 L253.1 123.7 L256.6 116.9 L260.0 110.0" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="2" fill="none"/>
<path d="M40.0 110.0 L95.0 40.0 L150.0 110.0 L205.0 180.0 L260.0 110.0" stroke="var(--primary)" stroke-width="2.2" fill="none"/>
<text class="b" x="40" y="196">4 ReLUs · max error 0.21</text>
<path d="M300.0 110.0 L303.4 103.1 L306.9 96.3 L310.3 89.7 L313.8 83.2 L317.2 77.0 L320.6 71.1 L324.1 65.6 L327.5 60.5 L330.9 55.9 L334.4 51.8 L337.8 48.3 L341.2 45.3 L344.7 43.0 L348.1 41.3 L351.6 40.3 L355.0 40.0 L358.4 40.3 L361.9 41.3 L365.3 43.0 L368.8 45.3 L372.2 48.3 L375.6 51.8 L379.1 55.9 L382.5 60.5 L385.9 65.6 L389.4 71.1 L392.8 77.0 L396.2 83.2 L399.7 89.7 L403.1 96.3 L406.6 103.1 L410.0 110.0 L413.4 116.9 L416.9 123.7 L420.3 130.3 L423.8 136.8 L427.2 143.0 L430.6 148.9 L434.1 154.4 L437.5 159.5 L440.9 164.1 L444.4 168.2 L447.8 171.7 L451.2 174.7 L454.7 177.0 L458.1 178.7 L461.6 179.7 L465.0 180.0 L468.4 179.7 L471.9 178.7 L475.3 177.0 L478.8 174.7 L482.2 171.7 L485.6 168.2 L489.1 164.1 L492.5 159.5 L495.9 154.4 L499.4 148.9 L502.8 143.0 L506.2 136.8 L509.7 130.3 L513.1 123.7 L516.6 116.9 L520.0 110.0" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="2" fill="none"/>
<path d="M300.0 110.0 L313.8 83.2 L327.5 60.5 L341.2 45.3 L355.0 40.0 L368.8 45.3 L382.5 60.5 L396.2 83.2 L410.0 110.0 L423.8 136.8 L437.5 159.5 L451.2 174.7 L465.0 180.0 L478.8 174.7 L492.5 159.5 L506.2 136.8 L520.0 110.0" stroke="var(--primary)" stroke-width="2.2" fill="none"/>
<text class="b" x="300" y="196">16 ReLUs · max error 0.019</text>
<path d="M20 214 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="236">double the units, quarter the error — enough kinks follow any smooth curve</text>
</svg>
<figcaption>Grey: the target. Dark: the best piecewise-linear fit a layer of that many ReLUs can make.</figcaption>
</figure>

## Counting parameters

Every connection is a weight and every neuron has a bias, so a layer from *a* inputs to *b* outputs has `a × b + b` parameters. A classic MLP for 28 × 28 handwritten digits, with hidden layers of 256 and 128:

`784×256 + 256 + 256×128 + 128 + 128×10 + 10 =` **235,146 parameters**

Almost all of them are in the first layer, because it connects to every pixel. That is the MLP's main weakness on images: it treats every pixel as an unrelated input, with no idea that neighbouring pixels belong together. A cat moved two pixels to the left is, to an MLP, an entirely new input. Convolutional networks were invented to fix exactly that.

## The MLP inside every transformer

Each transformer layer has two parts. Attention moves information *between* positions in the sequence. Then an MLP — usually called the feed-forward network — processes *each position on its own*: expand the vector to about four times its width, apply an activation, project back down.

For a model of width 4,096:

| part of one transformer layer | parameters |
| --- | --- |
| attention (queries, keys, values, output) | 67M |
| MLP (4,096 → 16,384 → 4,096) | **134M** |

The MLP holds **two-thirds** of the layer's parameters, and therefore most of the model's. Research into what models store suggests much factual knowledge lives in these MLP weights: attention gathers the context, the MLP looks up and transforms what that context means. Mixture-of-experts models replace this one MLP with many smaller ones and route each token to a few — which is why "experts" are MLPs.

## Training it

An MLP is trained like any network: forward pass, loss, backpropagation, gradient step. Practical concerns that apply to it directly:

- **Activation choice.** ReLU and its smooth relatives (GELU, SiLU) train well in deep stacks; sigmoids saturate and slow learning in many layers.
- **Initialisation.** Weights must be scaled to the layer width so signals neither vanish nor explode as they pass through.
- **Overfitting.** With hundreds of thousands of parameters and modest data, an MLP can memorise; dropout, weight decay and early stopping keep it general.

## What to take away

A multilayer perceptron is fully connected layers with non-linear activations between them. Each ReLU unit contributes one kink, and enough kinks follow any smooth curve: 4 units fit a sine wave to within 0.21, 32 to within 0.0048. Depth lets layers combine pieces efficiently.

MLPs struggle with structure like images on their own, but they are central to modern models: in a transformer, the per-position MLP holds about two-thirds of every layer's parameters.
