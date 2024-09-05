import { BiX } from "react-icons/bi"

import type { PillProps } from "~/interfaces"

const Pill = ({ content, onClose }: PillProps) => {
  return (
    <div className="w-fit rounded-full border border-divider-strong px-3 py-1.5 text-content-strong">
      <div className="flex flex-row gap-1">
        <p className="my-auto text-caption-01">{content}</p>
        <button onClick={onClose} aria-label={`Remove ${content} filter`}>
          <BiX className="text-2xl/6" />
        </button>
      </div>
    </div>
  )
}

export default Pill
