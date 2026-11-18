// Every island in this package, by name, with a lazy import of the module that exports it. A host
// uses it to download only the islands on a page. island() only accepts names listed here, and
// __tests__/registry.test.ts checks each module exports the island under that name.
export const islands = {
  AskgovWidgetClient: () =>
    import("~/templates/next/components/internal/Askgov/AskgovWidgetClient"),
  BackToTopLink: () =>
    import("~/templates/next/components/internal/BackToTopLink"),
  CentralNotificationClient: () =>
    import("~/templates/next/components/internal/CentralNotification/CentralNotificationClient"),
  CollectionClient: () =>
    import("~/templates/next/layouts/Collection/CollectionClient"),
  DateFilterStatusClient: () =>
    import("~/templates/next/components/internal/CollectionCard/DateFilterStatusClient"),
  DgsContactInformation: () =>
    import("~/templates/next/components/complex/ContactInformation/DgsContactInformation/DgsContactInformation"),
  DGSSearchableTable: () =>
    import("~/templates/next/components/internal/SearchableTable/DGS/DGSSearchableTable"),
  DynamicComponentList: () =>
    import("~/templates/next/components/complex/DynamicComponentList/DynamicComponentList"),
  DynamicDataBannerClient: () =>
    import("~/templates/next/components/complex/DynamicDataBanner/DynamicDataBannerClient"),
  EgazetteAlgoliaSearch: () =>
    import("~/templates/next/layouts/Search/EgazetteAlgoliaSearch/EgazetteAlgoliaSearch"),
  ExternalLinkTitle: () =>
    import("~/templates/next/components/internal/CollectionCard/Title/ExternalLinkTitle"),
  HeroCarouselBlockClient: () =>
    import("~/templates/next/components/complex/Hero/HeroCarousel/HeroCarouselBlockClient"),
  HeroCarouselGradientClient: () =>
    import("~/templates/next/components/complex/Hero/HeroCarousel/HeroCarouselGradientClient"),
  HomepageSearchSGInputBox: () =>
    import("~/templates/next/components/internal/SearchSGInputBox/SearchSGInputBox"),
  ImageClient: () =>
    import("~/templates/next/components/internal/ImageClient/ImageClient"),
  ImageContainer: () =>
    import("~/templates/next/components/complex/Hero/HeroLargeImage/ImageContainer"),
  ImageGalleryClient: () =>
    import("~/templates/next/components/complex/ImageGallery/ImageGalleryClient"),
  LiteVimeoEmbed: () =>
    import("~/templates/next/components/complex/Video/LiteVimeoEmbed"),
  LiteYouTubeEmbed: () =>
    import("~/templates/next/components/complex/Video/LiteYouTubeEmbed"),
  MicrosoftClarity: () =>
    import("~/templates/next/components/internal/MicrosoftClarity/MicrosoftClarity"),
  NavbarClient: () =>
    import("~/templates/next/components/internal/Navbar/NavbarClient"),
  NotFoundSearchButton: () =>
    import("~/templates/next/layouts/NotFound/NotFoundSearchButton"),
  NotificationClient: () =>
    import("~/templates/next/components/internal/Notification/NotificationClient"),
  PolyglotClient: () =>
    import("~/templates/next/components/internal/Polyglot/PolyglotClient"),
  SearchableTableClient: () =>
    import("~/templates/next/components/internal/SearchableTable/shared/SearchableTableClient"),
  SearchSG: () => import("~/templates/next/layouts/Search/SearchSG"),
  UnsupportedBrowserBanner: () =>
    import("~/templates/next/components/internal/UnsupportedBrowserBanner/UnsupportedBrowserBanner"),
  VicaWidgetClient: () =>
    import("~/templates/next/components/internal/Vica/VicaWidgetClient"),
  ZendeskWidget: () =>
    import("~/templates/next/components/internal/Zendesk/ZendeskWidget"),
} satisfies Record<string, () => Promise<object>>

export type IslandName = keyof typeof islands
