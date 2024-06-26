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
  useToken,
  Icon,
} from '@chakra-ui/react'
import { Button } from '@opengovsg/design-system-react'
import { BiLeftArrowAlt, BiRightArrowAlt, BiShow } from 'react-icons/bi'
import Preview from '~/features/editing-experience/components/Preview'
import articleLayoutPreview from '~/features/editing-experience/data/articleLayoutPreview.json'
import contentLayoutPreview from '~/features/editing-experience/data/contentLayoutPreview.json'

interface LayoutSelectionProps {
  pageName: string
}

type LayoutType = 'article' | 'content'

const LAYOUT_DATA: {
  layoutDisplayName: string
  layoutTypename: LayoutType
  layoutDescription: string
  imageSource: string
  previewJson: JSON
}[] = [
  {
    layoutDisplayName: 'Default',
    layoutTypename: 'content',
    layoutDescription: 'This is the most basic layout for your content.',
    imageSource: '/assets/layout-card/default_layout_card.png',
    previewJson: contentLayoutPreview,
  },
  {
    layoutDisplayName: 'Article',
    layoutTypename: 'article',
    layoutDescription:
      'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
    imageSource: '/assets/layout-card/article_layout_card.png',
    previewJson: articleLayoutPreview,
  },
]

// TODO: Make this headless by getting the LAYOUT_DATA from the schema. Find somewhere in the schema for layoutDescription & image(fetch this too or generate it)
function LayoutSelection(props: LayoutSelectionProps): JSX.Element {
  // need state here to keep track of selected layout
  const [selectedLayout, setSelectedLayout] = useState(LAYOUT_DATA[0]!)
  return (
    <>
      {/* This is the floating header */}
      <VStack position="fixed" h="100%">
        <VStack p="1.5rem 2rem" w="full" gap="0.5rem" alignItems="flex-start">
          <Button variant="link">
            <Icon as={BiLeftArrowAlt} />
            Back To All Pages
          </Button>
          <HStack p="0" justifyContent="space-between" w="100%">
            <Text textStyle="h4" color="base.content.default">
              {`Choose a layout for "`}
              {props.pageName}
              {`"`}
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
                    cursor="pointer"
                    onClick={() => {
                      // TODO: set layout to render here
                      setSelectedLayout(layoutEntry)
                    }}
                    role="group"
                  >
                    <Box
                      className="hover-border"
                      borderRadius="8px"
                      border="2px"
                      p="1.5rem 1.5rem 0 1.5rem"
                      mb="1.25rem"
                      position="relative"
                      borderColor={
                        selectedLayout.layoutTypename ===
                        layoutEntry.layoutTypename
                          ? 'base.divider.brand'
                          : 'base.divider.medium'
                      }
                      sx={{
                        transition: 'border-color 300ms ease-out',
                      }}
                      _groupHover={
                        selectedLayout.layoutTypename !==
                        layoutEntry.layoutTypename
                          ? {
                              borderColor: useToken(
                                'colors',
                                'interaction.main-subtle.hover',
                              ),
                            }
                          : {}
                      }
                    >
                      <Image
                        src={layoutEntry.imageSource}
                        borderRadius="4px 4px 0px 0px"
                        boxShadow="md"
                        alt={`Image of ${layoutEntry.layoutDisplayName} layout`}
                      />

                      {selectedLayout.layoutTypename !==
                        layoutEntry.layoutTypename && (
                        <>
                          <Box
                            className="hover-blur"
                            position="absolute"
                            top="0"
                            left="0"
                            bg="interaction.main-subtle.default"
                            opacity="0.6"
                            alignItems="center"
                            w="100%"
                            h="100%"
                            borderRadius="6px" // due to this being smaller than the outer Box
                            sx={{
                              transition: 'opacity 300ms ease-out',
                              opacity: 0,
                            }}
                            _groupHover={{
                              opacity: 0.6,
                            }}
                          />
                          <VStack
                            sx={{
                              transition: 'opacity 300ms ease-out',
                              opacity: 0,
                            }}
                            className="hover-text"
                            w="100%"
                            h="100%"
                            position="absolute"
                            top="0"
                            left="0"
                            justify="center"
                            gap="0.25rem"
                            opacity="0"
                            color="base.content.brand"
                            _groupHover={{
                              opacity: 1,
                            }}
                          >
                            <Icon as={BiShow} />
                            <Text textStyle="caption-1">Click to preview</Text>
                          </VStack>
                        </>
                      )}
                    </Box>
                    <HStack w="100%" justifyContent="space-between">
                      <Text
                        className="layout-title"
                        textAlign="left"
                        textStyle="h6"
                        textColor={
                          selectedLayout.layoutTypename ===
                          layoutEntry.layoutTypename
                            ? 'base.content.brand'
                            : 'base.content.strong'
                        }
                        mb="0.5rem"
                        sx={{ transition: 'color 300ms ease-out' }}
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
              borderRadius="8px 8px 0px 0px"
              w="100%"
              minH="100%"
              boxShadow="md"
              position="relative"
            >
              <HStack
                borderRadius="8px 8px 0px 0px"
                w="100%"
                bgColor="slate.200"
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
              <Preview schema={selectedLayout.previewJson} />
              <Box position="absolute" top="0" left="0" w="100%" h="100%" />
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </>
  )
}
export default LayoutSelection
