// Lazy loaders for every island() in this package, keyed by island name. Used by ./client to
// download only the islands present on a page. __tests__/loaders.test.ts keeps it in sync.
export const islandLoaders: Record<string, () => Promise<unknown>> = {
  AskgovWidgetClient: () =>
    import("~/templates/next/components/internal/Askgov/AskgovWidgetClient").then(
      (m) => m.AskgovWidgetClient,
    ),
  BackToTopLink: () =>
    import("~/templates/next/components/internal/BackToTopLink").then(
      (m) => m.BackToTopLink,
    ),
  CentralNotificationClient: () =>
    import("~/templates/next/components/internal/CentralNotification/CentralNotificationClient").then(
      (m) => m.CentralNotificationClient,
    ),
  CollectionClient: () =>
    import("~/templates/next/layouts/Collection/CollectionClient").then(
      (m) => m.CollectionClient,
    ),
  DGSSearchableTable: () =>
    import("~/templates/next/components/internal/SearchableTable/DGS/DGSSearchableTable").then(
      (m) => m.DGSSearchableTable,
    ),
  DateFilterStatusClient: () =>
    import("~/templates/next/components/internal/CollectionCard/DateFilterStatusClient").then(
      (m) => m.DateFilterStatusClient,
    ),
  DgsContactInformation: () =>
    import("~/templates/next/components/complex/ContactInformation/DgsContactInformation/DgsContactInformation").then(
      (m) => m.DgsContactInformation,
    ),
  DynamicComponentList: () =>
    import("~/templates/next/components/complex/DynamicComponentList/DynamicComponentList").then(
      (m) => m.DynamicComponentList,
    ),
  DynamicDataBannerClient: () =>
    import("~/templates/next/components/complex/DynamicDataBanner/DynamicDataBannerClient").then(
      (m) => m.DynamicDataBannerClient,
    ),
  EgazetteAlgoliaSearch: () =>
    import("~/templates/next/layouts/Search/EgazetteAlgoliaSearch/EgazetteAlgoliaSearch").then(
      (m) => m.EgazetteAlgoliaSearch,
    ),
  ExternalLinkTitle: () =>
    import("~/templates/next/components/internal/CollectionCard/Title/ExternalLinkTitle").then(
      (m) => m.ExternalLinkTitle,
    ),
  HeroCarouselBlockClient: () =>
    import("~/templates/next/components/complex/Hero/HeroCarousel/HeroCarouselBlockClient").then(
      (m) => m.HeroCarouselBlockClient,
    ),
  HeroCarouselGradientClient: () =>
    import("~/templates/next/components/complex/Hero/HeroCarousel/HeroCarouselGradientClient").then(
      (m) => m.HeroCarouselGradientClient,
    ),
  HomepageSearchSGInputBox: () =>
    import("~/templates/next/components/internal/SearchSGInputBox/SearchSGInputBox").then(
      (m) => m.HomepageSearchSGInputBox,
    ),
  ImageClient: () =>
    import("~/templates/next/components/internal/ImageClient/ImageClient").then(
      (m) => m.ImageClient,
    ),
  ImageContainer: () =>
    import("~/templates/next/components/complex/Hero/HeroLargeImage/ImageContainer").then(
      (m) => m.ImageContainer,
    ),
  ImageGalleryClient: () =>
    import("~/templates/next/components/complex/ImageGallery/ImageGalleryClient").then(
      (m) => m.ImageGalleryClient,
    ),
  LiteVimeoEmbed: () =>
    import("~/templates/next/components/complex/Video/LiteVimeoEmbed").then(
      (m) => m.LiteVimeoEmbed,
    ),
  LiteYouTubeEmbed: () =>
    import("~/templates/next/components/complex/Video/LiteYouTubeEmbed").then(
      (m) => m.LiteYouTubeEmbed,
    ),
  MicrosoftClarity: () =>
    import("~/templates/next/components/internal/MicrosoftClarity/MicrosoftClarity").then(
      (m) => m.MicrosoftClarity,
    ),
  NavbarClient: () =>
    import("~/templates/next/components/internal/Navbar/NavbarClient").then(
      (m) => m.NavbarClient,
    ),
  NotFoundSearchButton: () =>
    import("~/templates/next/layouts/NotFound/NotFoundSearchButton").then(
      (m) => m.NotFoundSearchButton,
    ),
  NotificationClient: () =>
    import("~/templates/next/components/internal/Notification/NotificationClient").then(
      (m) => m.NotificationClient,
    ),
  PolyglotClient: () =>
    import("~/templates/next/components/internal/Polyglot/PolyglotClient").then(
      (m) => m.PolyglotClient,
    ),
  SearchSG: () =>
    import("~/templates/next/layouts/Search/SearchSG").then((m) => m.SearchSG),
  SearchableTableClient: () =>
    import("~/templates/next/components/internal/SearchableTable/shared/SearchableTableClient").then(
      (m) => m.SearchableTableClient,
    ),
  UnsupportedBrowserBanner: () =>
    import("~/templates/next/components/internal/UnsupportedBrowserBanner/UnsupportedBrowserBanner").then(
      (m) => m.UnsupportedBrowserBanner,
    ),
  VicaWidgetClient: () =>
    import("~/templates/next/components/internal/Vica/VicaWidgetClient").then(
      (m) => m.VicaWidgetClient,
    ),
  ZendeskWidget: () =>
    import("~/templates/next/components/internal/Zendesk/ZendeskWidget").then(
      (m) => m.ZendeskWidget,
    ),
}
