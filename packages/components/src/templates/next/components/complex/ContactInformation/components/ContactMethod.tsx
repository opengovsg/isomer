import type { IconType } from "react-icons"
import { BiEnvelope } from "react-icons/bi"

import type {
  ContactInformationUIProps,
  SingleContactInformationProps,
} from "~/interfaces"
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
import { commonContactMethodStyles } from "./common"

interface ContactMethodProps extends SingleContactInformationProps {
  styles: ReturnType<typeof commonContactMethodStyles>
  Icon?: IconType
  LinkComponent: ContactInformationUIProps["LinkComponent"]
  iconColor?: string
}

export const ContactMethod = ({
  styles,
  Icon = BiEnvelope,
  label,
  values,
  caption,
  LinkComponent,
  iconColor,
}: ContactMethodProps) => {
  return (
    <div className={styles.container()}>
      <Icon
        className={
          iconColor ? twMerge(styles.icon(), iconColor) : styles.icon()
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
