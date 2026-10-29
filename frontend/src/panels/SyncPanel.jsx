import { useState } from "react";
import { useProgress } from "../progress";
import { describeSync, timeAgo } from "../components/SyncStatus";

// Panel de sincronización: iniciar sesión una vez por dispositivo y ver el
// estado. El progreso se fusiona por clave (gana el cambio más reciente) y
// sigue funcionando sin conexión: lo pendiente se sube al volver la red.
export default function SyncPanel() {
  const { sync } = useProgress();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { tone: "ok" | "bad", text }

  const signedIn = Boolean(sync.email);
  const { tone, label } = describeSync(sync);

  async function run(fn) {
    setMsg(null);
    if (!email.trim() || password.length < 6) {
      setMsg({ tone: "bad", text: "Escribe tu email y una contraseña de al menos 6 caracteres." });
      return;
    }
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMsg({ tone: "bad", text: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  }

  const doSignIn = () =>
    run(async () => {
      await sync.signIn(email.trim(), password);
      setPassword("");
    });

  const doSignUp = () =>
    run(async () => {
      const mustConfirm = await sync.signUp(email.trim(), password);
      setMsg({
        tone: "ok",
        text: mustConfirm
          ? "Cuenta creada. Abre el email de confirmación y vuelve aquí para entrar."
          : "Cuenta creada. Ya puedes entrar.",
      });
    });

  return (
    <div className="sync-panel">
      <header className="panel-hero">
        <span className="panel-kicker">Tu progreso · iPhone ↔ Mac Mini ↔ MacBook</span>
        <h2>Sincronizar dispositivos</h2>
        <p className="sync-lead">
          Entra con la misma cuenta en cada dispositivo y lo que hagas en uno aparecerá en los demás.
          Sin conexión sigue funcionando: los cambios se suben en cuanto vuelve la red.
        </p>
      </header>

      {!sync.configured ? (
        <section className="sync-card">
          <span className="home-card-tag">Pendiente de activar</span>
          <p>
            La app ya sabe sincronizar, pero falta conectarla a tu proyecto de Supabase (la base de
            datos en la nube). En cuanto esté conectada, aquí podrás entrar con tu cuenta.
          </p>
        </section>
      ) : signedIn ? (
        <section className="sync-card ticket">
          <div className="ticket-main">
            <div className="sync-state">
              <span className={"sync-dot sync-" + tone} aria-hidden="true" />
              <span>{label}</span>
            </div>
            <p className="sync-account">
              Cuenta: <b>{sync.email}</b>
            </p>
            {sync.status === "error" && sync.error && <p className="sync-error">{sync.error}</p>}
            <div className="sync-actions">
              <button className="srs-show" onClick={() => sync.runNow()} disabled={sync.status === "syncing"}>
                Sincronizar ahora
              </button>
              <button className="srs-reset-btn" onClick={() => sync.signOut()}>
                Cerrar sesión
              </button>
            </div>
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
        <form
          className="sync-card sync-form"
          onSubmit={(e) => {
            e.preventDefault();
            doSignIn();
          }}
        >
          <span className="home-card-tag">Entra con tu cuenta</span>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
            />
          </label>
          {msg && <p className={"sync-msg sync-msg-" + msg.tone}>{msg.text}</p>}
          <div className="sync-actions">
            <button className="srs-show" type="submit" disabled={busy}>
              {busy ? "Un momento…" : "Entrar"}
            </button>
            <button className="srs-reset-btn" type="button" onClick={doSignUp} disabled={busy}>
              Crear cuenta
            </button>
          </div>
          <p className="sync-hint">
            Solo hace falta una cuenta: créala una vez y entra con ella en el iPhone y en cada Mac.
          </p>
        </form>
      )}
    </div>
  );
}

function friendlyError(e) {
  const m = String(e?.message || e || "");
  if (/invalid login/i.test(m)) return "Email o contraseña incorrectos.";
  if (/not confirmed/i.test(m)) return "Confirma primero la cuenta desde el email que te llegó.";
  if (/already registered/i.test(m)) return "Ese email ya tiene cuenta: pulsa Entrar.";
  if (/fetch|network/i.test(m)) return "Sin conexión. Inténtalo cuando tengas red.";
  return m || "No se pudo completar. Inténtalo de nuevo.";
}
