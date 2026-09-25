import { experimental_evaluate as evaluate } from "ai"

import type { StudioRouteDefinition } from "./studioRoutes"

export const JEV_MODEL_ID = "typesafe-ai/jev"
/**
 * Each destination is scored on its own. A shared choice would force one
 * winner, so "logs" could not surface both audit logs and user access logs.
 */
const MIN_MATCH_PROBABILITY = 0.4
const MAX_MATCHES = 2

export interface MatchedStudioRoute {
  id: string
  label: string
  href: string
  description: string
}

export type EvaluateStudioRoutes = (input: {
  query: string
  routes: StudioRouteDefinition[]
}) => Promise<Record<string, number>>

const evaluateWithJev: EvaluateStudioRoutes = async ({ query, routes }) => {
  const questions = Object.fromEntries(
    routes.map((route) => [
      route.id,
      {
        type: "boolean" as const,
        instructions: `Does this search refer to "${route.label}"? ${route.description}`,
        criteria: {
          true: "The query refers to this destination, even when it also refers to another destination.",
          false:
            "The query does not refer to this destination. It is a page, folder, or collection title, or it is about something else.",
        },
      },
    ]),
  )

  const result = await evaluate({
    model: JEV_MODEL_ID,
    state: query,
    questions,
    providerOptions: {
      gateway: { zeroDataRetention: true },
    },
  })

  return Object.fromEntries(
    routes.map((route) => {
      const answer = result.answers[route.id]
      const probability = answer?.type === "boolean" ? answer.probability : 0
      return [route.id, probability]
    }),
  )
}

export const pickRouteMatches = ({
  siteId,
  routes,
  probabilities,
}: {
  siteId: string
  routes: StudioRouteDefinition[]
  probabilities: Record<string, number>
}): MatchedStudioRoute[] => {
  const routesById = new Map(routes.map((route) => [route.id, route]))

  return Object.entries(probabilities)
    .filter(([id]) => routesById.has(id))
    .filter(([, probability]) => probability >= MIN_MATCH_PROBABILITY)
    .sort(([, left], [, right]) => right - left)
    .slice(0, MAX_MATCHES)
    .flatMap(([id]) => {
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

  const probabilities = await evaluateRoutes({
    query: trimmed,
    routes,
  })

  return pickRouteMatches({ siteId, routes, probabilities })
}
