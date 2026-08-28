import CodeEditor from "@monaco-editor/react"
import Ajv, { type ValidateFunction } from "ajv"
import { useCallback, useEffect, useState } from "react"

import placeholder from "../../data/placeholder.json"
import Preview, { type PreviewSchema } from "../Preview/Preview"

const ISOMER_SCHEMA_URI = "/0.1.0.json"

export default function Editor() {
  const [isEditorOpen, setIsEditorOpen] = useState(true)
  const [editorValue, setEditorValue] = useState(
    JSON.stringify(placeholder, null, 2),
  )
  const [editedSchema, setEditedSchema] = useState<PreviewSchema>(
    placeholder as PreviewSchema,
  )
  const [isJSONValid, setIsJSONValid] = useState(true)
  const [isCopied, setIsCopied] = useState(false)

  const [validate, setValidate] = useState<ValidateFunction | null>(null)

  const loadSchema = async () => {
    const response = await fetch(ISOMER_SCHEMA_URI)
    const schema = (await response.json()) as object
    const ajv = new Ajv({ strict: false })
    const validateFn = ajv.compile(schema)
    setValidate(() => validateFn)
  }

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) {
        return
      }

      setEditorValue(value)
      localStorage.setItem("editorValue", value)

      try {
        const parsedJson = JSON.parse(value) as PreviewSchema

        if (validate === null) {
          console.log("Schema not loaded yet")
          return
        }

        if (validate(parsedJson)) {
          setIsJSONValid(true)
          setEditedSchema(parsedJson)
        } else {
          setIsJSONValid(false)
          console.log("JSON is invalid", validate.errors)
        }
      } catch (e) {
        setIsJSONValid(false)
        console.log(e)
      }
    },
    [validate],
  )

  useEffect(() => {
    void loadSchema()
  }, [])

  useEffect(() => {
    if (validate === null) {
      return
    }

    const saved = localStorage.getItem("editorValue")

    if (saved !== null) {
      handleEditorChange(saved)
    }
  }, [validate, handleEditorChange])

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => setIsCopied(false), 3000)
    }
  }, [isCopied])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full flex-row gap-4 border-b border-b-gray-400 px-4 py-1 hover:[&_a]:text-blue-700 hover:[&_button]:text-blue-700">
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
        <a href={ISOMER_SCHEMA_URI} target="_blank">
          Isomer Schema
        </a>

        <div className="flex-1"></div>

        <div
          className={`px-2 ${
            isJSONValid
              ? "bg-green-200 text-green-700"
              : "bg-red-200 text-red-700"
          }`}
        >
          {isJSONValid ? "Valid" : "Invalid"}
        </div>
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
