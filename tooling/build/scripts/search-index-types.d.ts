export interface IndexableComponent {
  indexable?: string[]
  props?: { markdown?: string }
}

export interface SchemaContent {
  permalink?: string
  title?: string
  components?: IndexableComponent[]
}

export interface IndexableObject {
  content: string
  id: string
  title: string
  url: string
}
