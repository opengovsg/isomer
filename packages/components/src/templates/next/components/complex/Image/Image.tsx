import type { ImageProps } from "~/interfaces";

const BaseImage = ({ src, alt, width }: Omit<ImageProps, "type">) => (
  <img src={src} alt={alt} width={`${width ?? 100}%`} height="auto" />
);

const Image = ({ src, alt, width, href }: ImageProps) => {
  return (
    <div>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={
            href.startsWith("http") ? "noopener noreferrer nofollow" : undefined
          }
        >
          <BaseImage src={src} alt={alt} width={width}></BaseImage>
        </a>
      ) : (
        <BaseImage src={src} alt={alt} width={width}></BaseImage>
      )}
    </div>
  );
};

export default Image;
