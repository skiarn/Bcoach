import { getSkills } from '../utils/skills.ts'
import { getEnabledSports, normalizeSportId } from '../utils/sports.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'

interface SkillPickerProps {
  label: string
  selectedSkillType: string
  selectedSkillName: string
  onSkillTypeChange: (type: string) => void
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
  const { locale } = useI18n()
  const normalizedSelectedSport = normalizeSportId(selectedSkillType) ?? selectedSkillType
  const availableSports = getEnabledSports(locale)
  const localizedSkills = getSkills(locale)
  const filteredSkills = localizedSkills.filter((skill) => skill.sportId === normalizedSelectedSport)

  const handleTypeChange = (nextType: string) => {
    const normalizedNextType = normalizeSportId(nextType) ?? nextType
    onSkillTypeChange(nextType)

    const existsInNextType = localizedSkills.some(
      (entry) => entry.sportId === normalizedNextType && entry.name === selectedSkillName
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
        {availableSports.map((sport) => (
          <button
            key={sport.id}
            type="button"
            className={normalizedSelectedSport === sport.id ? 'active' : ''}
            onClick={() => handleTypeChange(sport.id)}
          >
            {sport.label}
          </button>
        ))}
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
