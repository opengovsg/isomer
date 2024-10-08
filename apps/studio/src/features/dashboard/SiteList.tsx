import NextLink from "next/link"
import {
  Card,
  CardHeader,
  Flex,
  Image,
  SimpleGrid,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"

import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

const NoResultIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={282}
      height={282}
      fill="none"
    >
      <g clipPath="url(#clip0_6868_50429)">
        <path
          fill="#072A69"
          stroke="#000"
          strokeWidth={1.953}
          d="M164.105 84.693c-28.182-3.38-60.149 22.013-62.408 54.227-2.26 32.215 22.012 60.149 54.227 62.408 32.215 2.26 60.15-22.028 62.408-54.227.817-11.645-1.836-22.734-7.08-32.254-6.622-14.572-26.376-27.663-47.147-30.154Zm-7.453 106.26c-26.467-1.856-46.438-24.823-44.58-51.305 1.857-26.482 24.823-46.438 51.305-44.58 26.482 1.857 46.438 24.823 44.58 51.305-1.857 26.483-24.823 46.438-51.305 44.58Z"
        />
        <path
          fill="#666C7A"
          stroke="#000"
          strokeWidth={2.254}
          d="m121.459 174.526-.288.217-3.233 2.443c-2.728 2.06-6.488 4.899-10.621 8.013-8.267 6.229-18.02 13.558-23.974 17.965-3.025 2.238-7.273 5.278-11.5 8.302-3.592 2.57-7.169 5.129-9.965 7.175-6.858 5.019-8.69 6.433-9.541 7.096-.2.155-.339.264-.48.372-.429.326-.874.63-3.072 2.138-2.65 1.816-6.33 4.254-10.002 5.376-1.824.557-3.569.764-5.137.46-1.539-.298-2.98-1.099-4.224-2.699-1.271-1.636-1.729-3.158-1.727-4.541.003-1.401.479-2.759 1.241-4.043 1.544-2.599 4.125-4.671 5.623-5.827.818-.631.91-.68 1.84-1.176l.396-.211c1.343-.719 3.938-2.139 9.968-5.719 11.216-6.659 28.449-17.247 42.871-26.167 7.213-4.46 13.725-8.505 18.434-11.434l5.573-3.47 1.32-.823 4.881 4.421 1.617 2.132Z"
        />
        <path
          fill="#666C7A"
          stroke="#000"
          strokeWidth={2.254}
          d="m208.983 111.886.018.039.021.038c5.143 9.335 7.745 20.209 6.944 31.631-2.215 31.579-29.612 55.399-61.206 53.183-31.593-2.216-55.398-29.612-53.182-61.206 1.105-15.755 9.482-29.889 21.086-39.679 11.612-9.796 26.347-15.153 40.064-13.508 10.203 1.224 20.173 5.055 28.402 10.374 8.239 5.327 14.656 12.093 17.853 19.128Zm-99.278 24.255c-1.901 27.104 18.538 50.609 45.625 52.509 27.103 1.901 50.608-18.522 52.509-45.626 1.901-27.103-18.523-50.607-45.626-52.508-27.103-1.901-50.607 18.522-52.508 45.625Z"
        />
        <path
          fill="#fff"
          stroke="#fff"
          strokeWidth={0.754}
          d="m237.058 93.773.001.002c.146.996-.219 2.04-.542 2.844-.332.841-.758 1.627-1.172 2.391l-.005.01c-.396.735-.782 1.465-1.082 2.226-.14.364-.26.72-.334 1.082l-.006.038a.746.746 0 0 1-.008.05c.315.162.578.46.603.92v.001a1.59 1.59 0 0 1-.975 1.559 1.5 1.5 0 0 1-1.791-.469c-.378-.471-.455-1.057-.428-1.588.027-.532.164-1.068.271-1.479v-.001c.222-.844.573-1.627.953-2.376a47.208 47.208 0 0 1 .586-1.108c.196-.365.389-.725.569-1.088l.001-.001c.35-.702.671-1.409.833-2.138v-.002c.046-.2.065-.34.053-.454a.433.433 0 0 0-.143-.28c-.202-.196-.483-.362-.776-.508-1.261-.624-2.876-.737-3.898.149h-.001c-.829.715-1.112 1.906-.595 2.827.19.334.149.705.022.99-.127.283-.361.54-.654.665-.699.305-1.312-.108-1.6-.612l-.001-.001c-.967-1.703-.483-3.893.729-5.267 1.237-1.41 3.137-1.932 4.924-1.673l4.466 3.291Zm0 0c-.16-1.058-.903-1.825-1.756-2.344m1.756 2.344-1.756-2.344m0 0c-.856-.52-1.875-.826-2.71-.947l2.71.947Z"
        />
        <path
          fill="#fff"
          stroke="#fff"
          strokeWidth={1.499}
          d="M234.36 106.351c-.707 0-1.591.42-1.696 1.424-.049.426.094.849.327 1.163.237.32.642.619 1.174.619.708 0 1.591-.421 1.696-1.424a1.672 1.672 0 0 0-.326-1.163c-.238-.321-.643-.619-1.175-.619Z"
        />
        <path
          fill="#fff"
          stroke="#fff"
          strokeWidth={0.754}
          d="m119.231 236.002-.001.002c-.47.654-1.256 1.046-1.868 1.319-.642.292-1.308.501-1.948.703l-.01.003c-.617.196-1.22.393-1.792.653a5.13 5.13 0 0 0-.755.414l-.006.005a.904.904 0 0 1-.194.86l-.001.001a1.317 1.317 0 0 1-1.478.366 1.247 1.247 0 0 1-.798-1.313c.046-.496.336-.882.644-1.169.31-.288.681-.517.962-.688.586-.355 1.21-.605 1.827-.818.286-.098.574-.19.857-.28l.068-.021c.306-.098.606-.194.901-.299h.001c.572-.201 1.123-.419 1.597-.732l.002-.001c.132-.086.208-.148.253-.206a.253.253 0 0 0 .054-.178 2.365 2.365 0 0 0-.154-.675c-.361-1.011-1.178-1.906-2.175-1.961h-.001c-.813-.047-1.571.444-1.767 1.191l-.365-.096.365.093c-.082.323-.33.525-.572.622-.239.096-.53.116-.784.019-.608-.228-.731-.843-.613-1.304v-.001c.39-1.512 1.876-2.488 3.319-2.603 1.482-.121 2.847.629 3.716 1.755l.716 4.339Zm0 0c.501-.704.497-1.561.298-2.322m-.298 2.322.298-2.322m0 0c-.2-.764-.609-1.493-1.014-2.017l1.014 2.017Z"
        />
        <path
          fill="#fff"
          stroke="#fff"
          strokeWidth={1.499}
          d="M111.001 241.38c-.432-.419-1.249-.705-1.936-.129-.294.241-.46.594-.504.931-.046.344.025.787.37 1.121.433.418 1.249.705 1.937.129a1.46 1.46 0 0 0 .504-.931c.045-.344-.026-.788-.371-1.121Z"
        />
      </g>
      <defs>
        <clipPath id="clip0_6868_50429">
          <path fill="#fff" d="M0 0h282v282H0z" />
        </clipPath>
      </defs>
    </svg>
  )
}

const SuspendableSiteList = (): JSX.Element => {
  // TODO: Only return sites that the user has access to
  const [sites] = trpc.site.list.useSuspenseQuery()

  if (sites.length === 0) {
    return (
      <Flex
        flexDirection="column"
        gap="1.5rem"
        alignItems="center"
        marginTop="6rem"
      >
        <NoResultIcon />
        <Flex flexDirection="column" gap="0.5rem" alignItems="center">
          <Text textStyle="h5" textAlign="center">
            You don't have access to any sites yet.
          </Text>
          <Text textStyle="body-2" textAlign="center">
            Speak to your System Owner to get access.<br></br>
            If you think there is an error,{" "}
            <Link variant="inline" href="mailto:support@isomer.gov.sg">
              let us know
            </Link>
            .
          </Text>
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex flexDirection="column" gap="1.5rem" marginTop="0.75rem">
      <Text textStyle="body-2">
        Don't see a site that you're supposed to have access to?{" "}
        <Link variant="inline" href="mailto:support@isomer.gov.sg">
          Let us know
        </Link>
        .
      </Text>
      <Flex flexDirection="column" gap="2rem">
        <SimpleGrid columns={3} gap="2.5rem" width="100%">
          {sites.map((site) => (
            <Link
              href={`/sites/${site.id}`}
              as={NextLink}
              textDecoration="none"
              color="links.neutral-hover"
              _hover={{
                textDecoration: "none",
                color: "links.neutral-hover",
              }}
            >
              <Flex
                key={site.id}
                flexDirection="column"
                gap="1rem"
                width="100%"
              >
                <Image
                  src={site.config.logoUrl || "/placeholder_no_image.png"}
                  alt={site.name}
                  borderRadius="0.5rem"
                  border="1.5px solid #EDEDED"
                  width="100%"
                  height="100%"
                  objectFit="cover"
                  aspectRatio="1/1"
                />
                <Flex flexDirection="column" gap="0.5rem">
                  <Text
                    textStyle="h6"
                    noOfLines={1}
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {site.name}
                  </Text>
                  {/* <Text textStyle="body-2"></Text> */}
                </Flex>
              </Flex>
            </Link>
          ))}
        </SimpleGrid>
      </Flex>
    </Flex>
  )
}

const SiteListSkeleton = (): JSX.Element => {
  return (
    <SimpleGrid columns={3} gap="2.5rem">
      {[1, 2, 3].map((index) => (
        <Card key={index} width="100%">
          <Skeleton>
            <CardHeader>Loading...</CardHeader>
          </Skeleton>
        </Card>
      ))}
    </SimpleGrid>
  )
}

export const SiteList = withSuspense(SuspendableSiteList, <SiteListSkeleton />)
