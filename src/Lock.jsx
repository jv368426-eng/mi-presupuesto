import { useState, useEffect } from "react";
import { Lock as LockIcon, Eye, EyeOff, ShieldCheck } from "lucide-react";

const HASH_KEY = "presupuesto-auth-hash";
const UNLOCK_KEY = "presupuesto-unlocked";

async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const C = {
  bg: "#080D18", card: "#0E1728", border: "#22314A", muted: "#7183A0",
  text: "#EAF0F7", green: "#34D399", blue: "#3B82F6", red: "#F87171"
};

const fieldStyle = {
  width: "100%", background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: ".65rem", padding: ".7rem .8rem", color: C.text,
  fontSize: ".875rem", outline: "none", boxSizing: "border-box"
};

export default function Lock({ children }) {
  const [hasPassword, setHasPassword] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(HASH_KEY);
    setHasPassword(!!stored);
    if (stored && sessionStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true);
  }, []);

  async function handleSetup(e) {
    e.preventDefault();
    if (pw.length < 4) { setError("Usa al menos 4 caracteres"); return; }
    if (pw !== pw2) { setError("Las contraseñas no coinciden"); return; }
    const hash = await hashPassword(pw);
    localStorage.setItem(HASH_KEY, hash);
    sessionStorage.setItem(UNLOCK_KEY, "1");
    setUnlocked(true);
    setHasPassword(true);
    setPw(""); setPw2("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    const hash = await hashPassword(pw);
    if (hash === localStorage.getItem(HASH_KEY)) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      setUnlocked(true);
      setError("");
      setPw("");
    } else {
      setError("Contraseña incorrecta");
    }
  }

  function handleLock() {
    sessionStorage.removeItem(UNLOCK_KEY);
    setUnlocked(false);
  }

  function handleForgot() {
    if (confirm("Esto elimina la contraseña de este dispositivo (tus movimientos NO se borran). ¿Continuar?")) {
      localStorage.removeItem(HASH_KEY);
      setHasPassword(false);
      setError("");
    }
  }

  if (hasPassword === null) return null;

  if (unlocked) {
    return (
      <div style={{ position: "relative" }}>
        <button onClick={handleLock} title="Bloquear"
          style={{
            position: "fixed", top: 14, right: 14, zIndex: 1000, width: 38, height: 38,
            borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, color: C.muted,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}>
          <LockIcon size={16} />
        </button>
        {children}
      </div>
    );
  }

  const isSetup = !hasPassword;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <form onSubmit={isSetup ? handleSetup : handleLogin}
        style={{ width: "100%", maxWidth: 340, background: C.card, border: `1px solid ${C.border}`, borderRadius: "1.2rem", padding: "1.8rem", color: C.text, fontFamily: "Inter, sans-serif" }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: `${C.green}18`, border: `1px solid ${C.green}33`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          {isSetup ? <ShieldCheck color={C.green} size={22} /> : <LockIcon color={C.green} size={20} />}
        </div>
        <h1 style={{ fontSize: "1.15rem", margin: "0 0 .3rem" }}>{isSetup ? "Protege tu presupuesto" : "Mi Presupuesto"}</h1>
        <p style={{ fontSize: ".78rem", color: C.muted, margin: "0 0 1.2rem" }}>
          {isSetup
            ? "Crea una contraseña para esta pantalla. Se guarda solo en este dispositivo."
            : "Ingresa tu contraseña para continuar."}
        </p>

        <div style={{ position: "relative", marginBottom: isSetup ? ".6rem" : "1rem" }}>
          <input
            autoFocus
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Contraseña"
            style={{ ...fieldStyle, paddingRight: "2.4rem" }}
          />
          <button type="button" onClick={() => setShowPw(s => !s)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {isSetup && (
          <input
            type={showPw ? "text" : "password"}
            value={pw2}
            onChange={e => setPw2(e.target.value)}
            placeholder="Confirma la contraseña"
            style={{ ...fieldStyle, marginBottom: "1rem" }}
          />
        )}

        {error && <p style={{ color: C.red, fontSize: ".75rem", margin: "0 0 .8rem" }}>{error}</p>}

        <button type="submit"
          style={{ width: "100%", background: C.blue, color: "#fff", border: "none", borderRadius: ".65rem", padding: ".75rem", fontWeight: 600, cursor: "pointer", fontSize: ".875rem" }}>
          {isSetup ? "Crear contraseña" : "Entrar"}
        </button>

        {!isSetup && (
          <button type="button" onClick={handleForgot}
            style={{ width: "100%", background: "none", border: "none", color: C.muted, fontSize: ".72rem", marginTop: ".8rem", cursor: "pointer", textDecoration: "underline dotted" }}>
            Olvidé mi contraseña
          </button>
        )}
      </form>
    </div>
  );
}
