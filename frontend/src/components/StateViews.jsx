// Estados de carga y error con cariño: en vez de un "Cargando…" seco, un
// esqueleto que insinúa la estructura (más cómodo, menos espera percibida); y
// un estado de error amable con reintento. Sin dependencias.

export function LoadingSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Cargando contenido">
      <div className="sk sk-kicker" />
      <div className="sk sk-title" />
      <div className="sk sk-line" style={{ width: "92%" }} />
      <div className="sk sk-line" style={{ width: "84%" }} />
      <div className="sk sk-line" style={{ width: "60%" }} />
      <div className="sk sk-card" />
      <div className="sk sk-card" />
    </div>
  );
}

export function ErrorState({ blockId, onRetry }) {
  return (
    <div className="state-empty">
      <div className="state-emoji">🔌</div>
      <h3>No se pudo cargar el bloque {blockId}</h3>
      <p>Puede ser un problema de conexión. Inténtalo de nuevo.</p>
      {onRetry && (
        <button className="srs-show" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
