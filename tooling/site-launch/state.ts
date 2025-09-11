import { writeFileSync } from "fs"
import { confirm } from "@inquirer/prompts"
import _ from "lodash"

import _state from "./state.json"

// NOTE: assumed that `isomer` is rooted at ~
const STATE_PATH = "~/isomer/tooling/site-launch/state.json"

export const SharedSteps = {
  __type: "Shared",
  Acm: "Acm",
  Domain: "Domain",
  CodeBuildId: "CodeBuildId",
  SearchSg: "SearchSg",
  LongName: "LongName",
  IndirectionCreated: "IndirectionCreated",
} as const

export const GithubSteps = {
  __type: "Github",
  Archived: "Archived",
  S3Sync: "S3Sync",
  StudioSiteId: "StudioSiteId",
  Imported: "Imported",
} as const

export const StudioSteps = { __type: "Studio" } as const

export const Steps = _.omit(
  { ...SharedSteps, ...GithubSteps, ...StudioSteps },
  "__type",
)

type Step =
  | keyof typeof GithubSteps
  | keyof typeof StudioSteps
  | keyof typeof SharedSteps

type SiteLaunchState = {
  [step in Step]: string
}

type State = Record<string, SiteLaunchState>
const state = _state as State

export const toStateFile = async (
  domain: string,
  step: Step,
  f: () => Promise<string>,
) => {
  const siteLaunchState = state[domain]
  const prevResult = siteLaunchState?.[step]

  if (prevResult) {
    const shouldOverridePrevious = await confirm({
      message: `Previoous result for step ${step} found: ${prevResult}. Proceed to override?`,
    })
    if (shouldOverridePrevious) {
      await writeToState(f, state, domain, step)
    }
  } else {
    await writeToState(f, state, domain, step)
  }
}

async function writeToState(
  f: () => Promise<string>,
  state: State,
  domain: string,
  step: Step,
) {
  const result = await f()
  state[domain]![step] = result
  writeFileSync(STATE_PATH, JSON.stringify(state))
}

export const skipIfExists = async (domain: string, step: Step, f: Function) => {
  if (state[domain]?.[step]) {
    return
  }

  await f()
}
