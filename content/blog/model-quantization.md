---
title: "Model Quantization"
date: "2026-09-11T21:00"
category: "AI"
tags: ["quantization", "int8", "outliers", "inference", "precision"]
summary: "Fewer bits per number is the easy part. What decides whether it works is how many numbers share a scale — and in one measured case the average error looked fine at 5% while the ordinary features were off by 42%."
draft: false
cover: "/blog/model-quantization.svg"
---

Quantization stores each number in fewer bits. A 7-billion-parameter model:

| | bytes per weight | total |
| --- | --- | --- |
| fp32 | 4 | 28.0 GB |
| fp16 | 2 | 14.0 GB |
| int8 | 1 | 7.0 GB |
| int4 | 0.5 | 3.5 GB |

That table is the entire motivation and none of the difficulty. The difficulty is that an 8-bit integer has 256 possible values, and you have to decide which 256 real numbers they stand for.

## Scale, and who shares one

The mapping is one multiplication. Pick a scale `s`, store `round(v / s)`, recover `q × s`. For a signed 8-bit integer the representable range is −127 to 127, so `s` must be large enough that the biggest value in the group fits.

Which means everything in the group is measured in units of the largest member. A group containing one enormous value forces a coarse scale on everything else.

So the real question is never "how many bits". It is **how many numbers share a scale**.

## Weights: the grouping axis matters

A weight matrix has structure. Different output channels can differ enormously in magnitude — in a matrix built with a realistic spread, the largest channel was 227× the smallest.

Quantizing all of it with one scale, versus one scale per output channel:

| | error, relative to the weights themselves |
| --- | --- |
| one scale for the whole tensor | 4.49% |
| one scale per output channel | **0.69%** |

A 6.5× improvement, for the cost of storing one extra number per channel — negligible against the channel's own hundreds of weights.

This is why per-channel quantization is the default for weights and the per-tensor variant is essentially never used. It is not a refinement; it is the difference between usable and not.

## Activations: the same idea, much worse stakes

Weights are known in advance and can be grouped carefully offline. Activations are computed at run time and have a property that makes them far harder: in a transformer, a handful of feature dimensions carry values vastly larger than the rest.

Taking 256 features where four of them run about 44× larger than the others:

| | all features | ordinary features only |
| --- | --- | --- |
| one scale for the tensor | 5.31% | **41.93%** |
| one scale per feature | 0.83% | 0.69% |

Look at what the aggregate number does. Measured across everything, per-tensor quantization looks acceptable at 5.31% — because the four outlier features are large, they dominate the total magnitude, and their own error is proportionally small.

Measured on the 252 features that carry the actual signal, the error is **42%**. The representation has been destroyed and the summary statistic says it is fine.

This is the central trap of quantization work. An average error weighted by magnitude hides exactly the failure you care about, because the outliers that caused it are also the values that dominate the average.

<figure>
<svg viewBox="0 0 560 294" width="560" role="img" aria-label="A row of feature magnitudes with four huge outliers, and error bars showing that per-tensor quantization has small overall error but large error on the ordinary features." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">FOUR FEATURES SET THE SCALE FOR ALL 256</text>
<path d="M20 116 H540" stroke="var(--muted-foreground)" stroke-opacity="0.3"/>
<g fill="color-mix(in srgb, var(--muted-foreground) 40%, transparent)">
<rect x="24" y="110" width="6" height="6"/><rect x="36" y="108" width="6" height="8"/><rect x="48" y="111" width="6" height="5"/><rect x="72" y="109" width="6" height="7"/><rect x="84" y="112" width="6" height="4"/><rect x="96" y="108" width="6" height="8"/><rect x="108" y="110" width="6" height="6"/><rect x="120" y="111" width="6" height="5"/><rect x="132" y="109" width="6" height="7"/><rect x="144" y="112" width="6" height="4"/><rect x="156" y="110" width="6" height="6"/><rect x="168" y="108" width="6" height="8"/><rect x="180" y="111" width="6" height="5"/><rect x="192" y="110" width="6" height="6"/><rect x="216" y="109" width="6" height="7"/><rect x="228" y="112" width="6" height="4"/><rect x="240" y="110" width="6" height="6"/><rect x="252" y="108" width="6" height="8"/><rect x="264" y="111" width="6" height="5"/><rect x="276" y="110" width="6" height="6"/><rect x="288" y="109" width="6" height="7"/><rect x="300" y="112" width="6" height="4"/><rect x="312" y="110" width="6" height="6"/><rect x="324" y="108" width="6" height="8"/><rect x="336" y="111" width="6" height="5"/><rect x="348" y="110" width="6" height="6"/><rect x="372" y="109" width="6" height="7"/><rect x="384" y="112" width="6" height="4"/><rect x="396" y="110" width="6" height="6"/><rect x="408" y="108" width="6" height="8"/><rect x="420" y="111" width="6" height="5"/><rect x="432" y="110" width="6" height="6"/><rect x="444" y="109" width="6" height="7"/><rect x="456" y="112" width="6" height="4"/><rect x="468" y="110" width="6" height="6"/><rect x="480" y="108" width="6" height="8"/><rect x="492" y="111" width="6" height="5"/><rect x="504" y="110" width="6" height="6"/><rect x="516" y="109" width="6" height="7"/><rect x="528" y="112" width="6" height="4"/>
</g>
<g fill="color-mix(in srgb, var(--primary) 55%, transparent)">
<rect x="60" y="40" width="6" height="76"/><rect x="204" y="46" width="6" height="70"/><rect x="360" y="38" width="6" height="78"/><rect x="516" y="44" width="6" height="72"/>
</g>
<text class="b" x="20" y="34">4 outlier features</text>
<text class="l" x="20" y="136">the other 252, drawn to the same scale</text>
<path d="M20 156 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="180">error after one scale for the whole tensor</text>
<rect x="20" y="190" width="40" height="16" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="68" y="203">5.31% measured across everything</text>
<rect x="20" y="214" width="316" height="16" rx="3" fill="color-mix(in srgb, var(--primary) 34%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="344" y="227">41.93% on the ordinary features</text>
<text class="l" x="20" y="252">the outliers dominate the average, so the average looks healthy</text>
<text class="l" x="20" y="272">one scale per feature brings both to under 1%</text>
</svg>
<figcaption>Same data, same quantizer. Which number you report decides whether it looks like a success.</figcaption>
</figure>

The consequences shape the whole field. **Weight-only quantization** is common and safe, because weights have no run-time outliers to surprise you. **Activation quantization** needs either per-feature scales computed on the fly, or the outlier dimensions held at higher precision, or a transformation that moves the problem from activations into weights before quantizing.

## Symmetric or not

A symmetric scheme centres on zero: the representable values run from −127 to 127 and zero maps exactly to zero.

That is wasteful when the data is one-sided. Values after a rectifying activation are all non-negative, so half the integer range represents numbers that cannot occur.

Measured on non-negative data at 8 bits:

| | error |
| --- | --- |
| symmetric | 0.843% |
| asymmetric | **0.421%** |

Exactly 2.00× — one whole bit, recovered by adding an offset so the range starts where the data starts. Asymmetric costs one extra stored integer per group and an addition per value, which is why it is normal for activations and usually skipped for weights, whose distributions are roughly centred anyway.

## After training, or during

**Post-training** quantization takes a finished model and converts it, using a small calibration sample to choose scales. Cheap, fast, and the right first attempt.

**Quantization-aware training** simulates the rounding during training, so the weights learn to be robust to it. Far more expensive, and the option worth reaching for at very low bit widths where post-training conversion visibly degrades.

At 8 bits, post-training is usually indistinguishable from the original. At 4 bits it depends heavily on the method — the better ones reduce error layer by layer, or spend their precision budget on the weights that matter most rather than spreading it evenly.

## What to take away

Bit width gets the headline and grouping does the work.

Before trusting any quantized model, ask two questions: which numbers share a scale, and — more importantly — what the error looks like on the values that are *not* the largest ones. An aggregate error figure computed over data containing outliers is not evidence of anything.
