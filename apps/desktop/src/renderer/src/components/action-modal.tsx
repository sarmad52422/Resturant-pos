import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ActionModalProps {
  children: ReactNode;
  description?: string;
  open: boolean;
  title: string;
  widthClass?: string;
  onClose: () => void;
}

export function ActionModal({
  children,
  description,
  open,
  title,
  widthClass = 'max-w-xl',
  onClose,
}: ActionModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-secondary/24 p-6 backdrop-blur-sm">
      <button
        aria-label="Close popup"
        className="absolute inset-0 cursor-default"
        type="button"
        onClick={onClose}
      />
      <section
        aria-modal="true"
        className={`modal-jiggle relative max-h-[88vh] w-full ${widthClass} overflow-hidden rounded-2xl bg-white shadow-[0_32px_90px_rgb(var(--ro-secondary-rgb)/0.22)]`}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-espresso">{title}</h2>
            {description ? <p className="mt-1 text-sm font-semibold text-muted">{description}</p> : null}
          </div>
          <button
            aria-label="Close popup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-mint hover:text-secondary"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(88vh-88px)] overflow-y-auto p-6">{children}</div>
      </section>
    </div>
  );
}
