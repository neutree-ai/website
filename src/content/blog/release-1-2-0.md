---
title: "Neutree 1.2: Flex Engine and Predictable Resource Planning"
description: "Neutree 1.2 adds Flex Engine for non-LLM models like MinerU and PaddleOCR, plus visual model registry management, automatic KV-cache and GPU memory calculation, and Project-based API key management."
pubDate: 2026-09-14
coverImage: "/images/og-image.png"
coverAlt: "Neutree 1.2 Release"
tags: ["release", "v1.2.0"]
---

AI platforms rarely run just one kind of model, and they rarely run just LLMs. Document parsing, OCR, and traditional machine learning models sit alongside language and embedding models in most production environments, each with its own runtime requirements. Once a model service is running, the next problem is resource planning: knowing what a deployment will cost in GPU memory, and knowing who is actually using each API key.

Neutree 1.2 addresses both. Flex Engine extends model support beyond standard inference engines to non-LLM workloads such as MinerU and PaddleOCR. Visual model registry management, automatic KV-cache and GPU memory calculation, and Project-based API key management make resource planning and operations more predictable as the platform scales.

## From LLMs to OCR and Machine Learning Models

Beyond large language models, enterprises building AI platforms often need document parsing, OCR, and traditional machine learning models for image processing and document recognition. These models frequently require extra non-inference work, such as PDF recognition and format conversion, so teams typically deploy additional virtual machines or containers alongside inference engines like vLLM. That duplicates infrastructure work and makes unified API management and model governance harder across environments.

Building on standard inference engines such as vLLM and SGLang, Neutree 1.2 introduces **Flex Engine** to support MinerU, PaddleOCR, and selected machine learning models. Language, multimodal, embedding, rerank, document parsing, OCR, and machine learning models can now be managed on one platform, then published and called through Neutree's unified model gateway.

![Flex Engine extends Neutree's unified model gateway to non-LLM models](/images/blog/release-1-2-0-flex-engine.png)

For platform teams, this removes duplicated infrastructure work and improves deployment efficiency. For business teams, it provides one consistent way to access different AI capabilities, shortening the path from model validation to production use.

## Simpler Resource Planning and Management

### Visual model registry management

Before deploying a model, teams typically pull it from a registry like Hugging Face and check its source, parameter size, version, and other details by hand. As the number of models grows, checking each one individually becomes expensive, and platform teams need a faster way to see model source, size, and key attributes to make good deployment decisions.

Neutree 1.2 improves model registry management with a visual interface that unifies public and private models, showing source, connection status, visibility, model count, storage usage, and update time in one place. Before deployment, users can also inspect a model's parameter count, size, precision, and context length.

![Visual model registry showing source, status, and per-model details](/images/blog/release-1-2-0-model-registry.png)

### Automatic KV-cache and GPU memory calculation

Resource planning affects both deployment speed and stability. Beyond model weights, KV-cache requirements change with context window, concurrency, model architecture, and precision, and manual estimates tend to go wrong in one of two directions: failed deployments from under-provisioning, or wasted GPU memory from over-provisioning.

With the improved model registry, Neutree 1.2 automatically parses model structure, identifies the parameters that matter, and calculates the KV-cache a deployment will need based on the requested context window and concurrency. It then combines model weights and KV-cache into a single recommended GPU memory figure, so users can check a deployment plan against available resources before committing to it.

![Automatic KV-cache calculation and GPU memory recommendation](/images/blog/release-1-2-0-kv-cache-calculation.png)

This gives users a more accurate resource check before deployment, reducing both failure risk and unnecessary GPU memory waste.

### Project-based API key management

As an AI platform serves more business teams, the number of API keys grows quickly. When keys live in a flat list with only manual names or notes to distinguish them, it becomes difficult for administrators to tell who owns each key and what it's for, which in turn complicates auditing, rate limiting, and troubleshooting.

Neutree 1.2 introduces Project-based API key management. Keys can be grouped by business project, with a Project selected or created at key-creation time and ownership carried through the Project's name and description. Each key's workspace, status, usage, rate limit, supported models, and creation time are visible, with search, filtering, and expandable views.

![API keys grouped by Project instead of a flat list](/images/blog/release-1-2-0-api-key-management.png)

This turns API key management from a flat list into a business-oriented view. Administrators can trace calling relationships and resource usage across teams more easily, which is a better starting point for governance, access audits, and resource metering than a list of unlabeled keys.

## Get Started

Through standardized model delivery, unified compute and model management, model governance, gateway management, and end-to-end observability, Neutree helps teams move from simply deploying models to unified governance across models, compute, and applications.

![Neutree's model and compute management layered on Arcfra Enterprise Cloud Platform](/images/blog/release-1-2-0-arcfra-architecture.png)

Neutree 1.2 is available now as an open-source release. Visit the [Neutree repository](https://github.com/neutree-ai/neutree) to deploy it, explore the project, open an issue, or contribute to the community.
