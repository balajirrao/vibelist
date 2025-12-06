import { useOperationQueue } from '../../hooks/useOperationQueue'

export function SyncStatus() {
  const { status, retryFailed, clearFailed } = useOperationQueue()

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
        <span className="sync-badge pending">
          {status.pending} pending
        </span>
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
    </div>
  )
}
