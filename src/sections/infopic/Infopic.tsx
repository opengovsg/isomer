import { HStack, Image, Text, VStack } from "@chakra-ui/react"
import { Button } from "@govtechsg/sgds-react"
import { HomepageSectionWrapper } from "../../components/HomepageSectionWrapper"

export interface InfopicProps {
  sectionIndex: number
  title?: string
  subtitle?: string
  description?: string
  alt?: string
  image?: string
  button?: string
  url?: string
}

const TextComponent = ({
  title,
  subtitle,
  description,
  button,
  url,
}: Omit<InfopicProps, "sectionIndex" | "image" | "alt">) => {
  return (
    <VStack alignSelf="start" alignItems="start" w="50%">
      {subtitle && (
        <Text textStyle="subtitle-2" textColor={"content.base"}>
          {subtitle}
        </Text>
      )}
      {title && (
        <Text textStyle="h1" textColor={"secondaryColour"}>
          {title}
        </Text>
      )}
      {description && (
        <Text textStyle="body-1" textColor={"content.base"}>
          {description}
        </Text>
      )}
      {button && (
        <Button href={url}>
          <Text textStyle="link-button" textColor={"secondaryColour"}>
            {button}
          </Text>
        </Button>
      )}
    </VStack>
  )
}

const ImageComponent = ({
  image,
  alt,
}: {
  image?: InfopicProps["image"]
  alt?: InfopicProps["alt"]
}) => {
  return (
    <VStack w="50%">
      <Image src={image} alt={alt} maxW="100%"></Image>
    </VStack>
  )
}

export const Infopic = ({
  sectionIndex,
  title,
  subtitle,
  description,
  alt,
  image,
  button,
  url,
}: InfopicProps): JSX.Element => {
  return (
    <HomepageSectionWrapper sectionIndex={sectionIndex}>
      <HStack gap="3rem">
        {sectionIndex % 2 === 0 ? (
          <>
            <TextComponent
              title={title}
              subtitle={subtitle}
              description={description}
              button={button}
              url={url}
            />
            <ImageComponent image={image} alt={alt} />
          </>
        ) : (
          <>
            <ImageComponent image={image} alt={alt} />
            <TextComponent
              title={title}
              subtitle={subtitle}
              description={description}
              button={button}
              url={url}
            />
          </>
        )}
      </HStack>
    </HomepageSectionWrapper>
  )

  // old stuff
  //   <section class="bp-section {{ gray_container_class }}">
  //     <div class="bp-container">
  //         {%- comment -%} mobile edition {%- endcomment -%}
  //         <div class="row is-hidden-desktop is-hidden-tablet-only">
  //             <div class="col is-half padding--bottom">
  //                 {%- if section.infopic.subtitle -%}
  //                     <p class="padding--bottom subtitle-2">
  //                         {{- section.infopic.subtitle -}}
  //                     </p>
  //                 {%- endif -%}

  //                 <h1 class="has-text-secondary padding--bottom h1">
  //                     {{- section.infopic.title -}}
  //                 </h1>

  //                 {%- if section.infopic.description -%}
  //                     <p class="body-1">
  //                         {{- section.infopic.description -}}
  //                     </p>
  //                 {%- endif -%}

  //                 {%- if section.infopic.url and section.infopic.button -%}
  //                     {%- assign url_input = section.infopic.url -%}
  //                     {%- include functions/external_url.html -%}
  //                     <a {{anchor}} class="py-4 link-button remove-after is-flex flex-start is-vh-centered">
  //                         <span class="link-button-text">{{- section.infopic.button -}}</span>
  //                         <i class="sgds-icon sgds-icon-arrow-right is-size-4 ml-3" aria-hidden="true"></i>
  //                     </a>
  //                 {%- endif -%}
  //             </div>
  //             <div class="col is-half">
  //                 {%- if section.infopic.image and section.infopic.alt -%}
  //                     <img src="{{- site.baseurl -}}{{- section.infopic.image -}}" alt="{{- section.infopic.alt -}}" />
  //                 {%- else -%}
  //                     <h2>Both the image and alt text are required. Please refer to the documentation for more details.</h2>
  //                 {%- endif -%}
  //             </div>
  //         </div>
  //         {%- comment -%} tablet edition {%- endcomment -%}
  //         <div class="row is-hidden-mobile is-hidden-desktop">
  //             <div class="col is-half">
  //                 {%- if section.infopic.subtitle -%}
  //                     <p class="padding--bottom subtitle-2">
  //                         {{- section.infopic.subtitle -}}
  //                     </p>
  //                 {%- endif -%}

  //                 <h1 class="has-text-secondary padding--bottom h1">
  //                     {{- section.infopic.title -}}
  //                 </h1>

  //                 {%- if section.infopic.description -%}
  //                     <p class="body-1">
  //                         {{- section.infopic.description -}}
  //                     </p>
  //                 {%- endif -%}

  //                 {%- if section.infopic.url and section.infopic.button -%}
  //                     {%- assign url_input = section.infopic.url -%}
  //                     {%- include functions/external_url.html -%}
  //                     <a {{anchor}} class="py-4 link-button remove-after is-flex flex-start is-vh-centered">
  //                         <span class="link-button-text">{{- section.infopic.button -}}</span>
  //                         <i class="sgds-icon sgds-icon-arrow-right is-size-4 ml-3" aria-hidden="true"></i>
  //                     </a>
  //                 {%- endif -%}
  //             </div>
  //             <div class="col is-half is-half padding--top--xl padding--bottom--xl">
  //                 {%- if section.infopic.image and section.infopic.alt -%}
  //                     <img src="{{- site.baseurl -}}{{- section.infopic.image -}}" alt="{{- section.infopic.alt -}}" />
  //                 {%- else -%}
  //                     <h2>Both the image and alt text are required. Please refer to the documentation for more details.</h2>
  //                 {%- endif -%}
  //             </div>
  //         </div>
  //         {%- comment -%} desktop edition {%- endcomment -%}
  //         <div class="row is-hidden-mobile is-hidden-tablet-only">
  //             <div class="col is-half padding--top--xl padding--bottom--xl padding--left--xl padding--right--xl">
  //                 {%- if section.infopic.subtitle -%}
  //                     <p class="padding--bottom subtitle-2">
  //                         {{- section.infopic.subtitle -}}
  //                     </p>
  //                 {%- endif -%}

  //                 <h1 class="has-text-secondary padding--bottom h1">
  //                     {{- section.infopic.title -}}
  //                 </h1>

  //                 {%- if section.infopic.description -%}
  //                     <p class="body-1">
  //                         {{- section.infopic.description -}}
  //                     </p>
  //                 {%- endif -%}

  //                 {%- if section.infopic.url and section.infopic.button -%}
  //                     {%- assign url_input = section.infopic.url -%}
  //                     {%- include functions/external_url.html -%}
  //                     <a {{anchor}} class="py-4 link-button remove-after is-flex flex-start is-vh-centered">
  //                         <span class="link-button-text">{{- section.infopic.button -}}</span>
  //                         <i class="sgds-icon sgds-icon-arrow-right is-size-4 ml-3" aria-hidden="true"></i>
  //                     </a>
  //                 {%- endif -%}
  //             </div>
  //             <div class="col is-half is-half padding--top--xl padding--bottom--xl">
  //                 {%- if section.infopic.image and section.infopic.alt -%}
  //                     <img src="{{- site.baseurl -}}{{- section.infopic.image -}}" alt="{{- section.infopic.alt -}}" />
  //                 {%- else -%}
  //                     <h2>Both the image and alt text are required. Please refer to the documentation for more details.</h2>
  //                 {%- endif -%}
  //             </div>
  //         </div>
  //     </div>
  // </section>
}
