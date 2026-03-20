import { useEffect, useMemo, useState } from 'react'
import { VideoLibraryListItem } from '../../services/videoLibrary.ts'

interface HistorySkillGroupsProps {
  isLoading: boolean
  groupedItems: Record<string, Record<string, VideoLibraryListItem[]>>
  typeOrder: string[]
  selectedId: string | null
  onOpenItem: (id: string) => void
  onDelete: (id: string) => void
  formatDate: (timestamp: number) => string
  formatBytes: (bytes: number) => string
}

interface SkillTab {
  key: string
  typeLabel: string
  skillName: string
  items: VideoLibraryListItem[]
}

function HistorySkillGroups({
  isLoading,
  groupedItems,
  typeOrder,
  selectedId,
  onOpenItem,
  onDelete,
  formatDate,
  formatBytes,
}: HistorySkillGroupsProps): JSX.Element {
  const tabs = useMemo<SkillTab[]>(() => {
    return typeOrder.flatMap((typeLabel) => {
      const skillGroups = groupedItems[typeLabel]
      if (!skillGroups) return []

      return Object.entries(skillGroups)
        .sort(([a], [b]) => a.localeCompare(b, 'sv'))
        .map(([skillName, items]) => ({
          key: `${typeLabel}::${skillName}`,
          typeLabel,
          skillName,
          items: [...items].sort((a, b) => b.createdAt - a.createdAt),
        }))
    })
  }, [groupedItems, typeOrder])

  const [activeTabKey, setActiveTabKey] = useState<string>('')

  useEffect(() => {
    if (tabs.length === 0) {
      setActiveTabKey('')
      return
    }

    if (!selectedId) {
      if (!tabs.some((tab) => tab.key === activeTabKey)) {
        setActiveTabKey(tabs[0].key)
      }
      return
    }

    const selectedTab = selectedId
      ? tabs.find((tab) => tab.items.some((item) => item.id === selectedId))
      : undefined

    if (selectedTab && !activeTabKey) {
      setActiveTabKey(selectedTab.key)
      return
    }

    if (!tabs.some((tab) => tab.key === activeTabKey)) {
      setActiveTabKey(selectedTab?.key ?? tabs[0].key)
    }
  }, [tabs, selectedId, activeTabKey])

  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0]

  return (
    <aside className="history-sidebar">
      <div className="history-sidebar-header">
        <p className="history-sidebar-label">Teknik</p>
        <h3>{activeTab?.skillName ?? 'Mina videos'}</h3>
        <p className="history-sidebar-meta">{activeTab ? `${activeTab.typeLabel} · ${activeTab.items.length} videor` : 'Ingen video tillgänglig'}</p>
      </div>

      <div className="history-skill-tabs" role="tablist" aria-label="Välj teknik">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab?.key === tab.key}
            className={`history-skill-tab ${activeTab?.key === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTabKey(tab.key)}
          >
            <span className="history-skill-tab__title">{tab.skillName}</span>
            <span className="history-skill-tab__meta">{tab.typeLabel}</span>
          </button>
        ))}
      </div>

      <div className="history-sidebar-list">
        {isLoading ? (
          <p>Laddar...</p>
        ) : !activeTab || activeTab.items.length === 0 ? (
          <p>Inga videor indexerade ännu.</p>
        ) : (
          activeTab.items.map((item) => (
            <article
              key={item.id}
              className={`history-sidebar-item ${selectedId === item.id ? 'selected' : ''}`}
            >
              <button type="button" className="history-sidebar-item__main" onClick={() => onOpenItem(item.id)}>
                <strong>{item.name}</strong>
                <p className="history-skill-type">{item.source === 'exported' ? 'Exporterad' : 'Importerad'}</p>
                <p>{formatDate(item.createdAt)}</p>
                <p>{formatBytes(item.size)}</p>
                <p>Feedback: {item.metadata?.feedback.length ?? 0}</p>
                <p>Nästa steg: {item.metadata?.nextSteps.length ?? 0}</p>
              </button>
              <button type="button" onClick={() => onDelete(item.id)} className="history-action-btn history-action-btn--delete">
                Ta bort
              </button>
            </article>
          ))
        )}
      </div>
    </aside>
  )
}

export default HistorySkillGroups
