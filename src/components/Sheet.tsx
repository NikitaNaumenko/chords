import type { ReactNode } from 'react'

/** Нижняя шторка поверх экрана. */
export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog">
        <div className="sheet-inner">
          <div className="grip" />
          {children}
        </div>
      </div>
    </>
  )
}
