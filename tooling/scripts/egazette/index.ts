import { select } from "@inquirer/prompts"

import { createStaticPage } from "./apps/create-static-page"

const main = async () => {
  const script = await select({
    message: "Select an eGazette script to run",
    choices: [
      {
        name: "Create static page",
        description:
          "Export published gazettes as HTML during a search outage.",
        value: "create-static-page",
      },
    ],
  })

  switch (script) {
    case "create-static-page":
      await createStaticPage()
      break
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
