import type { ArticlePageSchemaType } from "@opengovsg/isomer-components"
import { renderLayout } from "@opengovsg/isomer-components/templates/next"

interface Props {
  data: ArticlePageSchemaType
}

/**
 * Article layout variant: title left / summary right, then full-bleed image below.
 * Injected via portal — replaces the ArticlePageHeader section in the DOM.
 */
export default function ArticleLayoutAlt({ data }: Props) {
  const { title, date, articlePageHeader } = data.page
  const summary = articlePageHeader?.summary

  // Extract the first image block (used as full-bleed cover)
  const firstBlock = data.content[0]
  const coverImage =
    firstBlock?.type === "image"
      ? { src: firstBlock.src, alt: firstBlock.alt ?? "" }
      : null

  // Format date nicely
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <>
      <style>{`
        .ala-wrap {
          padding: 64px 0 0;
        }
        .ala-header {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 48px;
        }
        .ala-meta {
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
          letter-spacing: 0.02em;
          margin-bottom: 28px;
        }
        .ala-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
          padding-bottom: 48px;
        }
        @media (max-width: 768px) {
          .ala-split { grid-template-columns: 1fr; gap: 24px; }
          .ala-header { padding: 0 24px; }
        }
        .ala-title {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.15;
          color: #111827;
          font-family: var(--font-heading, var(--font-body, inherit));
        }
        .ala-summary {
          font-size: 18px;
          color: #6b7280;
          line-height: 1.75;
          padding-top: 8px;
          font-family: var(--font-body, inherit);
        }
        .ala-cover {
          width: 100%;
          display: block;
          max-height: 520px;
          object-fit: cover;
        }
      `}</style>

      <div className="ala-wrap">
        <div className="ala-header">
          {formattedDate && (
            <p className="ala-meta">Crafted · {formattedDate}</p>
          )}
          <div className="ala-split">
            <h1 className="ala-title">{title}</h1>
            {summary && <p className="ala-summary">{summary}</p>}
          </div>
        </div>

        {coverImage && (
          <img
            className="ala-cover"
            src={coverImage.src}
            alt={coverImage.alt}
          />
        )}
      </div>
    </>
  )
}
