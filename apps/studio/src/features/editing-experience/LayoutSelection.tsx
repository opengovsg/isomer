/* eslint-disable import/prefer-default-export */
/* eslint-disable prettier/prettier */
/* eslint-disable */

// Component for layout selection

import React, { useState } from 'react'
import {
  Box,
  Center,
  Grid,
  GridItem,
  HStack,
  Image,
  List,
  ListItem,
  Text,
  VStack,
  useToken,
} from '@chakra-ui/react'
import { Button, BxRightArrowAlt } from '@opengovsg/design-system-react'

import { Icon } from '@chakra-ui/react'
import { BiLeftArrowAlt, BiShow } from 'react-icons/bi'

interface LayoutSelectionProps {
  pageName: String
}

const LAYOUT_DATA: {
  layoutDisplayName: string
  layoutSchemaName: string
  layoutDescription: string
  imageSource: string
}[] = [
  {
    layoutDisplayName: 'Default',
    layoutSchemaName: 'content',
    layoutDescription: 'This is the most basic layout for your content.',
    imageSource: '/assets/layout_card/default_layout_card.png',
  },
  {
    layoutDisplayName: 'Article',
    layoutSchemaName: 'article',
    layoutDescription:
      'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
    imageSource: '/assets/layout_card/article_layout_card.png',
  },
]

const placeholderSchema = {
  version: '0.1.0',
  layout: 'default',
  page: {
    title: 'Home',
  },
  content: [
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1570441262582-a2d4b9a916a5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      alt: 'A man is serving food out of a blue food',
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: "Singapore - In a bid to foster community spirit and celebrate the rich tapestry of its diverse population, Singapore is gearing up to host its first-ever Citizens' Festival. This unprecedented event promises to be a dazzling extravaganza filled with entertainment, cultural showcases, and gastronomic delights.",
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: "One of the highlights of the festival is the Cultural Village, where visitors can immerse themselves in the sights, sounds, and flavors of Singapore's various ethnic communities. From traditional Malay dance performances to Chinese calligraphy demonstrations and Indian culinary workshops, attendees will have the opportunity to gain a deeper appreciation for the country's multicultural heritage.",
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This is a Chat-GPT4 generated article for visual testing purposes.',
        },
      ],
    },
  ],
}

export const LayoutSelection = (props: LayoutSelectionProps): JSX.Element => {
  // need state here to keep track of selected layout
  const [selectedLayout, setSelectedLayout] = useState(
    LAYOUT_DATA[0].layoutDisplayName,
  )
  const interactionMainSubtleDefault = useToken(
    'colors',
    'interaction.main-subtle.default',
  )
  console.log(interactionMainSubtleDefault)

  return (
    <>
      {/* This is the floating header */}
      <VStack position="fixed" h="100vh">
        <VStack p="1.5rem 2rem" w="100vw" gap="0.5rem" alignItems="flex-start">
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
              <BxRightArrowAlt fontSize="1.5rem" />
            </Button>
          </HStack>
        </VStack>
        <Grid
          w="100vw"
          h="calc(100% - 7rem)"
          templateColumns="repeat(4, 1fr)"
          gap={0}
        >
          <GridItem w="100%" colSpan={1} bg="grey.50" overflowY="scroll">
            <VStack p="2rem" gap="2rem" h="fit-content">
              {/* Picking Layouts */}
              {LAYOUT_DATA.map((e) => {
                return (
                  <VStack
                    p="0"
                    gap="0"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedLayout(e.layoutDisplayName)
                    }}
                    _hover={
                      selectedLayout == e.layoutDisplayName
                        ? {}
                        : {
                            '.layout-title': { color: 'base.content.brand' },
                            '.hover-text': {
                              opacity: 1,
                            },
                            '.hover-border': {
                              borderColor: useToken(
                                'colors',
                                'interaction.main-subtle.hover',
                              ),
                            },
                          }
                    }
                    sx={
                      selectedLayout == e.layoutDisplayName
                        ? {}
                        : {
                            '.layout-title': {
                              transition: 'color 300ms ease-out',
                            },
                            '.hover-text': {
                              transition: 'opacity 300ms ease-out',
                              opacity: 0,
                            },
                          }
                    }
                    // _hover={{
                    //   '.layout-title': { textColor: 'base.content.brand' },
                    //   '.hover-text': {
                    //     display: 'block',
                    //   },
                    // }}
                    // sx={{
                    //   '.layout-title': {
                    //     transition: 'textColor 300ms ease-out',
                    //   },
                    //   '.hover-text': {
                    //     transition: 'opacity 300ms ease-out',
                    //     opacity: 0,
                    //   },
                    //   ':hover .hover-text': {
                    //     opacity: 1,
                    //   },
                    // }}
                  >
                    <Box
                      //    className={selectedLayout==e.layoutName?"":"hover-border"}
                      className="hover-border"
                      borderRadius="8px"
                      border="2px"
                      p="1.5rem 1.5rem 0 1.5rem"
                      mb="1.25rem"
                      position="relative"
                      borderColor={
                        selectedLayout == e.layoutDisplayName
                          ? 'base.divider.brand'
                          : 'base.divider.medium'
                      }
                    >
                      <Image
                        src={e.imageSource}
                        borderRadius="4px 4px 0px 0px"
                        boxShadow="0px 0px 20px 0px rgba(104, 104, 104, 0.30)"
                      />
                      {selectedLayout != e.layoutDisplayName && (
                        <Box
                          // className="hover-text"
                          // display="none"
                          // position="absolute"
                          // top="0"
                          // left="0"
                          // right="0"
                          // bottom="0"
                          // bg="rgba(0, 0, 255, 0.2)"
                          // color="blue"
                          // alignItems="center"
                          // justifyContent="center"
                          // borderRadius="8px"
                          className="hover-text"
                          position="absolute"
                          top="0"
                          left="0"
                          right="0"
                          bottom="0"
                          bg="rgba(172, 199, 250, 0.4)"
                          opacity="0"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="6px" // due to this being smaller than the outer Box
                        >
                          <VStack
                            w="100%"
                            h="100%"
                            justify="center"
                            gap="0.25rem"
                            opacity="1"
                            color="base.content.brand"
                          >
                            <Icon as={BiShow} />
                            <Text textStyle="caption-1">Click to preview</Text>
                          </VStack>
                        </Box>
                      )}
                    </Box>
                    <HStack w="100%" justifyContent="space-between">
                      <Text
                        className="layout-title"
                        textAlign="left"
                        textStyle="h6"
                        textColor={
                          selectedLayout == e.layoutDisplayName
                            ? 'base.content.brand'
                            : 'base.content.strong'
                        }
                        mb="0.5rem"
                      >
                        {e.layoutDisplayName} layout
                      </Text>
                    </HStack>
                    <Text
                      textAlign="left"
                      textStyle="body-1"
                      textColor="base.content.default"
                    >
                      {e.layoutDescription}
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
              boxShadow="0 0 20px 0 rgba(104,104,104,0.3)"
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
                  {selectedLayout}
                  {` Layout`}
                </Text>
              </HStack>
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </>
  )
}

// const LinksReportDetails = ({ layoutStyle: String }: {}) => {
//   return (
//     <VStack p="0" gap="0">
//       <Box borderRadius="8px" border="2px" p="1.5rem 1.5rem 0 1.5rem">
//         {/* image */}
//       </Box>
//       <Hstack>
//         <Text>layout name</Text>
//       </Hstack>
//       <Text>description text</Text>
//     </VStack>
//   )
// }
