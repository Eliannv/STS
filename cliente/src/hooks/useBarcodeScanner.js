import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 200;
const MAX_SCANNER_INTERVAL_MS = 80;
const MIN_GLOBAL_BARCODE_LENGTH = 4;

export default function useBarcodeScanner({ enabled = true, onScan, inputRef }) {
  const timerRef = useRef(null);
  const lastRef = useRef('');
  const lastKeyAtRef = useRef(0);
  const targetRef = useRef(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    function reset() {
      clearTimeout(timerRef.current);
      lastRef.current = '';
      lastKeyAtRef.current = 0;
      targetRef.current = null;
    }

    function emitScan(minLength = 2) {
      const barcode = lastRef.current.trim();
      const target = targetRef.current;
      reset();
      if (barcode.length < minLength) return;

      if (
        target
        && typeof target.value === 'string'
        && target.value.endsWith(barcode)
      ) {
        target.value = target.value.slice(0, -barcode.length);
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }

      onScanRef.current?.(barcode);
    }

    const element = inputRef?.current;
    if (element) {
      function handleInput() {
        lastRef.current = element.value || '';
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          emitScan();
          element.value = '';
        }, DEBOUNCE_MS);
      }

      element.addEventListener('input', handleInput);
      return () => {
        element.removeEventListener('input', handleInput);
        reset();
      };
    }

    function handleKeyDown(event) {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === 'Enter') {
        if (lastRef.current.length >= MIN_GLOBAL_BARCODE_LENGTH) {
          event.preventDefault();
          emitScan(MIN_GLOBAL_BARCODE_LENGTH);
        }
        return;
      }
      if (event.key.length !== 1) return;

      const now = Date.now();
      if (lastKeyAtRef.current && now - lastKeyAtRef.current > MAX_SCANNER_INTERVAL_MS) {
        lastRef.current = '';
        targetRef.current = null;
      }
      if (!lastRef.current) targetRef.current = event.target;
      lastRef.current += event.key;
      lastKeyAtRef.current = now;

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        emitScan(MIN_GLOBAL_BARCODE_LENGTH);
      }, DEBOUNCE_MS);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      reset();
    };
  }, [enabled, inputRef]);
}
