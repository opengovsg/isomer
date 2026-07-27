# Isomer Bruno API Collections

We use [Bruno](https://www.usebruno.com) as our API client instead of Insomnia. Bruno stores
collections as plain `.bru` text files that are committed alongside the code, making them
git-friendly and easy to review.

## Opening the collection

1. Install [Bruno](https://www.usebruno.com) (desktop app).
2. Click **Open Collection** and select the `tooling/bruno` directory.
3. You should see the **Isomer API Collections** workspace with a **searchsg** folder inside.

## SearchSG environment setup

The SearchSG requests require an API key (a base64-encoded Basic-auth credential).

1. Copy the sample environment file:
   ```
   cp tooling/bruno/searchsg/environments/production.bru.sample \
      tooling/bruno/searchsg/environments/production.bru
   ```
2. Open `production.bru` and fill in `searchsgApiKey` with the value from
   **1Password "Isomer Next"** or **AWS Secrets Manager** at `/searchsg/api-key`.
3. The real `production.bru` is gitignored — never commit it.

## Usage flow

1. Select the **production** environment in Bruno (top-right dropdown).
2. Run **1 - Auth Token** — a post-response script automatically captures `accessToken` and
   `tokenType` into the environment, so all subsequent requests authenticate automatically.
3. Run **2 - Get Site** (after setting `siteClientId` in the environment) to retrieve
   `appId` and `projectId`; copy those values into the environment vars.
4. Run **3 - Patch App Theme** or **4 - Patch Project Name** as needed.
5. Run **5 - Bootstrap Site** to provision a new SearchSG site (use cautiously — SearchSG
   has no non-production environment).

## Notes

- These endpoints mirror the implementation in
  `apps/studio/src/server/modules/searchsg/searchsg.service.ts` and
  `tooling/site-launch/create-searchsg-client.ts`.
- The `Authorization: Basic {{searchsgApiKey}}` header sends the API key as-is (it is
  already a full base64 credential string, not a plain user:pass pair).
