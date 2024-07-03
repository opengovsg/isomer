import baseConfig, { restrictEnvAccess } from "@isomer/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [...baseConfig, ...restrictEnvAccess];
