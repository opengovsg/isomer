import { type IsomerComponent } from '@opengovsg/isomer-components'

// TODO: add in default blocks for remaining
export const DEFAULT_BLOCKS: Record<
  IsomerComponent['type'],
  IsomerComponent | undefined
> = {
  prose: {
    type: 'prose',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '',
          },
        ],
      },
    ],
  },
  accordion: undefined,
  button: undefined,
  callout: undefined,
  hero: undefined,
  iframe: undefined,
  image: undefined,
  infobar: undefined,
  infocards: undefined,
  infocols: undefined,
  infopic: undefined,
  keystatistics: undefined,
}
