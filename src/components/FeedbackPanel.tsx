import { useState } from 'react'
import { Skill } from '../utils/skills.ts'

interface FeedbackPanelProps {
  skill?: Skill
  onFeedbackChange?: (feedback: string[]) => void
}

function FeedbackPanel({ skill, onFeedbackChange }: FeedbackPanelProps): JSX.Element {
  const [selectedFeedback, setSelectedFeedback] = useState<Set<number>>(new Set())
  const [customFeedback, setCustomFeedback] = useState('')

  const commonMistakes = skill ? [
    ...skill.advice,
    "Du hoppar lite sent - försök att börja hoppet tidigare",
    "Armen är inte helt rak vid kontakt - sträck ut armen mer",
    "Följ igenom slaget - håll kontakten längre med bollen",
    "Positionera dig bättre framför bollen",
    "Håll blicken på bollen hela tiden",
    "Fotarbete behöver förbättras",
    "Timing av slaget är fel",
    "Kraften i slaget är för svag"
  ] : [
    "Du hoppar lite sent - försök att börja hoppet tidigare",
    "Armen är inte helt rak vid kontakt - sträck ut armen mer",
    "Följ igenom slaget - håll kontakten längre med bollen",
    "Positionera dig bättre framför bollen",
    "Håll blicken på bollen hela tiden"
  ]

  const handleCheckboxChange = (index: number) => {
    const newSelected = new Set(selectedFeedback)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedFeedback(newSelected)
    updateFeedback(newSelected, customFeedback)
  }

  const handleCustomChange = (value: string) => {
    setCustomFeedback(value)
    updateFeedback(selectedFeedback, value)
  }

  const updateFeedback = (selected: Set<number>, custom: string) => {
    const selectedItems = Array.from(selected).map(i => commonMistakes[i])
    const allFeedback = [...selectedItems]
    if (custom.trim()) {
      allFeedback.push(custom.trim())
    }
    onFeedbackChange?.(allFeedback)
  }

  return (
    <div className="feedback-panel">
      <h3>💡 Analys & Tips</h3>
      {skill && <p><strong>För {skill.name} ({skill.type}):</strong></p>}
      
      <div style={{ marginBottom: '15px' }}>
        <p><strong>Välj vanliga misstag att förbättra:</strong></p>
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
          {commonMistakes.map((mistake, index) => (
            <label key={index} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedFeedback.has(index)}
                onChange={() => handleCheckboxChange(index)}
                style={{ marginRight: '8px' }}
              />
              {mistake}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <p><strong>Egen feedback:</strong></p>
        <textarea
          value={customFeedback}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="Lägg till dina egna observationer..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <h4>🎯 Nästa steg</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Öva på att hoppa tidigare</li>
          <li>Fokusera på armrörelsen</li>
          <li>Spela in fler videos för jämförelse</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <p style={{ fontSize: '0.9em', margin: 0 }}>
          💡 <strong>Tips:</strong> Rita linjer på videon för att visualisera din teknik och jämför med tidigare analyser.
        </p>
      </div>
    </div>
  )
}

export default FeedbackPanel