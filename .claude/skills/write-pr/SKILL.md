---
name: write-pr
description: This writes a pull request (PR) description for the current branch.
---

# Instructions

Before starting, always double check the current git status

Write a pull request for the current branch. The pull request should follow the template and it should focus on the impact of the change as well as the technical changes made in the current pull request. Under the Tests heading, if the PR includes changes to production code functionality (i.e. not purely documentation, test-only, CI/CD config, dev dependency, or formatting changes), populate the "Manual Verification Steps" checklist with specific, actionable steps that a release deployer can follow to manually verify that the PR's functionality works correctly. These steps should be tailored to the actual changes in the PR (e.g., navigate to a specific page, perform an action, verify an expected outcome). If there are no production code changes, remove the Manual Verification Steps section entirely.

The language used should be clear and unambiguous. Additionally, use the `gh` command-line tool to create the pull request with the generated description. If there is already a pull request created for the current branch, update the pull request description for the current branch using the `gh` command-line tool. You should also update the pull request for the current branch with a title

Do not ask for permission to read and create the PR using the `gh` cli

# Template

## Problem

<!-- What problem are you trying to solve? What issue does this close? -->

Closes [insert issue #]

## Solution

<!-- How did you solve the problem? -->

**Breaking Changes**

<!-- Does this PR contain any backward incompatible changes? If so, what are they and should there be special considerations for release? -->

- [ ] Yes - this PR contains breaking changes
  - Details ...
- [ ] No - this PR is backwards compatible

**Features**:

- Details ...

**Improvements**:

- Details ...

**Bug Fixes**:

- Details ...

## Before & After Screenshots

**BEFORE**:

<!-- [insert screenshot here] -->

**AFTER**:

<!-- [insert screenshot here] -->

## Tests

<!-- What tests should be run to confirm functionality? -->

**Manual Verification Steps**:

<!-- Checklist of steps for the release deployer to manually verify that the PR functionality works correctly. Each step should be actionable and specific. -->

- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

**New scripts**:

- `script` : script details

**New dependencies**:

- `dependency` : dependency details

**New dev dependencies**:

- `dependency` : dependency details
