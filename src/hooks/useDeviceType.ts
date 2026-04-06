import { useState, useEffect } from 'react'

type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * Hook to determine device type based on viewport width
 * Mobile: < 768px
 * Tablet: 768px - 992px
 * Desktop: > 992px
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')

  useEffect(() => {
    const getDeviceType = (): DeviceType => {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 992) return 'tablet'
      return 'desktop'
    }

    setDeviceType(getDeviceType())

    const handleResize = () => {
      setDeviceType(getDeviceType())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return deviceType
}

/**
 * Hook to check if viewport matches a media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/**
 * Hook to detect if device supports touch
 */
export function useTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const hasTouch = () => {
      return (
        typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0))
      )
    }

    setIsTouch(hasTouch())
  }, [])

  return isTouch
}
