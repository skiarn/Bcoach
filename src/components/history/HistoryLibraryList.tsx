import { VideoLibraryListItem } from '../../services/videoLibrary.ts'

interface HistoryLibraryListProps {
  items: VideoLibraryListItem[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  formatDate: (timestamp: number) => string
  formatBytes: (bytes: number) => string
}

function HistoryLibraryList({
  items,
  isLoading,
  selectedId,
  onSelect,
  onDelete,
  formatDate,
  formatBytes,
}: HistoryLibraryListProps): JSX.Element {
  return (
    <aside style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '10px', maxHeight: '75vh', overflowY: 'auto' }}>
      {isLoading ? (
        <p>Laddar...</p>
      ) : items.length === 0 ? (
        <p>Inga videor indexerade ännu.</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            style={{
              border: selectedId === item.id ? '2px solid #007bff' : '1px solid #ddd',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '10px',
              background: selectedId === item.id ? '#f0f7ff' : 'white',
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              style={{ border: 'none', background: 'transparent', textAlign: 'left', width: '100%', cursor: 'pointer' }}
            >
              <strong>{item.name}</strong>
              <p style={{ margin: '6px 0' }}>{item.source === 'exported' ? 'Exporterad' : 'Importerad'}</p>
              <p style={{ margin: '6px 0' }}>{formatDate(item.createdAt)}</p>
              <p style={{ margin: '6px 0' }}>{formatBytes(item.size)}</p>
              <p style={{ margin: '6px 0', color: '#555' }}>Metadata: {item.metadata ? 'Ja' : 'Nej'}</p>
            </button>
            <button type="button" onClick={() => onDelete(item.id)} className="history-action-btn history-action-btn--delete">
              Ta bort
            </button>
          </div>
        ))
      )}
    </aside>
  )
}

export default HistoryLibraryList
