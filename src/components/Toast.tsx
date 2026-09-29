import { useEffect } from 'react';
import { CircleCheck, CircleAlert, X, Undo2 } from 'lucide-react';

interface Props {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  action?: { label: string; onClick: () => void };
}

export function Toast({ message, type, onClose, action }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, action ? 6000 : 2800);
    return () => clearTimeout(timer);
  }, [onClose, action]);

  return (
    <div className={`toast toast-${type}`} role="status">
      <span className="toast-icon" aria-hidden="true">
        {type === 'success' ? <CircleCheck size={16} /> : <CircleAlert size={16} />}
      </span>
      <span className="toast-msg">{message}</span>
      {action && (
        <button className="toast-action" onClick={action.onClick}>
          <Undo2 size={13} /> {action.label}
        </button>
      )}
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
