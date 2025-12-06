import { useState, type FormEvent } from 'react'
import { useAuthStore } from '../../store/authStore'
import { TodoistAPI } from '../../api/todoist'

export function TokenEntry() {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const saveToken = useAuthStore((s) => s.setToken)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return

    setIsValidating(true)
    setError(null)

    try {
      const api = new TodoistAPI(token.trim())
      await api.getProjects()
      saveToken(token.trim())
    } catch {
      setError('Invalid API token. Please check and try again.')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="token-entry">
      <h1>Vibelist</h1>
      <p>Enter your Todoist API token to get started.</p>

      <form className="token-form" onSubmit={handleSubmit}>
        <input
          type="password"
          className="token-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your API token"
          autoComplete="off"
        />
        <button
          type="submit"
          className="token-submit"
          disabled={isValidating || !token.trim()}
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </button>
        {error && <p className="token-error">{error}</p>}
      </form>

      <p className="token-help">
        Find your token at: Todoist Settings → Integrations → Developer
      </p>
    </div>
  )
}
