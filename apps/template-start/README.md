# TanStack Start template POC

Experimental static-site renderer for published Isomer pages, parallel to `apps/template` (Next.js `output: "export"`).

## Commands

```bash
# From repo root
pnpm --filter @opengovsg/isomer-components run build:module
pnpm --filter isomer-tanstack-start-template run build:template-start
```

Static export lands in `apps/template-start/dist/client/` (`index.html`, `about/index.html`, `assets/`).

Dev server: `pnpm --filter isomer-tanstack-start-template run dev` (port 3002).
