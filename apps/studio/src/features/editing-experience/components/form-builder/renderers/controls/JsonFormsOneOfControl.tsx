import type { CombinatorRendererProps, RankedTester } from "@jsonforms/core";
import { useState } from "react";
import { Box, FormControl } from "@chakra-ui/react";
import {
  createCombinatorRenderInfos,
  isOneOfControl,
  rankWith,
} from "@jsonforms/core";
import { JsonFormsDispatch, withJsonFormsOneOfProps } from "@jsonforms/react";
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react";

import { JSON_FORMS_RANKING } from "~/constants/formBuilder";

export const jsonFormsOneOfControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.OneOfControl,
  isOneOfControl,
);

export function JsonFormsOneOfControl({
  schema,
  path,
  renderers,
  cells,
  rootSchema,
  uischema,
  uischemas,
  label,
  description,
}: CombinatorRendererProps) {
  const oneOfRenderInfos = createCombinatorRenderInfos(
    schema.oneOf || [],
    rootSchema,
    "oneOf",
    uischema,
    path,
    uischemas,
  );
  const variants = oneOfRenderInfos.map((oneOfRenderInfo) => ({
    label: oneOfRenderInfo.label,
    value: oneOfRenderInfo.label,
  }));

  const [variant, setVariant] = useState(oneOfRenderInfos[0]?.label || "");

  return (
    <Box py={2}>
      <FormControl isRequired>
        <FormLabel description={description}>{label}</FormLabel>
        <SingleSelect
          value={variant}
          name={label}
          items={variants}
          isClearable={false}
          onChange={setVariant}
        />
      </FormControl>

      {oneOfRenderInfos.map(
        (oneOfRenderInfo) =>
          variant === oneOfRenderInfo.label && (
            <JsonFormsDispatch
              key={oneOfRenderInfo.label}
              uischema={oneOfRenderInfo.uischema}
              schema={oneOfRenderInfo.schema}
              path={path}
              renderers={renderers}
              cells={cells}
            />
          ),
      )}
    </Box>
  );
}

export default withJsonFormsOneOfProps(JsonFormsOneOfControl);
