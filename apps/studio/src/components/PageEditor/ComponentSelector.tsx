import { Flex, Text, VStack, Wrap } from '@chakra-ui/react'
import { Button, IconButton } from '@opengovsg/design-system-react'
import { IconType } from 'react-icons'
import {
  BiCard,
  BiColumns,
  BiDollar,
  BiExpandVertical,
  BiImage,
  BiImages,
  BiMap,
  BiMovie,
  BiQuestionMark,
  BiRuler,
  BiSolidHandUp,
  BiSolidQuoteAltLeft,
  BiText,
  BiX,
} from 'react-icons/bi'
import { SectionType } from './types'

const Section = ({ children }: React.PropsWithChildren) => {
  return (
    <VStack gap="0.5rem" alignItems={'start'}>
      {children}
    </VStack>
  )
}

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <Text textStyle={'subhead-3'} textColor="base.content.medium">
      {title}
    </Text>
  )
}

const BlockList = ({ children }: React.PropsWithChildren) => {
  return <Wrap spacing="0">{children}</Wrap>
}

const BlockItem = ({
  icon: Icon,
  label,
  onProceed,
  sectionType,
}: {
  icon: IconType
  label: string
  onProceed: (sectionType: SectionType) => void
  sectionType: SectionType
}) => {
  return (
    <Button
      m="0.75rem"
      w="6rem"
      h="6rem"
      variant="clear"
      colorScheme="neutral"
      onClick={() => onProceed(sectionType)}
    >
      <VStack gap="0.5rem" color="base.content.default">
        <Icon size="1.25rem" />
        <Text textStyle={'caption-1'}>{label}</Text>
      </VStack>
    </Button>
  )
}

interface ComponentSelectorProps {
  onClose: () => void
  onProceed: (sectionType: SectionType) => void
}

const ComponentSelector = ({ onClose, onProceed }: ComponentSelectorProps) => {
  return (
    <VStack w="full" gap="0">
      <Flex
        w="full"
        py="1.25rem"
        px="2rem"
        alignItems={'center'}
        justifyContent={'space-between'}
        borderBottom={'solid'}
        borderWidth={'1px'}
        borderColor={'base.divider.medium'}
      >
        <VStack alignItems={'start'}>
          <Text as={'h5'} textStyle={'h5'}>
            Add a new block
          </Text>
          <Text textStyle={'body-2'}>Click a block to add to the page</Text>
        </VStack>
        <IconButton
          size="lg"
          variant="clear"
          colorScheme="neutral"
          color="interaction.sub.default"
          aria-label="Close add component"
          icon={<BiX />}
          onClick={onClose}
        />
      </Flex>
      <VStack p="2rem" w="full" gap="1.25rem" alignItems={'start'}>
        <Section>
          <SectionTitle title="Basic Building Blocks" />
          <BlockList>
            <BlockItem
              label="Paragraph"
              icon={BiText}
              onProceed={onProceed}
              sectionType="paragraph"
            />
            <BlockItem
              label="Image"
              icon={BiImage}
              onProceed={onProceed}
              sectionType="image"
            />
          </BlockList>
        </Section>
        <Section>
          <SectionTitle title="Highlight Important Information" />
          <BlockList>
            <BlockItem
              label="Statistics"
              icon={BiDollar}
              onProceed={onProceed}
              sectionType="statistics"
            />
            <BlockItem
              label="Callout"
              icon={BiSolidQuoteAltLeft}
              onProceed={onProceed}
              sectionType="callout"
            />
            <BlockItem
              label="Text with button"
              icon={BiSolidHandUp}
              onProceed={onProceed}
              sectionType="textWithButton"
            />
            <BlockItem
              label="Text with image"
              icon={BiImages}
              onProceed={onProceed}
              sectionType="textWithImage"
            />
          </BlockList>
        </Section>
        <Section>
          <SectionTitle title="Organise Content" />
          <BlockList>
            <BlockItem
              label="Cards"
              icon={BiCard}
              onProceed={onProceed}
              sectionType="cards"
            />
            <BlockItem
              label="Columns"
              icon={BiColumns}
              onProceed={onProceed}
              sectionType="columns"
            />
            <BlockItem
              label="Accordion"
              icon={BiExpandVertical}
              onProceed={onProceed}
              sectionType="accordion"
            />
            <BlockItem
              label="Divider"
              icon={BiRuler}
              onProceed={onProceed}
              sectionType="divider"
            />
          </BlockList>
        </Section>
        <Section>
          <SectionTitle title="External Content" />
          <BlockList>
            <BlockItem
              label="Youtube"
              icon={BiMovie}
              onProceed={onProceed}
              sectionType="youtube"
            />
            <BlockItem
              label="Google Maps"
              icon={BiMap}
              onProceed={onProceed}
              sectionType="googleMaps"
            />
            <BlockItem
              label="FormSG"
              icon={BiQuestionMark}
              onProceed={onProceed}
              sectionType="formsg"
            />
          </BlockList>
        </Section>
      </VStack>
    </VStack>
  )
}

export default ComponentSelector
