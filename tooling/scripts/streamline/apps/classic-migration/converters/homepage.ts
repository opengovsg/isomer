import fm from "front-matter";
import { generateImageAltText } from "../ai";
import { isomerSchemaValidator } from "../schema";
import type { GetIsomerSchemaFromJekyllResponse } from "../types";

interface HomepageMigrationParams {
  content: string;
  site: string;
  domain?: string;
  useStagingBranch?: boolean;
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
 * External URLs must use https:// (not http://).
 * Other protocols (tel:, mailto:, etc.) are left as-is.
 */
const normalizeUrl = (url: string | undefined): string | undefined => {
  if (!url) {
    return url;
  }

  // Convert HTTP to HTTPS for external URLs
  if (url.startsWith("http://")) {
    return url.replace(/^http:\/\//, "https://");
  }

  // External URLs, phone, email, resource references are already valid
  if (/^(https:\/\/|tel:|sms:|mailto:|\[resource:)/.test(url)) {
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
    reviewItems.push("Hero dropdown was removed");
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
    title: siteTitle || "This is the title of the InfoCols block", // Should be customized based on site
    subtitle: "", // Default, can be enhanced
    infoBoxes: keyHighlights.map((highlight) => ({
      icon: mapIcon(highlight.title),
      title: highlight.title,
      description:
        stripHtml(
          enhanceDescription(highlight.description) || highlight.description
        ) ?? "",
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

// Extract cards from HTML description that contains multiple paragraphs with bold titles
const extractCardsFromDescription = (
  description: string
): { title: string; description: string; url?: string }[] | null => {
  if (!description) {
    return null;
  }

  // Match paragraphs that start with bold text (e.g., <p><b>Title</b>Description</p>)
  // Also handle <BR> tags and other HTML
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
  const cards: { title: string; description: string; url?: string }[] = [];
  let match;

  while ((match = paragraphRegex.exec(description)) !== null) {
    const paragraphContent = match[1] || "";

    // Check if paragraph starts with bold text (may have <BR> or other tags after)
    const boldRegex = /^<b[^>]*>(.*?)<\/b>/i;
    const boldMatch = boldRegex.exec(paragraphContent);
    if (boldMatch) {
      const title = stripHtml(boldMatch[1]) || "";
      // Get the rest of the paragraph after the bold tag
      // Remove the bold tag and any <BR> tags, then clean up remaining HTML
      const descriptionText = paragraphContent
        .replace(/^<b[^>]*>.*?<\/b>/i, "") // Remove bold tag
        .replace(/<BR\s*\/?>/gi, " ") // Replace <BR> with space
        .replace(/<br\s*\/?>/gi, " ") // Replace <br> with space
        .replace(/<[^>]+>/g, " ") // Remove remaining HTML tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      // Skip paragraphs that are just "We welcome you..." or similar closing text
      if (
        title &&
        descriptionText &&
        !descriptionText.toLowerCase().includes("we welcome")
      ) {
        cards.push({
          title,
          description: descriptionText,
        });
      }
    }
  }

  // Also check for links at the end of the description (outside paragraphs)
  // Look for links that might be associated with the cards
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let linkMatch;
  const links: string[] = [];
  while ((linkMatch = linkRegex.exec(description)) !== null) {
    links.push(linkMatch[1] || "");
  }

  // Apply the last link URL to the last card if we have cards and links
  if (links.length > 0 && cards.length > 0) {
    const lastCard = cards[cards.length - 1];
    if (lastCard) {
      lastCard.url = normalizeUrl(links[links.length - 1] || "");
    }
  }

  // Only return cards if we found at least 2 (indicating multiple items)
  return cards.length >= 2 ? cards : null;
};

const convertInfopic = async (
  infopicSection: InfopicSection,
  site: string,
  domain?: string,
  useStagingBranch = false
): Promise<{ infopic?: any; infocards?: any; reviewItems: string[] }> => {
  const reviewItems: string[] = [];

  // Check if description contains multiple items that should be converted to infocards
  const extractedCards = infopicSection.description
    ? extractCardsFromDescription(infopicSection.description)
    : null;

  if (extractedCards) {
    // Convert to infocards instead of infopic
    reviewItems.push("Infopic with multiple items converted to infocards");

    const cards = extractedCards
      .map((card) => {
        const cardObj: any = {
          title: card.title,
          description: stripHtml(card.description)?.substring(0, 150) || "",
        };

        // Only include url if it's not empty after normalization
        if (card.url) {
          const normalizedUrl = normalizeUrl(card.url);
          if (normalizedUrl && normalizedUrl.trim() !== "") {
            cardObj.url = normalizedUrl;
          }
        } else if (infopicSection.url) {
          // Fall back to infopic URL if card doesn't have one
          const normalizedUrl = normalizeUrl(infopicSection.url);
          if (normalizedUrl && normalizedUrl.trim() !== "") {
            cardObj.url = normalizedUrl;
          }
        }

        return cardObj;
      })
      .filter((card) => card.title); // Ensure valid cards

    // Schema requires at least 1 card
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
        "Infopic section had no valid cards - placeholder card added"
      );
    }

    return {
      infocards: {
        type: "infocards",
        title:
          stripHtml(infopicSection.title) ||
          infopicSection.title ||
          "This is the title of the InfoCards block",
        variant: "cardsWithoutImages",
        maxColumns: "3",
        cards: finalCards,
      },
      reviewItems,
    };
  }

  // Default: convert to infopic
  const infopic: any = {
    type: "infopic",
    title:
      stripHtml(infopicSection.title) ||
      infopicSection.title ||
      "This is the title of the Infopic block",
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
      const altText = stripHtml(infopicSection.alt);
      // Check if alt text is generic/placeholder and use title instead
      const genericAltPattern =
        /^(image|picture|photo|logo|screenshot|graph|chart|diagram|icon|alt text|image alt text).*$/i;
      if (altText && genericAltPattern.test(altText.trim())) {
        infopic.imageAlt =
          stripHtml(infopicSection.title) || infopicSection.title;
      } else {
        infopic.imageAlt =
          altText?.substring(0, 120) || infopicSection.alt.substring(0, 120);
      }
    }

    if (
      !infopicSection.alt ||
      infopic.imageAlt === undefined ||
      infopic.imageAlt.trim().length < 5
    ) {
      const fullSrc = infopicSection.image.startsWith("http")
        ? infopicSection.image
        : domain
          ? `${domain}${infopicSection.image}`
          : `https://raw.githubusercontent.com/isomerpages/${site}/${useStagingBranch ? "staging" : "master"}${infopicSection.image}`;
      const generatedAltText = await generateImageAltText(fullSrc);
      infopic.imageAlt = generatedAltText || `${infopicSection.title} image`;
      reviewItems.push("AI-generated alt text was used for infopic image");
    }
  } else {
    infopic.imageAlt = `${infopicSection.title} image`;
  }

  // Flag subtitle removal
  if (infopicSection.subtitle) {
    reviewItems.push("Infopic subtitle was removed");
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
        reviewItems.push("Infobar subtitle was removed");
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
    reviewItems.push("Infobar subtitle was removed");
  }

  const component: any = {
    type: "infobar",
    title:
      stripHtml(infobar.title) ||
      infobar.title ||
      "This is the title of the Infobar block",
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

  const component: any = {
    type: "collectionblock",
    buttonLabel:
      enhanceButtonLabel(resourcesSection.button, resourcesSection.subtitle) ||
      "Explore more",
    displayCategory: true,
    displayThumbnail: true,
    collectionReferenceLink: "[resource:0:0]", // Requires manual lookup - placeholder needs to be replaced with actual resource ID
    ...(resourcesSection.title && {
      customTitle: stripHtml(resourcesSection.title) || resourcesSection.title,
    }),
  };

  // Only include customDescription if it has a value
  if (resourcesSection.subtitle) {
    const cleanedDescription = stripHtml(resourcesSection.subtitle);
    if (cleanedDescription && cleanedDescription.trim() !== "") {
      component.customDescription = cleanedDescription;
    }
  }

  return {
    component,
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
    reviewItems.push("Textcards subtitle was removed");
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
          reviewItems.push("Textcards with link text was removed");
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
    reviewItems.push("Announcement block subtitle used as description");
  }

  const hasDates = announcementsSection.announcements?.some((ann) => ann.date);
  if (hasDates) {
    reviewItems.push("Announcement date was removed");
  }

  const hasLinkText = announcementsSection.announcements?.some(
    (ann) => ann.linktext
  );
  if (hasLinkText) {
    reviewItems.push("Announcement block link text was removed");
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
    reviewItems.push("Infocolumns subtitle was removed");
  }
  if (infocolumnsSection.linktext || infocolumnsSection.url) {
    reviewItems.push("Infocolumns link was removed");
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
  useStagingBranch = false,
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
    const result = await convertInfopic(
      infopicSection,
      site,
      domain,
      useStagingBranch
    );
    reviewItems.push(...result.reviewItems);
    // Handle both infopic and infocards cases
    if (result.infocards) {
      contentArray.push(result.infocards);
    } else if (result.infopic) {
      contentArray.push(result.infopic);
    }
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

  if (reviewItems.length === 0) {
    return {
      status: "converted",
      title: "Home",
      permalink: frontmatter.permalink || "/",
      content: homepageSchema,
    };
  }

  return {
    status: "manual_review",
    title: "Home",
    permalink: frontmatter.permalink || "/",
    reviewItems: [...new Set(reviewItems)],
    content: homepageSchema,
  };
};
