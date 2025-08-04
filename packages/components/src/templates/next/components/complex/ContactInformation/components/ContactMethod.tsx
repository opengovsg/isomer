import type { IconType } from "react-icons"
import { BiEnvelope } from "react-icons/bi"

import type { ContactInformationUIProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Link } from "~/templates/next/components/internal/Link"
import { isEmail, isExternalUrl, isUrl } from "~/utils"

const createContactMethodStyles = tv({
  slots: {
    container: "flex flex-col items-start gap-2",
    icon: "h-[32px] w-[32px] flex-shrink-0 text-base-content-strong",
    textContainer: "flex flex-col items-start gap-3",
    label: "prose-headline-lg-semibold text-base-content",
    valuesContainer: "flex flex-col items-start gap-1",
    value: "prose-headline-lg-medium text-center text-base-content",
  },
  variants: {
    variant: {
      default: {},
      homepage: {
        container: "md:items-center",
        textContainer: "md:items-center",
        valuesContainer: "md:items-center",
      },
    },
    isLink: {
      true: {
        value: "underline",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface ContactMethodProps {
  variant: "default" | "homepage"
  Icon?: IconType
  displayText: string
  values: string[]
  LinkComponent: ContactInformationUIProps["LinkComponent"]
}

export const ContactMethod = ({
  variant,
  Icon = BiEnvelope,
  displayText,
  values,
  LinkComponent,
}: ContactMethodProps) => {
  const styles = createContactMethodStyles({ variant })

  return (
    <div className={styles.container()}>
      <Icon className={styles.icon()} />
      <div className={styles.textContainer()}>
        <div className={styles.label()}>{displayText}</div>
        <div className={styles.valuesContainer()}>
          {values.map((value) => {
            if (isUrl(value)) {
              const isExternalLink = isExternalUrl(value)
              return (
                <Link
                  href={value}
                  isExternal={isExternalLink}
                  showExternalIcon={isExternalLink}
                  LinkComponent={LinkComponent}
                  className={styles.value({ isLink: true })}
                >
                  {value}
                </Link>
              )
            }
            if (isEmail(value)) {
              return (
                <Link
                  href={`mailto:${value}`}
                  className={styles.value({ isLink: true })}
                >
                  {value}
                </Link>
              )
            }
            return <div className={styles.value()}>{value}</div>
          })}
        </div>
      </div>
    </div>
  )
}
