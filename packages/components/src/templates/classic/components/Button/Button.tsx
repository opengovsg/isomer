import type { ButtonProps } from "~/interfaces";

// Classic Button does not use much from ButtonProps, e.g bg colour is always site's secondary colour
const Button = ({ label, href }: ButtonProps) => {
  const Label = () => (
    <span className="tracking-wider text-center uppercase text-white">
      {label}
    </span>
  );

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
      type="button"
      className="bg-site-secondary px-6 py-4"
    >
      <Label />
    </a>
  );
};

export default Button;
