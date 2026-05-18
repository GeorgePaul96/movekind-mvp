import { useCallback, useState } from 'react';

export function useToast(): {
  message: string | null;
  show: (m: string) => void;
  hide: () => void;
} {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((m: string) => setMessage(m), []);
  const hide = useCallback(() => setMessage(null), []);
  return { message, show, hide };
}
