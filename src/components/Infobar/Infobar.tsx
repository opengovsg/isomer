import { ArrowRightIcon } from "@heroicons/react/24/outline"

export interface InfobarProps {
  title?: string
  subtitle?: string
  description?: string
  buttonLabel?: string
  buttonUrl?: string
}

const Infobar = ({
  title,
  subtitle,
  description,
  buttonLabel,
  buttonUrl,
}: InfobarProps) => {
  return (
    <section className="text-slate-600 py-12 px-6 bg-gray-100">
      <div>
        <div className="flex justify-center">
          <div className="pb-3 px-3 pt-16 text-center">
            <p className="text-subtitle pb-4 uppercase tracking-widest">
              {subtitle}
            </p>
            <h1 className="text-secondary text-5xl pb-4">
              <b className="font-semibold">{title}</b>
            </h1>
            <p className="text-paragraph text-xl">{description}</p>
            <div className="pb-4 text-lg font-semibold uppercase">
              <div className="p-3">
                <a
                  className="inline-flex text-secondary font-semibold text-center underline uppercase bg-gray-100 pt-4 tracking-wide"
                  href={buttonUrl}
                >
                  {buttonLabel}
                  <ArrowRightIcon className="text-secondary h-5 w-5 ml-1 mt-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Infobar
