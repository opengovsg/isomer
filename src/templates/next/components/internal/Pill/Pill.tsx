import { BiX } from "react-icons/bi"
import type { PillProps } from "~/interfaces"
import { Caption } from "~/templates/next/typography/Caption"

const Pill = ({ content, onClose }: PillProps) => {
  return (
    <div className="rounded-full border border-divider-strong text-content-strong w-fit px-3 py-1.5">
      <div className="flex flex-row gap-1">
        <p className={`${Caption["1"]} my-auto`}>{content}</p>
        <button onClick={onClose} aria-label={`Remove ${content} filter`}>
          <BiX className="text-2xl/6" />
        </button>
      </div>
    </div>
  )
}

export default Pill
