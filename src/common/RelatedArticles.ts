interface RelatedArticle {
  title: string
  url: string
}

export interface RelatedArticlesProps {
  items: RelatedArticle[]
  LinkComponent?: any
}

export default RelatedArticlesProps
