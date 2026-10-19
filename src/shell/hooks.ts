import { useEffect, useState } from 'react'

/** Monte un composant lourd seulement après sa première ouverture. */
export function useMountedOnce(open: boolean) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])
  return mounted || open
}
