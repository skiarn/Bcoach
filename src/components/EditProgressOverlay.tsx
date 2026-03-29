import { useI18n } from '../i18n/I18nProvider.tsx'

interface EditProgressOverlayProps {
  progress: number
  label?: string
}

export default function EditProgressOverlay({ progress, label }: EditProgressOverlayProps): JSX.Element {
  const { t } = useI18n()
  const percent = Math.round(progress * 100)

  return (
    <div className="edit-progress-overlay" role="dialog" aria-modal="true" aria-label={t('editor.processing')}>
      <div className="edit-progress-overlay__card">
        <div className="edit-progress-overlay__spinner" aria-hidden="true" />
        <p className="edit-progress-overlay__title">{label ?? t('editor.processing')}</p>
        <div className="edit-progress-overlay__bar-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="edit-progress-overlay__bar-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="edit-progress-overlay__percent">{percent}%</p>
      </div>
    </div>
  )
}
