import fm from "front-matter";
import moment from "moment";
import { isomerSchemaValidator } from "./schema";
import { generateImageAltText } from "./ai";
import type { GetIsomerSchemaFromJekyllResponse } from "./types";

interface HomepageMigrationParams {
  content: string;
  site: string;
  domain?: string;
}

// Icon mapping helper
const ICON_MAP: Record<string, string> = {
  citizens: "users",
  residents: "users",
  people: "users",
  businesses: "bar-chart",
  business: "bar-chart",
  vendors: "office-building",
  partners: "office-building",
  government: "globe",
  agencies: "globe",
  programmes: "bar-chart",
  services: "bar-chart",
  district: "globe",
  location: "globe",
  arts: "stars",
  culture: "stars",
  data: "line-chart",
  analytics: "line-chart",
  statistics: "line-chart",
};

const mapIcon = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lowerTitle.includes(key)) {
      return icon;
    }
  }
  return "globe"; // default
};

const enhanceButtonLabel = (
  original: string | undefined,
  description?: string,
  title?: string
): string => {
  const genericLabels = [
    "Find out more",
    "Learn more",
    "Click here",
    "Read more",
  ];
  if (original && !genericLabels.includes(original)) {
    return original;
  }

  // Generate descriptive label from description or title
  const source = description || title || "";
  const words = source.toLowerCase().split(" ");
  if (words.includes("apply") || words.includes("application")) {
    return "Apply now";
  }
  if (words.includes("explore") || words.includes("discover")) {
    return "Explore more";
  }
  if (words.includes("learn") || words.includes("find")) {
    return "Learn more";
  }
  if (words.includes("contact") || words.includes("reach")) {
    return "Contact us";
  }
  if (words.includes("voucher") || words.includes("vouchers")) {
    return "Check voucher eligibility";
  }
  if (words.includes("district")) {
    return "Find your district";
  }

  return "Find out more";
};

const enhanceDescription = (original: string | undefined): string => {
  if (!original || original.length > 100) {
    return original || "";
  }

  // Add context for very short descriptions
  const enhanced: Record<string, string> = {
    "Find out more": "Discover more about this programme",
    "Learn more": "Learn more about this initiative",
    "How to apply": "Find out how to apply for this programme",
    "Locate your district here":
      "Find out which CDC district you belong to and access district-specific services and programmes.",
  };

  return enhanced[original] || original;
};

/**
 * Strip HTML tags from text and convert common HTML entities to plain text.
 * This ensures text fields contain only plain text as required by the schema.
 */
const stripHtml = (text: string | undefined): string | undefined => {
  if (!text) {
    return text;
  }

  // Replace <br> and <br/> with newlines, then spaces
  let cleaned = text.replace(/<br\s*\/?>/gi, " ");

  // Replace <a href="...">text</a> with "text (url)"
  cleaned = cleaned.replace(
    /<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
    (match, url, linkText) => {
      const trimmedText = linkText.trim();
      return trimmedText ? `${trimmedText} (${url})` : url;
    }
  );

  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned || undefined;
};

/**
 * Normalize URL to ensure it matches Isomer Next schema requirements.
 * Internal links must start with '/' to match LINK_HREF_PATTERN.
 * External URLs (https://, tel:, mailto:, etc.) are left as-is.
 */
const normalizeUrl = (url: string | undefined): string | undefined => {
  if (!url) {
    return url;
  }

  // External URLs, phone, email, resource references are already valid
  if (/^(https?:\/\/|tel:|sms:|mailto:|\[resource:)/.test(url)) {
    return url;
  }

  // Internal links must start with '/'
  if (!url.startsWith("/")) {
    return "/" + url;
  }

  return url;
};

interface HeroSection {
  title?: string;
  subtitle?: string;
  background?: string;
  button?: string;
  url?: string;
  dropdown?: any;
  key_highlights?: {
    title: string;
    description: string;
    url: string;
  }[];
  variant?: string;
  size?: string;
  alignment?: string;
}

const convertHero = (heroSection: HeroSection, firstInfobar?: any): any => {
  const reviewItems: string[] = [];
  const hero: any = {
    type: "hero",
    title: stripHtml(heroSection.title) || heroSection.title || "Home",
    variant: "gradient", // default
  };

  // Map variant if provided
  if (heroSection.variant) {
    const variantMap: Record<string, string> = {
      center: "gradient",
      block: "block",
      large: "largeImage",
      floating: "floating",
    };
    hero.variant = variantMap[heroSection.variant] || "gradient";
  }

  if (heroSection.background) {
    hero.backgroundUrl = heroSection.background;
  }

  if (heroSection.url) {
    hero.buttonUrl = normalizeUrl(heroSection.url);
    hero.buttonLabel = enhanceButtonLabel(
      heroSection.button,
      heroSection.subtitle
    );
  }

  // Add subtitle from first infobar if available
  if (firstInfobar?.description) {
    hero.subtitle = stripHtml(firstInfobar.description)?.substring(0, 300);
  } else if (heroSection.subtitle) {
    hero.subtitle = stripHtml(heroSection.subtitle)?.substring(0, 300);
  }

  // Flag dropdown removal
  if (heroSection.dropdown) {
    reviewItems.push("Hero dropdown was removed - requires manual review");
  }

  return { hero, reviewItems };
};

const convertKeyHighlights = (
  keyHighlights: {
    title: string;
    description: string;
    url: string;
  }[],
  siteTitle?: string
): any => {
  if (
    !keyHighlights ||
    !Array.isArray(keyHighlights) ||
    keyHighlights.length === 0
  ) {
    return null;
  }

  return {
    type: "infocols",
    title: siteTitle || "Organization Name", // Should be customized based on site
    subtitle: "Serving our community", // Default, can be enhanced
    infoBoxes: keyHighlights.map((highlight) => ({
      icon: mapIcon(highlight.title),
      title: highlight.title,
      description: stripHtml(
        enhanceDescription(highlight.description) || highlight.description
      ),
      buttonUrl: normalizeUrl(highlight.url),
      buttonLabel: enhanceButtonLabel(
        undefined,
        highlight.description,
        highlight.title
      ),
    })),
  };
};

interface InfopicSection {
  title: string;
  subtitle?: string;
  description?: string;
  button?: string;
  url?: string;
  image?: string;
  alt?: string;
}

const convertInfopic = async (
  infopicSection: InfopicSection,
  site: string,
  domain?: string
): Promise<{ infopic: any; reviewItems: string[] }> => {
  const reviewItems: string[] = [];
  const infopic: any = {
    type: "infopic",
    title: stripHtml(infopicSection.title) || infopicSection.title,
    variant: "block",
  };

  if (infopicSection.description) {
    infopic.description = stripHtml(
      enhanceDescription(infopicSection.description) ||
        infopicSection.description
    );
  }

  if (infopicSection.url) {
    infopic.buttonUrl = normalizeUrl(infopicSection.url);
    infopic.buttonLabel = enhanceButtonLabel(
      infopicSection.button,
      infopicSection.description,
      infopicSection.title
    );
  }

  if (infopicSection.image) {
    infopic.imageSrc = infopicSection.image;

    // Generate alt text if missing or enhance existing
    if (infopicSection.alt) {
      infopic.imageAlt = infopicSection.alt.substring(0, 120);
    } else {
      const fullSrc = infopicSection.image.startsWith("http")
        ? infopicSection.image
        : domain
          ? `${domain}${infopicSection.image}`
          : `https://raw.githubusercontent.com/isomerpages/${site}/master${infopicSection.image}`;
      const generatedAltText = await generateImageAltText(fullSrc);
      infopic.imageAlt = generatedAltText || `${infopicSection.title} image`;
      reviewItems.push("AI-generated alt text was used for infopic image");
    }
  } else {
    infopic.imageAlt = `${infopicSection.title} image`;
  }

  // Flag subtitle removal
  if (infopicSection.subtitle) {
    reviewItems.push("Infopic subtitle was removed - requires manual review");
  }

  return { infopic, reviewItems };
};

interface InfobarSection {
  title: string;
  subtitle?: string;
  description?: string;
  button?: string;
  url?: string;
  id?: string;
}

const convertInfobars = (
  infobarSections: InfobarSection[]
): { components: any[]; reviewItems: string[] } => {
  const reviewItems: string[] = [];

  if (!infobarSections || infobarSections.length === 0) {
    return { components: [], reviewItems: [] };
  }

  // If multiple infobars, convert to infocards
  if (infobarSections.length >= 2) {
    infobarSections.forEach((infobar) => {
      if (infobar.subtitle) {
        reviewItems.push(
          "Infobar subtitle was removed - requires manual review"
        );
      }
    });

    const cards = infobarSections
      .map((infobar) => {
        const card: any = {
          title: stripHtml(infobar.title) || infobar.title,
          description:
            stripHtml(
              enhanceDescription(infobar.description) ||
                infobar.description ||
                ""
            ) || "",
        };
        // Only include url if it's not empty after normalization
        const normalizedUrl = normalizeUrl(infobar.url);
        if (normalizedUrl && normalizedUrl.trim() !== "") {
          card.url = normalizedUrl;
        }
        return card;
      })
      .filter((card) => card.title); // Ensure valid cards

    // Schema requires at least 1 card (minItems: 1)
    // If no valid cards, add a placeholder card
    const finalCards =
      cards.length === 0
        ? [
            {
              title: "Placeholder",
              description: "",
            },
          ]
        : cards;

    if (cards.length === 0) {
      reviewItems.push(
        "Infobars section had no valid cards - placeholder card added"
      );
    }

    return {
      components: [
        {
          type: "infocards",
          title: "Who we are", // Thematic title
          subtitle: "Learn about our key initiatives",
          variant: "cardsWithoutImages",
          maxColumns: "3",
          cards: finalCards,
        },
      ],
      reviewItems,
    };
  }

  // Single infobar - keep as infobar
  const infobar = infobarSections[0]!;
  if (infobar.subtitle) {
    reviewItems.push("Infobar subtitle was removed - requires manual review");
  }

  const component: any = {
    type: "infobar",
    title: stripHtml(infobar.title) || infobar.title,
    buttonLabel: enhanceButtonLabel(
      infobar.button,
      infobar.description,
      infobar.title
    ),
    buttonUrl: normalizeUrl(infobar.url),
  };

  if (infobar.description) {
    component.description = stripHtml(infobar.description);
  }

  if (infobar.id) {
    component.id = infobar.id;
  }

  return { components: [component], reviewItems };
};

interface ResourcesSection {
  title?: string;
  subtitle?: string;
  button?: string;
}

const convertResources = (
  resourcesSection: ResourcesSection
): { component: any; reviewItems: string[] } => {
  const reviewItems: string[] = [];
  reviewItems.push("Collection reference link requires manual lookup");

  return {
    component: {
      type: "collectionblock",
      buttonLabel:
        enhanceButtonLabel(
          resourcesSection.button,
          resourcesSection.subtitle
        ) || "Explore more",
      customDescription: resourcesSection.subtitle || "",
      displayCategory: true,
      displayThumbnail: true,
      collectionReferenceLink: "[resource:ID:ID]", // Requires manual lookup
      ...(resourcesSection.title && { customTitle: resourcesSection.title }),
    },
    reviewItems,
  };
};

interface TextcardsSection {
  title?: string;
  subtitle?: string;
  description?: string;
  cards?: {
    title: string;
    description?: string;
    linktext?: string;
    url: string;
    image?: string;
    alt?: string;
  }[];
}

const convertTextcards = (
  textcardsSection: TextcardsSection
): { component: any; reviewItems: string[] } => {
  const reviewItems: string[] = [];

  if (textcardsSection.subtitle) {
    reviewItems.push("Textcards subtitle was removed - requires manual review");
  }

  const hasImages = textcardsSection.cards?.some((card) => card.image);

  const component: any = {
    type: "infocards",
    title: textcardsSection.title || "Quick Links",
    variant: hasImages ? "cardsWithImages" : "cardsWithoutImages",
    maxColumns: "3",
    cards: (textcardsSection.cards || [])
      .map((card) => {
        if (card.linktext) {
          reviewItems.push("Link text was removed - requires manual review");
        }

        const cardObj: any = {
          title: stripHtml(card.title) || card.title,
          description: stripHtml(card.description)?.substring(0, 150) || "",
        };

        // Only include url if it's not empty after normalization
        const normalizedUrl = normalizeUrl(card.url);
        if (normalizedUrl && normalizedUrl.trim() !== "") {
          cardObj.url = normalizedUrl;
        }

        if (card.image) {
          cardObj.imageUrl = card.image;
          cardObj.imageAlt = card.alt || `${card.title} image`;
          cardObj.imageFit = "cover";
        }

        return cardObj;
      })
      .filter((card) => card.title), // Ensure valid cards
  };

  if (textcardsSection.description) {
    component.subtitle = stripHtml(textcardsSection.description);
  }

  // Schema requires at least 1 card (minItems: 1)
  // If no valid cards, add a placeholder card
  if (component.cards.length === 0) {
    reviewItems.push(
      "Textcards section had no valid cards - placeholder card added"
    );
    component.cards = [
      {
        title: "Placeholder",
        description: "",
      },
    ];
  }

  return { component, reviewItems };
};

interface AnnouncementsSection {
  title?: string;
  subtitle?: string;
  announcements?: {
    title: string;
    date?: string;
    announcement: string;
    linktext?: string;
    url: string;
  }[];
}

const convertAnnouncements = (
  announcementsSection: AnnouncementsSection
): { component: any; reviewItems: string[] } => {
  const reviewItems: string[] = [];

  if (announcementsSection.subtitle) {
    reviewItems.push("Subtitle used as Description");
  }

  const hasDates = announcementsSection.announcements?.some((ann) => ann.date);
  if (hasDates) {
    reviewItems.push("Announcement date was removed - requires manual review");
  }

  const hasLinkText = announcementsSection.announcements?.some(
    (ann) => ann.linktext
  );
  if (hasLinkText) {
    reviewItems.push("Link text was removed");
  }

  const cards = (announcementsSection.announcements || [])
    .map((ann) => {
      const card: any = {
        title: stripHtml(ann.title) || ann.title,
        description: stripHtml(ann.announcement) || ann.announcement,
      };
      // Only include url if it's not empty after normalization
      const normalizedUrl = normalizeUrl(ann.url);
      if (normalizedUrl && normalizedUrl.trim() !== "") {
        card.url = normalizedUrl;
      }
      return card;
    })
    .filter((card) => card.title); // Ensure valid cards

  // Schema requires at least 1 card (minItems: 1)
  // If no valid cards, add a placeholder card
  const finalCards =
    cards.length === 0
      ? [
          {
            title: "Placeholder",
            description: "",
          },
        ]
      : cards;

  if (cards.length === 0) {
    reviewItems.push(
      "Announcements section had no valid cards - placeholder card added"
    );
  }

  return {
    component: {
      type: "infocards",
      title:
        stripHtml(announcementsSection.title) ||
        announcementsSection.title ||
        "Announcements",
      ...(announcementsSection.subtitle && {
        subtitle: stripHtml(announcementsSection.subtitle),
      }),
      variant: "cardsWithoutImages",
      maxColumns: "3",
      cards: finalCards,
    },
    reviewItems,
  };
};

interface InfocolumnsSection {
  title?: string;
  subtitle?: string;
  linktext?: string;
  url?: string;
  columns?: {
    title: string;
    description?: string;
  }[];
}

const convertInfocolumns = (
  infocolumnsSection: InfocolumnsSection
): { component: any; reviewItems: string[] } => {
  const reviewItems: string[] = [];

  if (infocolumnsSection.subtitle) {
    reviewItems.push(
      "Infocolumns subtitle was removed - requires manual review"
    );
  }
  if (infocolumnsSection.linktext || infocolumnsSection.url) {
    reviewItems.push("Infocolumns link was removed - requires manual review");
  }

  return {
    component: {
      type: "infocols",
      title:
        stripHtml(infocolumnsSection.title) ||
        infocolumnsSection.title ||
        "Information",
      infoBoxes: (infocolumnsSection.columns || []).map((col) => ({
        title: stripHtml(col.title) || col.title,
        description: stripHtml(col.description) || col.description || "",
        icon: mapIcon(col.title),
      })),
    },
    reviewItems,
  };
};

export const migrateHomepage = async ({
  content,
  site,
  domain,
}: HomepageMigrationParams): Promise<GetIsomerSchemaFromJekyllResponse> => {
  const reviewItems: string[] = [];

  // Parse frontmatter
  let frontmatter: any = {};
  try {
    frontmatter = fm(content).attributes as any;
  } catch (e) {
    // Handle case where frontmatter has duplicate keys
    const frontmatterMatch = /---([\s\S]*?)---/.exec(content);
    if (frontmatterMatch) {
      const frontmatterContent = frontmatterMatch[1]!;
      frontmatterContent.split("\n").forEach((line) => {
        const [key, ...rest] = line.split(":");
        if (key && rest.length > 0) {
          const value = rest
            .join(":")
            .trim()
            .replace(/^["']|["']$/g, "");
          frontmatter[key.trim()] = value;
        }
      });
    }
  }

  // Check if this is a homepage
  if (frontmatter.layout !== "homepage") {
    return {
      status: "not_converted",
      title: frontmatter.title || "Page",
      permalink: frontmatter.permalink || "/",
    };
  }

  // Handle notification banner
  if (frontmatter.notification) {
    reviewItems.push(
      "Notification banner requires manual configuration in Next"
    );
  }

  const sections = frontmatter.sections || [];
  const contentArray: any[] = [];

  // Extract sections by type
  const heroSection = sections.find((s: any) => s.hero)?.hero as
    | HeroSection
    | undefined;
  const infopicSections = sections
    .filter((s: any) => s.infopic)
    .map((s: any) => s.infopic) as InfopicSection[];
  const infobarSections = sections
    .filter((s: any) => s.infobar)
    .map((s: any) => s.infobar) as InfobarSection[];
  const resourcesSection = sections.find((s: any) => s.resources)?.resources as
    | ResourcesSection
    | undefined;
  const textcardsSection = sections.find((s: any) => s.textcards)?.textcards as
    | TextcardsSection
    | undefined;
  const announcementsSection = sections.find((s: any) => s.announcements)
    ?.announcements as AnnouncementsSection | undefined;
  const infocolumnsSection =
    sections.find((s: any) => s.infocolumns || s["info-columns"])
      ?.infocolumns ||
    (sections.find((s: any) => s["info-columns"])?.["info-columns"] as
      | InfocolumnsSection
      | undefined);

  // Convert Hero + InfoCols
  if (heroSection) {
    const firstInfobar = infobarSections[0];
    const { hero, reviewItems: heroReviewItems } = convertHero(
      heroSection,
      firstInfobar
    );
    reviewItems.push(...heroReviewItems);
    contentArray.push(hero);

    // Convert key highlights to InfoCols
    if (heroSection.key_highlights) {
      const infocols = convertKeyHighlights(
        heroSection.key_highlights,
        frontmatter.title
      );
      if (infocols) {
        contentArray.push(infocols);
      }
    }
  }

  // Convert Infopics
  for (const infopicSection of infopicSections) {
    const { infopic, reviewItems: infopicReviewItems } = await convertInfopic(
      infopicSection,
      site,
      domain
    );
    reviewItems.push(...infopicReviewItems);
    contentArray.push(infopic);
  }

  // Convert Infobars (skip first if used in hero subtitle)
  const infobarsToProcess =
    heroSection && infobarSections.length > 0
      ? infobarSections.slice(1)
      : infobarSections;

  if (infobarsToProcess.length > 0) {
    const { components, reviewItems: infobarReviewItems } =
      convertInfobars(infobarsToProcess);
    reviewItems.push(...infobarReviewItems);
    contentArray.push(...components);
  }

  // Convert Resources
  if (resourcesSection) {
    const { component, reviewItems: resourcesReviewItems } =
      convertResources(resourcesSection);
    reviewItems.push(...resourcesReviewItems);
    contentArray.push(component);
  }

  // Convert Announcements
  if (announcementsSection) {
    const { component, reviewItems: announcementsReviewItems } =
      convertAnnouncements(announcementsSection);
    reviewItems.push(...announcementsReviewItems);
    contentArray.push(component);
  }

  // Convert Textcards
  if (textcardsSection) {
    const { component, reviewItems: textcardsReviewItems } =
      convertTextcards(textcardsSection);
    reviewItems.push(...textcardsReviewItems);
    contentArray.push(component);
  }

  // Convert Infocolumns
  if (infocolumnsSection) {
    const { component, reviewItems: infocolumnsReviewItems } =
      convertInfocolumns(infocolumnsSection);
    reviewItems.push(...infocolumnsReviewItems);
    contentArray.push(component);
  }

  // All components should be valid now (placeholders added instead of null)
  const validContent = contentArray;

  // Build final JSON
  // Note: page object must be empty {} per HomePagePageSchema
  const homepageSchema = {
    meta: {
      ...(frontmatter.image && { image: frontmatter.image }),
      noIndex: false,
      ...(frontmatter.description && { description: frontmatter.description }),
    },
    page: {}, // HomePagePageSchema requires empty object
    layout: "homepage",
    content: validContent,
    version: "0.1.0",
  };

  // Validate schema
  const isValidSchema = isomerSchemaValidator(homepageSchema);
  if (!isValidSchema) {
    reviewItems.push("Homepage schema is invalid");
  }

  const status = reviewItems.length === 0 ? "converted" : "manual_review";

  return {
    status,
    title: "Home",
    permalink: frontmatter.permalink || "/",
    reviewItems: reviewItems.length > 0 ? reviewItems : undefined,
    content: homepageSchema,
  };
};
