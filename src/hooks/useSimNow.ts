import { useEffect, useState } from 'react'
import { useSupportStore } from '@/stores/supportStore'

/** Current simulated time, ticking once a second. Includes the presenter's fast-forward. */
export function useSimNow(): number {
  const offset = useSupportStore((state) => state.clockOffsetMs)
  const [wallClock, setWallClock] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setWallClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return wallClock + offset
}
