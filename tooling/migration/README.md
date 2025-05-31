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
