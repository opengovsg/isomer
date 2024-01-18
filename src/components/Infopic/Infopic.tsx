import "@govtechsg/sgds/css/sgds.css"
import { BiRightArrowAlt } from "react-icons/bi"

export interface InfopicProps {
  title?: string
  subtitle?: string
  description?: string
  alt?: string
  image?: string
  button?: string
  url?: string
}

const Infopic = ({
  title,
  subtitle,
  description,
  alt,
  image,
  button,
  url,
}: InfopicProps) => {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
        {/* Product details */}
        <div className="lg:max-w-lg lg:self-end">
          <div className="mt-4">
            <div>
              <p className="text-base text-gray-500 uppercase">{subtitle}</p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {title}
            </h1>
          </div>

          <section aria-labelledby="information-heading" className="mt-4">
            <div className="mt-4 space-y-6">
              <p className="text-base ">{description}</p>
            </div>
          </section>

          <p>
            <a
              href="#"
              className="inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline"
            >
              Read their stories
              <BiRightArrowAlt />
            </a>
          </p>
        </div>

        {/* Product image */}
        <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-center">
          <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-lg">
            <img
              src={image}
              alt={alt}
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Infopic
