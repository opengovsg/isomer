import { writeFileSync } from "fs"
import { confirm } from "@inquirer/prompts"
import _ from "lodash"
import { SimplifyDeep } from "type-fest"

import _state from "./state.json"

// NOTE: assumed that `isomer` is rooted at ~
const STATE_PATH = "./state.json"

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
  GithubName: "GithubName",
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

type Step = SimplifyDeep<
  Exclude<
    | keyof typeof GithubSteps
    | keyof typeof StudioSteps
    | keyof typeof SharedSteps,
    "__type"
  >
>

type SiteLaunchState = {
  [step in Step]?: string
}

type State = Record<string, SiteLaunchState>
const state = _state as State

export const toStateFile = async (
  domain: string,
  step: Step,
  f: () => Promise<string>,
): Promise<string> => {
  const siteLaunchState = state[domain]
  const prevResult = siteLaunchState?.[step]

  if (prevResult) {
    const shouldOverridePrevious = await confirm({
      message: `Previoous result for step ${step} found: ${prevResult}. Proceed to override?`,
    })
    if (shouldOverridePrevious) {
      return writeToState(f, state, domain, step)
    } else return prevResult
  } else {
    return writeToState(f, state, domain, step)
  }
}

async function writeToState(
  f: () => Promise<string>,
  state: State,
  domain: string,
  step: Step,
) {
  const result = await f()
  if (!state[domain]) state[domain] = {}
  state[domain]![step] = result
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
  return result
}

export const skipIfExists = async (
  domain: string,
  step: Step,
  f: () => Promise<string>,
): Promise<string> => {
  if (state[domain]?.[step]) {
    console.log(`Found previous result for ${step}: ${state[domain][step]}`)
    return state[domain]?.[step]
  }

  return writeToState(f, state, domain, step)
}
