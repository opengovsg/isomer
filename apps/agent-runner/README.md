# @isomer/agent-runner

Cloudflare Worker that brokers between Linear, Anthropic Managed Agents, and GitHub for the L3 AI-adoption pipeline. **Stateless** — no database, no in-memory state across requests. Source of truth lives in Linear (ticket labels, comments) and Anthropic (session metadata).

## Status

PR-1: Worker shell only. Verifies signatures and acks, but does no real dispatch yet — the `LINEAR_AGENT_TRIGGER` env flag short-circuits with 204 when off (the default). Follow-up PRs wire the Anthropic Managed Agents client, the Linear label state machine, and the pick resolver.

## Endpoints

| Path              | Caller                   | What it does today                                            |
| ----------------- | ------------------------ | ------------------------------------------------------------- |
| `POST /linear`    | Linear webhooks          | Verify HMAC + timestamp window, parse, log intent, 204 / 202. |
| `POST /anthropic` | Anthropic Managed Agents | Verify HMAC + timestamp window, parse, log intent, 204 / 202. |

## Local development

```bash
pnpm --filter @isomer/agent-runner dev
```

`wrangler dev` runs the Worker on `http://localhost:8787`. Configure secrets in a `.dev.vars` file (gitignored):

```
LINEAR_WEBHOOK_SECRET=dev-secret
ANTHROPIC_WEBHOOK_SECRET=dev-secret
ANTHROPIC_API_KEY=sk-ant-...
LINEAR_API_TOKEN=lin_api_...
```

Use [webhook.site](https://webhook.site) or `ngrok` to receive real Linear webhooks locally, then replay them against `localhost:8787` with `curl -X POST -H "linear-signature: ..." --data-binary @payload.json http://localhost:8787/linear`.

## Tests

```bash
pnpm --filter @isomer/agent-runner test:unit
```

The HMAC verifier has full coverage — every other piece is either a stateless parser or a stub for a follow-up PR.

## Deploy

```bash
pnpm --filter @isomer/agent-runner deploy
```

The Worker deploys to Cloudflare under the `isomer-agent-runner` name. Production secrets are set per-env via:

```bash
wrangler secret put LINEAR_WEBHOOK_SECRET
wrangler secret put ANTHROPIC_WEBHOOK_SECRET
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put LINEAR_API_TOKEN
```

## Trigger lifecycle (planned, not in this PR)

Designed for stateless operation — every webhook handler reads state from Linear or Anthropic at request time and writes state back to Linear via labels and comments.

```
Linear ticket gets `ai:implement` label
  → POST /linear
  → Worker validates fields, checks for existing `agent:running` label (skip if present)
  → Worker calls Anthropic POST /v1/sessions
       metadata: { linearIssueId }
       webhook: this Worker's /anthropic URL
  → Worker writes `agent:running` label to the Linear ticket

Anthropic session goes idle (e.g. feature-plan finished)
  → POST /anthropic { type: session.status_idle }
  → Worker swaps Linear label: agent:running → agent:idle

Human comments `pick: B` on the Linear ticket
  → POST /linear (comment.create)
  → Worker queries Anthropic for the session by metadata.linearIssueId
  → Worker POSTs user.custom_tool_result with the pick
  → Worker swaps Linear label: agent:idle → agent:running

Anthropic session completes
  → POST /anthropic { type: session.completed }
  → Worker clears all agent:* labels from the Linear ticket
```

If the Worker crashes, the next webhook recovers — no state is lost because there's no Worker-side state.

## Rollback

`LINEAR_AGENT_TRIGGER=false` (the default) is the master kill-switch — handlers short-circuit before any outbound work. Flip via `wrangler secret put` or directly in `wrangler.toml [vars]` + redeploy.

Full rollback: `wrangler delete` removes the Worker. Linear and Anthropic are independent — no cleanup required there.
