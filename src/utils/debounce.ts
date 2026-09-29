export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  };
}

export function debounceLeading<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer !== null) return;
    fn(...args);
    timer = setTimeout(() => {
      timer = null;
    }, ms);
  };
}

export function formatDate(d: Date, locale = navigator.language): string {
  return d.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(d: Date, h24: boolean): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !h24 });
}
