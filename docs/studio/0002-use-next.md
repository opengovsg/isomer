# 2. Use Next.js

Date: 2024-06-27

## Status

Accepted

## Context

Isomer is undergoing a rebuild from the original application that was on express for backend + react/chakra for frontend. For additional reading on why we are not using react server components (RSC), read more [here](https://opengovproducts.slack.com/archives/CK68JNFHR/p1716775203875659).

## Decision

1. Isomer is going to use starter-kit (prisma, next, kysely) to build our application
2. Isomer is going to use Page Router to build our application instead of App Router. This is because Page Router is more stable and our existing base off `starter-kit` is also using Page Router

## Consequences

Easier to ship stuff because framework is more recent
