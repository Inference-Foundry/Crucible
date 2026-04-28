# Crucible — Inference Foundry Research Journal

> A rigorous, empirically-grounded research log for low-level ML systems engineering.

---

## Mission

Crucible is the internal and open research journal of **Inference Foundry**, a low-level ML systems engineering organization. Our mandate is to dismantle modern machine learning architectures at the hardware and mathematical level — not to survey high-level concepts, but to instrument real silicon, measure actual memory bandwidth, and expose the exact computational bottlenecks that determine production inference cost.

Every article published in Crucible is expected to contain:

- Verified LaTeX-formatted mathematical derivations traceable to primary literature
- Hardware profiling data collected on real accelerators (CUDA, ROCm, or Metal)
- Annotated architectural diagrams with cycle- or byte-level annotations where applicable
- Honest accounting of failure modes, not just benchmark victories

We do not publish opinion pieces. We publish measurements.

---

## Active Profiling

Work-in-progress teardowns currently under active instrumentation:

### FlashAttention-3 — Kernel-Level Deconstruction
**Status:** Hardware profiling in progress (H100 SXM5, BF16)
**Lead:** Inference Foundry Core Team
**Focus areas:**
- Warp-specialization and producer/consumer pipeline overlap in CUTLASS 3.x
- WGMMA instruction throughput vs. theoretical peak on Hopper SM90a
- VRAM access pattern analysis: HBM3 bandwidth saturation during causal masking
- Comparison of tiling strategies: `(Br=128, Bc=64)` vs. `(Br=64, Bc=128)` under varying sequence lengths
- Time-to-First-Token (TTFT) regression curves at batch sizes 1, 8, 32, 128

**Preliminary findings:** The async WGMMA + TMA pipeline achieves ~92% of theoretical H100 FLOP/s on sequences ≥ 4096 tokens, degrading sharply below 512 tokens due to kernel launch overhead relative to compute time.

---

### I-JEPA — Latent Prediction Architecture Teardown
**Status:** Mathematical formalization complete; hardware profiling queued
**Lead:** Inference Foundry Vision Systems Team
**Focus areas:**
- Context/target block sampling strategy and its effect on representation collapse
- ViT backbone throughput profiling: patch embedding GEMM vs. attention compute ratio
- Gradient flow analysis through the exponential moving average (EMA) target encoder
- Comparison of predictor network depth vs. downstream linear probe accuracy

**Key open question:** Does the asymmetric EMA update rule implicitly act as a regularizer equivalent to dropout in representation space, or is the collapse-prevention purely a function of the masking schedule?

---

## Queued Teardowns

The following papers are formally queued for full deconstruction and will be assigned to profiling slots as hardware capacity becomes available:

| Priority | Paper | Focus | Target Hardware |
|----------|-------|-------|-----------------|
| 1 | Mamba-2 (SSM + SSD Kernels) | State space model CUDA kernel efficiency, selective scan throughput | A100 80GB |
| 2 | DeepSeek-V3 MLA (Multi-head Latent Attention) | KV-cache compression ratio vs. attention quality degradation | H100 NVL |
| 3 | Medusa (Speculative Decoding) | Draft head acceptance rate under temperature variation, memory overhead | A10G |
| 4 | RoPE (Rotary Positional Embeddings) | Precision sensitivity in BF16 vs. FP32 at long context (128K+) | CPU baseline + CUDA |
| 5 | GQA / MQA (Grouped / Multi-Query Attention) | KV-cache VRAM footprint, decode throughput per byte of KV memory | L40S |
| 6 | Mixture of Experts (MoE) — Router Analysis | Expert load imbalance, all-to-all communication overhead in multi-GPU | 8× H100 |

---

## Contribution Protocol

Crucible maintains strict editorial standards. Submissions that do not meet the following criteria will be rejected without review.

### Requirements

1. **Mathematical rigor**: All equations must be written in LaTeX and compiled correctly via MathJax. Informal descriptions of mathematical operations are not acceptable as a substitute for formal notation.

2. **Hardware profiling data**: Every paper teardown must include at minimum:
   - VRAM consumption profiles (peak and average) measured with `nvidia-smi`, `nvml`, or equivalent
   - Time-to-First-Token (TTFT) and throughput (tokens/sec) benchmarks at multiple batch sizes
   - Kernel execution timelines from `nsys` (Nsight Systems) or `ncu` (Nsight Compute) where kernel-level claims are made
   - Where CGo or FFI bridging is involved: CGo bridging overhead measured with `go test -bench` and `pprof`

3. **Reproducibility**: All profiling scripts, environment specs (CUDA version, driver version, OS, GPU model and firmware revision), and raw data must be published alongside the article in the corresponding `/data/` subdirectory.

4. **No benchmark tourism**: Do not publish results from a single configuration. Sweep at least three axis variables (e.g., sequence length, batch size, precision) and explain the interaction effects.

5. **Primary sources only**: Claims about architectural design decisions must cite the original paper, commit, or issue thread. Blog posts and tweets are not citable sources.

### Submission Process

1. Fork this repository
2. Duplicate `templates/article-template.html` into the appropriate category subdirectory
3. Fill all required sections — incomplete sections will block merge
4. Open a pull request with the tag `[TEARDOWN]`, `[BENCHMARK]`, or `[ANALYSIS]` in the title
5. At least one member of the Inference Foundry Core Team must approve before merge

### File Naming Convention

```
articles/{category}/{paper-slug}-{YYYY-MM}.html
data/{paper-slug}/profiling-{hardware-slug}.csv
data/{paper-slug}/env-{hardware-slug}.txt
```

Example:
```
articles/attention/flashattention3-2024-08.html
data/flashattention3/profiling-h100-sxm5.csv
data/flashattention3/env-h100-sxm5.txt
```

---

*Crucible is maintained by the Inference Foundry engineering team. All content is licensed under the terms specified in `LICENSE`.*
