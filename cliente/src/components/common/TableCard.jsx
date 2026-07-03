export default function TableCard({
  children,
  loading,
  empty,
  emptyText = 'Sin resultados',
  loadingText,
  header,
  page,
  hasNext,
  onPrevPage,
  onNextPage,
  hidePagination,
  paginationBorderColor = '#e9ecef',
  scrollY,
  noCard,
  style,
}) {
  const cardStyle = scrollY
    ? { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', ...style }
    : style;

  const containerStyle = scrollY
    ? { flex: 1, overflowY: 'auto', borderRadius: 0, border: 'none' }
    : undefined;

  const showPagination = !hidePagination && page !== undefined && hasNext !== undefined && onPrevPage && onNextPage;

  const inner = (
    <>
      {header && <div className="card-header">{header}</div>}
      <div className="table-container" style={containerStyle}>
        {loading ? (
          <div className="spinner-wrapper">
            <div className="spinner" />
            {loadingText && <span style={{ marginLeft: 10, color: 'var(--text-muted)', fontSize: 14 }}>{loadingText}</span>}
          </div>
        ) : empty ? (
          <div className="empty-state">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
      {showPagination && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 20px', borderTop: `1px solid ${paginationBorderColor}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onPrevPage} disabled={page === 0}>← Anterior</button>
            <button className="btn btn-ghost btn-sm" onClick={onNextPage} disabled={!hasNext}>Siguiente →</button>
          </div>
        </div>
      )}
    </>
  );

  return noCard ? inner : <div className="card" style={cardStyle}>{inner}</div>;
}
