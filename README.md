# Isomer Next

This is a monorepo for the Isomer Next project.

## Getting Started

This monorepo uses Turborepo. To get started, first install the `turbo` command:

```bash
npm install turbo --global

```

### Adding a new package

To add a new package, simply run `pnpm turbo gen init` in the monorepo root. This will prompt you for a package name as well as if you want to install any dependencies to the new package (of course you can also do this yourself later).

If you need to use it in an application in the app/ folder, install it in that particular folder (example: `pnpm add  @isomer/shared  --filter @isomer/open-data`).

- Update the reference in the relevant `package.json` to workspace to `workspace:^` to `workspace:*`.

The generator sets up the `package.json`, `tsconfig.json` and a `index.ts`, as well as configures all the necessary configurations for tooling around your package such as formatting, linting and typechecking. When the package is created, you're ready to go build out the package.
