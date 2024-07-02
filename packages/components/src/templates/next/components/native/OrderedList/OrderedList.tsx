import type { OrderedListProps } from "~/interfaces";
import Prose from "../Prose";

const OrderedList = ({ start, content }: OrderedListProps) => {
  return (
    <ol className="mt-6 list-decimal ps-8" start={start}>
      <Prose content={content} />
    </ol>
  );
};

export default OrderedList;
