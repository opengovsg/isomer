import type {
  ControlProps,
  OwnPropsOfEnum,
  RankedTester,
} from "@jsonforms/core";
import { useState } from "react";
import { Box, FormControl } from "@chakra-ui/react";
import { isEnumControl, rankWith } from "@jsonforms/core";
import { withJsonFormsEnumProps } from "@jsonforms/react";
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react";

import { JSON_FORMS_RANKING } from "~/constants/formBuilder";

export const jsonFormsDropdownControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.DropdownControl,
  isEnumControl,
);

export function JsonFormsDropdownControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  options,
  schema,
}: ControlProps & OwnPropsOfEnum) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [dropdownValue, setDropdownValue] = useState(data || "");

  if (!options || (options.length === 1 && !!schema.default)) {
    return null;
  }

  const items = options.map((option) => ({
    label: option.label.charAt(0).toUpperCase() + option.label.slice(1),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    value: option.value,
  }));

  return (
    <Box py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <SingleSelect
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          value={dropdownValue}
          name={label}
          items={items}
          isClearable={false}
          onChange={(value) => {
            setDropdownValue(value);
            handleChange(path, value);
          }}
        />
      </FormControl>
    </Box>
  );
}

export default withJsonFormsEnumProps(JsonFormsDropdownControl);
