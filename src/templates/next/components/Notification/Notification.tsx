import { NotificationProps } from "~/common/Notification"
import BaseParagraph from "../shared/Paragraph"
import { RxCross2 } from "react-icons/rx"

const Notification = ({ title }: NotificationProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-6 bg-[#FEF4E8] py-4 px-5 sm:px-10">
      <BaseParagraph className="text-base " content={title}></BaseParagraph>
      <button className="flex flex-row ml-auto items-center gap-1">
        <text className="text-lg">Dismiss</text>
        <RxCross2 className="h-full" />
      </button>
    </div>
  )
}

export default Notification
