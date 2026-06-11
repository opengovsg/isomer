#!/usr/bin/env node
// Minimal OIDC-discovery stub for Singpass, standing in for the mockpass
// container (opengovsg/mockpass on Docker Hub, which is rate-limited here).
//
// Studio's singpass.service.ts runs `await Issuer.discover(...)` at MODULE
// LOAD. If nothing answers on :5156 the call throws ECONNREFUSED, the tRPC
// root router fails to initialise, and every authenticated request 500s.
// This server answers the discovery document so the module loads; it does
// NOT implement a real login (the driver forges a session cookie instead).
//
// Run it (any cwd) before `pnpm dev`:  node mock-singpass.mjs &
// Port/issuer mirror .env's SINGPASS_ISSUER_ENDPOINT (http://localhost:5156/singpass/v2).

import { createServer } from "node:http"

const ISSUER = "http://localhost:5156/singpass/v2"
const PORT = 5156

const discovery = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/authorize`,
  token_endpoint: `${ISSUER}/token`,
  jwks_uri: `${ISSUER}/.well-known/keys`,
  response_types_supported: ["code"],
  subject_types_supported: ["public"],
  id_token_signing_alg_values_supported: ["ES256"],
  scopes_supported: ["openid"],
  token_endpoint_auth_methods_supported: ["private_key_jwt"],
  token_endpoint_auth_signing_alg_values_supported: ["ES256", "ES512", "RS256"],
  code_challenge_methods_supported: ["S256"],
}

createServer((req, res) => {
  res.setHeader("content-type", "application/json")
  if (req.url.includes("/.well-known/keys")) {
    res.end(JSON.stringify({ keys: [] }))
    return
  }
  // openid-client requests <issuer>/.well-known/openid-configuration
  res.end(JSON.stringify(discovery))
}).listen(PORT, () => console.log(`mock-singpass listening on :${PORT}`))
