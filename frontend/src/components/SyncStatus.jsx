import { useEffect, useState } from "react";
import { useProgress } from "../progress";

export function timeAgo(ts, now = Date.now()) {
  if (!ts) return "nunca";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return "ahora mismo";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// Estado → tono del punto + texto corto.
export function describeSync(sync, now = Date.now()) {
  switch (sync.status) {
    case "off":
      return { tone: "off", label: "Sincronización sin activar" };
    case "idle":
    case "signed-out":
      return { tone: "off", label: "Sin sincronizar · entra" };
    case "syncing":
      return { tone: "busy", label: "Sincronizando…" };
    case "offline":
      return { tone: "wait", label: sync.pending ? "Sin conexión · se subirá luego" : "Sin conexión" };
    case "error":
      return { tone: "bad", label: "Error al sincronizar" };
    default:
      return sync.pending
        ? { tone: "wait", label: "Cambios por subir" }
        : { tone: "ok", label: `Sincronizado · ${timeAgo(sync.lastSync, now)}` };
  }
}

// Refresca el "hace X min" sin depender de otros renders.
function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

// Indicador compacto: punto de estado (+ texto si no es `compact`).
export default function SyncStatus({ onOpen, compact = false }) {
  const { sync } = useProgress();
  const now = useNow();
  const { tone, label } = describeSync(sync, now);
  return (
    <button
      type="button"
      className={"sync-status" + (compact ? " compact" : "")}
      onClick={onOpen}
      aria-label={`Sincronización: ${label}`}
      title={label}
    >
      <span className={"sync-dot sync-" + tone} aria-hidden="true" />
      {!compact && <span className="sync-label">{label}</span>}
    </button>
  );
}
