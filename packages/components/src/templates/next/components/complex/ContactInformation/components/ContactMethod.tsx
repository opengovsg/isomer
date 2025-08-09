import { BiEnvelope } from "react-icons/bi"

import type { commonContactMethodStyles } from "./common"
import type { ContactInformationUIProps } from "~/interfaces"
import { twMerge } from "~/lib/twMerge"
import { Link } from "~/templates/next/components/internal/Link"
import {
  focusVisibleHighlight,
  isEmail,
  isExternalUrl,
  isPhoneNumber,
  isUrl,
  sanitizePhoneNumber,
} from "~/utils"
import { METHODS_MAPPING } from "./mapping"

type ContactMethodProps = ContactInformationUIProps["methods"][number] & {
  styles: ReturnType<typeof commonContactMethodStyles>
  LinkComponent: ContactInformationUIProps["LinkComponent"]
}

export const ContactMethod = ({
  styles,
  method,
  label,
  values,
  caption,
  LinkComponent,
}: ContactMethodProps) => {
  const methodMapping = method ? METHODS_MAPPING[method] : undefined
  const Icon = methodMapping?.Icon ?? BiEnvelope

  return (
    <div className={styles.container()}>
      <Icon
        className={
          methodMapping?.color
            ? twMerge(styles.icon(), methodMapping.color)
            : styles.icon()
        }
      />
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
            if (isPhoneNumber(value)) {
              return (
                <Link
                  href={`tel:${sanitizePhoneNumber(value)}`}
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
