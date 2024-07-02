import { renderComponent } from "~/templates/next/render";
import { IsomerComponent } from "~/types";

export const renderPageContent = ({
  content,
  LinkComponent,
}: {
  content: IsomerComponent[];
  LinkComponent: any;
}) => {
  let isInfopicTextOnRight = false;
  return content.map((component) => {
    if (component.type === "infopic") {
      isInfopicTextOnRight = !isInfopicTextOnRight;
      const formattedComponent = {
        ...component,
        isTextOnRight: isInfopicTextOnRight,
      };
      return renderComponent({ component: formattedComponent, LinkComponent });
    }
    return renderComponent({ component, LinkComponent });
  });
};
