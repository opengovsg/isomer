# Using these scripts

1. first, run `npm run jump` for production or `npm run jump:<env>`
   a. if you are running this against production, find another engineer to pair

2. then, update your `$DATABASE_URL` in your local `apps/studio/.env` to the one for the environment
   b. ensure that the port you have specified is 5433 as we are using a jump host to tunnel our connection

3. update the script you want to invoke to pass in the correct arguments
4. invoke the command via `source .env && <path_to_script>`
