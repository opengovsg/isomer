## Isomer Classic to Next migration script

This script is intended to automatically migrate Isomer Classic sites to Isomer Next, with the aim of preserving as much of the existing content structure as possible while also detecting and upgrading sites to meet best practices.

Some of the mappings from Classic to Next that is [documented in this Notion document](https://www.notion.so/opengov/Classic-to-Next-Common-issues-in-auto-migration-19177dbba788804892b3c2ad857710bf?pvs=4) is implemented in this script.

### Features

This script's primary feature is to automatically convert the Markdown content of Classic sites into the Isomer Next JSON schema. In addition, it can:

- Customise the folders to be migrated
- Choose if the resource room should be migrated
- Automatically move the migrated site over to Isomer Studio **(not ready yet)**

### Setting up your workspace

This script requires a connection to the Studio production database. Duplicate the `.env.example` file into `.env` and update the values accordingly:

- `DATABASE_URL`: This is the database connection string to the Studio database (but should be localhost since we are using port forwarding).
- `PUBLISHER_USER_ID`: This is the user ID of the user to assign as the publisher of all pages. You can use your own user ID stored inside the production DB User table.

Additionally, you need to set up your SSH keys and `.env.prod` files inside the `.ssh` folder:

1. Create a `.ssh` folder inside this folder.
2. Create a `.env.prod` (for production) with the following environment variables:
   1. `SSH_HOST`: This is the IP address or domain name of the bastion host to jump through to access the database.
   2. `SSH_USER`: This is the user to use when connecting to the bastion host.
   3. `DB_HOST`: This is the full hostname of the RDS database server, which should be the writer endpoint of the RDS cluster.
3. Add the SSH private key as `isomer-next-prod-bastion.pem` inside this `.ssh` folder.

Once everything is set up, verify that you are able to connect to the bastion host by connecting to the OGP VPN, then running `npm run jump:prod`. If successful, you should be able to see a shell session started on the bastion host.

### Running the script

1. Ensure that you are connected to the OGP VPN
2. In one terminal instance, run `npm run jump:prod` to create an SSH tunnel to the production RDS database using the bastion host. If successful, you should be able to see a shell session started on the bastion host.
3. Add the repos that you wish to migrate inside `config.ts`, following the requirements of the `MigrationRequest` type. The documentation of each property is provided in the `types.ts` file.
4. In a new terminal instance, run `npm run start`.

### Converting individual pages only

The full-site migration above converts an entire site. When you only need to convert **specific pages** (for example, a handful of pages a site owner wants moved into an existing Studio site), use **Script 7: Convert individual Classic pages** in the streamline menu (`../../page-migration.ts`).

Unlike the full-site flow, it does not write into Studio. It converts only the pages you list, downloads only the assets those pages actually reference, and writes everything to a conversion output folder for you to paste into Studio and upload to S3 manually.

Prerequisites are the same as the full-site flow (OGP VPN + `npm run jump:prod` tunnel for the resource-map query, and the usual `.env`). Run the streamline menu (`npm run streamline` from `tooling/scripts`) and select Script 7. You will be prompted for:

- **Classic GitHub repo name** (under `isomerpages`, e.g. `moe-peircesec`)
- **Studio site ID** — used both for the `/<site-id>/<uuid>/<filename>` asset structure and to look up the site's existing resources for internal-link resolution
- **Branch** (`master` or `staging`)
- **Target domain** (e.g. `www.example.gov.sg`), used for link cleanup and as the asset download fallback
- **Markdown paths** — repo-relative paths, **comma-separated**, e.g. `_about/history.md, pages/contact-us.md`. Paths may contain spaces (only commas and newlines separate entries), so `_about/my page.md, pages/contact us.md` works.

Output is written to `page-conversion-output/<repo>/`:

- `pages/<permalink>.json` — the studiofied pages, ready to paste into Studio
- `assets/<site-id>/<uuid>/<filename>` — upload the **contents of `assets/`** to S3, preserving the folder structure
- `asset-mappings-<repo>.csv` — original → new asset paths (with a `BROKEN` marker for any that could not be downloaded)
- `migrated-pages-<repo>.csv` — per-page status, review items, broken-asset notes, and any internal links that had no matching Studio page

Pages under a Jekyll `_posts/` folder are converted as resource-room articles; all other pages are converted as content pages. Internal links are rewritten to `[resource:<siteId>:<resourceId>]` only for pages that already exist in the target Studio site; unresolved links are left as-is and listed in the report.
