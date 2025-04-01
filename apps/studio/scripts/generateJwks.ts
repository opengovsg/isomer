import { mkdirSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { program } from "commander"
import * as jose from "jose"
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
  })
  .parse(program.opts())

const OUTPUT_FOLDER = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "keys",
  opts.environment,
)

async function generateSigningKey({ alg, crv }: { alg: string; crv: string }) {
  const keyPair = await jose.generateKeyPair(alg, { crv })
  const privateKey = await jose.exportPKCS8(keyPair.privateKey)
  const publicKey = await jose.exportSPKI(keyPair.publicKey)
  const jwk = await jose.exportJWK(keyPair.publicKey)
  const kid = await jose.calculateJwkThumbprint(jwk)
  const json = { ...jwk, kid, use: "sig", alg }
  return { privateKey, publicKey, jwk: json }
}

async function generateEncryptionKey({
  alg,
  crv,
}: {
  alg: string
  crv: string
}) {
  const keyPair = await jose.generateKeyPair(alg, { crv })
  const privateKey = await jose.exportPKCS8(keyPair.privateKey)
  const publicKey = await jose.exportSPKI(keyPair.publicKey)
  const jwk = await jose.exportJWK(keyPair.publicKey)
  const kid = await jose.calculateJwkThumbprint(jwk)
  const json = { ...jwk, kid, use: "enc", alg }
  return { privateKey, publicKey, jwk: json }
}

const encryption = await generateEncryptionKey({
  alg: opts.encryptionAlg,
  crv: opts.encryptionCrv,
})
const signing = await generateSigningKey({
  alg: opts.signingAlg,
  crv: opts.signingCrv,
})

mkdirSync(OUTPUT_FOLDER, { recursive: true })

writeFileSync(
  join(OUTPUT_FOLDER, `encryption-${new Date().toISOString()}.pem`),
  encryption.privateKey,
)
writeFileSync(
  join(OUTPUT_FOLDER, `encryption-${new Date().toISOString()}.pub`),
  encryption.publicKey,
)
writeFileSync(
  join(OUTPUT_FOLDER, `encryption-${new Date().toISOString()}.jwk`),
  JSON.stringify(encryption.jwk, null, 2),
)
writeFileSync(
  join(OUTPUT_FOLDER, `signing-${new Date().toISOString()}.pem`),
  signing.privateKey,
)
writeFileSync(
  join(OUTPUT_FOLDER, `signing-${new Date().toISOString()}.pub`),
  signing.publicKey,
)
writeFileSync(
  join(OUTPUT_FOLDER, `signing-${new Date().toISOString()}.jwk`),
  JSON.stringify(signing.jwk, null, 2),
)
