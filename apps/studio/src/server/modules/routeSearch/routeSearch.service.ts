import { experimental_evaluate as evaluate } from "ai"

import type { StudioRouteDefinition } from "./studioRoutes"

export const JEV_MODEL_ID = "typesafe-ai/jev"
export const NONE_ROUTE_CHOICE = "none"
/**
 * Extra destinations besides Jev's top choice. 0.35 hid short queries such as
 * "user", where none wins and the real page is only somewhat likely.
 */
const MIN_MATCH_PROBABILITY = 0.2
const MAX_MATCHES = 3

export interface MatchedStudioRoute {
  id: string
  label: string
  href: string
  description: string
}

export interface RouteChoiceAnswer {
  type: "choice"
  choice: string
  probabilities?: Record<string, number>
}

export type EvaluateStudioRoutes = (input: {
  query: string
  criteria: Record<string, string>
}) => Promise<RouteChoiceAnswer>

const evaluateWithJev: EvaluateStudioRoutes = async ({ query, criteria }) => {
  const result = await evaluate({
    model: JEV_MODEL_ID,
    state: query,
    questions: {
      destination: {
        type: "choice",
        instructions:
          "Which Studio destination is this search trying to open? Pick none when it is looking for a page, folder, or collection by title.",
        criteria,
      },
    },
    providerOptions: {
      gateway: { zeroDataRetention: true },
    },
  })

  return result.answers.destination
}

export const buildRouteCriteria = (
  routes: StudioRouteDefinition[],
): Record<string, string> => {
  return {
    ...Object.fromEntries(routes.map((route) => [route.id, route.description])),
    [NONE_ROUTE_CHOICE]:
      "The query is looking for a page, folder, or collection by its title, not a Studio settings or admin destination.",
  }
}

export const pickRouteMatches = ({
  siteId,
  routes,
  answer,
}: {
  siteId: string
  routes: StudioRouteDefinition[]
  answer: RouteChoiceAnswer
}): MatchedStudioRoute[] => {
  const routesById = new Map(routes.map((route) => [route.id, route]))
  const probabilities = answer.probabilities

  const rankedFromProbabilities = probabilities
    ? Object.entries(probabilities)
        .filter(([id]) => id !== NONE_ROUTE_CHOICE && routesById.has(id))
        .filter(([, probability]) => probability >= MIN_MATCH_PROBABILITY)
        .sort(([, left], [, right]) => right - left)
    : []
  const selectedId =
    answer.choice !== NONE_ROUTE_CHOICE && routesById.has(answer.choice)
      ? answer.choice
      : undefined
  const ranked = selectedId
    ? [
        [selectedId, probabilities?.[selectedId] ?? 1] as const,
        ...rankedFromProbabilities.filter(([id]) => id !== selectedId),
      ]
    : rankedFromProbabilities

  return ranked.slice(0, MAX_MATCHES).flatMap(([id]) => {
    const route = routesById.get(id)
    if (!route) return []
    return [
      {
        id: route.id,
        label: route.label,
        href: route.href(siteId),
        description: route.description,
      },
    ]
  })
}

export const matchStudioRoutes = async ({
  siteId,
  query,
  routes,
  evaluateRoutes = evaluateWithJev,
}: {
  siteId: string
  query: string
  routes: StudioRouteDefinition[]
  evaluateRoutes?: EvaluateStudioRoutes
}): Promise<MatchedStudioRoute[]> => {
  const trimmed = query.trim()
  if (!trimmed || routes.length === 0) return []

  const answer = await evaluateRoutes({
    query: trimmed,
    criteria: buildRouteCriteria(routes),
  })

  return pickRouteMatches({ siteId, routes, answer })
}
