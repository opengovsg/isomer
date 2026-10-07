import CodeEditor from "@monaco-editor/react"
import { schema } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import { useCallback, useEffect, useState } from "react"

import placeholder from "../../data/placeholder.json"
import { Preview, type PreviewSchema } from "../Preview/Preview"

const ajv = new Ajv({ strict: false })
const validatePageSchema = ajv.compile(schema)

const SCHEMA_DOWNLOAD_FILENAME = "0.1.0.json"

function downloadIsomerSchema(): void {
  const json = JSON.stringify(schema, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = SCHEMA_DOWNLOAD_FILENAME
  anchor.click()
  URL.revokeObjectURL(url)
}

export function Editor() {
  const [isEditorOpen, setIsEditorOpen] = useState(true)
  const [editorValue, setEditorValue] = useState(
    JSON.stringify(placeholder, null, 2),
  )
  const [editedSchema, setEditedSchema] = useState<PreviewSchema>(
    placeholder as PreviewSchema,
  )
  const [isJSONValid, setIsJSONValid] = useState(true)
  const [isCopied, setIsCopied] = useState(false)

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) {
      return
    }

    setEditorValue(value)
    localStorage.setItem("editorValue", value)

    try {
      const parsedJson = JSON.parse(value) as PreviewSchema

      if (validatePageSchema(parsedJson)) {
        setIsJSONValid(true)
        setEditedSchema(parsedJson)
      } else {
        setIsJSONValid(false)
        console.log("JSON is invalid", validatePageSchema.errors)
      }
    } catch (e) {
      setIsJSONValid(false)
      console.log(e)
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("editorValue")

    if (saved !== null) {
      handleEditorChange(saved)
    }
  }, [handleEditorChange])

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => setIsCopied(false), 3000)
    }
  }, [isCopied])

  const statusLabel = isJSONValid ? "Valid" : "Invalid"
  const statusClassName = isJSONValid
    ? "bg-green-200 text-green-700"
    : "bg-red-200 text-red-700"

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full flex-row gap-4 border-b border-b-gray-400 px-4 py-1 hover:[&_button]:text-blue-700">
        <button onClick={() => setIsEditorOpen(!isEditorOpen)}>
          {isEditorOpen ? "Close Editor" : "Open Editor"}
        </button>
        <button
          onClick={() =>
            handleEditorChange(JSON.stringify(placeholder, null, 2))
          }
        >
          Reset Editor
        </button>
        <button type="button" onClick={downloadIsomerSchema}>
          Download schema
        </button>

        <div className="flex-1"></div>

        <div className={`px-2 ${statusClassName}`}>{statusLabel}</div>
      </div>

      <div className="flex flex-row">
        <div
          className={
            isEditorOpen
              ? "h-[calc(100vh-33px)] w-2/5 border-r-2 border-r-gray-400"
              : "w-0"
          }
        >
          <CodeEditor
            height="100%"
            defaultLanguage="json"
            value={editorValue}
            onChange={handleEditorChange}
          />
        </div>
        <div
          className={`h-[calc(100vh-33px)] overflow-scroll ${
            isEditorOpen ? "w-3/5 px-1" : "w-full"
          }`}
        >
          <Preview schema={editedSchema} />
        </div>
      </div>
    </div>
  )
}
