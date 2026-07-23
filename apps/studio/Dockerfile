FROM node:24-alpine AS base

ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV

ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ARG NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

ARG NEXT_PUBLIC_S3_REGION
ENV NEXT_PUBLIC_S3_REGION=$NEXT_PUBLIC_S3_REGION

ARG NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME
ENV NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME=$NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME

ARG NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME
ENV NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME=$NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME

ARG NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY
ENV NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=$NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY

ARG NEXT_PUBLIC_INTERCOM_APP_ID
ENV NEXT_PUBLIC_INTERCOM_APP_ID=$NEXT_PUBLIC_INTERCOM_APP_ID

# Refer to this PR for the env var and why we need this.
# https://github.com/vercel/next.js/pull/46052/changes
ENV KEEP_ALIVE_TIMEOUT 70000

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app
# pnpm global bin is under PNPM_HOME/bin (not on PATH by default); npm's -g used /usr/local/bin.
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable && corepack install -g pnpm@11.5.1
# fixed version to prevent supply chain attacks (to ensure it's same version as pnpm-workspace.yaml)
RUN pnpm add -g turbo@2.10.5
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "isomer-studio" is the name entered in the project's package.json: { name: "isomer-studio" }
RUN turbo prune isomer-studio --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack install -g pnpm@11.5.1

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml .
COPY --from=builder /app/out/pnpm-workspace.yaml .
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm exec turbo run build --filter=isomer-studio...

FROM base AS runner
WORKDIR /app

# Datadog source code integration
ARG DD_GIT_REPOSITORY_URL
ARG DD_GIT_COMMIT_SHA
ENV DD_GIT_REPOSITORY_URL=${DD_GIT_REPOSITORY_URL}
ENV DD_GIT_COMMIT_SHA=${DD_GIT_COMMIT_SHA}

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/studio/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/studio/.next/static ./apps/studio/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/studio/public ./apps/studio/public

# Remove sourcemaps from production image (they are uploaded to Datadog separately)
RUN find . -name "*.map" -type f -delete

CMD ["node", "apps/studio/server.js"]
