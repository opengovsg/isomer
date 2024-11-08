# Isomer Next

This is a monorepo for the Isomer Next project.

## Getting Started

This monorepo uses Turborepo. To get started, first install the `turbo` command:

```bash
npm install turbo --global

```

### Credentials

There are a few steps to getting started:

1. First, ensure that you are added to the Okta SSO. This can be verified via going to the `all-might` repository located [here](https://github.com/opengovsg/all-might)
   a. ensure that the user has a `/users/<name>.yml` file
   b. next, add the user to the relevant groups in `/groups`
   c. lastly, add the user to the relevant `applications`

2. Next, add the user to the AWS opengovsg org. This is done via configuration on the sso repo [here](https://github.com/opengovsg/opengovsg-aws-org-configs)
   a. follow the same process as above - add the users to `/config/users/<name>.yml`
   b. thereafter, add the user to either `/config/groups/isomer-admins.yaml` if they require admin permissions (engineer) or to `/config/groups/isomer-users.yaml` if they are not an engineer

3. Thirdly, get the credentials for 1Password
4. Add the user to the `isomerpages` organisation by adding them to the file [here](https://github.com/opengovsg/isomer-infra/blob/main/src/github/constants.ts)
5. Add the user to the relevant github teams [here](https://github.com/orgs/opengovsg/teams?query=isomer) by asking the maintainer

### Cutting a release

We run releases via the `publish` event. Hence, in order to cut a release, we have to go through the following steps:

1. first, select the release commit
2. generate a tag for the release commit from the previous tag as follows:
   - if you're making a hotfix, add a 0.0.1 to the previous version
   - if you're making a minor upgrade, add a 0.1 to the previous version.
   - for all purposes, all our releases are minor upgrades so we will not be incrementing the major version number
3. push the tag to the remote origin
4. go to github and click on `Tags`
5. next, click on releases and draft a new release
6. choose the tag you have previously created
7. generate release notes (this can be done automatically via the button)
8. publish the release

### Running database migrations

1. first, add the relevant `.pem` file to the `apps/studio/ssh` folder
   - this can be found by searching for `AWS Isomer Next <env> Bastion SSH Key` in your 1Password vault
2. Next, duplicate the `.env.example` in `apps/studio` to `.ssh/.env.<env>`
3. Fill in the relevant information by searching for `Isomer Next <env> Database` inside 1password
4. Next, run `npm run jump:<env>` from within the `apps/studio` folder
5. Next, run `npm run migrate:<env>` from within the `apps/studio` folder
6. (Optional) If you need to run a seed, run `npm run db:seed`

### Extra tools

1. Vercel
   a. To get access to vercel, go to 1Password (1PW) and find the credentials for `isomeradmin`. Login via that Github account and you should have access
2. Database GUI
   a. we have a tableplus subscription. Download the Tableplus software [here](https://tableplus.com/download) and find the credentials in 1Password by searching for `Tableplus License`
3. For a stacked PR workflow, we also have access to [Graphite](https://graphite.dev/). Click on [this](https://app.graphite.dev/invite/github/opengovsg?inviter=0qpsjhZ8WQoruHDLa64F&team=509074568&name=Open%2520Government%2520Products) link to get access.
