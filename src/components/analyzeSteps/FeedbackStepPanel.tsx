import FeedbackPanel from '../FeedbackPanel.tsx'
import { Skill } from '../../utils/skills.ts'

interface FeedbackStepPanelProps {
  skill: Skill | undefined
  initialFeedback: string[]
  initialNextSteps: string[]
  onFeedbackChange: (feedback: string[]) => void
  onNextStepsChange: (nextSteps: string[]) => void
}

function FeedbackStepPanel({
  skill,
  initialFeedback,
  initialNextSteps,
  onFeedbackChange,
  onNextStepsChange,
}: FeedbackStepPanelProps): JSX.Element {
  return (
    <FeedbackPanel
      skill={skill}
      mode="feedback"
      initialFeedback={initialFeedback}
      initialNextSteps={initialNextSteps}
      onFeedbackChange={onFeedbackChange}
      onNextStepsChange={onNextStepsChange}
    />
  )
}

export default FeedbackStepPanel
