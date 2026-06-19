# Automated PR pipeline using self-hosted agents over managed services

We chose to build the automated PR pipeline (risk labeling, code review, security review, CI autofix, and bot approval) using `anthropics/claude-code-action` as the execution shell with our own prompts and `docs/` context, rather than adopting a managed service such as CodeRabbit, the hosted Claude Code Review product, or Macroscope.

## Why

Managed services cost $15–25/PR and, more importantly, have no knowledge of our institutional context: the hot-path files, the pgboss job handler irreversibility constraint, the GrowthBook flag-gate modifier, or the OGP government-data audit requirements. That context lives in `docs/risk-taxonomy.md`, `docs/ai-workflow.md`, and the area `CLAUDE.md` files — and is what makes the risk signal trustworthy. A managed service would produce generic findings; our custom agents load these docs at run time and reason against them.

## Considered alternatives

**CodeRabbit / hosted Claude Code Review** — faster to ship initially, but opaque risk scoring and per-PR SaaS cost that compounds as PR volume grows. No path to encoding repo-specific heuristics without proprietary config that lives outside the codebase.

**PR-Agent `enable_auto_approval`** — open source and self-hostable, but auto-approval is AI-score-driven rather than rule-based; reliability issues reported in practice. Insufficient determinism for a government CMS where a false approval on a schema change or auth change is a meaningful incident risk.

## Consequences

- We own the prompt maintenance cost. When a new high-risk area is added to the codebase, the taxonomy doc and the agent prompt must be updated together.
- CI autofix commits (lint, format, build, typecheck) appear in PR history authored by the bot identity — acceptable noise given the auditability benefit.
- Bot approval counts toward required-approvals branch protection for `risk:low` PRs. A human still clicks merge; no PR is auto-merged.
