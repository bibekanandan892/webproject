---
title: "BatchNorm vs LayerNorm"
date: "2026-09-10T17:20"
category: "AI"
tags: ["normalisation", "batchnorm", "layernorm", "training", "transformers"]
summary: "Same formula, different axis. One averages a feature across the examples in a batch, the other averages all the features within one example — and that choice decides which architectures each one suits."
draft: false
cover: "/blog/batchnorm-vs-layernorm.svg"
---

Both do the same arithmetic: subtract a mean, divide by a standard deviation, then scale and shift by two learned parameters.

$$
y = \gamma \cdot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta
$$

The entire difference is which numbers go into $\mu$ and $\sigma$.

## The two axes

Activations arrive as a grid: one row per example in the batch, one column per feature.

**Batch normalisation goes down a column.** For each feature, take that feature's values across every example in the batch, and normalise using those.

**Layer normalisation goes across a row.** For each example, take all of that example's features, and normalise using those.

<figure>
<svg viewBox="0 0 560 240" width="560" role="img" aria-label="A four by four grid of activations. A highlighted column shows batch normalisation working down one feature across all examples; a highlighted row shows layer normalisation working across all features of one example." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.c{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.lb{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.h{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME GRID, DIFFERENT AXIS</text>
<text class="h" x="149" y="52" text-anchor="middle">f1</text>
<text class="h" x="211" y="52" text-anchor="middle">f2</text>
<text class="h" x="273" y="52" text-anchor="middle">f3</text>
<text class="h" x="335" y="52" text-anchor="middle">f4</text>
<rect x="178" y="56" width="66" height="148" rx="5" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<rect x="116" y="56" width="252" height="40" rx="5" fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-dasharray="4 3"/>
<text class="c" x="149" y="82" text-anchor="middle">2</text>
<text class="c" x="211" y="82" text-anchor="middle">40</text>
<text class="c" x="273" y="82" text-anchor="middle">1</text>
<text class="c" x="335" y="82" text-anchor="middle">9</text>
<text class="c" x="149" y="118" text-anchor="middle">6</text>
<text class="c" x="211" y="118" text-anchor="middle">44</text>
<text class="c" x="273" y="118" text-anchor="middle">3</text>
<text class="c" x="335" y="118" text-anchor="middle">5</text>
<text class="c" x="149" y="154" text-anchor="middle">4</text>
<text class="c" x="211" y="154" text-anchor="middle">36</text>
<text class="c" x="273" y="154" text-anchor="middle">2</text>
<text class="c" x="335" y="154" text-anchor="middle">7</text>
<text class="c" x="149" y="190" text-anchor="middle">8</text>
<text class="c" x="211" y="190" text-anchor="middle">48</text>
<text class="c" x="273" y="190" text-anchor="middle">4</text>
<text class="c" x="335" y="190" text-anchor="middle">3</text>
<text class="h" x="108" y="82" text-anchor="end">example 1</text>
<text class="h" x="108" y="118" text-anchor="end">example 2</text>
<text class="h" x="108" y="154" text-anchor="end">example 3</text>
<text class="h" x="108" y="190" text-anchor="end">example 4</text>
<text class="lb" x="211" y="222" text-anchor="middle">batch norm</text>
<text class="lb" x="396" y="82">layer norm</text>
<text class="h" x="396" y="100">one example,</text>
<text class="h" x="396" y="116">all features</text>
<text class="h" x="396" y="200">one feature,</text>
<text class="h" x="396" y="216">all examples</text>
</svg>
<figcaption>The solid box is one batch-norm statistic. The dashed box is one layer-norm statistic.</figcaption>
</figure>

## Both, on the same numbers

Feature 2 in that grid sits around 40 while the others sit in single digits. Watch what each normalisation does about that.

**Batch norm**, down each column:

| | f1 | f2 | f3 | f4 |
| --- | --- | --- | --- | --- |
| ex 1 | −1.34 | −0.45 | −1.34 | 1.34 |
| ex 2 | 0.45 | 0.45 | 0.45 | −0.45 |
| ex 3 | −0.45 | −1.34 | −0.45 | 0.45 |
| ex 4 | 1.34 | 1.34 | 1.34 | −1.34 |

Every column now has mean 0 and standard deviation 1. Feature 2's original scale is gone — it competes on equal terms with the rest.

**Layer norm**, across each row:

| | f1 | f2 | f3 | f4 |
| --- | --- | --- | --- | --- |
| ex 1 | −0.69 | **1.70** | −0.76 | −0.25 |
| ex 2 | −0.50 | **1.73** | −0.67 | −0.56 |
| ex 3 | −0.60 | **1.72** | −0.74 | −0.38 |
| ex 4 | −0.41 | **1.72** | −0.63 | −0.68 |

Every row now has mean 0 and standard deviation 1. But look at the second column — feature 2 is still the largest value in every single row, at almost exactly the same number each time.

That is the substantive difference, and it is easy to miss. Batch norm equalises features *against each other*. Layer norm does not; it only fixes the overall magnitude of each example, and any feature that is systematically larger than the others stays systematically larger.

Neither is wrong. They are answering different questions.

## Why sequence models cannot use batch norm

Three problems, and they compound.

**It needs a batch.** With a single example, a column contains one number, so its standard deviation is zero and the normalisation is undefined. Layer norm on that same single example works exactly as it always does — its statistics never involved the batch.

**It behaves differently at inference.** During training the statistics come from the current batch; at inference there may be no batch, so a running average collected during training is substituted instead. Training and serving are therefore not the same computation, and small batches make those running averages noisy.

**Sequences vary in length.** In a transformer the grid is not just examples by features — there is a position axis too, and different examples in a batch have different numbers of real positions. Averaging a feature "across the batch" means averaging across padding, or writing careful masking to avoid it.

Layer norm has none of these. It looks at one example's features and nothing else, so batch size, padding, and inference all become irrelevant.

## Why images do use it

Convolutional networks on images have the opposite situation: large batches, fixed-size inputs, and channels that genuinely are comparable quantities across a dataset.

There, normalising a channel across the batch is meaningful, and it brings a real bonus — because each example's normalisation depends on whichever other examples happen to be in its batch, the output is slightly noisy, which acts as regularisation.

That noise is exactly what makes it unsuitable elsewhere. In a sequence model, an example's representation changing depending on what it was batched with is not a feature.

## The short version

- Identical formula; the difference is which values the mean and variance come from.
- Batch norm: one feature, across the examples in the batch. Layer norm: one example, across its features.
- Batch norm makes features comparable to each other; layer norm only fixes each example's overall magnitude.
- A feature on a larger scale stays larger under layer norm — it is normalised, not equalised.
- Batch norm needs a batch, behaves differently at inference, and struggles with variable-length sequences.
- Layer norm works at batch size 1 and is identical in training and serving, which is why transformers use it.
- Batch norm's dependence on batch-mates is regularising for images and unacceptable for sequences.
