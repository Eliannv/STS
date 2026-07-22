import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTabHistory } from '../context/TabHistoryContext';

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 99999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  panel: {
    background: '#252526', borderRadius: 8, width: 520, maxHeight: 420,
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 16px', borderBottom: '1px solid #3c3c3c',
    color: '#ccc', fontSize: 12.5, fontWeight: 600,
    letterSpacing: 0.3,
  },
  list: { flex: 1, overflowY: 'auto', padding: 4 },
  item: (selected) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '7px 12px', borderRadius: 4,
    background: selected ? '#094771' : 'transparent',
    color: selected ? '#fff' : '#ccc',
    fontSize: 13, transition: 'background 0.05s',
    cursor: 'pointer',
  }),
  arrow: (selected) => ({
    width: 18, flexShrink: 0, textAlign: 'center',
    color: selected ? '#fff' : 'transparent',
    fontSize: 10,
  }),
  footer: {
    padding: '8px 16px', borderTop: '1px solid #3c3c3c',
    color: '#777', fontSize: 11, textAlign: 'center',
  },
};

export default function CtrlTabNavigator() {
  const { history } = useTabHistory();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen && selectedIndex >= history.length) {
      setSelectedIndex(Math.max(0, history.length - 1));
    }
  }, [history, isOpen, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const items = listRef.current.children;
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, selectedIndex]);

  const navigateToSelected = useCallback((path) => {
    if (path) navigate(path);
    setIsOpen(false);
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen) {
        if (e.ctrlKey && e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => (prev + 1) % history.length);
          return;
        }
        if (e.ctrlKey && e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => (prev - 1 + history.length) % history.length);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          navigateToSelected(history[selectedIndex]?.path);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          return;
        }
        return;
      }

      if (e.ctrlKey && e.shiftKey && (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space')) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
        setSelectedIndex(0);
      }
    };

    const handleBlur = () => {
      if (isOpen) setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isOpen, selectedIndex, history, navigateToSelected]);

  if (!isOpen || history.length === 0) return null;

  return createPortal(
    <div style={styles.backdrop} onMouseDown={() => setIsOpen(false)}>
      <div style={styles.panel} onMouseDown={e => e.stopPropagation()}>
        <div style={styles.header}>Navegador de archivos recientes</div>
        <div style={styles.list} ref={listRef}>
          {history.map((page, idx) => (
            <div
              key={`${page.path}-${idx}`}
              style={styles.item(idx === selectedIndex)}
              onClick={() => navigateToSelected(page.path)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span style={styles.arrow(idx === selectedIndex)}>▶</span>
              <span>{page.label}</span>
            </div>
          ))}
        </div>
        <div style={styles.footer}>
          <kbd style={{ background: '#3c3c3c', padding: '1px 6px', borderRadius: 3, fontSize: 10, margin: '0 2px' }}>Ctrl+Shift+Space</kbd>
          {' '}abrir{' · '}
          <kbd style={{ background: '#3c3c3c', padding: '1px 6px', borderRadius: 3, fontSize: 10, margin: '0 2px' }}>Ctrl+↓</kbd>
          <kbd style={{ background: '#3c3c3c', padding: '1px 6px', borderRadius: 3, fontSize: 10, margin: '0 2px' }}>↑</kbd>
          {' '}navegar{' · '}
          <kbd style={{ background: '#3c3c3c', padding: '1px 6px', borderRadius: 3, fontSize: 10, margin: '0 2px' }}>Enter</kbd>
          {' '}ir{' · '}
          <kbd style={{ background: '#3c3c3c', padding: '1px 6px', borderRadius: 3, fontSize: 10, margin: '0 2px' }}>Esc</kbd>
          {' '}cerrar
        </div>
      </div>
    </div>,
    document.body
  );
}
