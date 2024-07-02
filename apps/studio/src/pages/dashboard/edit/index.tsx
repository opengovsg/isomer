import { Grid, GridItem } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import Ajv from 'ajv'
import { EditorDrawerProvider } from '~/contexts/EditorDrawerContext'
import EditPageDrawer from '~/features/editing-experience/components/EditPageDrawer'
import Preview from '~/features/editing-experience/components/Preview'
import { type NextPageWithLayout } from '~/lib/types'
import { PageEditingLayout } from '~/templates/layouts/PageEditingLayout'

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

const EditPage: NextPageWithLayout = () => {
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

  return (
    <EditorDrawerProvider>
      <Grid
        w="100vw"
        templateColumns="repeat(3, 1fr)"
        gap={0}
        maxH="calc(100vh - 57px)"
      >
        {/* TODO: Implement sidebar editor */}
        <GridItem colSpan={1} bg="slate.50">
          <EditPageDrawer
            isOpen
            state={{
              state: 'root',
              blocks: [
                { text: 'Hero', id: 'hero-123' },
                { text: 'Content', id: 'content-123' },
                { text: 'Infopic', id: 'infopic-123' },
                { text: 'Content', id: 'content-234' },
              ],
            }}
          />
        </GridItem>
        {/* TODO: Implement preview */}
        <GridItem colSpan={2} overflow="scroll">
          <Preview schema={editedSchema} />
        </GridItem>
      </Grid>
    </EditorDrawerProvider>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
