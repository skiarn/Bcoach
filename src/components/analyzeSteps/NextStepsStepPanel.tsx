import FeedbackPanel from '../FeedbackPanel.tsx'
import SkillPicker from '../SkillPicker.tsx'
import { Skill } from '../../utils/skills.ts'

interface NextStepsStepPanelProps {
  skill: Skill | undefined
  skillLabel: string
  selectedSkillType: string
  selectedSkillName: string
  initialFeedback: string[]
  initialNextSteps: string[]
  onSkillTypeChange: (skillType: string) => void
  onSkillNameChange: (skillName: string) => void
  onFeedbackChange: (feedback: string[]) => void
  onNextStepsChange: (nextSteps: string[]) => void
}

function NextStepsStepPanel({
  skill,
  skillLabel,
  selectedSkillType,
  selectedSkillName,
  initialFeedback,
  initialNextSteps,
  onSkillTypeChange,
  onSkillNameChange,
  onFeedbackChange,
  onNextStepsChange,
}: NextStepsStepPanelProps): JSX.Element {
  return (
    <div>
      {!skill && (
        <SkillPicker
          label={skillLabel}
          selectedSkillType={selectedSkillType}
          selectedSkillName={selectedSkillName}
          onSkillTypeChange={onSkillTypeChange}
          onSkillNameChange={onSkillNameChange}
          allowDeselect={true}
          className="home-skill-picker"
        />
      )}

      <FeedbackPanel
        skill={skill}
        mode="nextSteps"
        initialFeedback={initialFeedback}
        initialNextSteps={initialNextSteps}
        onFeedbackChange={onFeedbackChange}
        onNextStepsChange={onNextStepsChange}
      />
    </div>
  )
}

export default NextStepsStepPanel
