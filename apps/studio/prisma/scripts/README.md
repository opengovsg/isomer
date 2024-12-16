# Using these scripts

1. first, run `npm run jump` for production or `npm run jump:<env>`
   a. if you are running this against production, find another engineer to pair

2. then, update your `$DATABASE_URL` in your local `apps/studio/.env` to the one for the environment
   b. ensure that the port you have specified is 5433 as we are using a jump host to tunnel our connection

3. update the script you want to invoke to pass in the correct arguments
4. invoke the command via `source .env && npx tsx <path_to_script>`
5. note that tsx might export the env vars to be exported. Hence, minor change to the `.env` is required to add `export` before each required env var.

## Create site script

1. On the last line, update the site name to the name you require. This should be exactly as what should be shown on Studio (e.g. "Site ABC")
2. This already adds the Isomer admins and migrators with the Admin role.

## Add users to site

1. Edit the array of `User` objects to be added at the end of the script
2. Each entry contains 4 fields: email, name, phone and role. Note that name, phone and role are optional fields. If left empty, name will be empty string, phone will be empty string and role will default to Editor.

## Update all user permissions for site

1. This script updates all users of a site to have a specific `RoleType`
2. Edit the `siteId` and `role` at the end of the script
