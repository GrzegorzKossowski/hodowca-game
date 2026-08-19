import { useEffect } from 'react'
import { useGameStore } from '../store'

export function useIsDesktop() {
  const setIsDesktop = useGameStore((s) => s.setIsDesktop)
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 980)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setIsDesktop])
}
