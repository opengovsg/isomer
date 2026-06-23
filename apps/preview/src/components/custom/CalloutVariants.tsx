// Icons
const IconSuccess = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconError = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconPencil = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

interface CalloutVariantProps {
  icon: React.ReactNode
  text: string
  borderColor: string
  bgColor: string
  color: string
}

function CalloutVariant({ icon, text, borderColor, bgColor, color }: CalloutVariantProps) {
  return (
    <div
      className="prose-headline-lg-regular rounded-lg border px-5 py-4"
      style={{
        borderColor,
        backgroundColor: bgColor,
        color,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      {icon}
      <span>{text}</span>
    </div>
  )
}

export default function CalloutVariants() {
  return (
    <div className="my-6" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CalloutVariant
        icon={<IconSuccess />}
        text="Success hints are good for showing positive actions or achievements."
        borderColor="#16a34a"
        bgColor="#dcfce7"
        color="#15803d"
      />
      <CalloutVariant
        icon={<IconWarning />}
        text="Warning hints are good for showing important information or non-critical warnings."
        borderColor="#d97706"
        bgColor="#fef3c7"
        color="#b45309"
      />
      <CalloutVariant
        icon={<IconError />}
        text="Danger hints are good for highlighting destructive actions or raising attention to critical information."
        borderColor="#dc2626"
        bgColor="#fee2e2"
        color="#b91c1c"
      />
      <CalloutVariant
        icon={<IconPencil />}
        text="This is a custom callout block with a pencil icon."
        borderColor="#d1d5db"
        bgColor="#f9fafb"
        color="#374151"
      />
    </div>
  )
}
