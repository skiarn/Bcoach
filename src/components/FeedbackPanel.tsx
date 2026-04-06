import { useEffect, useMemo, useRef, useState } from 'react'
import { Skill } from '../utils/skills.ts'
import { getSportLabel } from '../utils/sports.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'

interface FeedbackPanelProps {
  skill?: Skill
  onFeedbackChange?: (feedback: string[]) => void
  onNextStepsChange?: (nextSteps: string[]) => void
  mode?: 'all' | 'feedback' | 'nextSteps'
  initialFeedback?: string[]
  initialNextSteps?: string[]
}

function CheckList({
  items,
  selected,
  onToggle,
}: {
  items: string[]
  selected: Set<number>
  onToggle: (i: number) => void
}) {
  return (
    <div className="checklist">
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          className={`checklist-item-card ${selected.has(i) ? 'checked' : ''}`}
          onClick={() => onToggle(i)}
          aria-pressed={selected.has(i)}
        >
          <span className="checklist-item-marker" aria-hidden="true">
            {selected.has(i) ? '✓' : '+'}
          </span>
          <span>{item}</span>
        </button>
      ))}
    </div>
  )
}

function FeedbackPanel({
  skill,
  onFeedbackChange,
  onNextStepsChange,
  mode = 'all',
  initialFeedback = [],
  initialNextSteps = [],
}: FeedbackPanelProps): JSX.Element {
  const { t, locale } = useI18n()
  const hydrationKeyRef = useRef('')

  const generalFeedback = useMemo(
    () => [
      t('feedback.general.1'),
      t('feedback.general.2'),
      t('feedback.general.3'),
      t('feedback.general.4'),
      t('feedback.general.5'),
      t('feedback.general.6'),
      t('feedback.general.7'),
      t('feedback.general.8'),
    ],
    [locale, t]
  )

  const feedbackItems = useMemo(
    () => (skill ? [...skill.advice, ...generalFeedback] : generalFeedback),
    [skill, generalFeedback]
  )
  const nextStepItems = useMemo(() => skill?.nextSteps ?? [], [skill])
  const showFeedbackSection = mode === 'all' || mode === 'feedback'
  const showNextStepsSection = (mode === 'all' || mode === 'nextSteps') && nextStepItems.length > 0

  const [selectedFeedback, setSelectedFeedback] = useState<Set<number>>(new Set())
  const [selectedNextSteps, setSelectedNextSteps] = useState<Set<number>>(new Set())
  const [customFeedback, setCustomFeedback] = useState('')
  const [customNextStep, setCustomNextStep] = useState('')

  useEffect(() => {
    const hydrationKey = JSON.stringify({
      initialFeedback,
      initialNextSteps,
      feedbackItems,
      nextStepItems,
    })

    if (hydrationKeyRef.current === hydrationKey) {
      return
    }

    hydrationKeyRef.current = hydrationKey

    const feedbackSet = new Set<number>()
    const extraFeedback: string[] = []
    initialFeedback.forEach((value) => {
      const index = feedbackItems.indexOf(value)
      if (index >= 0) {
        feedbackSet.add(index)
      } else if (value.trim()) {
        extraFeedback.push(value)
      }
    })

    const nextStepsSet = new Set<number>()
    const extraNextSteps: string[] = []
    initialNextSteps.forEach((value) => {
      const index = nextStepItems.indexOf(value)
      if (index >= 0) {
        nextStepsSet.add(index)
      } else if (value.trim()) {
        extraNextSteps.push(value)
      }
    })

    setSelectedFeedback(feedbackSet)
    setSelectedNextSteps(nextStepsSet)
    setCustomFeedback(extraFeedback.join('\n'))
    setCustomNextStep(extraNextSteps.join('\n'))
  }, [initialFeedback, initialNextSteps, feedbackItems, nextStepItems])

  const toggleFeedback = (i: number) => {
    const next = new Set(selectedFeedback)
    next.has(i) ? next.delete(i) : next.add(i)
    setSelectedFeedback(next)
    emitFeedback(next, customFeedback)
  }

  const toggleNextStep = (i: number) => {
    const next = new Set(selectedNextSteps)
    next.has(i) ? next.delete(i) : next.add(i)
    setSelectedNextSteps(next)
    emitNextSteps(next, customNextStep)
  }

  const emitFeedback = (sel: Set<number>, custom: string) => {
    const items = Array.from(sel).map(i => feedbackItems[i])
    if (custom.trim()) items.push(custom.trim())
    onFeedbackChange?.(items)
  }

  const emitNextSteps = (sel: Set<number>, custom: string) => {
    const items = Array.from(sel).map(i => nextStepItems[i])
    if (custom.trim()) items.push(custom.trim())
    onNextStepsChange?.(items)
  }

  return (
    <div className="feedback-panel">
      {skill && (
        <div className="feedback-skill-badge">
          🏐 {skill.name} <span className="feedback-skill-type">({getSportLabel(skill.sportId, locale)})</span>
        </div>
      )}

      {/* Feedback section */}
      {showFeedbackSection && (
        <section className="feedback-section">
          <h3>📋 {t('feedback.title')}</h3>
          <CheckList items={feedbackItems} selected={selectedFeedback} onToggle={toggleFeedback} />
          <textarea
            className="feedback-textarea"
            value={customFeedback}
            placeholder={t('feedback.placeholder')}
            onChange={(e) => {
              setCustomFeedback(e.target.value)
              emitFeedback(selectedFeedback, e.target.value)
            }}
          />
        </section>
      )}

      {/* Nästa steg section */}
      {showNextStepsSection && (
        <section className="feedback-section">
          <h3>🎯 {t('feedback.nextStepsTitle')}</h3>
          <CheckList items={nextStepItems} selected={selectedNextSteps} onToggle={toggleNextStep} />
          <textarea
            className="feedback-textarea"
            value={customNextStep}
            placeholder={t('feedback.nextStepsPlaceholder')}
            onChange={(e) => {
              setCustomNextStep(e.target.value)
              emitNextSteps(selectedNextSteps, e.target.value)
            }}
          />
        </section>
      )}

      {!skill && mode === 'all' && (
        <p className="feedback-no-skill-hint">
          💡 {t('feedback.chooseSkillHint')}
        </p>
      )}

      {mode === 'nextSteps' && nextStepItems.length === 0 && (
        <p className="feedback-no-skill-hint">
          {t('feedback.noSkillInNextSteps')}
        </p>
      )}
    </div>
  )
}

export default FeedbackPanel
