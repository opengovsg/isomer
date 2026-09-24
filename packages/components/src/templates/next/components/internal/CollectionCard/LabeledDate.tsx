interface LabeledDateProps {
  label: string
  dateText: string
}

export const LabeledDate = ({ label, dateText }: LabeledDateProps) => {
  return (
    <div>
      <p className="prose-label-sm-regular text-base-content-subtle">{label}</p>
      <p className="prose-label-md-medium text-base-content">{dateText}</p>
    </div>
  )
}
