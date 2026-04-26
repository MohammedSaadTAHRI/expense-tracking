import type { Toast } from '../hooks/useToast';

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className="toast-stack" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="toast" role="status">
          <span className="toast-msg">{t.message}</span>
          {t.actionLabel && t.onAction && (
            <button
              className="toast-action"
              onClick={() => {
                t.onAction?.();
                onDismiss(t.id);
              }}
            >
              {t.actionLabel}
            </button>
          )}
          <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Close">✕</button>
        </div>
      ))}
    </div>
  );
}
