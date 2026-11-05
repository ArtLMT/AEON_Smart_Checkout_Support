import { cn } from '@/lib/utils'
import type { RequestStatus } from '@/types/request'

const STYLES: Record<RequestStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-800 ring-amber-300' },
  ACCEPTED: { label: 'Accepted', className: 'bg-sky-50 text-sky-800 ring-sky-300' },
  IN_PROGRESS: { label: 'In progress', className: 'bg-indigo-50 text-indigo-800 ring-indigo-300' },
  REMOTE_RESOLUTION: {
    label: 'Remote review',
    className: 'bg-violet-50 text-violet-800 ring-violet-300',
  },
  RESOLVED: { label: 'Resolved', className: 'bg-emerald-50 text-emerald-800 ring-emerald-300' },
  REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-800 ring-red-300' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-700 ring-slate-300' },
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { label, className } = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        className,
      )}
    >
      {label}
    </span>
  )
}
