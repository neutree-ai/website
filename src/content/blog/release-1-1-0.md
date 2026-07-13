---
title: "Neutree 1.1: Native GPU Virtualization and Unified Model Governance"
description: "Neutree 1.1 improves GPU utilization with native vGPU support and introduces unified controls for model usage, quotas, access, and security auditing."
pubDate: 2026-07-13
coverImage: "/images/og-image.png"
coverAlt: "Neutree 1.1 Release"
tags: ["release", "v1.1.0"]
---

AI platforms rarely serve just one kind of model. A single environment may need to run large language models alongside OCR, ASR, embedding, and reranking workloads, each with different resource and access patterns.

Neutree 1.1 addresses both sides of that challenge. Native GPU virtualization improves how accelerator capacity is shared across workloads, while a new model governance layer brings usage accounting, quota management, access control, and security auditing into one place.

## Native GPU Virtualization for More Efficient Compute

GPU passthrough remains the right choice for large models that need predictable access to the full performance of a device. It is less efficient for lightweight models or groups of smaller, concurrent workloads: when each instance occupies an entire GPU, memory and compute capacity can remain idle.

Building on the existing GPU passthrough and logical isolation options, Neutree 1.1 adds native support for virtual GPUs (vGPUs). Administrators can enable virtualization when needed and divide a physical GPU dynamically by both memory and compute capacity. Multiple model instances can then share the same device, making vGPU a practical fit for OCR, speech, embedding, reranking, and other lightweight or concurrent workloads.

GPU passthrough remains available for performance-sensitive large-model deployments. Both modes can be used on the same platform, allowing teams to preserve dedicated performance where it matters while improving utilization elsewhere.

![GPU virtualization resource configuration in Neutree](/images/blog/release-1-1-0-gpu-virtualization.jpg)

Neutree also provides a cluster-wide view of GPU allocation. Administrators can see usage by node and by physical GPU, then use that information when partitioning, scheduling, and assigning resources. Hardware-enforced isolation keeps model instances from interfering with one another even when they share a device. Together, these capabilities help increase GPU utilization and reduce the infrastructure cost of delivering model services at scale.

## Unified Model Governance

As model services are integrated into more applications, platform teams need to answer a broader set of operational questions:

- **Who is consuming model capacity?** Token usage, request distribution, and cost attribution are often spread across multiple systems.
- **How should capacity be allocated?** Different applications, users, and API keys need different limits and priorities.
- **Which models can each client access?** Distributed credentials make it difficult to enforce consistent model access, rate limits, and concurrency limits.
- **What happened during a request?** Without complete request records, troubleshooting and security audits become difficult.

![Common model governance challenges](/images/blog/release-1-1-0-governance-challenges.jpg)

Neutree 1.1 extends the existing model gateway into a unified governance layer for both private deployments and external model APIs. Applications continue to use a single, familiar API endpoint, while platform teams gain centralized control over usage, quotas, access, and auditing.

![Unified model governance in Neutree](/images/blog/release-1-1-0-model-governance.jpg)

### Usage accounting

Token consumption and request activity can now be analyzed by API key, user, and model. This gives administrators a clear view of how capacity is distributed across applications and services, providing a basis for resource planning, cost attribution, and service optimization.

### Quota management

Administrators can assign an independent token quota to each API key. Quotas prevent a single application or test workload from consuming a disproportionate share of model capacity, while allowing allocation to reflect business priority and actual demand.

### Access control

Each API key can be configured with request rate limits, concurrency limits, and an explicit list of accessible models. These controls apply the principle of least privilege, reduce the risk of misuse or unauthorized access, and improve stability when model services are shared across teams.

### Access logs and security auditing

Neutree records each request with its source, API key, model, status, token consumption, throughput, latency, and completion reason. Request and response details can also be retained when deeper investigation is required. This request-level history supports troubleshooting, performance analysis, and security auditing from the same operational layer.

## Get Started

As enterprise AI moves from isolated pilots to production use, a model platform needs to do more than deploy and serve models. It must also help teams manage accelerator capacity, model access, and the complete request lifecycle.

Neutree 1.1 balances dedicated performance with efficient resource sharing through native GPU virtualization. Its model governance capabilities bring distributed model traffic behind a single entry point where usage is visible, quotas are enforceable, permissions are manageable, and requests are traceable.

Neutree 1.1 is available now as an open-source release. Visit the [Neutree repository](https://github.com/neutree-ai/neutree) to deploy it, explore the project, open an issue, or contribute to the community.
