# Contributing to Isomer

Welcome to Isomer! The following are guidelines for contribution. Use your best judgment, and feel free to propose changes to this document in an issue.

## Getting started

To contribute, you can start by taking a look at our open issues marked 'contribute' under GitHub's 'Issues' tab. Feel free to assign yourself to any 'contribute' issue that interests you, and comment with questions or clarifications.

Before starting work on a PR, please **first discuss the change you wish to make via GitHub issue**, or any other method with the repository owners beforehand. This will give us the opportunity to provide feedback, and avoid wasted effort subsequently.

For other changes which are not currently in our open issues, please file an issue first for discussion, before starting work on the PR. We strongly encourage contributors not to open unsolicited PRs, as we may not be able to review or accept them.

## Security reports

Please do not file an open issue for ongoing security bugs. Instead, email us directly with your findings at [contribute@form.gov.sg](mailto:contribute@form.gov.sg).

## Bug reports and feature requests

The following guidelines help maintainers and the community understand your report, reproduce the behavior, and find related reports.

Before submitting bug reports or feature request, please check our [issues](https://github.com/opengovsg/isomer/issues) and [PRs](https://github.com/opengovsg/isomer/pulls).
You might find out that you don't need to create one.

When **submitting a bug report**, please include as many details as possible, such as the steps to reproduce this bug, expected and actual behaviour.

When **submitting a feature request**, please include the motivation, alternatives that you've considered and any additional contexts that could help us better understand your goal.

Here are some tips to writing good issues:

- **Use a clear and descriptive title** to identify the problem
- **Describe the exact steps to reproduce the problem** and **explain how you did it**
- **Provide specific examples to demonstrate the steps**
- **Include screenshots or animated GIFs if you can**
- **Explain why this new feature would be useful**

## Making a pull request

Issues available to be picked up by the community are labeled with `contribute`.

If you're submitting a pull request, some points to note:

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build. Refer to [README.md](./README.md) for more details
2. Update the [README.md](./README.md) with details of changes to the interface, including new environment variables, exposed ports, useful file locations and container parameters.
3. Write [semantic commit messages](https://www.conventionalcommits.org/en/v1.0.0/). See past [PRs](https://github.com/opengovsg/isomer/pulls) for examples.
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## Stacked PRs with Graphite

We use [Graphite](https://graphite.dev) to break large changes into a stack of small, individually-reviewable PRs. Each PR in a stack should be scoped to a single concern and revertable on its own.

### Why stack

- One concern per PR keeps reviews fast and reverts safe.
- Reviewers can approve earlier PRs while later ones evolve.
- AI-generated changes are easier to audit when split by area.

### Authoring a stack

```bash
gt create -m "feat: add foo router"      # branch + commit
# edit files for the next PR in the stack
gt create -m "feat: wire foo router to client"
gt log short                             # see the stack
gt submit --stack                        # push & open PRs for the whole stack
```

Rules of thumb:

- **One concern per branch.** If a branch touches two unrelated areas, split it: `gt split` or `gt absorb`.
- **Each PR must be revertable without breaking the ones below it.** New code paths land behind feature flags / config when the rest of the stack is not yet merged.
- **Restack after rebases.** `gt sync` pulls in `main` and restacks. Resolve conflicts bottom-up.
- **Never force-push the trunk.** `gt submit` force-pushes feature branches in the stack; this is expected.

### When *not* to stack

- One-line hotfixes and dependency bumps go straight to `main` via a single PR.
- Migrations that change schema in a non-backward-compatible way must land alone (see [Database migrations](./README.md#running-database-migrations)).

If you don't have access to Graphite yet, see the invite link in [README.md](./README.md#extra-tools).

## Contributor License Agreement

Code contributions to this project must be accompanied by a Contributor License Agreement. You (or your employer) retain the copyright to your contribution; this simply gives us permission to use and redistribute your contributions as part of the project.
Head over [here](https://go.gov.sg/ogp-cla) to submit one.

You generally only need to submit a CLA once, so if you've already submitted one (even if it was for a different project owned by [GovTech](https://www.tech.gov.sg)), you probably don't need to do it again.

## Contact us

Have questions? Feel free to reach out to us at [our contact form](https://go.gov.sg/isomer-contact/).
