import { useEffect, useState } from 'react'

export type Route =
  | { page: 'home' }
  | { page: 'manager' }
  | { page: 'cashier'; counterId: string }

function parseHash(hash: string): Route {
  const [, page, param] = hash.replace(/^#/, '').split('/')
  if (page === 'manager') return { page: 'manager' }
  if (page === 'cashier') return { page: 'cashier', counterId: param ?? '05' }
  return { page: 'home' }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
