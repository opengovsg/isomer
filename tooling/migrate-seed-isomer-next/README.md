## Migrate + Seed Isomer Studio with Isomer Next GitHub site

This script migrates an Isomer Next GitHub repository into the Isomer Studio database. More specifically, it does the following:

1. Clones the GitHub repository that you want to migrate into the `repos` folder.
2. Recursively iterates through all the files and folders inside the `schema` folder and prepares them to be ingested into the Studio database.
   1. This involves converting existing index pages into the new `_index.json` format.
3. Creates the respective Resource, Blob and Version for each file and folder inside the `schema` folder.
4. Creates the Navbar and Footer rows inside the Studio database, and updates the Site config and theme.
5. "Studioify" the site by replacing any internal links with reference links, and replacing images/files with the proper asset links.
6. Prepares the assets folder with all the images and files required to be uploaded to the assets S3 bucket.

### Setup

This script requires authenticating to GitHub and to the Studio database, so you will need to set up the GitHub API token and the SSH keys to authenticate to the bastion jump host. To do that, duplicate the `.env.example` file into `.env` and update the values accordingly:

- `DATABASE_URL`: This is the database connection string to the Studio database (but should be localhost since we are using port forwarding).
- `GITHUB_TOKEN`: This is the GitHub token that should have access to the isomerpages organisation, and has read access to the repository that you wish to migrate.
- `PUBLISHER_USER_ID`: This is the user ID of the user to assign as the publisher of all pages. You can use your own user ID stored inside the production DB User table.

Additionally, you need to set up your SSH keys and `.env.prod` files inside the `.ssh` folder:

1. Create a `.ssh` folder inside this folder.
2. Create a `.env.prod` (for production) with the following environment variables:
   1. `SSH_HOST`: This is the IP address or domain name of the bastion host to jump through to access the database.
   2. `SSH_USER`: This is the user to use when connecting to the bastion host.
   3. `DB_HOST`: This is the full hostname of the RDS database server, which should be the writer endpoint of the RDS cluster.
3. Add the SSH private key as `isomer-next-prod-bastion.pem` inside this `.ssh` folder.

Once everything is set up, verify that you are able to connect to the bastion host by connecting to the OGP VPN, then running `npm run jump:prod`. If successful, you should be able to see a shell session started on the bastion host.

### Running the migration and seeding process

As you will be modifying the production database and creating lots of entries, make sure to **follow these steps very carefully**.

1. Before starting everything, make sure to run through the [site pre-launch checklist](https://www.notion.so/opengov/Sites-pre-launch-checklist-11e77dbba788803d9e30e2bae9c18d73?pvs=4) and resolve any issues in the page contents, as it will be a lot easier to edit directly on GitHub than on Studio after the site is imported.
2. Archive the GitHub repository to prevent further edits.
3. Connect to the production RDS database writer endpoint using TablePlus.
4. Create a new Site table entry by populating the following information:
   1. `name`: This is the name of the site. Take this from `data/config.json` under `site.siteName`.
   2. `config`: Set this to `{}`. This will be updated later.
   3. `codeBuildId`: Set this to the site's `shortName` defined inside `isomer-next-infra`.
   4. `theme`: Set this to `{}`. This will be updated later.
   5. Everything else can be set to the default.
5. Modify the `MIGRATING_SITES_MAPPING` constant inside `index.ts` with the mapping of the GitHub repo name to the site ID that is currently stored in the database.
6. Ensure that you do not have any `assets` or `repos` folder and if you do, delete them.
7. Run `npm run start` to perform the migration.
8. After the migration is complete, go to the AWS production account and open the assets S3 bucket. Click on "Upload" in the root directory, click on "Add folder" and select the folder inside `assets` (which should correspond with the site ID). This will automatically upload all the assets with their corresponding UUIDs in their paths.
9. Go to CodeBuild and click on "Start build" for that site.
10. Once the site has finished building, verify that there are no broken links on the site. Use a test domain and point the origin to the site's latest build if there isn't one.
11. Delete the site's Amplify app and remove the credentials that are stored in 1Password for that site. Also remove any references to the GitHub repo, Amplify apps and staging sites inside Slack.

Separately, you should add the necessary permissions and whitelists to allow people to access the site on Studio itself.
