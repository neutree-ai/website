---
title: "Neutree 1.0.1: Extending the Operations Layer to External APIs"
description: "Most teams run both private and external models, but they shouldn't need two control planes. Neutree 1.0.1 brings external APIs into the same operations layer, and makes the platform itself easier to evolve underneath running workloads."
pubDate: 2026-04-29
coverImage: "/images/og-image.png"
coverAlt: "Neutree 1.0.1 Release"
tags: ["release", "v1.0.1"]
---

When we [introduced Neutree](/blog/introducing-neutree), the argument was that running models is no longer the hard part. The harder part is turning models into reliable, governable services. Neutree 1.0.1 takes that argument one step further in two directions.

First, the operations layer should not stop at the boundary between private models and external APIs. If a team has both, they should be governed through the same control plane.

Second, an operations layer is only useful if the platform itself stays out of the way during day-to-day work. Cluster upgrades, engine version changes, and routine maintenance should not require rebuilding what already works.

This release focuses on these two directions. The full list of changes is available in the [1.0.1 release notes](https://docs.neutree.ai/1.0.1/release-notes/what's_in_this_release/).

## Bringing External APIs Into the Same Control Plane

In practice, very few teams use only private models or only external APIs. Most use both — private deployments for sensitive data and cost-controlled workloads, public services for capabilities they don't yet host themselves. The result is two parallel stacks: two ways to authenticate users, two ways to enforce access, two places to look at usage.

Neutree 1.0.1 introduces external endpoints as a first-class resource. An endpoint can now point to an external provider — for example, OpenAI — and the AI gateway proxies requests through it with the same authentication, RBAC, and usage accounting that already apply to private endpoints. Tokens and quotas are tracked centrally. The application code does not need to know whether a model is hosted internally or behind a public API.

To support a broader set of clients, this release also adds compatibility with the Anthropic protocol on the gateway side. Together with the existing OpenAI-compatible interface, applications written against either protocol can target Neutree without modification.

## Day-2 Operations Without Disruption

The other half of the release is about reducing the operational cost of running the platform itself.

### Online cluster upgrades

Both static node clusters and Kubernetes clusters can now be upgraded in place. Earlier, version changes were a planned event that required recreating clusters; in 1.0.1, the upgrade flow keeps existing workloads running. Patch releases can be rolled out on a normal cadence rather than during a maintenance window. Cluster status reporting was also refined — `Updating`, `Upgrading`, and `Deleting` are now first-class states, and spec-hash comparison gives an accurate view of where each cluster is in its lifecycle.

### Multiple engine versions, side by side

Static node clusters can now run different inference engine versions simultaneously. This matters when one model requires a newer vLLM build while another is pinned to an older one — both can share the same cluster instead of forcing a global decision.

## Working with Neutree

Alongside the two main themes, 1.0.1 makes Neutree easier to work with on a daily basis.

On the **CLI**, declarative management is now a first-class workflow. New `apply`, `get`, `wait`, `delete`, and `cleanup` commands let resources be managed from version-controlled manifests, which fits naturally into GitOps-style pipelines. For platform teams that already operate the rest of their infrastructure this way, Neutree resources no longer need to live outside that loop.

On the **UI**, this release lands a broad set of quality-of-life improvements across onboarding, resource management, observability, and access control. None of them are individually large, but together they make day-to-day use noticeably smoother.

## Looking Ahead

Neutree's direction has not changed: provide the control and operations layer that lets model inference be operated as a shared, governable system. 1.0.1 widens that layer to include external APIs, and lowers the cost of evolving the platform underneath running workloads.

For setup and concepts, the [documentation](https://docs.neutree.ai/1.0.1/) remains the best starting point. Issues and contributions are welcome on [GitHub](https://github.com/neutree-ai/neutree).
