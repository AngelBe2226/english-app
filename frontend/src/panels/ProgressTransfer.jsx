import { useRef, useState } from "react";
import { useProgress } from "../progress";

// Exporta e importa el progreso como un archivo JSON. Útil para copia de
// seguridad y para mover el progreso entre equipos (la base de datos vive en
// cada máquina y no se sincroniza por git).
export default function ProgressTransfer() {
  const { progress, importAll } = useProgress();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null); // { kind: "ok" | "no", text }

  const count = Object.keys(progress).length;

  function handleExport() {
    const payload = {
      app: "indice-de-ingles",
      type: "progress-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      count,
      items: progress,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `progreso-ingles-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg({ kind: "ok", text: `Exportadas ${count} entradas.` });
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-seleccionar el mismo archivo
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        // Acepta el formato exportado ({items}), o un mapa plano directo.
        const items =
          data && typeof data === "object" && data.items && typeof data.items === "object"
            ? data.items
            : data;
        if (!items || typeof items !== "object" || Array.isArray(items))
          throw new Error("formato no reconocido");
        // Solo pares clave→valor de texto.
        const clean = {};
        for (const [k, v] of Object.entries(items)) {
          if (typeof k === "string" && (typeof v === "string" || typeof v === "number"))
            clean[k] = String(v);
        }
        const n = Object.keys(clean).length;
        if (n === 0) throw new Error("no hay entradas válidas");
        if (
          !window.confirm(
            `Importar ${n} entradas. Se combinarán con tu progreso actual (las claves repetidas se sobrescriben). ¿Continuar?`
          )
        )
          return;
        importAll(clean)
          .then(() => setMsg({ kind: "ok", text: `Importadas ${n} entradas.` }))
          .catch(() =>
            setMsg({ kind: "no", text: "No se pudo guardar la importación." })
          );
      } catch (err) {
        setMsg({ kind: "no", text: "Archivo inválido: " + err.message });
      }
    };
    reader.onerror = () => setMsg({ kind: "no", text: "No se pudo leer el archivo." });
    reader.readAsText(file);
  }

  return (
    <div className="data-transfer">
      <div className="dt-head">
        <span className="dt-tag">Copia de seguridad</span>
        <span className="dt-count">{count} entradas guardadas</span>
      </div>
      <p className="dt-desc">
        Guarda tu progreso en un archivo o impórtalo en otro equipo. La base de
        datos vive en cada máquina, así que esta es la forma de moverlo.
      </p>
      <div className="dt-actions">
        <button className="dt-btn primary" onClick={handleExport} disabled={count === 0}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Exportar
        </button>
        <button className="dt-btn" onClick={() => fileRef.current?.click()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 15V3m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Importar
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          hidden
        />
      </div>
      {msg && <p className={"dt-msg " + msg.kind}>{msg.text}</p>}
    </div>
  );
}
