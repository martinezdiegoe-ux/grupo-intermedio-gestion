import { useEffect } from 'react'
import { USE_MOCKS } from './config'
import { supabase } from './supabase'

const HEARTBEAT_MS = 30_000

export function useAuditVisit(userId: string | undefined) {
  useEffect(() => {
    const client = supabase
    if (!userId || USE_MOCKS || !client) return

    let visitId: string | undefined
    let timer: number | undefined
    const touch = (id: string) => {
      void client.rpc('touch_app_visit', { visit_id: id }).then(({ error }) => {
        if (error) console.warn('No se pudo registrar la actividad:', error.message)
      })
    }

    function stop() {
      window.clearInterval(timer)
      if (visitId) touch(visitId)
      visitId = undefined
    }

    function syncVisibility() {
      if (document.visibilityState !== 'visible') {
        stop()
        return
      }
      if (visitId) return

      const id = window.crypto.randomUUID()
      visitId = id
      touch(id)
      timer = window.setInterval(() => {
        if (document.visibilityState === 'visible') touch(id)
      }, HEARTBEAT_MS)
    }

    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)
    window.addEventListener('pageshow', syncVisibility)
    window.addEventListener('pagehide', stop)
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility)
      window.removeEventListener('pageshow', syncVisibility)
      window.removeEventListener('pagehide', stop)
      stop()
    }
  }, [userId])
}
