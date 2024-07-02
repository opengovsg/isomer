import type { UnorderedListProps } from "~/interfaces";
import Prose from "../Prose";

const UnorderedList = ({ content }: UnorderedListProps) => {
  return (
    <ul className="mt-6 list-disc ps-8">
      <Prose content={content} />
    </ul>
  );
};

export default UnorderedList;
