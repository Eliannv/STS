export function FormSection({ icon, title, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {icon && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2">{icon}</svg>}
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function FormModal({
  abierto,
  titulo,
  subtitulo,
  onCerrar,
  onSubmit,
  saving,
  saveLabel = 'Guardar',
  saveContent,
  minSaveWidth,
  error,
  maxWidth = 900,
  rightPanel,
  scrollable,
  hideSave,
  cancelLabel = 'Cancelar',
  modalStyle,
  formStyle,
  headerLeft,
  headerRight,
  headerStyle,
  bodyStyle,
  footerStyle,
  children,
}) {
  if (!abierto) return null;

  const hasRightPanel = rightPanel && rightPanel.props?.children;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{
          maxWidth, width: '95vw',
          ...(scrollable ? { maxHeight: '92vh', display: 'flex', flexDirection: 'column' } : {}),
          ...modalStyle,
        }}
      >
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          ...(scrollable ? { flexShrink: 0 } : {}),
          ...headerStyle,
        }}>
          {headerLeft || (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{titulo}</h2>
              {subtitulo && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{subtitulo}</p>}
            </div>
          )}
          {headerRight || (
            <button className="btn-icon" onClick={onCerrar} style={{ marginTop: 2 }}>✕</button>
          )}
        </div>

        <form onSubmit={onSubmit}
          style={{
            ...(scrollable ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } : {}),
            ...formStyle,
          }}
        >
          {hasRightPanel ? (
            <div style={{ display: 'flex', gap: 0, ...(scrollable ? { flex: 1, minHeight: 0 } : {}) }}>
              <div style={{
                flex: 1, padding: '24px', borderRight: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', gap: 24,
                ...(scrollable ? { overflowY: 'auto' } : {}),
                ...bodyStyle,
              }}>
                {error && <div className="alert alert-error">{error}</div>}
                {children}
              </div>
              <div style={{
                width: 220, flexShrink: 0, padding: '24px 20px',
                display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-secondary)',
                ...(scrollable ? { overflowY: 'auto' } : {}),
              }}>
                {rightPanel}
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px', ...bodyStyle }}>
              {error && <div className="alert alert-error">{error}</div>}
              {children}
            </div>
          )}

          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            ...(scrollable ? { flexShrink: 0 } : {}),
            ...footerStyle,
          }}>
            <button type="button" className="btn btn-ghost" onClick={onCerrar} disabled={saving}>{cancelLabel}</button>
            {!hideSave && (
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: minSaveWidth || 130 }}>
                {saveContent || (saving ? 'Guardando...' : saveLabel)}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
