import type { ValidateFunction } from "ajv";
import { useEffect, useState } from "react";
import { Grid, GridItem } from "@chakra-ui/react";
import Ajv from "ajv";

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext";
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer";
import Preview from "~/features/editing-experience/components/Preview";
import { type NextPageWithLayout } from "~/lib/types";
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout";
import { trpc } from "~/utils/trpc";

const ISOMER_SCHEMA_URI = "https://schema.isomer.gov.sg/next/0.1.0.json";

const EditPage: NextPageWithLayout = () => {
  const [, setJsonSchema] = useState(null);
  const [validate, setValidate] = useState<ValidateFunction | null>(null);

  const { setDrawerState, pageState, setPageState, setEditorState } =
    useEditorDrawerContext();

  const [{ content: page }] = trpc.page.readPageAndBlob.useSuspenseQuery({
    pageId: 1,
  });

  // TODO: should be a get query
  const loadSchema = async () => {
    await fetch(ISOMER_SCHEMA_URI)
      .then((response) => response.json())
      .then((schema) => {
        console.log(schema);
        const ajv = new Ajv({ strict: false });
        const validateFn = ajv.compile(schema);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        setJsonSchema(schema);
        setValidate(() => validateFn);
      });
  };

  // TODO: Bad use of useEffect, see https://react.dev/learn/you-might-not-need-an-effect.
  useEffect(() => {
    if (validate === null) {
      void loadSchema();
    }
  }, [validate]);

  useEffect(() => {
    setDrawerState({
      state: "root",
    });
    const blocks = page.content;
    setEditorState(blocks);
    setPageState(blocks);
  }, [page.content, setDrawerState, setEditorState, setPageState]);

  return (
    <Grid
      w="100vw"
      templateColumns="repeat(3, 1fr)"
      gap={0}
      maxH="calc(100vh - 57px)"
    >
      {/* TODO: Implement sidebar editor */}
      <GridItem colSpan={1} bg="slate.50">
        <EditPageDrawer isOpen />
      </GridItem>
      {/* TODO: Implement preview */}
      <GridItem colSpan={2} overflow="scroll">
        {/* TODO: the version here should be obtained from the schema  */}
        {/* and not from the page */}
        <Preview {...page} content={pageState} />
      </GridItem>
    </Grid>
  );
};

EditPage.getLayout = PageEditingLayout;

export default EditPage;
