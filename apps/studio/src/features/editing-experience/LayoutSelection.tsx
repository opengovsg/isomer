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
  Text,
  VStack,
} from '@chakra-ui/react'
import { Button, BxRightArrowAlt } from '@opengovsg/design-system-react'

import { Icon } from '@chakra-ui/react'
import { BiLeftArrowAlt, BiShow } from 'react-icons/bi'

interface LayoutSelectionProps {
  pageName: String
}

const LAYOUT_DATA: {
  layoutName: string
  layoutDescription: string
  imageSource: string
}[] = [
  {
    layoutName: 'Default',
    layoutDescription: 'This is the most basic layout for your content.',
    imageSource: '/assets/layout_card/default_layout_card.png',
  },
  {
    layoutName: 'Article',
    layoutDescription:
      'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
    imageSource: '/assets/layout_card/article_layout_card.png',
  },
  //   {
  //     layoutName: 'Default',
  //     layoutDescription: 'This is the most basic layout for your content.',
  //     imageSource: '/assets/layout_card/default_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Article',
  //     layoutDescription:
  //       'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
  //     imageSource: '/assets/layout_card/article_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Default',
  //     layoutDescription: 'This is the most basic layout for your content.',
  //     imageSource: '/assets/layout_card/default_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Article',
  //     layoutDescription:
  //       'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
  //     imageSource: '/assets/layout_card/article_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Default',
  //     layoutDescription: 'This is the most basic layout for your content.',
  //     imageSource: '/assets/layout_card/default_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Article',
  //     layoutDescription:
  //       'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
  //     imageSource: '/assets/layout_card/article_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Default',
  //     layoutDescription: 'This is the most basic layout for your content.',
  //     imageSource: '/assets/layout_card/default_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Article',
  //     layoutDescription:
  //       'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
  //     imageSource: '/assets/layout_card/article_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Default',
  //     layoutDescription: 'This is the most basic layout for your content.',
  //     imageSource: '/assets/layout_card/default_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Article',
  //     layoutDescription:
  //       'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
  //     imageSource: '/assets/layout_card/article_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Default',
  //     layoutDescription: 'This is the most basic layout for your content.',
  //     imageSource: '/assets/layout_card/default_layout_card.png',
  //   },
  //   {
  //     layoutName: 'Article',
  //     layoutDescription:
  //       'Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches',
  //     imageSource: '/assets/layout_card/article_layout_card.png',
  //   },
]

export const LayoutSelection = (props: LayoutSelectionProps): JSX.Element => {
  // need state here to keep track of selected layout
  const [selectedLayout, setSelectedLayout] = useState(
    LAYOUT_DATA[0].layoutName,
  )

  // If selected there is no special hover effect.

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
          <GridItem w="100%" colSpan={1} bg="tomato" overflowY="scroll">
            <VStack p="2rem" gap="2rem" h="fit-content">
              {/* Picking Layouts */}
              {LAYOUT_DATA.map((e) => {
                return (
                  <VStack
                    p="0"
                    gap="0"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedLayout(e.layoutName)
                    }}
                    _hover={
                      selectedLayout == e.layoutName
                        ? {}
                        : {
                            '.layout-title': { color: 'base.content.brand' },
                            '.hover-text': {
                              opacity: 1,
                            },
                          }
                    }
                    sx={
                      selectedLayout == e.layoutName
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
                      borderRadius="8px"
                      border="2px"
                      p="1.5rem 1.5rem 0 1.5rem"
                      mb="1.25rem"
                      position="relative"
                      borderColor={
                        selectedLayout == e.layoutName
                          ? 'base.divider.brand'
                          : 'base.divider.medium'
                      }
                    >
                      <Image
                        src={e.imageSource}
                        borderRadius="4px 4px 0px 0px"
                        boxShadow="0px 0px 20px 0px rgba(104, 104, 104, 0.30)"
                      />
                      {selectedLayout != e.layoutName && (
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
                          bg="rgba(0, 0, 255, 0.2)"
                          color="blue"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="8px"
                        >
                          <VStack
                            w="100%"
                            h="100%"
                            justify="center"
                            gap="0.25rem"
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
                          selectedLayout == e.layoutName
                            ? 'base.content.brand'
                            : 'base.content.strong'
                        }
                        mb="0.5rem"
                      >
                        {e.layoutName} layout
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
            bg="brown"
            p=""
            overflow="auto"
          ></GridItem>
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
