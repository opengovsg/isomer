import { CalloutProps } from "~/common"
import Paragraph from "../Paragraph"

const Callout = ({ content }: CalloutProps) => {
  return (
    <>
      <div className="bg-[#E0EEFF] p-6 text-content-default text-lg leading-7 border border-[#87BDFF] rounded ">
        <Paragraph content={content} />
      </div>
    </>
  )
}

export default Callout
