import { DashboardRange, DashboardStats } from './historyData.ts'
import { useI18n } from '../../i18n/I18nProvider.tsx'

interface HistoryDashboardProps {
  range: DashboardRange
  onRangeChange: (range: DashboardRange) => void
  stats: DashboardStats
  formatDate: (timestamp: number) => string
}

function HistoryDashboard({ range, onRangeChange, stats, formatDate }: HistoryDashboardProps): JSX.Element {
  const { t } = useI18n()
  const rangeText = stats.rangeLabel === '7d'
    ? t('history.dashboard.range7d')
    : stats.rangeLabel === '30d'
      ? t('history.dashboard.range30d')
      : t('history.dashboard.rangeAll')

  return (
    <section className="history-dashboard">
      <div className="history-range-filter" role="group" aria-label={t('history.dashboard.rangeAria')}>
        <button type="button" className={range === '7d' ? 'active' : ''} onClick={() => onRangeChange('7d')}>
          {t('history.dashboard.range7d')}
        </button>
        <button type="button" className={range === '30d' ? 'active' : ''} onClick={() => onRangeChange('30d')}>
          {t('history.dashboard.range30d')}
        </button>
        <button type="button" className={range === 'all' ? 'active' : ''} onClick={() => onRangeChange('all')}>
          {t('history.dashboard.rangeAll')}
        </button>
      </div>

      <div className="history-stats-grid">
        <article className="history-stat-card">
          <p>{t('history.dashboard.totalSessions', { range: rangeText })}</p>
          <h3>{stats.totalSessions}</h3>
        </article>
        <article className="history-stat-card">
          <p>{t('history.dashboard.feedbackPoints', { range: rangeText })}</p>
          <h3>{stats.totalFeedbackPoints}</h3>
        </article>
        <article className="history-stat-card">
          <p>{t('history.dashboard.feedbackPerSession')}</p>
          <h3>{stats.avgFeedbackPerSession.toFixed(1)}</h3>
        </article>
        <article className="history-stat-card">
          <p>{t('history.dashboard.nextStepsPerSession')}</p>
          <h3>{stats.avgNextStepsPerSession.toFixed(1)}</h3>
        </article>
      </div>

      <article className="history-level-card">
        <div className="history-level-top">
          <div>
            <p className="history-level-label">{t('history.dashboard.level')}</p>
            <h3>{t('history.dashboard.levelValue', { level: stats.currentLevel })}</h3>
          </div>
          <div className="history-level-xp">{t('history.dashboard.xpValue', { xp: stats.xp })}</div>
        </div>
        <div className="history-level-progress-track">
          <div className="history-level-progress-fill" style={{ width: `${stats.levelProgress}%` }} />
        </div>
        <p className="history-level-meta">
          {t('history.dashboard.xpToNext', { xp: Math.max(0, stats.nextLevelTarget - stats.xp), level: stats.currentLevel + 1 })}
        </p>
        <div className="history-badge-row">
          {stats.badges.map((badge) => (
            <span key={badge.id} className={`history-badge ${badge.unlocked ? 'unlocked' : ''}`}>
              {badge.unlocked ? '✓' : '•'} {badge.label}
            </span>
          ))}
        </div>
      </article>

      <div className="history-analytics-grid">
        <article className="history-analytics-card">
          <h3>{t('history.dashboard.feedbackTrend')}</h3>
          {stats.trendPoints.length > 0 ? (
            <div className="history-trend-list">
              {stats.trendPoints.map((point) => (
                <div key={point.dayKey} className="history-trend-row">
                  <span>{point.label}</span>
                  <div className="history-trend-bar-track">
                    <div
                      className="history-trend-bar-fill"
                      style={{ width: `${Math.max(8, (point.feedback / stats.trendMaxFeedback) * 100)}%` }}
                    />
                  </div>
                  <strong>{point.feedback}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>{t('history.dashboard.noTrend')}</p>
          )}
        </article>

        <article className="history-analytics-card">
          <h3>{t('history.dashboard.topFeedback')}</h3>
          {stats.topFeedbackTopics.length > 0 ? (
            <div className="history-topic-list">
              {stats.topFeedbackTopics.map(([topic, count]) => (
                <div key={topic} className="history-topic-item">
                  <div className="history-topic-text">{topic}</div>
                  <div className="history-topic-track">
                    <div
                      className="history-topic-fill"
                      style={{ width: `${Math.max(10, (count / stats.maxTopicCount) * 100)}%` }}
                    />
                  </div>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>{t('history.dashboard.noFeedback')}</p>
          )}
        </article>
      </div>

      <article className="history-analytics-card">
        <h3>{t('history.dashboard.skillProgress')}</h3>
        <div className="history-skill-progress-grid">
          {stats.skillProgress.map((item) => (
            <div key={`${item.typeLabel}-${item.skillName}`} className="history-skill-card">
              <p className="history-skill-type">{item.typeLabel}</p>
              <h4>{item.skillName}</h4>
              <p>{t('history.dashboard.sessions', { count: item.sessions })}</p>
              <p>{t('history.dashboard.last', { date: formatDate(item.latestTimestamp) })}</p>
              <p>{t('history.dashboard.feedbackPerPass', { avg: (item.feedbackTotal / item.sessions).toFixed(1) })}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

export default HistoryDashboard
