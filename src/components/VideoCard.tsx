import { useI18n } from '../i18n/I18nProvider.tsx'

function VideoCard(): JSX.Element {
  const { t } = useI18n()

  return (
    <div className="video-card">
      <img src="" alt={t('videoCard.thumbnailAlt')} />
      <p>{t('videoCard.titlePlaceholder')}</p>
    </div>
  )
}

export default VideoCard