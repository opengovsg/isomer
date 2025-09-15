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
                  key={value}
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
                  key={value}
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
                  key={value}
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

interface LoadingContactMethodProps {
  styles: ReturnType<typeof commonContactMethodStyles>
}

export const LoadingContactMethod = ({ styles }: LoadingContactMethodProps) => {
  return (
    <div className={styles.container()}>
      <div className={styles.icon()} />
      <div className={styles.textContainer()}>
        <div className={styles.label()} />
        <div className={styles.valuesAndCaptionContainer()}>
          <div className={styles.value()} />
          <div className={styles.caption()} />
        </div>
      </div>
    </div>
  )
}
