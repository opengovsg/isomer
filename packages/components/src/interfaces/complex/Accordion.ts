import type { ProseContent } from "../native";

export interface AccordionProps {
  type: "accordion";
  summary: string;
  details: ProseContent;
}
