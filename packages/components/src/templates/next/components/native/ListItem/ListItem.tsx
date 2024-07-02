import type { ListItemProps } from "~/interfaces";
import Prose from "../Prose";

const ListItem = ({ content }: ListItemProps) => {
  return (
    <li className="my-5 pl-2 [&_p]:inline">
      <Prose content={content} />
    </li>
  );
};

export default ListItem;
