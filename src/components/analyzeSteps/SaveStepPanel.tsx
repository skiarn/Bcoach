interface SaveStepPanelProps {
  isSaved: boolean
  saveError: string | null
  feedbackCountLabel: string
  nextStepsCountLabel: string
  readyLabel: string
  helpLabel: string
  savedTitleLabel: string
  savedBodyLabel: string
  savedCtaLabel: string
  onNavigateHome: () => void
}

function SaveStepPanel({
  isSaved,
  saveError,
  feedbackCountLabel,
  nextStepsCountLabel,
  readyLabel,
  helpLabel,
  savedTitleLabel,
  savedBodyLabel,
  savedCtaLabel,
  onNavigateHome,
}: SaveStepPanelProps): JSX.Element {
  if (isSaved) {
    return (
      <div className="analysis-saved-panel">
        <h4>{savedTitleLabel}</h4>
        <p>{savedBodyLabel}</p>
        <div className="analysis-saved-actions">
          <button type="button" onClick={onNavigateHome}>
            {savedCtaLabel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <p>{readyLabel}</p>
      <ul style={{ margin: '10px 0 0 18px' }}>
        <li>{feedbackCountLabel}</li>
        <li>{nextStepsCountLabel}</li>
      </ul>
      <p style={{ marginTop: '10px', color: '#555' }}>{helpLabel}</p>
      {saveError && (
        <p style={{ marginTop: '8px', color: '#c62828' }}>
          {saveError}
        </p>
      )}
    </>
  )
}

export default SaveStepPanel
