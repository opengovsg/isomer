import type { IconType } from "react-icons"
import { BiEnvelope } from "react-icons/bi"

import type {
  ContactInformationUIProps,
  SingleContactInformationProps,
} from "~/interfaces"
import { tv } from "~/lib/tv"
import { Link } from "~/templates/next/components/internal/Link"
import { focusVisibleHighlight, isEmail, isExternalUrl, isUrl } from "~/utils"

const createContactMethodStyles = tv({
  slots: {
    container: "flex w-full flex-col items-start gap-2",
    icon: "size-8 flex-shrink-0 text-base-content-strong",
    textContainer: "flex w-full flex-col items-start gap-3",
    label: "prose-headline-lg-semibold text-base-content",
    valuesAndCaptionContainer: "flex w-full flex-col items-start gap-1",
    value: "prose-headline-lg-medium text-left text-base-content",
    caption: "prose-body-sm text-base-content",
  },
  variants: {
    variant: {
      default: {},
      homepage: {
        container: "md:items-center",
        textContainer: "md:items-center",
        valuesAndCaptionContainer: "md:items-center",
        value: "md:text-center",
      },
    },
    isLink: {
      true: {
        value:
          "text-hyperlink underline visited:text-hyperlink-visited hover:text-hyperlink-hover",
      },
      false: {
        value: "text-base-content",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface ContactMethodProps extends SingleContactInformationProps {
  variant: "default" | "homepage"
  Icon?: IconType
  LinkComponent: ContactInformationUIProps["LinkComponent"]
}

export const ContactMethod = ({
  variant,
  Icon = BiEnvelope,
  label,
  values,
  caption,
  LinkComponent,
}: ContactMethodProps) => {
  const styles = createContactMethodStyles({ variant })

  return (
    <div className={styles.container()}>
      <Icon className={styles.icon()} />
      <div className={styles.textContainer()}>
        <div className={styles.label()}>{label}</div>
        <div className={styles.valuesAndCaptionContainer()}>
          {values.map((value) => {
            if (isUrl(value)) {
              const isExternalLink = isExternalUrl(value)
              return (
                <Link
                  href={value}
                  isExternal={isExternalLink}
                  showExternalIcon={isExternalLink}
                  LinkComponent={LinkComponent}
                  className={styles.value({
                    isLink: true,
                    className: focusVisibleHighlight(),
                  })}
                >
                  {value}
                </Link>
              )
            }
            if (isEmail(value)) {
              return (
                <Link
                  href={`mailto:${value}`}
                  className={styles.value({
                    isLink: true,
                    className: focusVisibleHighlight(),
                  })}
                >
                  {value}
                </Link>
              )
            }
            return <div className={styles.value()}>{value}</div>
          })}
          {!!caption && <div className={styles.caption()}>{caption}</div>}
        </div>
      </div>
    </div>
  )
}
