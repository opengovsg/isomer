import fs from "fs";
import path from "path";
import fm from "front-matter";

interface ContactUsLocation {
  title?: string;
  address: string[];
  operating_hours?: Array<{
    days?: string;
    time?: string;
    description?: string;
  }>;
  maps_link?: string;
}

interface ContactUsContact {
  title: string;
  content: Array<{
    phone?: string;
    email?: string;
    other?: string; // HTML string
  }>;
}

interface ContactUsFrontmatter {
  layout: string;
  title: string;
  permalink: string;
  agency_name?: string;
  locations?: ContactUsLocation[];
  contacts?: ContactUsContact[];
}

// Valid Google Maps embed URL pattern
const MAPS_EMBED_URL_PATTERN =
  /^https:\/\/www\.google\.com\/maps(?:\/d)?\/embed.*$/;

const isValidMapEmbedUrl = (url: string): boolean => {
  if (!url || url.trim() === "") {
    return false;
  }
  return MAPS_EMBED_URL_PATTERN.test(url);
};

// Extract links from HTML string (e.g., <a href="...">text</a>)
const extractLinksFromHtml = (html: string): Array<{ href: string; text: string }> => {
  const links: Array<{ href: string; text: string }> = [];
  const linkRegex = /<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    links.push({
      href: match[1] || "",
      text: match[2]?.replace(/<[^>]+>/g, "") || "", // Remove HTML tags from text
    });
  }

  return links;
};

// Create a text node
const createTextNode = (text: string, marks: any[] = []): any => {
  return {
    type: "text",
    text,
    marks,
  };
};

// Create a link mark
const createLinkMark = (href: string, target: string = "_self"): any => {
  return {
    type: "link",
    attrs: {
      href,
      target,
    },
  };
};

// Create a paragraph node
const createParagraphNode = (content: any[], dir: string = "ltr"): any => {
  return {
    type: "paragraph",
    ...(dir && { attrs: { dir } }),
    content,
  };
};

// Create a heading node
const createHeadingNode = (level: number, text: string, dir: string = "ltr"): any => {
  return {
    type: "heading",
    attrs: {
      dir,
      level,
    },
    content: [createTextNode(text)],
  };
};

// Create a hard break node
const createHardBreakNode = (): any => {
  return {
    type: "hardBreak",
    marks: [],
  };
};

// Convert address array to paragraph content
const addressToParagraphContent = (address: string[]): any[] => {
  const content: any[] = [];
  address.forEach((line, index) => {
    if (index > 0) {
      content.push(createHardBreakNode());
    }
    content.push(createTextNode(line));
  });
  return content;
};

// Convert operating hours to paragraph content
const operatingHoursToParagraphContent = (
  operatingHours: ContactUsLocation["operating_hours"]
): any[] => {
  if (!operatingHours || operatingHours.length === 0) {
    return [];
  }

  const content: any[] = [];
  operatingHours.forEach((oh, index) => {
    if (index > 0) {
      content.push(createHardBreakNode());
    }
    
    // Add days and time on first line
    if (oh.days && oh.time) {
      content.push(createTextNode(`${oh.days}: ${oh.time}`));
    } else if (oh.days) {
      content.push(createTextNode(oh.days));
    } else if (oh.time) {
      content.push(createTextNode(oh.time));
    }
    
    // Add description on next line if present
    if (oh.description) {
      if (content.length > 0 && content[content.length - 1]?.type === "text") {
        content.push(createHardBreakNode());
      }
      content.push(createTextNode(oh.description));
    }
  });

  return content;
};

// Convert contact content to paragraph nodes
const contactContentToParagraphs = (
  contactContent: ContactUsContact["content"]
): any[] => {
  const paragraphs: any[] = [];

  contactContent.forEach((item) => {
    if (item.email) {
      const emailContent: any[] = [
        createTextNode("Email: "),
        createTextNode(item.email, [createLinkMark(`mailto:${item.email}`)]),
      ];
      paragraphs.push(createParagraphNode(emailContent));
    }

    if (item.phone) {
      const phoneContent: any[] = [
        createTextNode("Phone: "),
        createTextNode(item.phone, [createLinkMark(`tel:${item.phone}`)]),
      ];
      paragraphs.push(createParagraphNode(phoneContent));
    }

    if (item.other) {
      const links = extractLinksFromHtml(item.other);
      links.forEach((link) => {
        const linkContent: any[] = [
          createTextNode(link.text, [createLinkMark(link.href)]),
        ];
        paragraphs.push(createParagraphNode(linkContent));
      });
    }
  });

  return paragraphs;
};

// Convert contact us markdown to JSON schema
export const migrateContactUsPage = (
  markdownContent: string,
  lastModified?: string
): { content: any; reviewItems: string[] } => {
  const { attributes, body } = fm<ContactUsFrontmatter>(markdownContent);
  const frontmatter = attributes;
  const reviewItems: string[] = [];

  if (frontmatter.layout !== "contact_us") {
    throw new Error("This is not a contact_us layout page");
  }

  const content: any[] = [];
  let currentProseContent: any[] = [];

  // Process locations
  if (frontmatter.locations && frontmatter.locations.length > 0) {
    frontmatter.locations.forEach((location, locationIndex) => {
      // Add heading for location
      const locationTitle = location.title || `Location ${locationIndex + 1}`;
      currentProseContent.push(createHeadingNode(2, locationTitle));

      // Add address paragraph
      if (location.address && location.address.length > 0) {
        const addressContent = addressToParagraphContent(location.address);
        currentProseContent.push(createParagraphNode(addressContent));
      }

      // Add operating hours paragraph if available
      if (location.operating_hours && location.operating_hours.length > 0) {
        const ohContent = operatingHoursToParagraphContent(location.operating_hours);
        if (ohContent.length > 0) {
          currentProseContent.push(createParagraphNode(ohContent));
        }
      }

      // Check if we need to add a map block
      // Only add if it's a valid embed URL
      if (location.maps_link) {
        if (isValidMapEmbedUrl(location.maps_link)) {
          // Close current prose block if it has content
          if (currentProseContent.length > 0) {
            content.push({
              type: "prose",
              content: currentProseContent,
            });
            currentProseContent = [];
          }

          // Add map block
          content.push({
            type: "map",
            url: location.maps_link,
            title: locationTitle,
          });
        } else {
          // Invalid map URL - track as review item
          reviewItems.push(
            `Map URL for "${locationTitle}" is not a valid embed URL and was removed: ${location.maps_link}`
          );
        }
      }
    });
  }

  // Process contacts
  if (frontmatter.contacts && frontmatter.contacts.length > 0) {
    frontmatter.contacts.forEach((contact) => {
      // Add heading for contact section
      currentProseContent.push(createHeadingNode(2, contact.title));

      // Add contact content paragraphs
      const contactParagraphs = contactContentToParagraphs(contact.content);
      currentProseContent.push(...contactParagraphs);
    });
  }

  // Close any remaining prose content
  if (currentProseContent.length > 0) {
    content.push({
      type: "prose",
      content: currentProseContent,
    });
  }

  // Generate summary for contentPageHeader
  const summary = frontmatter.agency_name
    ? `Get in touch with ${frontmatter.agency_name}.`
    : "Get in touch with us.";

  return {
    content: {
      page: {
        title: frontmatter.title || "Contact Us",
        permalink: frontmatter.permalink || "/contact-us/",
        lastModified: lastModified || new Date().toISOString(),
        contentPageHeader: {
          summary,
          showThumbnail: false,
        },
      },
      layout: "content",
      content,
      version: "0.1.0",
    },
    reviewItems,
  };
};

// Main execution function
const main = async () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: tsx contact.ts <input-file> [output-file]");
    console.error("Example: tsx contact.ts contact-us.md contact-us.json");
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.md$/, ".json");

  try {
    // Read input file
    const markdownContent = fs.readFileSync(inputFile, "utf-8");

    // Migrate to JSON
    const migrationResult = migrateContactUsPage(markdownContent);
    const jsonContent = migrationResult.content;

    // Write output file
    fs.writeFileSync(outputFile, JSON.stringify(jsonContent, null, 2));

    if (migrationResult.reviewItems.length > 0) {
      console.log(`⚠️  Migrated ${inputFile} to ${outputFile} (requires manual review)`);
      console.log("Review items:");
      migrationResult.reviewItems.forEach((item) => {
        console.log(`  - ${item}`);
      });
    } else {
      console.log(`✅ Successfully migrated ${inputFile} to ${outputFile}`);
    }
  } catch (error) {
    console.error(`❌ Error migrating ${inputFile}:`, error);
    process.exit(1);
  }
};

// Run if executed directly
main();
