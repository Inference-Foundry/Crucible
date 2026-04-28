# 🔬 Crucible

**Crucible** is the open-source research journal and experimental log for [Inference Foundry](https://github.com/InferenceFoundry). 

This repository houses our teardowns of Machine Learning literature. We bypass high-level summaries and AI hype in favor of strict mathematical breakdowns, architectural profiling, and empirical observations from reproducing paper claims.

## 📑 Live Journal
The contents of this repository are automatically deployed via GitHub Pages. Read the active logs here: **[Link to GitHub Pages / CNAME]**

---

## ⚙️ Active Profiling (Work in Progress)
*These are papers we are currently breaking down, rewriting in raw math, or actively benchmarking against `super-ollama`.*

* **[WIP] `jepa-analysis`:** Joint-Embedding Predictive Architectures. Specifically profiling the memory bandwidth costs of the target encoder.
* **[WIP] `flash-attention-3-teardown`:** Deconstructing the FP8 block scaling equations and mapping them to expected Metal/CUDA kernel utilization.
* **[WIP] `world-models-state-space`:** Analyzing the state-space representations for environment simulation and their implications for VRAM caching.

## 📋 Queued Teardowns (Future Pipeline)
*Architectures and literature slated for future dissection. PRs claiming these topics must include a baseline profiling script.*

* *BitNet b1.58:* The math and hardware implications of 1-bit LLMs. Target: Assess CGo bridging overhead for ternary operations.
* *Mamba-2:* State Space Models (SSMs). Target: Compare theoretical context-switching latency against standard Transformer KV-cache structures.
* *Qwen2.5-VL Architecture:* Target: Dissecting the vision-language bridging mechanism for native CLI execution.

---

## 🏗️ Repository Architecture

This is a lightweight, static-generated site. We bypass heavy static site generators to keep publication overhead at zero.

* `/content/`: The raw HTML articles containing our math, tool benchmarks, and paper notes.
* `/templates/`: Contains `article-template.html`. **All new research logs must start from this template.**
* `/css/site.css` & `/js/content-filter.js`: Minimalist styling and filtering logic.
* `.github/workflows/deploy-pages.yml`: Automated CI/CD pipeline targeting the `gh-pages` branch.

## ✍️ Contribution Protocol

If you are a member of Inference Foundry contributing a new paper analysis or experimental observation:

1. **Review the Guide:** Read `CONTENT_GUIDE.md` for our strict formatting and mathematical notation ($LaTeX$) standards.
2. **Initialize:** Duplicate `templates/article-template.html` into the `/content/` directory. Name it using strict kebab-case (e.g., `content/flash-attention-v2-analysis.html`).
3. **Draft:** - Deconstruct the target paper's core equations.
   - Include any profiling scripts or benchmark data you ran to verify the paper's claims.
   - Detail where the theoretical architecture fails or bottlenecks in actual hardware (CPU/GPU) execution.
4. **Deploy:** Push to the `main` branch. The GitHub Actions workflow will automatically rebuild the live site.

---
*Inference Foundry — Bypassing the network, talking to the metal.*
