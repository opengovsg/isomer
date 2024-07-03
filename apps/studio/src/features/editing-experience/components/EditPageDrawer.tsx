import ComponentSelector from "~/components/PageEditor/ComponentSelector";
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext";
import ComplexEditorStateDrawer from "./ComplexEditorStateDrawer";
import RootStateDrawer from "./RootStateDrawer";
import TipTapComponent from "./TipTapComponent";

interface EditPageDrawerProps {
  isOpen: boolean;
}

export function EditPageDrawer({ isOpen: _open }: EditPageDrawerProps) {
  const { drawerState: currState } = useEditorDrawerContext();

  switch (currState.state) {
    case "root":
      return <RootStateDrawer />;
    case "addBlock":
      return <ComponentSelector />;
    case "nativeEditor":
      return <TipTapComponent data="test" path="test" type="paragraph" />;
    case "complexEditor":
      return <ComplexEditorStateDrawer />;
    default:
      return <h1>Edit Page Drawer</h1>;
  }
}

export default EditPageDrawer;
