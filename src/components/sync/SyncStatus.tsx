import { useState } from 'react'
import { useOperationQueue } from '../../hooks/useOperationQueue'
import type { QueueItem } from '../../services/operationQueue'

export function SyncStatus() {
  const { status, retryFailed, clearFailed, clearPending, getPendingItems, processNow } = useOperationQueue()
  const [showDetails, setShowDetails] = useState(false)
  const [items, setItems] = useState<QueueItem[]>([])

  const handleShowDetails = async () => {
    if (!showDetails) {
      const pending = await getPendingItems()
      setItems(pending)
    }
    setShowDetails(!showDetails)
  }

  const formatOperation = (item: QueueItem) => {
    const op = item.operation
    switch (op.type) {
      case 'createTask':
        return `Create: "${op.payload.content.slice(0, 30)}${op.payload.content.length > 30 ? '...' : ''}"`
      case 'updateTask':
        return `Update: ${op.payload.taskId.slice(0, 8)}...`
      case 'closeTask':
        return `Complete: ${op.payload.taskId.slice(0, 8)}...`
      case 'reopenTask':
        return `Reopen: ${op.payload.taskId.slice(0, 8)}...`
    }
  }

  // Don't show anything if everything is synced and online
  if (status.isOnline && status.pending === 0 && status.failed === 0) {
    return null
  }

  return (
    <div className="sync-status">
      {!status.isOnline && (
        <span className="sync-badge offline">Offline</span>
      )}

      {status.isProcessing && (
        <span className="sync-badge syncing">
          <span className="sync-spinner" />
          Syncing...
        </span>
      )}

      {status.pending > 0 && !status.isProcessing && (
        <div className="sync-pending">
          <span
            className="sync-badge pending"
            onClick={handleShowDetails}
            style={{ cursor: 'pointer' }}
            title="Click to see details"
          >
            {status.pending} pending
          </span>
          <button className="sync-action" onClick={processNow}>
            Sync
          </button>
          <button className="sync-action" onClick={clearPending}>
            Clear
          </button>
        </div>
      )}

      {status.failed > 0 && (
        <div className="sync-failed">
          <span className="sync-badge failed">{status.failed} failed</span>
          <button className="sync-action" onClick={retryFailed}>
            Retry
          </button>
          <button className="sync-action" onClick={clearFailed}>
            Clear
          </button>
        </div>
      )}

      {showDetails && items.length > 0 && (
        <div className="sync-details">
          {items.map((item) => (
            <div key={item.id} className="sync-detail-item">
              <span className={`sync-detail-status ${item.status}`}>{item.status}</span>
              <span className="sync-detail-op">{formatOperation(item)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
