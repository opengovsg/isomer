import { useEffect, useState } from 'react'

import Ajv from 'ajv'
import Editor from '~/components/PageEditor/Editor'

const ISOMER_SCHEMA_URI = 'https://schema.isomer.gov.sg/next/0.1.0.json'

const placeholder = {
  version: '0.1.0',
  layout: 'homepage',
  page: {
    title: 'Home',
  },
  content: [
    {
      type: 'hero',
      variant: 'gradient',
      alignment: 'left',
      backgroundColor: 'black',
      title: 'Ministry of Trade and Industry',
      subtitle:
        'A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity',
      buttonLabel: 'Main CTA',
      buttonUrl: '/',
      secondaryButtonLabel: 'Sub CTA',
      secondaryButtonUrl: '/',
      backgroundUrl: 'https://ohno.isomer.gov.sg/images/hero-banner.png',
    },
    {
      type: 'infobar',
      title: 'This is an infobar',
      description: 'This is the description that goes into the Infobar section',
    },
    {
      type: 'infopic',
      title: 'This is an infopic',
      description: 'This is the description for the infopic component',
      imageSrc: 'https://placehold.co/600x400',
    },
    {
      type: 'keystatistics',
      statistics: [
        {
          label: 'Average all nighters pulled in a typical calendar month',
          value: '3',
        },
        {
          label: 'Growth in tasks assigned Q4 2024 (YoY)',
          value: '+12.2%',
        },
        {
          label: 'Creative blocks met per single evening',
          value: '89',
        },
        {
          value: '4.0',
          label: 'Number of lies in this stat block',
        },
      ],
      variant: 'top',
      title: 'Irrationality in numbers',
    },
  ],
}

const EditPage = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(true)
  const [editorValue, setEditorValue] = useState(
    JSON.stringify(placeholder, null, 2),
  )
  const [newEditorValue, setNewEditorValue] = useState({})
  const [editedSchema, setEditedSchema] = useState<any>(placeholder)
  const [isJSONValid, setIsJSONValid] = useState(true)
  const [isNewEditor, setIsNewEditor] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const [jsonSchema, setJsonSchema] = useState<any>(null)
  const [validate, setValidate] = useState<any>(null)

  const loadSchema = async () => {
    await fetch(ISOMER_SCHEMA_URI)
      .then((response) => response.json())
      .then((schema) => {
        console.log(schema)
        const ajv = new Ajv({ strict: false })
        const validateFn = ajv.compile(schema)
        setJsonSchema(schema)
        setValidate(() => validateFn)
      })
  }

  useEffect(() => {
    if (validate === null) {
      loadSchema()
    }

    const saved = localStorage.getItem('editorValue')

    if (saved) {
      handleEditorChange(saved)
    }

    const savedNew = localStorage.getItem('newEditorValue')

    if (savedNew) {
      handleNewEditorChange(saved)
    }
  }, [validate])

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => setIsCopied(false), 3000)
    }
  }, [isCopied])

  const handleEditorChange = (value: any) => {
    setEditorValue(value)
    localStorage.setItem('editorValue', value)

    try {
      const parsedJson = JSON.parse(value)

      if (validate === null) {
        console.log('Schema not loaded yet')
        return
      }

      if (validate(parsedJson)) {
        setIsJSONValid(true)
        setEditedSchema(parsedJson)
      } else {
        setIsJSONValid(false)
        console.log('JSON is invalid', validate.errors)
      }
    } catch (e) {
      setIsJSONValid(false)
      console.log(e)
    }
  }

  const handleNewEditorChange = (value: any) => {
    setNewEditorValue(value)
    localStorage.setItem('newEditorValue', value)

    try {
      if (validate === null) {
        console.log('Schema not loaded yet')
        return
      }

      if (validate(value)) {
        setIsJSONValid(true)
        setEditedSchema(value)
      } else {
        setIsJSONValid(false)
        console.log('JSON is invalid', validate.errors)
      }
    } catch (e) {
      setIsJSONValid(false)
      console.log(e)
    }
  }

  // const handleCopyToClipboard = () => {
  //   navigator.clipboard.writeText(JSON.stringify(editedSchema, null, 2))
  //   setIsCopied(true)
  // }

  return (
    <div className="flex flex-col w-full h-full">
      {/* <div className="flex flex-row w-full border-b border-b-gray-400 gap-4 px-4 py-1 hover:[&_a]:text-blue-700 hover:[&_button]:text-blue-700">
        <button onClick={() => setIsEditorOpen(!isEditorOpen)}>
          {isEditorOpen ? 'Close Editor' : 'Open Editor'}
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
        <a
          href="https://rjsf-team.github.io/react-jsonschema-form/"
          target="_blank"
        >
          Form-based editor
        </a>
        <button onClick={() => setIsNewEditor(!isNewEditor)}>
          {isNewEditor ? 'Go back to code editor' : 'Use new editor (BETA)'}
        </button>

        <div className="flex-1"></div>

        {isNewEditor && (
          <button onClick={handleCopyToClipboard}>
            {!isCopied ? 'Copy JSON to Clipboard' : 'Copied!'}
          </button>
        )}
        <div
          className={`px-2 ${
            isJSONValid
              ? 'text-green-700 bg-green-200'
              : 'text-red-700 bg-red-200'
          }`}
        >
          {isJSONValid ? 'Valid' : 'Invalid'}
        </div>
      </div> */}

      <div className="flex flex-row">
        <div
          className={
            isEditorOpen
              ? 'w-2/5 h-[calc(100vh-33px)] border-r-2 border-r-gray-400'
              : 'w-0'
          }
        >
          {jsonSchema && (
            <Editor
              jsonSchema={jsonSchema}
              editorValue={newEditorValue}
              onChange={handleNewEditorChange}
            />
          )}
        </div>
        {/* <div
          className={`h-[calc(100vh-33px)] overflow-scroll ${
            isEditorOpen ? 'w-3/5 px-1' : 'w-full'
          }`}
        >
          <Preview schema={editedSchema} />
        </div> */}
      </div>
    </div>
  )
}

export default EditPage
