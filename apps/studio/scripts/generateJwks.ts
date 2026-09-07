import { program } from "commander"
import * as jose from "jose"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"

program.option(
  "-e, --environment <env>",
  "Environment to generate the key pair for",
  "development",
)
program.option("--signing-alg", "Algorithm to use for signing key", "ES512")
program.option("--signing-crv", "Algorithm to use for signing key", "P-521")
program.option(
  "--encryption-alg",
  "Algorithm to use for encryption key",
  "ECDH-ES+A256KW",
)
program.option(
  "--encryption-crv",
  "Algorithm to use for encryption key",
  "P-521",
)

program.parse()

const opts = z
  .object({
    encryptionAlg: z.union([
      z.literal("ECDH-ES+A128KW"),
      z.literal("ECDH-ES+A192KW"),
      z.literal("ECDH-ES+A256KW"),
    ]),
    encryptionCrv: z.union([
      z.literal("P-256"),
      z.literal("P-384"),
      z.literal("P-521"),
    ]),
    environment: z.union([
      z.literal("development"),
      z.literal("staging"),
      z.literal("uat"),
      z.literal("vapt"),
      z.literal("production"),
    ]),
    signingAlg: z.union([
      z.literal("ES256"),
      z.literal("ES384"),
      z.literal("ES512"),
    ]),
    signingCrv: z.union([
      z.literal("P-256"),
      z.literal("P-384"),
      z.literal("P-521"),
    ]),
  })
  .parse(program.opts())

const OUTPUT_FOLDER = path.join(
  import.meta.dirname,
  "..",
  "keys",
  opts.environment,
)

const generateSigningKey = async ({
  alg,
  crv,
}: {
  alg: string
  crv: string
}) => {
  const keyPair = await jose.generateKeyPair(alg, { crv, extractable: true })
  const jwk = await jose.exportJWK(keyPair.publicKey)
  const [privateKey, publicKey, kid] = await Promise.all([
    jose.exportPKCS8(keyPair.privateKey),
    jose.exportSPKI(keyPair.publicKey),
    jose.calculateJwkThumbprint(jwk),
  ])
  const json = { ...jwk, alg, kid, use: "sig" }
  return { jwk: json, privateKey, publicKey }
}

const generateEncryptionKey = async ({
  alg,
  crv,
}: {
  alg: string
  crv: string
}) => {
  const keyPair = await jose.generateKeyPair(alg, { crv, extractable: true })
  const jwk = await jose.exportJWK(keyPair.publicKey)
  const [privateKey, publicKey, kid] = await Promise.all([
    jose.exportPKCS8(keyPair.privateKey),
    jose.exportSPKI(keyPair.publicKey),
    jose.calculateJwkThumbprint(jwk),
  ])
  const json = { ...jwk, alg, kid, use: "enc" }
  return { jwk: json, privateKey, publicKey }
}

const [encryption, signing] = await Promise.all([
  generateEncryptionKey({
    alg: opts.encryptionAlg,
    crv: opts.encryptionCrv,
  }),
  generateSigningKey({
    alg: opts.signingAlg,
    crv: opts.signingCrv,
  }),
])

mkdirSync(OUTPUT_FOLDER, { recursive: true })

writeFileSync(
  path.join(OUTPUT_FOLDER, `encryption-${new Date().toISOString()}.pem`),
  encryption.privateKey,
)
writeFileSync(
  path.join(OUTPUT_FOLDER, `encryption-${new Date().toISOString()}.pub`),
  encryption.publicKey,
)
writeFileSync(
  path.join(OUTPUT_FOLDER, `encryption-${new Date().toISOString()}.jwk`),
  JSON.stringify(encryption.jwk, null, 2),
)
writeFileSync(
  path.join(OUTPUT_FOLDER, `signing-${new Date().toISOString()}.pem`),
  signing.privateKey,
)
writeFileSync(
  path.join(OUTPUT_FOLDER, `signing-${new Date().toISOString()}.pub`),
  signing.publicKey,
)
writeFileSync(
  path.join(OUTPUT_FOLDER, `signing-${new Date().toISOString()}.jwk`),
  JSON.stringify(signing.jwk, null, 2),
)
