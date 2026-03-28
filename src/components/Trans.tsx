import { MessageKey } from '../i18n/messages.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'

type TranslationValues = Record<string, string | number>

interface TransProps {
  k: MessageKey
  values?: TranslationValues
}

function Trans({ k, values }: TransProps): JSX.Element {
  const { t } = useI18n()
  return <>{t(k, values)}</>
}

export default Trans
