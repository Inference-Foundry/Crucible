# Crucible Content Guide

> Strict authoring standards for all articles published in the Inference Foundry research journal.

Failure to comply with any rule in this document constitutes grounds for immediate rejection of a pull request. These rules are non-negotiable and will not be waived for any contributor, including Core Team members.

---

## 1. Mathematical Notation

### 1.1 LaTeX is Mandatory

Every mathematical expression, no matter how simple, must be written in LaTeX. The journal renders all math through [MathJax](https://www.mathjax.org/). Inline expressions use `\( ... \)` delimiters. Block-level (display) equations use `\[ ... \]` or `equation` environments.

**Acceptable:**
```html
<p>The attention score is computed as \( \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V \).</p>

\[
  O = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
  \quad \in \mathbb{R}^{N \times d_v}
\]
```

**Not acceptable:**
```html
<p>The attention score is softmax(QK^T / sqrt(d_k)) * V.</p>
```

### 1.2 Equation Numbering

All display equations that are referenced in the text must be numbered using the `\begin{equation}...\end{equation}` environment. Unnumbered display equations (`\[ ... \]`) are permitted only when the equation is not cross-referenced.

### 1.3 Symbol Consistency

All mathematical symbols introduced in an article must be defined on first use and used consistently throughout. Reusing the same symbol for different quantities within the same article is a fatal error.

### 1.4 Notation for Computational Complexity

Algorithmic complexity claims must use standard Landau notation with explicit base and assumptions stated. Do not write "linear complexity" in prose — write \( O(N) \) and specify what \( N \) represents.

---

## 2. Hardware Profiling Data

### 2.1 Required Metrics (Minimum Bar)

Every paper teardown article must include measured data for **all** of the following metrics. Estimated or theoretically derived numbers are not acceptable as substitutes for measured values.

| Metric | Tool | Notes |
|--------|------|-------|
| Peak VRAM consumption (MiB) | `nvidia-smi dmon`, `nvml` Python bindings, or `torch.cuda.max_memory_allocated()` | Report peak, not average |
| Average VRAM consumption (MiB) | Same as above | Report rolling average over inference run |
| Time-to-First-Token (TTFT, ms) | Custom timer around first generated token | Must sweep: batch size ∈ {1, 8, 32, 128} |
| Decode throughput (tokens/sec) | Custom timer over N decoded tokens | Must sweep: sequence length ∈ {256, 1024, 4096} |
| Kernel execution time (μs) | `nsys profile` + `nsys stats`, or `ncu --metrics` | Required for any kernel-level claim |
| SM occupancy (%) | `ncu --metrics sm__warps_active.avg.pct_of_peak_sustained_active` | Required for claims about parallelism |
| HBM bandwidth utilization (%) | `ncu --metrics l1tex__t_bytes.sum`, `dram__bytes.sum` | Required for memory-bound kernel analysis |

### 2.2 CGo / FFI Bridging Overhead

For any article involving Go bindings to CUDA, C libraries, or other FFI interfaces, the following additional measurements are mandatory:

| Metric | Tool | Notes |
|--------|------|-------|
| CGo call overhead (ns/op) | `go test -bench=BenchmarkCGoCall -benchmem` | Must isolate pure CGo crossing cost |
| Total FFI round-trip latency (μs) | `go test -bench` + wall clock | Include marshalling/unmarshalling cost |
| `pprof` CPU profile | `go tool pprof` | Attach flame graph as PNG in `/data/` directory |
| GC pause during FFI | `GODEBUG=gctrace=1` | Report max and P99 pause time |

### 2.3 Profiling Environment Specification

Each article must include a fully specified profiling environment in `/data/{paper-slug}/env-{hardware-slug}.txt`. The file must contain:

```
GPU Model:          NVIDIA H100 SXM5 80GB
GPU Firmware:       96.00.74.00.01
CUDA Version:       12.4
cuDNN Version:      9.1.0
Driver Version:     550.54.15
OS:                 Ubuntu 22.04.4 LTS
Kernel:             6.5.0-28-generic
CPU:                Intel Xeon Platinum 8480+ (2× socket, 56 cores each)
RAM:                2048 GiB DDR5 ECC
PyTorch Version:    2.4.0+cu124
Triton Version:     3.0.0
NCCL Version:       2.21.5
```

Any missing field from the above template is grounds for rejection.

### 2.4 Data Formatting

- All profiling data must be published as `.csv` files in `/data/{paper-slug}/`.
- CSV files must include a header row with human-readable column names.
- All time values must be in a single, explicitly stated unit. Do not mix ms and μs in the same table.
- Charts generated from profiling data must be reproducible from the provided CSV using only standard Python libraries (`matplotlib`, `pandas`). The generation script must be included in `/data/{paper-slug}/plot.py`.

### 2.5 Multi-Axis Sweeps

Single-point benchmarks will not be accepted. Every profiling claim must be supported by a sweep over at least three values of at least two independent variables. Acceptable axes include:

- Batch size
- Sequence length / context length
- Model precision (FP32, BF16, FP8, INT8, INT4)
- Number of GPU devices (for multi-GPU claims)
- Prompt length vs. generation length ratio

State interaction effects explicitly. If throughput degrades non-linearly above a certain batch size, explain the suspected cause (e.g., L2 cache thrashing, HBM bandwidth saturation, SM scheduling pressure).

---

## 3. Architectural Analysis

### 3.1 Primary Sources

All claims about why an architectural decision was made must cite:
- The original peer-reviewed paper (arXiv or conference proceedings)
- A specific commit or pull request if the claim is implementation-specific
- An official issue, RFC, or design document for engineering decisions

Blog posts, YouTube videos, and social media posts are not citable. If a claim cannot be sourced to a primary document, it must be labeled `[UNVERIFIED]` and a corresponding issue must be filed.

### 3.2 Bottleneck Classification

Each identified architectural bottleneck must be classified as one of:

| Class | Definition |
|-------|-----------|
| `COMPUTE-BOUND` | Kernel is limited by peak FLOP/s of the SM array |
| `MEMORY-BOUND` | Kernel is limited by HBM or L2 bandwidth, not compute |
| `LATENCY-BOUND` | Performance dominated by kernel launch overhead or PCIe latency |
| `SYNCHRONIZATION-BOUND` | Performance dominated by inter-warp or inter-SM synchronization |
| `COMMUNICATION-BOUND` | Multi-GPU: dominated by all-to-all, all-reduce, or P2P transfers |

Misclassifying a bottleneck is an error. If the roofline model is ambiguous, state the ambiguity and provide the roofline plot.

### 3.3 Roofline Model

For any kernel analysis section, include a roofline model plot showing:
- Achieved arithmetic intensity (FLOP/byte) on the x-axis
- Achieved throughput (FLOP/s) on the y-axis
- Peak compute ridge point for the target hardware
- Peak memory bandwidth line
- Measured kernel position on the plot

The roofline plot must be generated from measured `ncu` data, not estimated.

---

## 4. Article Structure

Every article must follow the structure defined in `templates/article-template.html`. The following sections are non-optional:

| Section | Required Content |
|---------|----------------|
| Abstract | ≤ 250 words, no equations, no citations. Summarize what was measured and the three most important findings. |
| Background | Mathematical prerequisites and notation. All symbols defined here. |
| Mathematical Deconstruction | Full derivation chain from paper equations to implementation-level operations. |
| Hardware Profiling | All tables and charts from §2. Raw data linked to `/data/` directory. |
| Architectural Bottlenecks | Roofline analysis, bottleneck classification, optimization hypotheses. |
| Reproduction Notes | Complete environment spec, command-line invocations, known failure modes. |
| References | IEEE-style numbered citation list. |

Omitting any section or leaving placeholder text in any section will block merge.

---

## 5. Style and Formatting

- **No marketing language.** Words like "revolutionary", "groundbreaking", "state-of-the-art" (except when citing an official benchmark) are prohibited.
- **No hedging without evidence.** "May be faster" or "could improve" are not acceptable without supporting measurements.
- **Active voice, technical precision.** Prefer "The kernel executes 128 warps per SM" over "Warps are executed by the kernel."
- **No unexplained acronyms.** Every acronym must be expanded on first use, even if it seems obvious. Example: "HBM (High Bandwidth Memory)".
- **Code snippets must be syntax-highlighted** using the `<pre><code>` pattern with a `data-lang` attribute for tooling compatibility.

---

## 6. Review and Merge Policy

1. Author opens PR with tag `[TEARDOWN]`, `[BENCHMARK]`, or `[ANALYSIS]`.
2. Automated CI checks validate HTML structure (required sections present, MathJax CDN present).
3. At least one Core Team member reviews mathematical correctness.
4. At least one Core Team member reviews profiling methodology and data.
5. Both reviewers must approve. A single rejection blocks merge indefinitely until resolved.
6. No force-pushes to `main`. All history is preserved.

---

*This document is versioned in this repository. Changes to the Content Guide require a supermajority (2/3) of Core Team approval.*
