// Component for layout selection

import React, { useState } from 'react'
import {
  Box,
  Grid,
  GridItem,
  HStack,
  Image,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react'
import { Button, Link } from '@opengovsg/design-system-react'
import { BiLeftArrowAlt, BiRightArrowAlt, BiShow } from 'react-icons/bi'
import Preview, {
  type PreviewProps,
} from '~/features/editing-experience/components/Preview'
import articleLayoutPreview from '~/features/editing-experience/data/articleLayoutPreview.json'
import contentLayoutPreview from '~/features/editing-experience/data/contentLayoutPreview.json'

export interface LayoutSelectionProps {
  pageName: string
  // preparing to make the trpc call to create page. required props
  pageUrl: string
  siteId: string
  folderId: string
}

type LayoutDataType = {
  layoutDisplayName: string
  layoutTypename: string
  layoutDescription: string
  imageSource: string
  previewJson: object
}

const LAYOUT_DATA: LayoutDataType[] = [
  {
    layoutDisplayName: 'Default',
    layoutTypename: 'content',
    layoutDescription: 'This is the most basic layout for your content.',
    imageSource: '/assets/layout-card/default_layout_card.webp',
    previewJson: contentLayoutPreview,
  },
  {
    layoutDisplayName: 'Article',
    layoutTypename: 'article',
    layoutDescription:
      'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
    imageSource: '/assets/layout-card/article_layout_card.webp',
    previewJson: articleLayoutPreview,
  },
] as const

const dataAttr = (value: unknown) => (!!value ? true : undefined) // Keeping this here for now, might shift out to a utils file when necessary.

// TODO: Make this headless by getting the LAYOUT_DATA from the schema. Find somewhere in the schema for layoutDescription & image(fetch this too or generate it)
function LayoutSelection(props: LayoutSelectionProps): JSX.Element {
  const [selectedLayout, setSelectedLayout] = useState<LayoutDataType>(
    LAYOUT_DATA[0]!,
  )

  return (
    <>
      {/* This is the floating header */}
      <VStack position="fixed" h="100%">
        <VStack p="1.5rem 2rem" w="full" gap="0.5rem" alignItems="flex-start">
          <Link variant="standalone" href="/" gap="0.25rem" size="sm" p="0">
            <Icon as={BiLeftArrowAlt} boxSize="1.25rem" />
            Back to all pages
          </Link>
          <HStack p="0" justifyContent="space-between" w="100%">
            <Text textStyle="h4" color="base.content.default">
              {`Choose a layout for "${props.pageName}"`}
            </Text>
            <Button size="xs">
              Start with this layout
              <BiRightArrowAlt fontSize="1.5rem" />
            </Button>
          </HStack>
        </VStack>
        <Grid
          w="100%"
          h="calc(100% - 7rem)"
          templateColumns="repeat(4, 1fr)"
          gap={0}
        >
          <GridItem w="100%" colSpan={1} bg="grey.50" overflowY="scroll">
            <VStack p="2rem" gap="2rem" h="fit-content">
              {/* Picking Layouts */}
              {LAYOUT_DATA.map((layoutEntry) => {
                return (
                  <VStack
                    key={layoutEntry.layoutTypename}
                    p="0"
                    gap="0"
                    onClick={() => {
                      setSelectedLayout(layoutEntry)
                    }}
                    role="group"
                    as="button"
                  >
                    <Box
                      borderRadius="8px"
                      border="2px"
                      p="1.5rem 1.5rem 0 1.5rem"
                      mb="1.25rem"
                      position="relative"
                      borderColor="base.divider.medium"
                      bgColor="interaction.muted.main.hover"
                      data-active={dataAttr(
                        selectedLayout.layoutTypename ===
                          layoutEntry.layoutTypename,
                      )} // have to use null so that React will not parse this jsx attribute. having the [data-active] selection attribute will trigger _active.
                      _active={{
                        borderColor: 'base.divider.brand',
                        bgColor: 'interaction.muted.main.active',
                        _groupHover: {
                          // Override the group hover behavior
                          bgColor: 'interaction.main-subtle.default',
                          borderColor: 'base.divider.brand',
                        },
                      }}
                      _groupHover={{
                        borderColor: 'interaction.main-subtle.hover',
                        bgColor: 'interaction.main-subtle.default',
                      }}
                      transition="border-color 300ms ease-out, opacity 300ms ease-out, background-color 300ms ease-out"
                    >
                      <Image
                        src={layoutEntry.imageSource}
                        borderTopRadius="4px"
                        boxShadow="md"
                        alt={`Image of ${layoutEntry.layoutDisplayName} layout`}
                      />

                      {selectedLayout.layoutTypename !==
                        layoutEntry.layoutTypename && (
                        <>
                          {/* for opacity, since we need the text to be clear */}
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            opacity="0"
                            alignItems="center"
                            w="100%"
                            h="100%"
                            borderRadius="6px" // due to this being smaller than the outer Box
                            bgColor="interaction.main-subtle.default"
                            transition="opacity 300ms ease-out"
                            _groupHover={{
                              opacity: 0.6,
                            }}
                          />
                          <VStack
                            transition="opacity 300ms ease-out"
                            opacity="0"
                            w="100%"
                            h="100%"
                            position="absolute"
                            top="0"
                            left="0"
                            justify="center"
                            gap="0.25rem"
                            color="base.content.brand"
                            _groupHover={{
                              opacity: 1,
                            }}
                            as="button"
                          >
                            <Icon as={BiShow} />
                            <Text textStyle="caption-1">Click to preview</Text>
                          </VStack>
                        </>
                      )}
                    </Box>
                    <HStack w="100%" justifyContent="space-between">
                      <Text
                        textAlign="left"
                        textStyle="h6"
                        textColor="base.content.strong"
                        data-active={dataAttr(
                          selectedLayout.layoutTypename ===
                            layoutEntry.layoutTypename,
                        )}
                        _active={{ textColor: 'base.content.brand' }}
                        mb="0.5rem"
                        transition="color 300ms ease-out"
                        _groupHover={{ textColor: 'base.content.brand' }}
                      >
                        {layoutEntry.layoutDisplayName} layout
                      </Text>
                    </HStack>
                    <Text
                      w="100%"
                      textAlign="left"
                      textStyle="body-1"
                      textColor="base.content.default"
                    >
                      {layoutEntry.layoutDescription}
                    </Text>
                  </VStack>
                )
              })}
            </VStack>
          </GridItem>
          <GridItem
            w="100%"
            colSpan={3}
            bg="grey.100"
            p="2rem 2rem 0 2rem"
            overflow="auto"
          >
            <Box
              borderTopRadius="8px"
              w="100%"
              minH="100%"
              boxShadow="md"
              position="relative"
            >
              <HStack
                borderTopRadius="8px"
                w="100%"
                bgColor="base.canvas.light"
                textColor="white"
                justifyContent="center"
                gap="0"
                padding="0.5rem 0.75rem"
              >
                <Text textStyle="caption-2">
                  {`You're previewing the`}&nbsp;
                </Text>
                <Text textStyle="caption-1">
                  {selectedLayout.layoutDisplayName}
                  {` Layout`}
                </Text>
              </HStack>
              <Preview
                schema={selectedLayout.previewJson as PreviewProps['schema']}
              />
              <Box position="absolute" top="0" left="0" w="100%" h="100%" />
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </>
  )
}
export default LayoutSelection
