import { select } from "@inquirer/prompts"

import type { IsomerAdminScriptType } from "./types"
import { bulkUploadAssets } from "./apps/bulk-upload-assets"
import { exportIndividualJsons } from "./apps/export-individual-jsons"
import { exportSiteJsons } from "./apps/export-site-jsons"
import { extractFolderJsons } from "./apps/extract-folder-jsons"
import { findInvalidSchema } from "./apps/find-invalid-schema"
import { createContentFromLocal } from "./apps/create-content-from-local"
import { importFolderJsons } from "./apps/import-folder-jsons"
import { publishSiteResources } from "./apps/publish-site-resources"
import { rebuildAllCodebuildProjects } from "./apps/rebuild-all-codebuild-projects"

const main = async () => {
  const script = await select<IsomerAdminScriptType>({
    message: "Select an Isomer admin script to run",
    choices: [
      {
        name: "Bulk upload assets",
        description:
          "Prepare assets for S3 upload by assigning UUIDs and generating a mapping CSV.",
        value: "bulk-upload-assets",
      },
      {
        name: "Export individual JSONs",
        description:
          "Export JSON blobs for specific resource IDs from the database.",
        value: "export-individual-jsons",
      },
      {
        name: "Export site JSONs",
        description:
          "Export all JSON blobs for specific site IDs from the database.",
        value: "export-site-jsons",
      },
      {
        name: "Extract folder JSONs",
        description:
          "Export JSON blobs for all children of a specific parent resource.",
        value: "extract-folder-jsons",
      },
      {
        name: "Find invalid schema",
        description: "Validate JSON blobs against the Isomer Next page schema.",
        value: "find-invalid-schema",
      },
      {
        name: "Create content from local",
        description:
          "Prepare assets, studioify schemas, and create a published Collection or Folder from local JSON.",
        value: "create-content-from-local",
      },
      {
        name: "Import folder JSONs",
        description:
          "Import JSON files from ./input to update existing resources in the database.",
        value: "import-folder-jsons",
      },
      {
        name: "Publish site resources",
        description:
          "Publish all draft resources for a given site ID in the database.",
        value: "publish-site-resources",
      },
      {
        name: "Rebuild all CodeBuild projects",
        description:
          "List AWS CodeBuild projects and start builds for each project with resumable batching.",
        value: "rebuild-all-codebuild-projects",
      },
    ],
  })

  switch (script) {
    case "bulk-upload-assets":
      await bulkUploadAssets()
      break
    case "export-individual-jsons":
      await exportIndividualJsons()
      break
    case "export-site-jsons":
      await exportSiteJsons()
      break
    case "extract-folder-jsons":
      await extractFolderJsons()
      break
    case "find-invalid-schema":
      await findInvalidSchema()
      break
    case "create-content-from-local":
      await createContentFromLocal()
      break
    case "import-folder-jsons":
      await importFolderJsons()
      break
    case "publish-site-resources":
      await publishSiteResources()
      break
    case "rebuild-all-codebuild-projects":
      await rebuildAllCodebuildProjects()
      break
    default:
      const _: never = script
      console.error("No valid script selected.")
  }
}

main().catch((error) => console.error(error))
