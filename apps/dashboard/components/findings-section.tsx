'use client'

import { useState } from 'react'

interface FindingsSectionProps {
  title: string
  count: number
  children: React.ReactNode
}

export function FindingsSection({ title, count, children }: FindingsSectionProps) {
  const [open, setOpen] = useState(count > 0)

  return (
    <div className="table-wrap" style={{ marginBottom: 16 }}>
      <button
        type="button"
        className="collapsible-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>
          {title}
          {count > 0 && (
            <span className="flag-badge" style={{ marginLeft: 10 }}>{count}</span>
          )}
        </span>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 18, lineHeight: 1 }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="collapsible-content">{children}</div>}
    </div>
  )
}
