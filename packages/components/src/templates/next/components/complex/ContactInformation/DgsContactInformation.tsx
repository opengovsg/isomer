import pick from "lodash/pick"

import type {
  DgsContactInformationProps,
  NativeContactInformationProps,
} from "~/interfaces/complex/ContactInformation"
import { transformDgsField, useDgsData } from "~/hooks/useDgsData"
import { safeJsonParse } from "~/utils"
import { ContactInformationUI } from "./ContactInformationUI"

export const DgsContactInformation = ({
  dataSource: { resourceId, row },
  ...rest
}: DgsContactInformationProps) => {
  const { record, isLoading, isError } = useDgsData({ resourceId, row })

  // TODO: better handling of these non-success states
  // will check with SY for design
  if (isLoading || isError || !record) {
    return <div>Loading...</div>
  }

  const country = transformDgsField(rest.country, record)

  const entityName = transformDgsField(rest.entityName, record)

  const description = transformDgsField(rest.description, record)

  const otherInformation = transformDgsField(rest.otherInformation, record)

  const telephone = rest.telephone
    ? safeJsonParse<NativeContactInformationProps["telephone"]>(
        transformDgsField(rest.telephone, record),
      )
    : undefined

  const fax = rest.fax
    ? safeJsonParse<NativeContactInformationProps["fax"]>(
        transformDgsField(rest.fax, record),
      )
    : undefined

  const email = rest.email
    ? safeJsonParse<NativeContactInformationProps["email"]>(
        transformDgsField(rest.email, record),
      )
    : undefined

  const website = rest.website
    ? safeJsonParse<NativeContactInformationProps["website"]>(
        transformDgsField(rest.website, record),
      )
    : undefined

  const operatingHours = rest.operatingHours
    ? safeJsonParse<NativeContactInformationProps["operatingHours"]>(
        transformDgsField(rest.operatingHours, record),
      )
    : undefined

  const entityDetails = rest.entityDetails
    ? safeJsonParse<NativeContactInformationProps["entityDetails"]>(
        transformDgsField(rest.entityDetails, record),
      )
    : undefined

  return (
    <ContactInformationUI
      country={country}
      entityName={entityName}
      description={description}
      telephone={telephone}
      fax={fax}
      email={email}
      website={website}
      operatingHours={operatingHours}
      entityDetails={entityDetails}
      otherInformation={otherInformation}
      {...pick(rest, "type", "layout", "site", "LinkComponent")}
    />
  )
}
