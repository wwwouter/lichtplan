import { useUIStore } from '../stores/useUIStore'

export function LoadingOverlay() {
  const loading = useUIStore((s) => s.loading)

  if (!loading) return null

  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <div className="loading-message">{loading}</div>
    </div>
  )
}
