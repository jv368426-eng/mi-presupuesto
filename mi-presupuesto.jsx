import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Settings, TrendingUp, TrendingDown, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const CURRENCIES = [
  { code: 'COP', label: 'Peso colombiano', symbol: '$' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$' },
  { code: 'ARS', label: 'Peso argentino', symbol: '$' },
  { code: 'CLP', label: 'Peso chileno', symbol: '$' },
  { code: 'PEN', label: 'Sol peruano', symbol: 'S/' },
  { code: 'BRL', label: 'Real brasileño', symbol: 'R$' },
  { code: 'GBP', label: 'Libra esterlina', symbol: '£' },
  { code: 'custom', label: 'Personalizada', symbol: null },
];

const DEFAULT_SETTINGS = { currency: 'COP', customSymbol: '$', decimals: true };
const STORAGE_KEY = 'presupuesto-data';

export default function MiPresupuesto() {
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState({ desc: '', amount: '', type: 'expense' });
  const firstLoad = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (parsed.transactions) setTransactions(parsed.transactions);
          if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
      } catch (e) {
        // no hay datos guardados todavía, no pasa nada
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (firstLoad.current) { firstLoad.current = false; }
    (async () => {
      try {
        const result = await window.storage.set(STORAGE_KEY, JSON.stringify({ transactions, settings }), false);
        if (!result) setLoadError(true);
        else setLoadError(false);
      } catch (e) {
        setLoadError(true);
      }
    })();
  }, [transactions, settings, loaded]);

  const currentCurrency = CURRENCIES.find(c => c.code === settings.currency) || CURRENCIES[0];
  const symbol = settings.currency === 'custom' ? (settings.customSymbol || '$') : currentCurrency.symbol;
  const frac = settings.decimals ? 2 : 0;

  const formatAmount = (value) => {
    const abs = Math.abs(value);
    const num = abs.toLocaleString('es-CO', { minimumFractionDigits: frac, maximumFractionDigits: frac });
    return `${symbol} ${num}`;
  };

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const addTransaction = () => {
    const trimmed = form.desc.trim();
    let amt = parseFloat(String(form.amount).replace(',', '.'));
    if (!trimmed || isNaN(amt) || amt <= 0) return;
    if (!settings.decimals) amt = Math.round(amt);
    const newT = { id: `t${Date.now()}`, desc: trimmed, amount: amt, type: form.type, date: new Date().toISOString() };
    setTransactions(prev => [newT, ...prev]);
    setForm({ desc: '', amount: '', type: form.type });
  };

  const removeTransaction = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

  const dateLabel = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="pp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .pp-root {
          --bg: #1b211f;
          --surface: #232b28;
          --surface-raised: #2b3431;
          --line: #384038;
          --paper: #ece7da;
          --paper-dim: #a9a89a;
          --income: #7fbf8f;
          --income-dim: #4d6b53;
          --expense: #d1685a;
          --expense-dim: #6b4038;
          --gold: #d8b26a;
          --radius: 10px;
          font-family: 'IBM Plex Sans', sans-serif;
          background: var(--bg);
          color: var(--paper);
          min-height: 100%;
          padding: 28px 18px 60px;
          background-image:
            linear-gradient(var(--line) 1px, transparent 1px);
          background-size: 100% 34px;
          background-attachment: local;
        }
        .pp-container { max-width: 560px; margin: 0 auto; }
        .pp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }
        .pp-title {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .pp-subtitle {
          font-size: 12.5px;
          color: var(--paper-dim);
          margin-top: 4px;
          letter-spacing: 0.02em;
        }
        .pp-gear {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 8px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--paper-dim);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .pp-gear:hover { color: var(--gold); border-color: var(--gold); }

        .pp-balance-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 22px 20px;
          margin-bottom: 16px;
        }
        .pp-balance-label {
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--paper-dim);
          margin-bottom: 6px;
        }
        .pp-balance-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 34px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--gold);
          word-break: break-all;
        }
        .pp-mini-row { display: flex; gap: 10px; margin-bottom: 20px; }
        .pp-mini-card {
          flex: 1;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pp-mini-icon { flex-shrink: 0; }
        .pp-mini-label { font-size: 11px; color: var(--paper-dim); letter-spacing: 0.04em; }
        .pp-mini-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 15px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .pp-form {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 22px;
        }
        .pp-type-toggle { display: flex; gap: 8px; margin-bottom: 10px; }
        .pp-type-btn {
          flex: 1;
          padding: 8px 10px;
          border-radius: 7px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--paper-dim);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .pp-type-btn.active.expense { background: var(--expense-dim); border-color: var(--expense); color: #f2d9d4; }
        .pp-type-btn.active.income { background: var(--income-dim); border-color: var(--income); color: #dcf0e0; }

        .pp-form-row { display: flex; gap: 8px; }
        .pp-input {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 7px;
          color: var(--paper);
          padding: 10px 12px;
          font-size: 14px;
          font-family: 'IBM Plex Sans', sans-serif;
          outline: none;
        }
        .pp-input:focus { border-color: var(--gold); }
        .pp-input.desc { flex: 1.6; min-width: 0; }
        .pp-input.amount { flex: 1; min-width: 0; font-family: 'IBM Plex Mono', monospace; }
        .pp-add-btn {
          background: var(--gold);
          color: #23291f;
          border: none;
          border-radius: 7px;
          width: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: filter 0.15s;
        }
        .pp-add-btn:hover { filter: brightness(1.08); }
        .pp-form-row2 { display: flex; gap: 8px; margin-top: 8px; }

        .pp-list-label {
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--paper-dim);
          margin-bottom: 10px;
        }
        .pp-tx {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 4px;
          border-bottom: 1px dashed var(--line);
        }
        .pp-tx-icon { flex-shrink: 0; }
        .pp-tx-desc { flex: 1; font-size: 14.5px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pp-tx-date { font-size: 11px; color: var(--paper-dim); }
        .pp-tx-amount {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14.5px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .pp-tx-amount.income { color: var(--income); }
        .pp-tx-amount.expense { color: var(--expense); }
        .pp-tx-del {
          background: none;
          border: none;
          color: var(--paper-dim);
          cursor: pointer;
          padding: 4px;
          display: flex;
          flex-shrink: 0;
        }
        .pp-tx-del:hover { color: var(--expense); }
        .pp-empty {
          text-align: center;
          color: var(--paper-dim);
          font-size: 13.5px;
          padding: 30px 10px;
          font-style: italic;
        }

        .pp-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 50;
        }
        .pp-modal {
          background: var(--surface-raised);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 22px;
          width: 100%;
          max-width: 380px;
        }
        .pp-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .pp-modal-title { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 600; }
        .pp-modal-close { background: none; border: none; color: var(--paper-dim); cursor: pointer; }
        .pp-field-label { font-size: 12px; color: var(--paper-dim); margin-bottom: 6px; letter-spacing: 0.03em; }
        .pp-select {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 7px;
          color: var(--paper);
          padding: 10px 12px;
          font-size: 14px;
          margin-bottom: 16px;
          outline: none;
        }
        .pp-select:focus { border-color: var(--gold); }
        .pp-decimal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .pp-decimal-desc { font-size: 12px; color: var(--paper-dim); margin-bottom: 16px; }
        .pp-switch {
          width: 42px;
          height: 24px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--bg);
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .pp-switch.on { background: var(--income-dim); border-color: var(--income); }
        .pp-switch-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--paper-dim);
          transition: transform 0.15s, background 0.15s;
        }
        .pp-switch.on .pp-switch-knob { transform: translateX(18px); background: var(--income); }
        .pp-preview {
          margin-top: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 20px;
          color: var(--gold);
          text-align: center;
          padding: 12px;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--line);
        }
        .pp-preview-label { font-size: 10.5px; color: var(--paper-dim); text-align: center; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 14px; margin-bottom: 6px; }
        .pp-warn { font-size: 11px; color: var(--expense); margin-top: 10px; }

        @media (max-width: 420px) {
          .pp-balance-value { font-size: 27px; }
        }
      `}</style>

      <div className="pp-container">
        <div className="pp-header">
          <div>
            <h1 className="pp-title">Mi Presupuesto</h1>
            <div className="pp-subtitle">Gestiona tus ingresos y gastos</div>
          </div>
          <button className="pp-gear" onClick={() => setShowSettings(true)} aria-label="Ajustes">
            <Settings size={18} />
          </button>
        </div>

        <div className="pp-balance-card">
          <div className="pp-balance-label">Saldo actual</div>
          <div className="pp-balance-value">{balance < 0 ? '-' : ''}{formatAmount(balance)}</div>
        </div>

        <div className="pp-mini-row">
          <div className="pp-mini-card">
            <TrendingUp size={18} color="var(--income)" className="pp-mini-icon" />
            <div>
              <div className="pp-mini-label">Ingresos</div>
              <div className="pp-mini-value" style={{ color: 'var(--income)' }}>{formatAmount(income)}</div>
            </div>
          </div>
          <div className="pp-mini-card">
            <TrendingDown size={18} color="var(--expense)" className="pp-mini-icon" />
            <div>
              <div className="pp-mini-label">Gastos</div>
              <div className="pp-mini-value" style={{ color: 'var(--expense)' }}>{formatAmount(expense)}</div>
            </div>
          </div>
        </div>

        <div className="pp-form">
          <div className="pp-type-toggle">
            <button
              className={`pp-type-btn expense ${form.type === 'expense' ? 'active expense' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
            >
              <ArrowDownCircle size={15} /> Gasto
            </button>
            <button
              className={`pp-type-btn income ${form.type === 'income' ? 'active income' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'income' }))}
            >
              <ArrowUpCircle size={15} /> Ingreso
            </button>
          </div>
          <div className="pp-form-row">
            <input
              className="pp-input desc"
              placeholder="Descripción"
              value={form.desc}
              onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addTransaction()}
            />
          </div>
          <div className="pp-form-row2">
            <input
              className="pp-input amount"
              placeholder={settings.decimals ? '0.00' : '0'}
              inputMode="decimal"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addTransaction()}
            />
            <button className="pp-add-btn" onClick={addTransaction} aria-label="Agregar">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="pp-list-label">Movimientos</div>
        {transactions.length === 0 ? (
          <div className="pp-empty">Todavía no has registrado movimientos.</div>
        ) : (
          transactions.map(t => (
            <div className="pp-tx" key={t.id}>
              {t.type === 'income'
                ? <ArrowUpCircle size={17} color="var(--income)" className="pp-tx-icon" />
                : <ArrowDownCircle size={17} color="var(--expense)" className="pp-tx-icon" />}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="pp-tx-desc">{t.desc}</div>
                <div className="pp-tx-date">{dateLabel(t.date)}</div>
              </div>
              <div className={`pp-tx-amount ${t.type}`}>
                {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
              </div>
              <button className="pp-tx-del" onClick={() => removeTransaction(t.id)} aria-label="Eliminar">
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}

        {loadError && (
          <div className="pp-warn">No se pudo guardar en este momento. Tus datos podrían no persistir.</div>
        )}
      </div>

      {showSettings && (
        <div className="pp-modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <div className="pp-modal-header">
              <div className="pp-modal-title">Ajustes</div>
              <button className="pp-modal-close" onClick={() => setShowSettings(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="pp-field-label">Moneda</div>
            <select
              className="pp-select"
              value={settings.currency}
              onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.label} {c.symbol ? `(${c.symbol})` : ''}
                </option>
              ))}
            </select>

            {settings.currency === 'custom' && (
              <>
                <div className="pp-field-label">Símbolo personalizado</div>
                <input
                  className="pp-select"
                  style={{ marginBottom: 16 }}
                  value={settings.customSymbol}
                  maxLength={4}
                  onChange={e => setSettings(s => ({ ...s, customSymbol: e.target.value }))}
                  placeholder="Ej: Bs, ¥, kr"
                />
              </>
            )}

            <div className="pp-decimal-row">
              <div className="pp-field-label" style={{ marginBottom: 0 }}>Mostrar decimales</div>
              <div
                className={`pp-switch ${settings.decimals ? 'on' : ''}`}
                onClick={() => setSettings(s => ({ ...s, decimals: !s.decimals }))}
                role="switch"
                aria-checked={settings.decimals}
              >
                <div className="pp-switch-knob" />
              </div>
            </div>
            <div className="pp-decimal-desc">
              {settings.decimals ? 'Los montos se mostrarán con centavos (ej: 45.50).' : 'Los montos se redondearán a números enteros (ej: 46).'}
            </div>

            <div className="pp-preview-label">Vista previa</div>
            <div className="pp-preview">{formatAmount(1234.5)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
