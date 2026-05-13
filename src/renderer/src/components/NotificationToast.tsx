import { useEffect } from 'react'
import { useUIStore } from '../stores/useUIStore'

export function NotificationToast() {
  const notification = useUIStore((s) => s.notification)
  const clearNotification = useUIStore((s) => s.clearNotification)

  useEffect(() => {
    if (!notification) return
    const timeout = window.setTimeout(clearNotification, notification.type === 'error' ? 9000 : 5000)
    return () => window.clearTimeout(timeout)
  }, [clearNotification, notification])

  if (!notification) return null

  return (
    <div className={`notification-toast ${notification.type}`} role="status" aria-live="polite">
      <span>{notification.message}</span>
      <button onClick={clearNotification} aria-label="Melding sluiten">
        x
      </button>
    </div>
  )
}
