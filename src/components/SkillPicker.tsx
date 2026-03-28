import { Skill, skills } from '../utils/skills.ts'

interface SkillPickerProps {
  label: string
  selectedSkillType: Skill['type']
  selectedSkillName: string
  onSkillTypeChange: (type: Skill['type']) => void
  onSkillNameChange: (name: string) => void
  allowDeselect?: boolean
  helperText?: string
  className?: string
}

function SkillPicker({
  label,
  selectedSkillType,
  selectedSkillName,
  onSkillTypeChange,
  onSkillNameChange,
  allowDeselect = true,
  helperText,
  className,
}: SkillPickerProps): JSX.Element {
  const filteredSkills = skills.filter((skill) => skill.type === selectedSkillType)

  const handleTypeChange = (nextType: Skill['type']) => {
    onSkillTypeChange(nextType)

    const existsInNextType = skills.some(
      (entry) => entry.type === nextType && entry.name === selectedSkillName
    )

    if (!existsInNextType) {
      onSkillNameChange('')
    }
  }

  return (
    <div className={className ?? 'home-skill-picker'}>
      <p className="home-skill-picker-label">{label}</p>
      {helperText ? <p style={{ margin: '0 0 12px', color: '#617387', fontSize: '0.92rem' }}>{helperText}</p> : null}

      <div className="home-sport-toggle">
        <button
          type="button"
          className={selectedSkillType === 'beachvolley' ? 'active' : ''}
          onClick={() => handleTypeChange('beachvolley')}
        >
          Beachvolley
        </button>
        <button
          type="button"
          className={selectedSkillType === 'volleyboll' ? 'active' : ''}
          onClick={() => handleTypeChange('volleyboll')}
        >
          Volleyboll
        </button>
      </div>

      <div className="home-skill-grid">
        {filteredSkills.map((skill) => {
          const isActive = selectedSkillName === skill.name
          return (
            <button
              key={`${skill.name}::${skill.type}`}
              type="button"
              className={`home-skill-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSkillNameChange(isActive && allowDeselect ? '' : skill.name)}
            >
              {skill.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SkillPicker
