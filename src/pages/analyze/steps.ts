export type AnalyzeStep = 'draw' | 'feedback' | 'nextSteps' | 'save'
type AnalyzeStepTitleKey =
  | 'analyze.stepTitle.draw'
  | 'analyze.stepTitle.feedback'
  | 'analyze.stepTitle.nextSteps'
  | 'analyze.stepTitle.save'

export const ANALYZE_STEP_ORDER: AnalyzeStep[] = ['draw', 'feedback', 'nextSteps', 'save']

export const getAnalyzeStepTitleKey = (step: AnalyzeStep): AnalyzeStepTitleKey => {
  if (step === 'draw') return 'analyze.stepTitle.draw'
  if (step === 'feedback') return 'analyze.stepTitle.feedback'
  if (step === 'nextSteps') return 'analyze.stepTitle.nextSteps'
  return 'analyze.stepTitle.save'
}
