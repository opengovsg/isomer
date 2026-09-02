# remove-government-pill

Bulk-disables the "government" scope pill on a list of SearchSG sites, via
the SearchSG Admin API (https://api.services.search.gov.sg/admin/v2).

For each site ID in `sites.csv`, this script:

1. `GET`s the site's details from the Search.gov Admin API.
2. Extracts the site's first application's `appId` from the response
   (`data.siteDetail.applications[0].appId`).
3. `PATCH`es that application's config to set:
   ```json
   {
     "config": {
       "scopePill": {
         "enabled": false,
         "default": "domain"
       }
     }
   }
   ```

## Prerequisites

- [`jq`](https://jqlang.github.io/jq/) installed.
- A valid Search.gov Admin API bearer token, exported as `TOKEN`.

## Usage

1. Populate `sites.csv` with one Search.gov site ID (UUID) per line, no
   header row. This site ID is the same as the searchSG Client ID in our database.
2. Get an API token by running the **Auth Token** request in the
   `tooling/bruno/searchsg` Bruno collection (request `1 - Auth Token`).
   It authenticates with the SearchSG Admin API using the `searchsgApiKey`
   credential (from 1Password "Isomer Next" or AWS Secrets Manager at
   `/searchsg/api-key`) and writes `accessToken`/`tokenType` into the Bruno
   environment — copy the resulting `accessToken` value.
3. Export it as `TOKEN`:
   ```bash
   export TOKEN=<accessToken-from-bruno>
   ```
4. Run the script from this directory (it reads `sites.csv` via a relative
   path):
   ```bash
   cd tooling/scripts/remove-government-pill
   ./searchsg.sh
   ```

The script processes sites sequentially and prints progress and status for
each site. Blank lines in `sites.csv` are skipped.

## Notes

- This mutates production Search.gov configuration for every site listed —
  double-check `sites.csv` before running.
- If a site has no applications, the script records that site as failed and
  skips the `PATCH` request.
