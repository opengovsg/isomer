import { Type, type Static } from "@sinclair/typebox"
import {
  AccordionSchema,
  ButtonSchema,
  CalloutSchema,
  HeroSchema,
  IframeSchema,
  ImageSchema,
  InfoCardsSchema,
  InfoColsSchema,
  InfobarSchema,
  InfopicSchema,
  KeyStatisticsSchema,
  ProseSchema,
} from "~/interfaces"

export const IsomerComplexComponentsMap = {
  accordion: AccordionSchema,
  button: ButtonSchema,
  callout: CalloutSchema,
  hero: HeroSchema,
  iframe: IframeSchema,
  image: ImageSchema,
  infobar: InfobarSchema,
  infocards: InfoCardsSchema,
  infocols: InfoColsSchema,
  infopic: InfopicSchema,
  keystatistics: KeyStatisticsSchema,
}

export const IsomerNativeComponentsMap = {
  prose: ProseSchema,
}

export const IsomerComplexComponentsSchemas = Type.Union(
  Object.values(IsomerComplexComponentsMap),
)

export const IsomerNativeComponentsSchemas = Type.Union(
  Object.values(IsomerNativeComponentsMap),
)

export const IsomerComponentsSchemas = Type.Union([
  IsomerComplexComponentsSchemas,
  IsomerNativeComponentsSchemas,
])

export type IsomerComplexComponentProps = Static<
  typeof IsomerComplexComponentsSchemas
>
export type IsomerNativeComponentProps = Static<
  typeof IsomerNativeComponentsSchemas
>
export type IsomerComponent = Static<typeof IsomerComponentsSchemas>
