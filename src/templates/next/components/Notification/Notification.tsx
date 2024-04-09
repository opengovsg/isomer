import { NotificationProps } from "~/common/Notification"
import { SUPPORTED_ICONS_MAP } from "~/common/Icons"
import BaseParagraph from "../shared/Paragraph"

const Notification = ({ title }: NotificationProps) => {
  const DismissIcon = SUPPORTED_ICONS_MAP["cross"]

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-6 bg-[#FEF4E8] py-4 px-5 sm:px-10">
      <BaseParagraph className="text-base " content={title}></BaseParagraph>
      <button className="flex flex-row ml-auto items-center sm:gap-1">
        <text className="text-lg">Dismiss</text>
        <DismissIcon className="h-full" />
      </button>
    </div>
  )
}

export default Notification
