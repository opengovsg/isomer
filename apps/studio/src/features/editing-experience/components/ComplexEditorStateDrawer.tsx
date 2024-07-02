import React from "react";
import { Box } from "@chakra-ui/react";

import FormBuilder from "./form-builder/FormBuilder";

export default function ComplexEditorStateDrawer(): JSX.Element {
  return (
    <Box p={4}>
      <h1>Complex Editor State Drawer</h1>
      <FormBuilder component="infocards" />
    </Box>
  );
}
