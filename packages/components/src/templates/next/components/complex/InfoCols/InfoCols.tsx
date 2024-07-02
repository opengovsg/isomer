import type { SupportedIconName } from "~/common/icons";
import type { InfoColsProps } from "~/interfaces";
import { SUPPORTED_ICONS_MAP } from "~/common/icons";
import { ComponentContent } from "../../internal/customCssClass";
import Button from "../Button";

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="flex w-full max-w-[47.5rem] flex-col items-start gap-7 text-left">
    <h2 className="text-2xl font-semibold text-content-strong sm:text-4xl">
      {title}
    </h2>
    {subtitle && (
      <p className="text-sm text-content text-paragraph-02 sm:text-lg">
        {subtitle}
      </p>
    )}
  </div>
);

const InfoBoxIcon = ({ icon }: { icon?: SupportedIconName }) => {
  if (!icon) return null;
  const Icon = SUPPORTED_ICONS_MAP[icon];
  return (
    <div className="rounded-lg bg-site-primary-100 p-2">
      <Icon className="h-auto w-6 text-site-primary" />
    </div>
  );
};

const InfoBoxes = ({
  infoBoxes,
  LinkComponent,
}: Pick<InfoColsProps, "infoBoxes" | "LinkComponent">) => {
  return (
    <div className="grid grid-cols-1 gap-x-28 gap-y-20 md:grid-cols-2 xl:grid-cols-3">
      {infoBoxes.map((infoBox, idx) => (
        <div key={idx} className="flex flex-col items-start gap-5 text-left">
          <InfoBoxIcon icon={infoBox.icon} />
          <div className="flex flex-col items-start gap-4 text-left">
            <div className="flex flex-col items-start gap-4 text-content-strong">
              <h3 className="line-clamp-2 text-lg font-semibold text-content-strong sm:text-2xl">
                {infoBox.title}
              </h3>
              <p className="line-clamp-4 text-sm text-content sm:text-lg">
                {infoBox.description}
              </p>
            </div>
          </div>
          {infoBox.buttonLabel && infoBox.buttonUrl && (
            <Button
              label={infoBox.buttonLabel}
              href={infoBox.buttonUrl}
              variant="link"
              rightIcon="right-arrow"
            />
          )}
        </div>
      ))}
    </div>
  );
};

const InfoCols = ({
  backgroundColor,
  title,
  subtitle,
  infoBoxes,
  LinkComponent = "a",
}: InfoColsProps) => {
  const bgColor = backgroundColor === "gray" ? "bg-gray-100" : "bg-white";
  return (
    <section className={bgColor}>
      <div className={`${ComponentContent} py-24`}>
        <div className="flex flex-col gap-24">
          <InfoColsHeader title={title} subtitle={subtitle} />
          <InfoBoxes infoBoxes={infoBoxes} LinkComponent={LinkComponent} />
        </div>
      </div>
    </section>
  );
};

export default InfoCols;
