/**
 * Content layout variant: full-bleed cover image at top, then plain text header
 * (no coloured background block). Injected via portal — replaces the
 * ContentPageHeader section in the DOM.
 */
export default function ContentLayoutAlt({
  title,
  summary,
}: {
  title: string
  summary: string
}) {
  return (
    <>
      <style>{`
        .cla-cover {
          width: 100%;
          display: block;
          height: 380px;
          object-fit: cover;
        }
        .cla-header {
          max-width: 1280px;
          margin: 0 auto;
          padding: 52px 48px 40px;
        }
        .cla-title {
          font-size: 40px;
          font-weight: 800;
          line-height: 1.2;
          color: #111827;
          margin-bottom: 16px;
          font-family: var(--font-heading, var(--font-body, inherit));
        }
        .cla-summary {
          font-size: 18px;
          color: #6b7280;
          line-height: 1.7;
          max-width: 640px;
          font-family: var(--font-body, inherit);
        }
        .cla-divider {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          margin: 0 48px;
          max-width: calc(1280px - 96px);
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>

      {/* Full-bleed cover image */}
      <img
        className="cla-cover"
        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2070&auto=format&fit=crop"
        alt="Cover"
      />

      {/* Plain text header */}
      <div className="cla-header">
        <h1 className="cla-title">{title}</h1>
        <p className="cla-summary">{summary}</p>
      </div>

      <hr className="cla-divider" />
    </>
  )
}
