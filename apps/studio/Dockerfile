# needed to pin to 3.20 because Prisma uses OpenSSL but it has been shifted to another location in 3.21
# Ref: https://github.com/prisma/prisma/issues/25817
# Solution: https://github.com/prisma/prisma/issues/25817#issuecomment-2529926082
FROM node:22-alpine3.20 AS base

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
RUN apk add --no-cache libc6-compat bash curl unzip

# Install bun
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"
ENV BUN_INSTALL="/root/.bun"
ENV PATH="/root/.bun/bin:${PATH}"

# Set working directory
WORKDIR /app
# Replace <your-major-version> with the major version installed in your repository. For example:
RUN bun add -g turbo@^2
COPY . .

RUN bun ci --ignore-scripts
RUN turbo run build --filter=isomer-studio...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio/.next/static ./apps/studio/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio/public ./apps/studio/public

CMD ["node", "apps/studio/server.js"]
