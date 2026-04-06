interface DrawStepPanelProps {
  title: string
  help: string
  tip: string
}

function DrawStepPanel({ title, help, tip }: DrawStepPanelProps): JSX.Element {
  return (
    <div>
      <p>{help}</p>
      <p style={{ color: '#555', fontSize: '0.9rem' }}>{tip}</p>
      <h3 style={{ marginTop: '14px' }}>{title}</h3>
    </div>
  )
}

export default DrawStepPanel
