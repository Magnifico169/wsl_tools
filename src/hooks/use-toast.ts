import * as React from "react";

type ToastVariant = "default" | "destructive";

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

type Listener = (toasts: ToastMessage[]) => void;

let count = 0;
let memoryState: ToastMessage[] = [];
const listeners: Listener[] = [];

function dispatch(toast: Omit<ToastMessage, "id">) {
  const id = String(++count);
  memoryState = [{ ...toast, id }, ...memoryState].slice(0, 5);
  listeners.forEach((l) => l(memoryState));
  setTimeout(() => {
    memoryState = memoryState.filter((t) => t.id !== id);
    listeners.forEach((l) => l(memoryState));
  }, 5000);
}

export function toast(props: Omit<ToastMessage, "id">) {
  dispatch(props);
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return { toasts, toast };
}
