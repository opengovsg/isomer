import type { ImageProps } from "~/interfaces";

const Image = ({ src, alt, width }: Omit<ImageProps, "type">) => (
  <img src={src} alt={alt} width={`${width ?? 100}%`} height={"auto"} />
);

const ImageComponent = ({ src, alt, width, href }: ImageProps) => {
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
          <Image src={src} alt={alt} width={width}></Image>
        </a>
      ) : (
        <Image src={src} alt={alt} width={width}></Image>
      )}
    </div>
  );
};

export default ImageComponent;
