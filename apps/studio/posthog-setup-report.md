# PostHog setup report

PostHog product analytics was initialized for the Studio browser, authenticated users are identified by stable application IDs, ten successful Studio actions are instrumented, global browser exception capture is enabled, and a starter dashboard was created.

## What the run set up

- **Installed:** `posthog-js` 1.408.1 and `posthog-node` 5.46.1 were resolved through pnpm during review. The packages are declared in `package.json`.
- **Initialization:** `instrumentation-client.ts:15-24` initializes one `posthog-js` singleton from `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`, keeps default capture behavior, enables `capture_exceptions`, and fails loudly in non-production when configuration is missing while remaining a production no-op.
- **Environment and CSP:** `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`, and `NEXT_PUBLIC_POSTHOG_ASSETS_HOST` are documented in `.env.example` and were confirmed present locally. `next.config.mjs:64` permits the assets host in `script-src`; `next.config.mjs:82` permits the ingestion host in `connect-src`; existing `blob:` worker support remains.
- **User identification:** Wired. `src/features/auth/LoginStateContext.tsx:54-64` identifies the authenticated user with `User.id` after `me.get` resolves, sends email and optional name as person properties, and resets before an in-session account switch. `src/features/me/api/useMe.ts:22` resets after confirmed logout. Captured events use the authenticated browser singleton and no explicit email/name distinct ID.
- **Error tracking:** Global browser exception capture is enabled by `capture_exceptions: true` in `instrumentation-client.ts:18`. No additional provider, error boundary, or manual scattered exception handlers were added.

## Events instrumented

These captures are placed in successful mutation handlers. The run reviewed the call sites and event plan, but did **not** observe events arriving in PostHog; event delivery remains unconfirmed.

| Event                     | What it measures                                                | File                                                                                                         |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `folder_created`          | A user successfully creates a folder.                           | `src/features/editing-experience/components/CreateFolderModal/CreateFolderModal.tsx`                         |
| `collection_created`      | A user successfully creates a collection.                       | `src/features/editing-experience/components/CreateCollectionModal/CreateCollectionModal.tsx`                 |
| `page_created`            | A user successfully creates a page.                             | `src/features/editing-experience/components/CreatePageModal/CreatePageWizardContext.tsx`                     |
| `collection_page_created` | A user successfully creates a collection page.                  | `src/features/editing-experience/components/CreateCollectionPageModal/CreateCollectionPageWizardContext.tsx` |
| `page_published`          | A user successfully publishes a page immediately.               | `src/features/editing-experience/components/PublishButton.tsx`                                               |
| `gazette_created`         | A user successfully creates a Gazette entry.                    | `src/features/gazettes/components/CreateGazetteModal/CreateGazetteModal.tsx`                                 |
| `redirect_created`        | A user successfully creates a redirect.                         | `src/features/settings/Redirects/components/AddRedirectCard.tsx`                                             |
| `site_user_invited`       | A user successfully sends an invitation to a site collaborator. | `src/features/users/components/UserPermissionModal/AddUserModal.tsx`                                         |
| `site_user_removed`       | A user successfully removes a collaborator from a site.         | `src/features/users/components/RemoveUserModal/RemoveUserModal.tsx`                                          |
| `resource_deleted`        | A user successfully deletes a page, collection, or folder.      | `src/features/dashboard/components/DeleteResourceModal/DeleteResourceModal.tsx`                              |

Scheduled publishing and bulk redirect publishing were intentionally not instrumented. No server-side PostHog captures were implemented.

## Dashboard

[Analytics basics (wizard)](https://us.posthog.com/project/535927/dashboard/1933004) contains five tagged insights covering content creation, publishing, collaboration, site operations, and the content publishing funnel. The definitions use the ten planned event names over the last 30 days and may remain empty until events arrive.

## What the run verified—and did not

Verified by the run: SDK resolution through pnpm; singleton initialization shape; environment-key presence; CSP configuration; stable-ID identification and logout reset code paths; ten capture call sites after successful mutations; global exception-capture configuration; and successful creation of the dashboard and five insight tiles.

Not verified: a production build, typecheck, lint, test suite, application boot, or actual event delivery. The review explicitly reported that no delivery test was performed, so this report makes no claim that any event was captured by PostHog.

## Build and installation conflict

The initial prescribed npm install could not process the existing workspace manifest because dependencies use pnpm-only `catalog:` protocols; npm reported `EUNSUPPORTEDPROTOCOL Unsupported URL Type "catalog:"`. The later pnpm install resolved `posthog-js@1.408.1` and `posthog-node@5.46.1` but exited during the workspace postinstall with `ERR_PNPM_IGNORED_BUILDS` for `core-js@3.49.0`. `pnpm typecheck` could not start because pnpm repeated that prerequisite install/dependency-status workflow and failed before TypeScript ran. The review reported no integration source error; build, typecheck, and lint remain unverified because of this pre-existing workspace package-manager/build-policy conflict.

## Unresolved follow-ups

- **Event delivery is unresolved:** no browser session or PostHog arrival was observed. Without a delivery check, the dashboard may remain empty and ingestion/CSP/runtime issues could still exist.
- **Server-side attribution is unresolved:** the identify handoff states that server-side captures were not implemented. If future server events are added without binding request context from forwarded tracing headers or authenticated `ctx.user.id`, those events may not be attributed to the authenticated person.
- **Deferred coverage:** scheduled publishing and bulk redirect publishing remain uninstrumented, so those actions will not appear in the current event plan or dashboard.

## Next steps

1. Set the three PostHog variables in every deploy environment, not only the local `.env`, and keep the exact names documented in `.env.example`.
2. Run the app with a real authenticated session, perform representative instrumented actions, and confirm the ten event names arrive in PostHog and populate the dashboard.
3. Resolve the workspace `core-js` ignored-build policy, then run the production build, typecheck, lint, and tests.
4. Decide whether scheduled publishing and bulk redirect publishing warrant follow-up events.
5. If server-side analytics is added, bind its captures to the authenticated stable user ID and flush before short-lived request handlers return.

## Before you merge

- [ ] Run a full production build and fix any lint or type errors introduced by the integration; the wizard could not execute these checks because pnpm stopped on `ERR_PNPM_IGNORED_BUILDS` for `core-js@3.49.0`.
- [ ] Run the test suite; the instrumented success handlers may require updated mocks or fixtures.
- [ ] Confirm `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`, and `NEXT_PUBLIC_POSTHOG_ASSETS_HOST` from `.env.example` are set in every deployment environment.
- [ ] Load the app and check the browser console for CSP violations, especially around `next.config.mjs:64` and `next.config.mjs:82`; a blocked SDK can queue events silently without sending them.
- [ ] With auth enabled, test a returning logged-in session and confirm `src/features/auth/LoginStateContext.tsx:54-64` identifies the user again rather than fragmenting the session onto an anonymous ID.
- [ ] Perform representative actions at the ten listed call sites and confirm the corresponding events appear in PostHog; the run itself did not observe delivery.
