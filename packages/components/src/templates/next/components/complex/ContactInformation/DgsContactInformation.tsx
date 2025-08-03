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
  const { records, isLoading, isError } = useDgsData({
    resourceId,
    filters: {
      [row.fieldKey]: row.fieldValue,
    },
  })

  const record = records?.[0]

  // TODO: better handling of these non-success states
  // will check with SY for design
  if (isLoading || isError || !record) {
    return <div>Loading...</div>
  }

  const country = transformDgsField(rest.country, record)

  const entityName = transformDgsField(rest.entityName, record)

  const description = transformDgsField(rest.description, record)

  const otherInformation = transformDgsField(rest.otherInformation, record)

  const telephone = safeJsonParse<NativeContactInformationProps["telephone"]>(
    transformDgsField(rest.telephone, record),
  )

  const fax = safeJsonParse<NativeContactInformationProps["fax"]>(
    transformDgsField(rest.fax, record),
  )

  const email = safeJsonParse<NativeContactInformationProps["email"]>(
    transformDgsField(rest.email, record),
  )

  const website = safeJsonParse<NativeContactInformationProps["website"]>(
    transformDgsField(rest.website, record),
  )

  const operatingHours = safeJsonParse<
    NativeContactInformationProps["operatingHours"]
  >(transformDgsField(rest.operatingHours, record))

  const entityDetails = safeJsonParse<
    NativeContactInformationProps["entityDetails"]
  >(transformDgsField(rest.entityDetails, record))

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
