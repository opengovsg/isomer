import {
  and,
  rankWith,
  schemaMatches,
  scopeEndsWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core'
import { materialCells, materialRenderers } from '@jsonforms/material-renderers'
import { JsonForms, withJsonFormsControlProps } from '@jsonforms/react'
import MainTiptapEditor from './MainTipTapEditor'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import { Box } from '@chakra-ui/react'

const jsonFormsTheme = createTheme()

const mainTiptapRenderer = {
  tester: rankWith(
    5, //increase rank as needed
    and(
      scopeEndsWith('/content'),
      schemaMatches(
        (schema) =>
          Object.prototype.hasOwnProperty.call(schema, 'minItems') &&
          schema.minItems === 1,
      ),
    ),
  ),
  renderer: withJsonFormsControlProps(MainTiptapEditor),
}

const nullRenderer = {
  tester: rankWith(
    5, //increase rank as needed
    and(
      scopeEndsWith('/content'),
      schemaMatches(
        (schema) =>
          Object.prototype.hasOwnProperty.call(schema, 'minItems') &&
          schema.minItems === 0,
      ),
    ),
  ),
  renderer: withJsonFormsControlProps(() => <></>),
}

// const proseBlockEditor = {
//   tester: rankWith(
//     2, //increase rank as needed
//     scopeEndsWith('/content'),
//   ),
//   renderer: withJsonFormsControlProps(ProseBlockEditor),
// }

const renderers: JsonFormsRendererRegistryEntry[] = [
  ...materialRenderers,
  mainTiptapRenderer,
  nullRenderer,
  // proseBlockEditor,
]

const Editor = ({ jsonSchema, editorValue, onChange }: any) => {
  return (
    <Box>
      <ThemeProvider theme={jsonFormsTheme}>
        <CssBaseline />
        <div className="p-2 overflow-y-auto max-h-full [&_div]:!max-w-full [&_div_.MuiTabs-flexContainer]:overflow-x-auto">
          <JsonForms
            schema={jsonSchema}
            // schema={schema}
            data={editorValue}
            renderers={renderers}
            cells={materialCells}
            onChange={({ data }) => onChange(data)}
          />
        </div>
      </ThemeProvider>
    </Box>
  )
}

export default Editor
