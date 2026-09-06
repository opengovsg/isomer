import fs from "node:fs"
import path from "node:path"

import type { IndexableObject, SchemaContent } from "./search-index-types.js"

const schemaDirectory = path.join(import.meta.dirname, "../schema")
const finalIndex: IndexableObject[] = []
let indexId = 0

const decodeAndStripMarkdown = (base64Content: string) => {
  const decodedContent = Buffer.from(base64Content, "base64").toString("utf-8")
  const strippedContent = decodedContent
    .replaceAll(/!\[[^\]]*\]\([^)]+\)/gu, "")
    .replaceAll(/\[[^\]]+\]\([^)]+\)/gu, "")
    .replaceAll(/[*_~`>#-]+/gu, "")
    .replaceAll(/\n+/gu, " ")
  return strippedContent
}

const extractIndexableContent = (schemaContent: string) => {
  // SAFETY: search-index schema files are produced by the build pipeline with a known shape.
  const parsedContent = JSON.parse(schemaContent) as SchemaContent
  const indexableObject: IndexableObject = {
    content: "",
    id: indexId.toString(),
    title: "",
    url: parsedContent.permalink ?? "",
  }

  if (parsedContent.title !== undefined) {
    indexableObject.title = parsedContent.title
  }

  for (const component of parsedContent.components ?? []) {
    for (const fieldPath of component.indexable ?? []) {
      if (
        fieldPath === "props.markdown" &&
        component.props?.markdown !== undefined
      ) {
        const decodedStrippedContent = decodeAndStripMarkdown(
          component.props.markdown,
        )
        indexableObject.content += `${decodedStrippedContent} `
      }
    }
  }

  indexableObject.content = indexableObject.content.trim()

  indexId += 1
  return indexableObject
}

const readSchemaFiles = (directory: string) => {
  for (const file of fs.readdirSync(directory)) {
    const fullPath = path.join(directory, file)
    if (fs.statSync(fullPath).isDirectory()) {
      readSchemaFiles(fullPath)
    } else if (file === "schema.json") {
      const schemaContent = fs.readFileSync(fullPath, "utf-8")
      const indexableObject = extractIndexableContent(schemaContent)
      finalIndex.push(indexableObject)
    }
  }
}

readSchemaFiles(schemaDirectory)

fs.writeFileSync(
  path.join(import.meta.dirname, "../searchIndex.json"),
  JSON.stringify(finalIndex, null, 2),
)
console.log("Search index created successfully!")
