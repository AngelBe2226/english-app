import { useState } from "react";
import { useProgress } from "../progress";
import { describeSync, timeAgo } from "../components/SyncStatus";

// Panel de cuentas y sincronización. Cada persona tiene su cuenta y su
// progreso; el contenido (lecciones) es el mismo para todos. Un dispositivo
// guarda el progreso de quien tiene la sesión abierta: al "cambiar de persona"
// se sube lo pendiente y el dispositivo queda limpio para la siguiente.
export default function SyncPanel() {
  const { sync } = useProgress();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ownLocal, setOwnLocal] = useState(null); // ¿el progreso sin dueño es mío?
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { tone: "ok" | "bad", text }

  const signedIn = Boolean(sync.email);
  const { tone, label } = describeSync(sync);
  const askOwnership = mode === "signin" && sync.unownedCount > 0;

  async function guarded(fn) {
    setMsg(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMsg({ tone: "bad", text: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  }

  function validCredentials() {
    if (!email.trim() || password.length < 6) {
      setMsg({ tone: "bad", text: "Escribe tu email y una contraseña de al menos 6 caracteres." });
      return false;
    }
    return true;
  }

  function submit(e) {
    e.preventDefault();
    if (!validCredentials()) return;
    if (mode === "signup") {
      guarded(async () => {
        const mustConfirm = await sync.signUp(email.trim(), password, name.trim());
        setMode("signin");
        setMsg({
          tone: "ok",
          text: mustConfirm
            ? "Cuenta creada. Abre el email de confirmación y vuelve aquí para entrar."
            : "Cuenta creada. Ya puedes entrar.",
        });
      });
      return;
    }
    if (askOwnership && ownLocal === null) {
      setMsg({ tone: "bad", text: "Elige antes de quién es el progreso que ya hay en este dispositivo." });
      return;
    }
    guarded(async () => {
      await sync.signIn(email.trim(), password, { keepLocal: askOwnership ? ownLocal : true });
      setPassword("");
    });
  }

  function switchPerson() {
    guarded(async () => {
      await sync.signOut();
      setEmail("");
      setPassword("");
      setOwnLocal(null);
      setMode("signin");
    });
  }

  return (
    <div className="sync-panel">
      <header className="panel-hero">
        <span className="panel-kicker">Cuentas · iPhone ↔ Mac</span>
        <h2>{signedIn ? `Hola, ${sync.name}` : "¿Quién estudia?"}</h2>
        <p className="sync-lead">
          Cada persona entra con su cuenta y lleva su propio progreso; las lecciones son las mismas
          para todos. Con la misma cuenta, lo que hagas en un dispositivo aparece en los demás, y sin
          conexión sigue funcionando.
        </p>
      </header>

      {!sync.configured ? (
        <section className="sync-card">
          <span className="home-card-tag">Pendiente de activar</span>
          <p>La sincronización aún no está conectada a la base de datos en la nube.</p>
        </section>
      ) : signedIn ? (
        <section className="sync-card ticket">
          <div className="ticket-main">
            <div className="sync-state">
              <span className={"sync-dot sync-" + tone} aria-hidden="true" />
              <span>{label}</span>
            </div>
            <p className="sync-account">
              Sesión de <b>{sync.name}</b> · {sync.email}
            </p>
            {sync.status === "error" && sync.error && <p className="sync-error">{sync.error}</p>}
            {msg && <p className={"sync-msg sync-msg-" + msg.tone}>{msg.text}</p>}
            <div className="sync-actions">
              <button className="srs-show" onClick={() => sync.runNow()} disabled={busy || sync.status === "syncing"}>
                Sincronizar ahora
              </button>
              <button className="srs-reset-btn" onClick={switchPerson} disabled={busy}>
                {busy ? "Guardando…" : "Cambiar de persona"}
              </button>
            </div>
            <p className="sync-hint">
              Al cambiar de persona, tu progreso queda guardado en la nube y este dispositivo se
              queda listo para que entre otra cuenta.
            </p>
          </div>
          <dl className="ticket-stub">
            <div>
              <dt>Última</dt>
              <dd>{timeAgo(sync.lastSync)}</dd>
            </div>
            <div>
              <dt>Por subir</dt>
              <dd>{sync.pending}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <form className="sync-card sync-form" onSubmit={submit} noValidate>
          <div className="sync-tabs" role="tablist" aria-label="Acceso">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              className={"sync-tab" + (mode === "signin" ? " active" : "")}
              onClick={() => {
                setMode("signin");
                setMsg(null);
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={"sync-tab" + (mode === "signup" ? " active" : "")}
              onClick={() => {
                setMode("signup");
                setMsg(null);
              }}
            >
              Crear cuenta
            </button>
          </div>

          {mode === "signup" && (
            <label>
              Tu nombre
              <input
                type="text"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Para saludarte y saber de quién es la sesión"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
            />
          </label>

          {askOwnership && (
            <fieldset className="sync-own">
              <legend>
                Este dispositivo ya tiene progreso sin cuenta ({sync.unownedCount}{" "}
                {sync.unownedCount === 1 ? "dato" : "datos"}). ¿Es tuyo?
              </legend>
              <label className="sync-radio">
                <input type="radio" name="own" checked={ownLocal === true} onChange={() => setOwnLocal(true)} />
                Sí, es mío: añádelo a mi cuenta
              </label>
              <label className="sync-radio">
                <input type="radio" name="own" checked={ownLocal === false} onChange={() => setOwnLocal(false)} />
                No: entrar solo con mi propio progreso
              </label>
            </fieldset>
          )}

          {msg && <p className={"sync-msg sync-msg-" + msg.tone}>{msg.text}</p>}
          <div className="sync-actions">
            <button className="srs-show" type="submit" disabled={busy}>
              {busy ? "Un momento…" : mode === "signup" ? "Crear cuenta" : "Entrar"}
            </button>
          </div>
          <p className="sync-hint">
            {mode === "signup"
              ? "Cada persona crea su propia cuenta una vez. Después entra con ella en el iPhone y en cada Mac."
              : "¿Primera vez? Pulsa «Crear cuenta» arriba."}
          </p>
        </form>
      )}
    </div>
  );
}

function friendlyError(e) {
  const m = String(e?.message || e || "");
  if (m === "PENDING_OFFLINE")
    return "Tienes cambios sin subir y no hay conexión. Conéctate para cambiar de persona sin perderlos.";
  if (/invalid login/i.test(m)) return "Email o contraseña incorrectos.";
  if (/not confirmed/i.test(m)) return "Confirma primero la cuenta desde el email que te llegó.";
  if (/already registered/i.test(m)) return "Ese email ya tiene cuenta: pulsa Entrar.";
  if (/signups not allowed|signup.*disabled/i.test(m)) return "El registro de cuentas nuevas está cerrado.";
  if (/fetch|network/i.test(m)) return "Sin conexión. Inténtalo cuando tengas red.";
  return m || "No se pudo completar. Inténtalo de nuevo.";
}
