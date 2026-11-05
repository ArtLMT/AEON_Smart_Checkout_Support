import { useHashRoute } from '@/hooks/useHashRoute'
import { CashierPage } from '@/pages/CashierPage'
import { HomePage } from '@/pages/HomePage'
import { ManagerPage } from '@/pages/ManagerPage'

export default function App() {
  const route = useHashRoute()
  if (route.page === 'cashier') return <CashierPage counterId={route.counterId} />
  if (route.page === 'manager') return <ManagerPage />
  return <HomePage />
}
