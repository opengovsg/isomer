import type { InfopicProps } from "~/interfaces";
import { ComponentContent } from "../../internal/customCssClass";
import Button from "../Button";

const TextComponent = ({
  title,
  description,
  buttonLabel,
  buttonUrl,
  className,
}: Omit<InfopicProps, "type" | "sectionIndex" | "imageSrc" | "imageAlt"> & {
  className?: string;
}) => {
  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-2xl font-bold text-content sm:text-4xl">{title}</h1>
        {description && (
          <p className="text-sm text-content sm:text-lg">{description}</p>
        )}
      </div>
      {buttonLabel && buttonUrl && (
        <Button label={buttonLabel} href={buttonUrl} rightIcon="right-arrow" />
      )}
    </div>
  );
};

const ImageComponent = ({
  src,
  alt,
  className,
}: {
  src: InfopicProps["imageSrc"];
  alt: InfopicProps["imageAlt"];
  className?: string;
}) => {
  return (
    <div
      className={`aspect-h-1 aspect-w-1 my-auto overflow-hidden ${className ?? ""}`}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[22.5rem] w-full object-cover object-center lg:max-h-[38.75rem]"
      />
    </div>
  );
};

const SideBySideInfoPic = ({
  title,
  description,
  imageAlt: alt,
  imageSrc: src,
  buttonLabel: button,
  buttonUrl: url,
  isTextOnRight,
}: InfopicProps) => {
  return (
    <>
      {/* Mobile-Tablet */}
      <div className="md:hidden">
        <div
          className={`${ComponentContent} flex flex-col gap-10 py-16 sm:px-14 sm:py-12`}
        >
          <ImageComponent src={src} alt={alt} className="rounded-xl" />
          <TextComponent
            title={title}
            description={description}
            buttonLabel={button}
            buttonUrl={url}
          />
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <div
          className={`${ComponentContent} flex ${
            isTextOnRight ? "flex-row" : "flex-row-reverse"
          } gap-16 py-24`}
        >
          <ImageComponent src={src} alt={alt} className="w-1/2 rounded-xl" />
          <TextComponent
            title={title}
            description={description}
            buttonLabel={button}
            buttonUrl={url}
            className="w-1/2 justify-center"
          />
        </div>
      </div>
    </>
  );
};

const SidePartInfoPic = ({
  title,
  description,
  imageAlt: alt,
  imageSrc: src,
  buttonLabel: button,
  buttonUrl: url,
  isTextOnRight,
}: InfopicProps) => {
  return (
    <>
      {/* Mobile-Tablet */}
      <div className="lg:hidden">
        <div className="flex flex-col gap-0">
          <ImageComponent src={src} alt={alt} />
          <div className={`${ComponentContent} py-10`}>
            <TextComponent
              title={title}
              description={description}
              buttonLabel={button}
              buttonUrl={url}
            />
          </div>
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden lg:block">
        <div
          className={`flex ${isTextOnRight ? "flex-row" : "flex-row-reverse"}`}
        >
          <ImageComponent src={src} alt={alt} className="w-1/2" />
          <div
            className={`my-auto flex w-1/2 py-24 ${isTextOnRight ? "justify-start pl-24" : "justify-end pr-24"} `}
          >
            <TextComponent
              title={title}
              description={description}
              buttonLabel={button}
              buttonUrl={url}
              className="max-w-[30.25rem]"
            />
          </div>
        </div>
      </div>
    </>
  );
};

const InfoPic = (props: InfopicProps) => {
  if (props.variant === "side-by-side") {
    return <SideBySideInfoPic {...props} />;
  }
  return <SidePartInfoPic {...props} />;
};

export default InfoPic;
