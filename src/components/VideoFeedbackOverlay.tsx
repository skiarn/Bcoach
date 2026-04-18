interface VideoFeedbackOverlayProps {
  visible: boolean
  startTimeLabel?: string
  nextStepsTitle: string
  feedbackItems: string[]
  nextStepItems: string[]
  emptyLabel: string
}

function VideoFeedbackOverlay({
  visible,
  startTimeLabel,
  nextStepsTitle,
  feedbackItems,
  nextStepItems,
  emptyLabel,
}: VideoFeedbackOverlayProps): JSX.Element | null {
  if (!visible) {
    return null
  }

  return (
    <div className="video-feedback-overlay" aria-live="polite">
      <div className="video-feedback-overlay__card">
        <div className="video-feedback-overlay__grid">
          <section>
            {feedbackItems.length > 0 ? (
              <ul>
                {feedbackItems.map((item, index) => (
                  <li key={`feedback-${index}-${item}`}>
                    {index === 0 && startTimeLabel ? `${startTimeLabel} ` : ''}
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{emptyLabel}</p>
            )}
          </section>

          {nextStepItems.length > 0 && (
            <section>
              <h4>{nextStepsTitle}</h4>
              <ul>
                {nextStepItems.map((item, index) => (
                  <li key={`next-${index}-${item}`}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

      </div>
    </div>
  )
}

export default VideoFeedbackOverlay
