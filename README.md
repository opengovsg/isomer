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

### Extra tools

1. Vercel
   a. To get access to vercel, go to 1Password (1PW) and find the credentials for `isomeradmin`. Login via that Github account and you should have access
2. Database GUI
   a. we have a tableplus subscription. Download the Tableplus software [here](https://tableplus.com/download) and find the credentials in 1Password by searching for `Tableplus License`
3. For a stacked PR workflow, we also have access to [Graphite](https://graphite.dev/). Click on [this](https://app.graphite.dev/invite/github/opengovsg?inviter=0qpsjhZ8WQoruHDLa64F&team=509074568&name=Open%2520Government%2520Products) link to get access.
