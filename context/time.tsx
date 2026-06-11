'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface TimeCtx {
  now: Date
  setNow: (d: Date) => void
}

const TimeContext = createContext<TimeCtx>({ now: new Date(), setNow: () => {} })

export function TimeProvider({ children }: { children: ReactNode }) {
  const [now, setNowState] = useState<Date>(new Date())

  useEffect(() => {
    const stored = localStorage.getItem('rms-time')
    if (stored) {
      const d = new Date(stored)
      if (!isNaN(d.getTime())) setNowState(d)
    }
    const tick = setInterval(() => {
      setNowState((prev) => {
        const next = new Date(prev.getTime() + 60_000)
        localStorage.setItem('rms-time', next.toISOString())
        return next
      })
    }, 60_000)
    return () => clearInterval(tick)
  }, [])

  function setNow(d: Date) {
    setNowState(d)
    localStorage.setItem('rms-time', d.toISOString())
  }

  return <TimeContext.Provider value={{ now, setNow }}>{children}</TimeContext.Provider>
}

export const useTime = () => useContext(TimeContext)
