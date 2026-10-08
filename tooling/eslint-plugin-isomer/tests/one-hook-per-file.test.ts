import { execSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

function lintFixture(relativePath: string): {
  exitCode: number
  output: string
} {
  const fixturePath = path.join(packageRoot, relativePath)
  const configPath = path.join(packageRoot, "tests/.oxlintrc.json")

  try {
    const output = execSync(
      `pnpm exec oxlint -c "${configPath}" "${fixturePath}"`,
      {
        cwd: packageRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    )
    return { exitCode: 0, output }
  } catch (error) {
    const err = error as {
      status?: number
      stdout?: string
      stderr?: string
    }
    return {
      exitCode: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    }
  }
}

describe("isomer/one-hook-per-file (via oxlint)", () => {
  it("allows a single exported hook", () => {
    const { exitCode, output } = lintFixture("tests/fixtures/single-hook.ts")
    expect(exitCode).toBe(0)
    expect(output).not.toContain("one-hook-per-file")
  })

  it("reports multiple hooks in a hooks file", () => {
    const { exitCode, output } = lintFixture("tests/fixtures/multiple-hooks.ts")
    expect(exitCode).not.toBe(0)
    expect(output).toContain("isomer(one-hook-per-file)")
    expect(output).toContain("useFoo")
    expect(output).toContain("useBar")
  })

  it("reports multiple hooks in a non-hooks api module", () => {
    const { exitCode, output } = lintFixture("tests/fixtures/redirect-api.ts")
    expect(exitCode).not.toBe(0)
    expect(output).toContain("useListRedirects")
    expect(output).toContain("useCountRedirects")
  })
})
