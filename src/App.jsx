import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar,
  Pencil, Search, X, Fuel, Target, BarChart3, Check,
  AlertTriangle, Home, ListChecks, PiggyBank, ChevronLeft, ChevronRight,
  Tags, Copy, RotateCcw
} from "lucide-react";

const DEFAULT_CATEGORIES = {
  gasto: ["Gasolina", "Alimentos y bebidas", "Mantenimiento", "Parqueadero", "Peajes", "Otros"],
  ingreso: ["UBER", "INDRIVER", "Extra", "Otro"]
};

const C = {
  bg: "#080D18", card: "#0E1728", card2: "#111D31", cardGradTop: "#15243D",
  border: "#22314A", muted: "#7183A0", text: "#EAF0F7", green: "#34D399",
  greenSoft: "#86E8C1", blue: "#3B82F6", blueSoft: "#60A5FA",
  purple: "#A78BFA", purpleSoft: "#C4B5FD",
  red: "#F87171", yellow: "#FBBF24", white: "#FFFFFF"
};

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value) || 0);
}
function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayStr() { return isoOf(new Date()); }
function startOfWeek(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`), day = d.getDay();
  d.setDate(d.getDate() + ((day === 0 ? -6 : 1) - day));
  return isoOf(d);
}
function addWeeks(weekStartIso, n) {
  const d = new Date(`${weekStartIso}T00:00:00`);
  d.setDate(d.getDate() + n * 7);
  return isoOf(d);
}
function endOfWeekFrom(weekStartIso) {
  const d = new Date(`${weekStartIso}T00:00:00`);
  d.setDate(d.getDate() + 6);
  return isoOf(d);
}
function monthStr() { return todayStr().slice(0, 7); }
function formatDate(date) {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function formatShort(date) {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}
function weekRangeLabel(weekStartIso) {
  const end = endOfWeekFrom(weekStartIso);
  const s = new Date(`${weekStartIso}T00:00:00`), e = new Date(`${end}T00:00:00`);
  const sameMonth = s.getMonth() === e.getMonth();
  const startPart = s.toLocaleDateString("es-CO", { day: "2-digit", month: sameMonth ? undefined : "short" });
  const endPart = e.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  return `${startPart} – ${endPart}`;
}

const DONUT_COLORS = [C.blue, C.green, C.purple, C.yellow, C.red, C.blueSoft, C.purpleSoft, C.greenSoft, "#F472B6", "#38BDF8"];

function categoryBreakdown(weekTx, kind, base) {
  const map = {};
  if (kind === "ingreso" && base > 0) map["Ingreso base"] = base;
  weekTx.filter(t => t.type === kind).forEach(t => { map[t.category] = (map[t.category] || 0) + Number(t.amount); });
  const entries = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const total = entries.reduce((s, e) => s + e.value, 0);
  return { entries, total };
}

const inputStyle = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: "0.65rem", padding: "0.7rem 0.8rem", fontSize: "0.875rem", color: C.text, outline: "none", width: "100%" };

function Button({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const styles = {
    primary: { background: C.blue, color: C.white, border: `1px solid ${C.blue}` },
    secondary: { background: C.card2, color: C.text, border: `1px solid ${C.border}` },
    danger: { background: "transparent", color: C.red, border: `1px solid ${C.border}` },
    success: { background: C.green, color: C.bg, border: `1px solid ${C.green}` },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` }
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], borderRadius: "0.65rem", padding: "0.65rem 0.85rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", ...style }}>{children}</button>;
}

const TABS = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "movimientos", label: "Movimientos", icon: ListChecks },
  { id: "presupuesto", label: "Presupuesto", icon: PiggyBank }
];

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [weeklyIncomes, setWeeklyIncomes] = useState({});
  const [savingGoal, setSavingGoal] = useState(0);
  const [monthlySavingGoal, setMonthlySavingGoal] = useState(0);
  const [spendingCaps, setSpendingCaps] = useState({});
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("inicio");

  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(todayStr()));
  const thisWeekStart = startOfWeek(todayStr());

  const [type, setType] = useState("gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES.gasto[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [editingId, setEditingId] = useState(null);

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterCategory, setFilterCategory] = useState("todas");

  const [newCatGasto, setNewCatGasto] = useState("");
  const [newCatIngreso, setNewCatIngreso] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        let raw = null;
        if (window.storage?.get) {
          const result = await window.storage.get("budget-data");
          raw = result?.value || null;
        } else {
          raw = localStorage.getItem("budget-data");
        }
        if (raw) {
          const p = JSON.parse(raw);
          setTransactions(p.transactions || []);
          let wi = p.weeklyIncomes;
          if (!wi) {
            wi = {};
            if (p.weeklyIncome) wi[startOfWeek(todayStr())] = p.weeklyIncome;
          }
          setWeeklyIncomes(wi);
          setSavingGoal(p.savingGoal || 0);
          setMonthlySavingGoal(p.monthlySavingGoal || 0);
          setSpendingCaps(p.spendingCaps || {});
          const cats = p.categories && p.categories.gasto?.length && p.categories.ingreso?.length ? p.categories : DEFAULT_CATEGORIES;
          setCategories(cats);
          setCategory(cats.gasto[0]);
        }
      } catch (e) { console.error("Error cargando datos:", e) }
      finally { setLoaded(true) }
    }
    loadData();
  }, []);

  async function persist(next) {
    const data = {
      transactions: next.transactions ?? transactions,
      weeklyIncomes: next.weeklyIncomes ?? weeklyIncomes,
      savingGoal: next.savingGoal ?? savingGoal,
      monthlySavingGoal: next.monthlySavingGoal ?? monthlySavingGoal,
      spendingCaps: next.spendingCaps ?? spendingCaps,
      categories: next.categories ?? categories
    };
    setSaving(true);
    try {
      if (window.storage?.set) await window.storage.set("budget-data", JSON.stringify(data));
      else localStorage.setItem("budget-data", JSON.stringify(data));
      setMessage("Guardado ✓");
      setTimeout(() => setMessage(""), 1800);
    } catch (e) { console.error("Error guardando datos:", e); setMessage("Error al guardar") }
    finally { setSaving(false) }
  }

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(""), 1800); }

  function changeType(newType) {
    setType(newType);
    setCategory(categories[newType][0] || "");
  }

  function addTransaction() {
    const num = Number(amount);
    if (!num || num <= 0) { flash("Ingresa un monto válido"); return }
    if (!date) { flash("Selecciona una fecha"); return }
    if (editingId) {
      const next = transactions.map(t => t.id === editingId ? { ...t, type, amount: num, category, note: note.trim(), date } : t);
      setTransactions(next); persist({ transactions: next }); setEditingId(null); setAmount(""); setNote(""); flash("Movimiento actualizado ✓"); return;
    }
    const newTx = { id: `${Date.now()}-${Math.random()}`, type, amount: num, category, note: note.trim(), date };
    const next = [newTx, ...transactions];
    setTransactions(next); persist({ transactions: next }); setAmount(""); setNote("");
    setSelectedWeekStart(startOfWeek(date));
    if (type === "gasto" && spendingCaps[category] > 0) {
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeekFrom(weekStart);
      const spent = next.filter(t => t.type === "gasto" && t.category === category && t.date >= weekStart && t.date <= weekEnd)
        .reduce((s, t) => s + Number(t.amount), 0);
      const cap = Number(spendingCaps[category]);
      if (spent >= cap) flash(`⚠️ Llegaste al 100% del tope de ${category}`);
      else if (spent >= cap * 0.9) flash(`⚠️ ${category} ya está al ${Math.round(spent / cap * 100)}% de su tope`);
      else flash("Movimiento agregado ✓");
    } else flash("Movimiento agregado ✓");
  }

  function editTransaction(t) {
    setEditingId(t.id); setType(t.type); setAmount(String(t.amount)); setCategory(t.category); setNote(t.note || ""); setDate(t.date);
    setActiveTab("movimientos");
  }
  function cancelEdit() {
    setEditingId(null); setAmount(""); setNote(""); setDate(todayStr()); setType("gasto"); setCategory(categories.gasto[0] || "");
  }
  function deleteTransaction(id) {
    const next = transactions.filter(t => t.id !== id);
    setTransactions(next); persist({ transactions: next }); flash("Movimiento eliminado");
  }

  function saveIncomeFor(weekStartIso) {
    const num = Number(incomeInput), val = Number.isFinite(num) && num >= 0 ? num : 0;
    const next = { ...weeklyIncomes, [weekStartIso]: val };
    setWeeklyIncomes(next); persist({ weeklyIncomes: next }); setEditingIncome(false);
    flash("Ingreso base actualizado ✓");
  }
  function saveGoal() {
    const num = Number(goalInput), next = Number.isFinite(num) && num >= 0 ? num : 0;
    setSavingGoal(next); persist({ savingGoal: next }); setEditingGoal(false);
    flash("Meta semanal actualizada ✓");
  }

  function saveMonthlyGoal(value) {
    const num = Number(value), next = Number.isFinite(num) && num >= 0 ? num : 0;
    setMonthlySavingGoal(next); persist({ monthlySavingGoal: next });
    flash("Meta mensual actualizada ✓");
  }

  function saveSpendingCap(categoryName, value) {
    const num = Number(value);
    const next = { ...spendingCaps, [categoryName]: Number.isFinite(num) && num > 0 ? num : 0 };
    setSpendingCaps(next); persist({ spendingCaps: next });
    flash(next[categoryName] > 0 ? `Tope de ${categoryName} actualizado ✓` : `Tope de ${categoryName} quitado`);
  }

  function addCategory(kind, value) {
    const name = value.trim();
    if (!name) return;
    if (categories[kind].some(c => c.toLowerCase() === name.toLowerCase())) { flash("Esa categoría ya existe"); return; }
    const next = { ...categories, [kind]: [...categories[kind], name] };
    setCategories(next); persist({ categories: next });
    if (kind === "gasto") setNewCatGasto(""); else setNewCatIngreso("");
    flash("Categoría agregada ✓");
  }
  function renameCategory(kind, oldName, newName) {
    const name = newName.trim();
    if (!name || name === oldName) return;
    const next = { ...categories, [kind]: categories[kind].map(c => c === oldName ? name : c) };
    setCategories(next);
    const nextTx = transactions.map(t => (t.type === kind && t.category === oldName) ? { ...t, category: name } : t);
    setTransactions(nextTx);
    persist({ categories: next, transactions: nextTx });
    if (category === oldName) setCategory(name);
    flash("Categoría renombrada ✓");
  }
  function deleteCategory(kind, name) {
    if (categories[kind].length <= 1) { flash("Debe quedar al menos una categoría"); return; }
    if (!confirm(`¿Eliminar la categoría "${name}"? Los movimientos existentes la conservarán como texto.`)) return;
    const next = { ...categories, [kind]: categories[kind].filter(c => c !== name) };
    setCategories(next); persist({ categories: next });
    if (category === name) setCategory(next[kind][0] || "");
    flash("Categoría eliminada");
  }

  function computeWeekStats(weekStartIso) {
    const start = weekStartIso, end = endOfWeekFrom(weekStartIso);
    const wt = transactions.filter(t => t.date >= start && t.date <= end);
    const income = wt.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = wt.filter(t => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
    const gasolina = wt.filter(t => t.type === "gasto" && t.category === "Gasolina").reduce((s, t) => s + Number(t.amount), 0);
    const base = weeklyIncomes[weekStartIso] || 0;
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(`${start}T00:00:00`); d.setDate(d.getDate() + i);
      const iso = isoOf(d);
      const g = transactions.filter(t => t.type === "gasto" && t.date === iso).reduce((s, t) => s + Number(t.amount), 0);
      const inc = transactions.filter(t => t.type === "ingreso" && t.date === iso).reduce((s, t) => s + Number(t.amount), 0);
      days.push({ iso, gasto: g, ingreso: inc, label: d.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "") });
    }
    return { start, end, base, income, expenses, gasolina, profit: base + income - expenses, days, count: wt.length };
  }

  const totals = useMemo(() => {
    const ingresosRegistrados = transactions.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
    const gastos = transactions.filter(t => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
    const baseIncomeTotal = Object.values(weeklyIncomes).reduce((s, v) => s + Number(v || 0), 0);
    return { ingresos: ingresosRegistrados + baseIncomeTotal, ingresosRegistrados, gastos, balance: ingresosRegistrados + baseIncomeTotal - gastos };
  }, [transactions, weeklyIncomes]);

  const currentWeekStats = useMemo(() => computeWeekStats(thisWeekStart), [transactions, weeklyIncomes, thisWeekStart]);
  const selectedWeekStats = useMemo(() => computeWeekStats(selectedWeekStart), [transactions, weeklyIncomes, selectedWeekStart]);

  const weeklyExpenseHistory = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const week = addWeeks(thisWeekStart, -(7 - i));
      const stats = computeWeekStats(week);
      return { ...stats, week };
    });
  }, [transactions, weeklyIncomes, thisWeekStart]);

  const monthlyStats = useMemo(() => {
    const m = monthStr();
    const current = transactions.filter(t => t.date.startsWith(m));
    const income = current.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = current.filter(t => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
    const baseIncome = Object.entries(weeklyIncomes).reduce((s, [week, value]) => {
      const weekEnd = endOfWeekFrom(week);
      return (week.slice(0,7) === m || weekEnd.slice(0,7) === m) ? s + Number(value || 0) : s;
    }, 0);
    return { income: income + baseIncome, expenses, profit: income + baseIncome - expenses };
  }, [transactions, weeklyIncomes]);

  const monthlySavingProgress = monthlySavingGoal
    ? Math.max(0, Math.min(100, (Math.max(0, monthlyStats.profit) / monthlySavingGoal) * 100))
    : 0;

  const averageDailyExpense = useMemo(() => {
    const daysPassed = Math.max(1, Math.floor((new Date(`${todayStr()}T00:00:00`) - new Date(`${thisWeekStart}T00:00:00`)) / 86400000) + 1);
    return currentWeekStats.expenses / daysPassed;
  }, [currentWeekStats.expenses, thisWeekStart]);

  const savingProgress = savingGoal ? Math.max(0, Math.min(100, (currentWeekStats.profit / savingGoal) * 100)) : 0;
  const selectedSavingProgress = savingGoal ? Math.max(0, Math.min(100, (selectedWeekStats.profit / savingGoal) * 100)) : 0;

  const weekTransactions = useMemo(() => transactions
    .filter(t => t.date >= selectedWeekStats.start && t.date <= selectedWeekStats.end)
    .sort((a, b) => b.date.localeCompare(a.date) || 0), [transactions, selectedWeekStats.start, selectedWeekStats.end]);

  const filteredTransactions = useMemo(() => weekTransactions.filter(t => {
    const q = search.toLowerCase();
    return (t.category.toLowerCase().includes(q) || (t.note || "").toLowerCase().includes(q)) &&
      (filterType === "todos" || t.type === filterType) &&
      (filterCategory === "todas" || t.category === filterCategory);
  }), [weekTransactions, search, filterType, filterCategory]);

  const allCategoryNames = useMemo(() => [...new Set([...categories.gasto, ...categories.ingreso])], [categories]);

  if (!loaded) return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.greenSoft }}>Cargando presupuesto...</div>;

  return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingBottom: "5.5rem" }}>
    <style>{`
      *{box-sizing:border-box}body{margin:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}button,input,select{font-family:inherit}
      input::placeholder{color:${C.muted}}select option{background:${C.bg};color:${C.text}}
      button{transition:all .15s ease}button:hover{filter:brightness(1.08)}
      .display{font-weight:700}.mono{font-variant-numeric:tabular-nums}
      .fade-in{animation:fadeIn .25s ease}
      @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      @media(max-width:500px){.main-container{padding:1rem!important}.balance-number{font-size:1.65rem!important}.stats-grid{grid-template-columns:1fr 1fr!important}.filter-row,.form-row{flex-direction:column!important}.date-input{width:100%!important}.pie-row{flex-direction:column!important}}
    `}</style>

    <div className="main-container" style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div><p className="mono" style={{ color: C.muted, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>Control financiero</p>
          <h1 className="display" style={{ margin: "0.2rem 0 0", fontSize: "1.7rem", fontWeight: 700 }}>Mi Presupuesto</h1></div>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: `${C.green}18`, border: `1px solid ${C.green}33`, display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet color={C.green} size={25} /></div>
      </header>

      {message && <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}35`, color: C.greenSoft, borderRadius: ".65rem", padding: ".7rem .8rem", marginBottom: "1rem", fontSize: ".8rem", display: "flex", alignItems: "center", gap: ".4rem" }}><Check size={15} />{message}</div>}

      {activeTab === "inicio" && <div className="fade-in">
        <InicioTab totals={totals} currentWeekStats={currentWeekStats} monthlyStats={monthlyStats} averageDailyExpense={averageDailyExpense}
          savingGoal={savingGoal} savingProgress={savingProgress} monthlySavingGoal={monthlySavingGoal} monthlySavingProgress={monthlySavingProgress} weeklyExpenseHistory={weeklyExpenseHistory} onGoToMovimientos={() => { setSelectedWeekStart(thisWeekStart); setActiveTab("movimientos"); }} />
      </div>}

      {activeTab === "movimientos" && <div className="fade-in">
        <MovimientosTab
          selectedWeekStart={selectedWeekStart} thisWeekStart={thisWeekStart}
          onPrevWeek={() => setSelectedWeekStart(w => addWeeks(w, -1))}
          onNextWeek={() => setSelectedWeekStart(w => addWeeks(w, 1))}
          onThisWeek={() => setSelectedWeekStart(thisWeekStart)}
          weekStats={selectedWeekStats} weekTransactions={weekTransactions}
          categories={categories} type={type} amount={amount} setAmount={setAmount}
          category={category} setCategory={setCategory} note={note} setNote={setNote}
          date={date} setDate={setDate} editingId={editingId} changeType={changeType}
          addTransaction={addTransaction} cancelEdit={cancelEdit}
          search={search} setSearch={setSearch} filterType={filterType} setFilterType={setFilterType}
          filterCategory={filterCategory} setFilterCategory={setFilterCategory}
          allCategoryNames={allCategoryNames}
          filteredTransactions={filteredTransactions}
          editTransaction={editTransaction} deleteTransaction={deleteTransaction}
        />
      </div>}

      {activeTab === "presupuesto" && <div className="fade-in">
        <PresupuestoTab
          selectedWeekStart={selectedWeekStart} thisWeekStart={thisWeekStart}
          onPrevWeek={() => setSelectedWeekStart(w => addWeeks(w, -1))}
          onNextWeek={() => setSelectedWeekStart(w => addWeeks(w, 1))}
          onThisWeek={() => setSelectedWeekStart(thisWeekStart)}
          weekStats={selectedWeekStats} weeklyIncomes={weeklyIncomes}
          editingIncome={editingIncome} setEditingIncome={setEditingIncome}
          incomeInput={incomeInput} setIncomeInput={setIncomeInput}
          saveIncomeFor={saveIncomeFor}
          savingGoal={savingGoal} editingGoal={editingGoal} setEditingGoal={setEditingGoal}
          goalInput={goalInput} setGoalInput={setGoalInput} saveGoal={saveGoal}
          monthlySavingGoal={monthlySavingGoal} saveMonthlyGoal={saveMonthlyGoal}
          selectedSavingProgress={selectedSavingProgress}
          spendingCaps={spendingCaps} saveSpendingCap={saveSpendingCap}
          categories={categories} newCatGasto={newCatGasto} setNewCatGasto={setNewCatGasto}
          newCatIngreso={newCatIngreso} setNewCatIngreso={setNewCatIngreso}
          addCategory={addCategory} renameCategory={renameCategory} deleteCategory={deleteCategory}
        />
      </div>}

      <div style={{ textAlign: "center", color: C.muted, fontSize: ".65rem", marginTop: "2rem" }}>{saving ? "Guardando datos..." : "Tus datos se guardan automáticamente"}</div>
    </div>

    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, background: `${C.card}F5`, backdropFilter: "blur(10px)",
      borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "center", zIndex: 900,
      paddingBottom: "env(safe-area-inset-bottom, 0px)"
    }}>
      <div style={{ display: "flex", width: "100%", maxWidth: 720 }}>
        {TABS.map(t => {
          const Icon = t.icon, active = activeTab === t.id;
          return <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer", padding: ".65rem 0 .6rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: ".25rem",
            color: active ? C.greenSoft : C.muted
          }}>
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: ".62rem", fontWeight: active ? 700 : 500 }}>{t.label}</span>
          </button>;
        })}
      </div>
    </nav>
  </div>;
}

function WeeklyExpenseHistory({ history }) {
  const max = Math.max(1, ...history.map(w => w.expenses));
  return <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1rem", marginBottom: "1rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".8rem" }}>
      <p style={{ margin: 0, fontSize: ".9rem", fontWeight: 600 }}>Gastos por semana</p>
      <span style={{ color: C.muted, fontSize: ".65rem" }}>Últimas 8 semanas</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
      {history.map((w, i) => {
        const current = i === history.length - 1;
        const pct = w.expenses ? Math.max(3, Math.round(w.expenses / max * 100)) : 0;
        return <div key={w.week} style={{ display: "grid", gridTemplateColumns: "92px 1fr 92px", gap: ".55rem", alignItems: "center" }}>
          <span style={{ fontSize: ".65rem", color: current ? C.text : C.muted, fontWeight: current ? 700 : 500 }}>{weekRangeLabel(w.week)}</span>
          <div style={{ height: 8, background: C.bg, borderRadius: 20, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: C.red, borderRadius: 20 }} /></div>
          <span className="mono" style={{ textAlign: "right", fontSize: ".68rem", color: w.expenses ? C.red : C.muted }}>{formatCOP(w.expenses)}</span>
        </div>;
      })}
    </div>
  </section>;
}

/* ---------- INICIO ---------- */
function InicioTab({ totals, currentWeekStats, monthlyStats, averageDailyExpense, savingGoal, savingProgress, monthlySavingGoal, monthlySavingProgress, weeklyExpenseHistory, onGoToMovimientos }) {
  const week = currentWeekStats.days;
  const maxDia = Math.max(1, ...week.map(d => Math.max(d.gasto, d.ingreso))), maxBarPx = 70;
  return <>
    <section style={{ background: `linear-gradient(135deg,${C.cardGradTop},${C.card})`, border: `1px solid ${C.border}`, borderRadius: "1.2rem", padding: "1.3rem", marginBottom: "1rem", boxShadow: "0 15px 40px rgba(0,0,0,.18)" }}>
      <p className="mono" style={{ color: C.muted, fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".08em", margin: 0 }}>Balance disponible</p>
      <div className="display balance-number" style={{ fontSize: "2.1rem", fontWeight: 700, margin: ".25rem 0 1.1rem", color: totals.balance >= 0 ? C.green : C.red }}>{formatCOP(totals.balance)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}>
        <MoneyBox icon={<TrendingUp size={13} />} label="INGRESOS" value={formatCOP(totals.ingresos)} color={C.green} />
        <MoneyBox icon={<TrendingDown size={13} />} label="GASTOS" value={formatCOP(totals.gastos)} color={C.red} />
      </div>
    </section>

    <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: ".6rem", marginBottom: "1rem" }}>
      <StatCard icon={<Wallet size={16} />} label="Neto semana" value={formatCOP(currentWeekStats.profit)} color={currentWeekStats.profit >= 0 ? C.green : C.red} />
      <StatCard icon={<Fuel size={16} />} label="Gasolina" value={formatCOP(currentWeekStats.gasolina)} color={C.yellow} />
      <StatCard icon={<Calendar size={16} />} label="Promedio/día" value={formatCOP(averageDailyExpense)} color={C.blueSoft} />
      <StatCard icon={<BarChart3 size={16} />} label="Mes" value={formatCOP(monthlyStats.profit)} color={monthlyStats.profit >= 0 ? C.green : C.red} />
    </div>

    <WeeklyExpenseHistory history={weeklyExpenseHistory} />
    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}><Target size={17} color={C.green} /><span style={{ fontWeight: 600, fontSize: ".85rem" }}>Meta de ahorro semanal</span></div></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".8rem", fontSize: ".75rem", color: C.muted }}><span>{formatCOP(Math.max(0, currentWeekStats.profit))}</span><span>{savingGoal ? formatCOP(savingGoal) : "Sin meta"}</span></div>
      <div style={{ height: 7, background: C.bg, borderRadius: 20, overflow: "hidden", marginTop: ".4rem" }}><div style={{ width: `${savingProgress}%`, height: "100%", background: C.green, borderRadius: 20, transition: "width .3s ease" }} /></div>
      {savingGoal > 0 && <p style={{ color: savingProgress >= 100 ? C.green : C.muted, fontSize: ".7rem", margin: ".5rem 0 0" }}>{savingProgress >= 100 ? "🎯 Meta alcanzada" : `${Math.round(savingProgress)}% completado`}</p>}
    </section>

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}><Target size={17} color={C.purpleSoft} /><span style={{ fontWeight: 600, fontSize: ".85rem" }}>Meta de ahorro mensual</span></div>
        <span className="mono" style={{ color: C.muted, fontSize: ".72rem" }}>{monthlySavingGoal ? formatCOP(monthlySavingGoal) : "Sin meta"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".8rem", fontSize: ".75rem", color: C.muted }}><span>{formatCOP(Math.max(0, monthlyStats.profit))}</span><span>{monthlySavingGoal ? `${Math.round(monthlySavingProgress)}%` : ""}</span></div>
      <div style={{ height: 7, background: C.bg, borderRadius: 20, overflow: "hidden", marginTop: ".4rem" }}><div style={{ width: `${monthlySavingProgress}%`, height: "100%", background: C.purple, borderRadius: 20 }} /></div>
      {monthlySavingGoal > 0 && <p style={{ color: monthlySavingProgress >= 100 ? C.green : C.muted, fontSize: ".7rem", margin: ".5rem 0 0" }}>{monthlySavingProgress >= 100 ? "🎯 Meta mensual alcanzada" : `${formatCOP(Math.max(0, monthlySavingGoal - Math.max(0, monthlyStats.profit)))} para alcanzar la meta`}</p>}
    </section>

    {currentWeekStats.expenses > currentWeekStats.base * .7 && currentWeekStats.base > 0 && <div style={{ display: "flex", gap: ".6rem", alignItems: "flex-start", background: `${C.yellow}10`, border: `1px solid ${C.yellow}30`, borderRadius: ".8rem", padding: ".8rem", marginBottom: "1rem" }}><AlertTriangle size={17} color={C.yellow} /><div><p style={{ margin: 0, fontWeight: 600, fontSize: ".8rem", color: C.yellow }}>Gastos elevados</p><p style={{ margin: ".2rem 0 0", fontSize: ".72rem", color: C.muted }}>Tus gastos ya superan el 70% de tu ingreso base semanal.</p></div></div>}

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}><div className="mono" style={{ display: "flex", gap: ".5rem", alignItems: "center", color: C.muted, fontSize: ".7rem", textTransform: "uppercase" }}><Calendar size={14} />Semana actual</div><div style={{ display: "flex", gap: ".7rem", fontSize: ".62rem", color: C.muted }}><span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: C.green, marginRight: 4 }} />Ingreso</span><span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: C.blue, marginRight: 4 }} />Gasto</span></div></div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: ".5rem", height: 115 }}>
        {week.map(d => { const ingresoPx = d.ingreso > 0 ? Math.max(6, Math.round(d.ingreso / maxDia * maxBarPx)) : 2, gastoPx = d.gasto > 0 ? Math.max(6, Math.round(d.gasto / maxDia * maxBarPx)) : 2, isToday = d.iso === todayStr(); return <div key={d.iso} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}><div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, width: "100%", height: maxBarPx }}><div title={`Ingreso: ${formatCOP(d.ingreso)}`} style={{ width: 9, background: C.green, height: ingresoPx, borderRadius: "3px 3px 0 0" }} /><div title={`Gasto: ${formatCOP(d.gasto)}`} style={{ width: 9, background: C.blue, height: gastoPx, borderRadius: "3px 3px 0 0" }} /></div><span className="mono" style={{ marginTop: ".6rem", fontSize: ".6rem", color: isToday ? C.text : C.muted, fontWeight: isToday ? 700 : 400, textTransform: "capitalize" }}>{d.label}</span></div> })}
      </div>
    </section>

    <Button onClick={onGoToMovimientos} variant="primary" style={{ width: "100%" }}><Plus size={17} />Agregar movimiento</Button>
  </>;
}

/* ---------- MOVIMIENTOS ---------- */
function MovimientosTab(props) {
  const {
    selectedWeekStart, thisWeekStart, onPrevWeek, onNextWeek, onThisWeek, weekStats, weekTransactions,
    categories, type, amount, setAmount, category, setCategory, note, setNote, date, setDate,
    editingId, changeType, addTransaction, cancelEdit,
    search, setSearch, filterType, setFilterType, filterCategory, setFilterCategory, allCategoryNames,
    filteredTransactions, editTransaction, deleteTransaction
  } = props;
  const isCurrent = selectedWeekStart === thisWeekStart;

  return <>
    <WeekNav selectedWeekStart={selectedWeekStart} isCurrent={isCurrent} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek} onThisWeek={onThisWeek} />

    <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".6rem", marginBottom: "1rem" }}>
      <StatCard icon={<TrendingUp size={16} />} label="Ingresos" value={formatCOP(weekStats.base + weekStats.income)} color={C.green} />
      <StatCard icon={<TrendingDown size={16} />} label="Gastos" value={formatCOP(weekStats.expenses)} color={C.red} />
      <StatCard icon={<Wallet size={16} />} label="Neto" value={formatCOP(weekStats.profit)} color={weekStats.profit >= 0 ? C.green : C.red} />
    </div>

    <DailyIncomeList days={weekStats.days} />
    <DailyExpenseList days={weekStats.days} total={weekStats.expenses} />

    <WeekPieCharts weekTx={weekTransactions} base={weekStats.base} />

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".8rem" }}><p className="mono" style={{ margin: 0, color: C.muted, fontSize: ".7rem", textTransform: "uppercase" }}>{editingId ? "Editar movimiento" : "Nuevo movimiento"}</p>{editingId && <button onClick={cancelEdit} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", gap: ".3rem", alignItems: "center", fontSize: ".72rem" }}><X size={14} />Cancelar</button>}</div>
      <div style={{ display: "flex", gap: ".5rem", marginBottom: ".7rem" }}><TypeButton active={type === "gasto"} onClick={() => changeType("gasto")}>Gasto</TypeButton><TypeButton active={type === "ingreso"} onClick={() => changeType("ingreso")}>Ingreso</TypeButton></div>
      <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monto en COP" className="mono" style={{ ...inputStyle, marginBottom: ".55rem" }} />
      <div className="form-row" style={{ display: "flex", gap: ".5rem", marginBottom: ".55rem" }}><select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, flex: 1 }}>{(type === "gasto" ? categories.gasto : categories.ingreso).map(c => <option key={c} value={c}>{c}</option>)}</select><input type="date" value={date} onChange={e => setDate(e.target.value)} className="mono date-input" style={{ ...inputStyle, width: "auto" }} /></div>
      <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Nota opcional" style={{ ...inputStyle, marginBottom: ".7rem" }} />
      <Button onClick={addTransaction} variant="primary" style={{ width: "100%" }}>{editingId ? <><Check size={16} />Actualizar movimiento</> : <><Plus size={17} />Agregar movimiento</>}</Button>
    </section>

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ position: "relative", marginBottom: ".6rem" }}><Search size={16} color={C.muted} style={{ position: "absolute", left: ".75rem", top: "50%", transform: "translateY(-50%)" }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en esta semana..." style={{ ...inputStyle, paddingLeft: "2.2rem" }} /></div>
      <div className="filter-row" style={{ display: "flex", gap: ".5rem" }}><select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, flex: 1 }}><option value="todos">Todos los movimientos</option><option value="ingreso">Solo ingresos</option><option value="gasto">Solo gastos</option></select><select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inputStyle, flex: 1 }}><option value="todas">Todas las categorías</option>{allCategoryNames.map(c => <option key={c} value={c}>{c}</option>)}</select>{(search || filterType !== "todos" || filterCategory !== "todas") && <Button variant="secondary" onClick={() => { setSearch(""); setFilterType("todos"); setFilterCategory("todas") }} style={{ padding: ".6rem" }}><X size={16} /></Button>}</div>
    </section>

    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".7rem", padding: "0 .2rem" }}><p className="mono" style={{ color: C.muted, fontSize: ".7rem", textTransform: "uppercase", margin: 0 }}>Movimientos</p><span style={{ color: C.muted, fontSize: ".7rem" }}>{filteredTransactions.length} registrados</span></div>
      {filteredTransactions.length === 0 ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "2rem 1rem", textAlign: "center", color: C.muted }}><Wallet size={30} strokeWidth={1.2} style={{ marginBottom: ".5rem", opacity: .5 }} /><p style={{ margin: 0, fontSize: ".85rem" }}>No hay movimientos en esta semana.</p></div> :
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>{filteredTransactions.map(t => <TransactionCard key={t.id} transaction={t} onEdit={editTransaction} onDelete={deleteTransaction} />)}</div>}
    </section>
  </>;
}

/* ---------- PRESUPUESTO ---------- */
function PresupuestoTab(props) {
  const {
    selectedWeekStart, thisWeekStart, onPrevWeek, onNextWeek, onThisWeek, weekStats, weeklyIncomes,
    editingIncome, setEditingIncome, incomeInput, setIncomeInput, saveIncomeFor,
    savingGoal, editingGoal, setEditingGoal, goalInput, setGoalInput, saveGoal, selectedSavingProgress,
    monthlySavingGoal, saveMonthlyGoal, spendingCaps, saveSpendingCap,
    categories, newCatGasto, setNewCatGasto, newCatIngreso, setNewCatIngreso, addCategory, renameCategory, deleteCategory
  } = props;
  const isCurrent = selectedWeekStart === thisWeekStart;
  const prevWeekIncome = weeklyIncomes[addWeeksStr(selectedWeekStart, -1)];
  const [monthlyInput, setMonthlyInput] = useState(String(monthlySavingGoal || ""));

  return <>
    <WeekNav selectedWeekStart={selectedWeekStart} isCurrent={isCurrent} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek} onThisWeek={onThisWeek} />

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".3rem" }}><Wallet size={17} color={C.blueSoft} /><span style={{ fontWeight: 600, fontSize: ".85rem" }}>Ingreso base de la semana</span></div>
      <p style={{ margin: "0 0 .8rem", fontSize: ".72rem", color: C.muted }}>Dinero fijo que entra sin importar los movimientos registrados (por ejemplo, un sueldo o un aporte fijo).</p>
      {!editingIncome ? <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text }}>{formatCOP(weekStats.base)}</span>
        <Button variant="secondary" onClick={() => { setIncomeInput(String(weekStats.base || "")); setEditingIncome(true) }}><Pencil size={14} />Editar</Button>
      </div> : <div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <input type="number" autoFocus value={incomeInput} onChange={e => setIncomeInput(e.target.value)} placeholder="Ingreso base semanal" className="mono" style={inputStyle} />
          <Button onClick={() => saveIncomeFor(selectedWeekStart)} variant="success">Guardar</Button>
        </div>
        {prevWeekIncome != null && <button onClick={() => setIncomeInput(String(prevWeekIncome))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: ".7rem", marginTop: ".6rem", display: "flex", alignItems: "center", gap: ".3rem" }}><Copy size={12} />Usar el de la semana anterior ({formatCOP(prevWeekIncome)})</button>}
      </div>}
    </section>

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}><Target size={17} color={C.green} /><span style={{ fontWeight: 600, fontSize: ".85rem" }}>Meta de ahorro semanal</span></div>{!editingGoal && <button onClick={() => { setGoalInput(String(savingGoal || "")); setEditingGoal(true) }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: ".72rem" }}>Editar</button>}</div>
      {editingGoal ? <div style={{ display: "flex", gap: ".5rem", marginTop: ".8rem" }}><input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="Ej: 300000" className="mono" style={inputStyle} /><Button onClick={saveGoal} variant="success">Guardar</Button></div> :
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".8rem", fontSize: ".75rem", color: C.muted }}><span>{formatCOP(Math.max(0, weekStats.profit))}</span><span>{savingGoal ? formatCOP(savingGoal) : "Sin meta"}</span></div>
          <div style={{ height: 7, background: C.bg, borderRadius: 20, overflow: "hidden", marginTop: ".4rem" }}><div style={{ width: `${selectedSavingProgress}%`, height: "100%", background: C.green, borderRadius: 20, transition: "width .3s ease" }} /></div>
          {savingGoal > 0 && <p style={{ color: selectedSavingProgress >= 100 ? C.green : C.muted, fontSize: ".7rem", margin: ".5rem 0 0" }}>{selectedSavingProgress >= 100 ? "🎯 Meta alcanzada esta semana" : `${Math.round(selectedSavingProgress)}% completado esta semana`}</p>}
          <p style={{ color: C.muted, fontSize: ".65rem", margin: ".5rem 0 0" }}>La meta aplica igual a todas las semanas, para poder comparar tu avance.</p>
        </>}
    </section>

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}><Target size={17} color={C.purpleSoft} /><span style={{ fontWeight: 600, fontSize: ".85rem" }}>Meta de ahorro mensual</span></div>
        <span className="mono" style={{ color: C.muted, fontSize: ".72rem" }}>{monthlySavingGoal ? formatCOP(monthlySavingGoal) : "Sin meta"}</span>
      </div>
      <div style={{ display: "flex", gap: ".5rem", marginTop: ".8rem" }}>
        <input type="number" min="0" value={monthlyInput} onChange={e => setMonthlyInput(e.target.value)} placeholder="Ej: 1000000" className="mono" style={inputStyle} />
        <Button variant="success" onClick={() => saveMonthlyGoal(monthlyInput)}>Guardar</Button>
      </div>
      <p style={{ margin: ".5rem 0 0", color: C.muted, fontSize: ".65rem" }}>Define cuánto quieres ahorrar durante todo el mes.</p>
    </section>

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".8rem" }}><Target size={17} color={C.red} /><span style={{ fontWeight: 600, fontSize: ".85rem" }}>Topes de gastos por categoría</span></div>
      <p style={{ margin: "0 0 .8rem", color: C.muted, fontSize: ".68rem" }}>El tope se controla por semana. Al llegar al 90% recibirás una alerta.</p>
      <SpendingCapsManager categories={categories.gasto} spendingCaps={spendingCaps} onSave={saveSpendingCap} />
    </section>

    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".9rem" }}><Tags size={17} color={C.purpleSoft} /><span style={{ fontWeight: 600, fontSize: ".85rem" }}>Categorías personalizadas</span></div>
      <CategoryManager kind="gasto" title="Categorías de gastos" color={C.red} categories={categories.gasto} newValue={newCatGasto} setNewValue={setNewCatGasto} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} />
      <div style={{ height: 1, background: C.border, margin: "1rem 0" }} />
      <CategoryManager kind="ingreso" title="Categorías de ingresos" color={C.green} categories={categories.ingreso} newValue={newCatIngreso} setNewValue={setNewCatIngreso} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} />
    </section>
  </>;
}

function addWeeksStr(iso, n) { return addWeeks(iso, n); }

function DailyExpenseList({ days, total }) {
  const maxGasto = Math.max(1, ...days.map(d => d.gasto));
  return <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Gastos de la semana</p>
      <span className="mono" style={{ fontSize: ".75rem", color: C.red, fontWeight: 600 }}>{formatCOP(total)}</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
      {days.map(d => {
        const pct = d.gasto > 0 ? Math.max(4, Math.round((d.gasto / maxGasto) * 100)) : 0;
        const isToday = d.iso === todayStr();
        return <div key={d.iso} style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
          <span style={{ width: 38, flexShrink: 0, fontSize: ".72rem", color: isToday ? C.text : C.muted, fontWeight: isToday ? 700 : 500, textTransform: "capitalize" }}>{d.label}</span>
          <div style={{ flex: 1, height: 8, background: C.bg, borderRadius: 20, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: C.red, borderRadius: 20 }} /></div>
          <span className="mono" style={{ width: 88, flexShrink: 0, textAlign: "right", fontSize: ".72rem", color: d.gasto > 0 ? C.red : C.muted }}>{formatCOP(d.gasto)}</span>
        </div>;
      })}
    </div>
  </section>;
}

function SpendingCapsManager({ categories, spendingCaps, onSave }) {
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");
  return <div style={{ display: "flex", flexDirection: "column", gap: ".45rem" }}>
    {categories.map(c => editing === c ? (
      <div key={c} style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
        <span style={{ flex: 1, fontSize: ".8rem" }}>{c}</span>
        <input autoFocus type="number" min="0" value={value} onChange={e => setValue(e.target.value)} placeholder="Tope semanal" className="mono" style={{ ...inputStyle, width: 150 }} />
        <Button variant="success" style={{ padding: ".55rem" }} onClick={() => { onSave(c, value); setEditing(null); }}><Check size={15} /></Button>
        <Button variant="ghost" style={{ padding: ".55rem" }} onClick={() => setEditing(null)}><X size={15} /></Button>
      </div>
    ) : (
      <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, border: `1px solid ${C.border}`, borderRadius: ".6rem", padding: ".6rem .7rem" }}>
        <div><span style={{ fontSize: ".8rem", fontWeight: 600 }}>{c}</span><div style={{ color: C.muted, fontSize: ".65rem", marginTop: ".15rem" }}>{spendingCaps[c] > 0 ? `Tope: ${formatCOP(spendingCaps[c])} / semana` : "Sin tope"}</div></div>
        <button onClick={() => { setEditing(c); setValue(String(spendingCaps[c] || "")); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: ".2rem", display: "flex" }}><Pencil size={14} /></button>
      </div>
    ))}
  </div>;
}

function CategoryManager({ kind, title, color, categories, newValue, setNewValue, onAdd, onRename, onDelete }) {
  const [editingName, setEditingName] = useState(null);
  const [editValue, setEditValue] = useState("");
  return <div>
    <p className="mono" style={{ margin: "0 0 .6rem", fontSize: ".68rem", color: C.muted, textTransform: "uppercase" }}>{title}</p>
    <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", marginBottom: ".7rem" }}>
      {categories.map(c => editingName === c ? (
        <div key={c} style={{ display: "flex", gap: ".4rem" }}>
          <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <Button variant="success" style={{ padding: ".55rem" }} onClick={() => { onRename(kind, c, editValue); setEditingName(null) }}><Check size={15} /></Button>
          <Button variant="ghost" style={{ padding: ".55rem" }} onClick={() => setEditingName(null)}><X size={15} /></Button>
        </div>
      ) : (
        <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, border: `1px solid ${C.border}`, borderRadius: ".6rem", padding: ".55rem .7rem" }}>
          <span style={{ fontSize: ".8rem", display: "flex", alignItems: "center", gap: ".5rem" }}><i style={{ width: 7, height: 7, borderRadius: 2, background: color, display: "inline-block" }} />{c}</span>
          <div style={{ display: "flex", gap: ".3rem" }}>
            <button onClick={() => { setEditingName(c); setEditValue(c) }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: ".2rem", display: "flex" }}><Pencil size={14} /></button>
            <button onClick={() => onDelete(kind, c)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: ".2rem", display: "flex" }}><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", gap: ".4rem" }}>
      <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Nueva categoría..." style={{ ...inputStyle, flex: 1 }}
        onKeyDown={e => { if (e.key === "Enter") onAdd(kind, newValue) }} />
      <Button variant="secondary" onClick={() => onAdd(kind, newValue)}><Plus size={15} /></Button>
    </div>
  </div>;
}

function Donut({ entries, total, size = 120 }) {
  if (!total) return <div style={{ width: size, height: size, borderRadius: "50%", border: `1px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <span style={{ fontSize: ".62rem", color: C.muted, textAlign: "center", padding: "0 .5rem" }}>Sin datos</span>
  </div>;
  let cum = 0;
  const stops = entries.map((e, i) => {
    const start = (cum / total) * 360; cum += e.value; const end = (cum / total) * 360;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}deg ${end}deg`;
  }).join(", ");
  return <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${stops})`, position: "relative", flexShrink: 0 }}>
    <div style={{ position: "absolute", inset: size * 0.16, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <span className="mono" style={{ fontSize: ".68rem", fontWeight: 700, color: C.text }}>{formatCOP(total)}</span>
    </div>
  </div>;
}

function CategoryPie({ title, kind, weekTx, base, accent }) {
  const { entries, total } = categoryBreakdown(weekTx, kind, base);
  return <div style={{ flex: "1 1 220px", minWidth: 0 }}>
    <p className="mono" style={{ margin: "0 0 .7rem", fontSize: ".68rem", color: C.muted, textTransform: "uppercase", display: "flex", alignItems: "center", gap: ".4rem" }}><i style={{ width: 7, height: 7, borderRadius: 2, background: accent, display: "inline-block" }} />{title}</p>
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <Donut entries={entries} total={total} />
      <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", minWidth: 0, flex: 1 }}>
        {entries.length === 0 ? <span style={{ fontSize: ".72rem", color: C.muted }}>Nada registrado esta semana.</span> :
          entries.slice(0, 6).map((e, i) => <div key={e.name} style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", fontSize: ".7rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: ".4rem", minWidth: 0, color: C.text }}><i style={{ width: 7, height: 7, borderRadius: 2, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0, display: "inline-block" }} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</span></span>
            <span className="mono" style={{ color: C.muted, flexShrink: 0 }}>{Math.round((e.value / total) * 100)}%</span>
          </div>)}
      </div>
    </div>
  </div>;
}

function WeekPieCharts({ weekTx, base }) {
  return <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
    <p className="display" style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>Cómo se movió tu dinero esta semana</p>
    <div className="pie-row" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
      <CategoryPie title="Gastado por categoría" kind="gasto" weekTx={weekTx} base={0} accent={C.red} />
      <CategoryPie title="Ingresado por categoría" kind="ingreso" weekTx={weekTx} base={base} accent={C.green} />
    </div>
  </section>;
}

function DailyIncomeList({ days }) {
  const maxIngreso = Math.max(1, ...days.map(d => d.ingreso));
  const total = days.reduce((s, d) => s + d.ingreso, 0);
  return <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Ingreso diario</p>
      <span className="mono" style={{ fontSize: ".75rem", color: C.greenSoft, fontWeight: 600 }}>{formatCOP(total)}</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
      {days.map(d => {
        const pct = d.ingreso > 0 ? Math.max(4, Math.round((d.ingreso / maxIngreso) * 100)) : 0;
        const isToday = d.iso === todayStr();
        return <div key={d.iso} style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
          <span style={{ width: 38, flexShrink: 0, fontSize: ".72rem", color: isToday ? C.text : C.muted, fontWeight: isToday ? 700 : 500, textTransform: "capitalize" }}>{d.label}</span>
          <div style={{ flex: 1, height: 8, background: C.bg, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: C.green, borderRadius: 20, transition: "width .3s ease" }} />
          </div>
          <span className="mono" style={{ width: 88, flexShrink: 0, textAlign: "right", fontSize: ".72rem", color: d.ingreso > 0 ? C.greenSoft : C.muted }}>{formatCOP(d.ingreso)}</span>
        </div>;
      })}
    </div>
  </section>;
}

/* ---------- SHARED PIECES ---------- */
function WeekNav({ selectedWeekStart, isCurrent, onPrevWeek, onNextWeek, onThisWeek }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: ".6rem .7rem", marginBottom: "1rem" }}>
    <button onClick={onPrevWeek} title="Semana anterior" style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: ".55rem", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: C.text, cursor: "pointer" }}><ChevronLeft size={17} /></button>
    <div style={{ textAlign: "center" }}>
      <p className="mono" style={{ margin: 0, fontSize: ".78rem", fontWeight: 700, color: C.text }}>{weekRangeLabel(selectedWeekStart)}</p>
      {isCurrent ? <p style={{ margin: ".15rem 0 0", fontSize: ".65rem", color: C.greenSoft }}>Semana actual</p> :
        <button onClick={onThisWeek} style={{ background: "none", border: "none", color: C.muted, fontSize: ".65rem", cursor: "pointer", textDecoration: "underline dotted", marginTop: ".15rem", display: "flex", alignItems: "center", gap: ".25rem", margin: ".15rem auto 0" }}><RotateCcw size={11} />Ir a la semana actual</button>}
    </div>
    <button onClick={onNextWeek} title="Semana siguiente" style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: ".55rem", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: C.text, cursor: "pointer" }}><ChevronRight size={17} /></button>
  </div>;
}

function MoneyBox({ icon, label, value, color }) { return <div style={{ background: `${color}0C`, border: `1px solid ${color}20`, borderRadius: ".8rem", padding: ".8rem" }}><div style={{ color: C.muted, fontSize: ".7rem", display: "flex", gap: ".3rem", alignItems: "center" }}>{icon}{label}</div><div className="mono" style={{ color, fontSize: ".9rem", marginTop: ".35rem" }}>{value}</div></div> }
function StatCard({ icon, label, value, color }) { return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: ".85rem", padding: ".75rem", minWidth: 0 }}><div style={{ color, marginBottom: ".35rem" }}>{icon}</div><p style={{ margin: 0, color: C.muted, fontSize: ".62rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p><p className="mono" style={{ margin: ".25rem 0 0", color: C.text, fontSize: ".72rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</p></div> }
function TypeButton({ active, onClick, children }) { return <button onClick={onClick} style={{ flex: 1, padding: ".65rem", borderRadius: ".6rem", border: `1px solid ${active ? `${C.blue}66` : C.border}`, background: active ? `${C.blue}18` : C.bg, color: active ? C.blueSoft : C.muted, fontWeight: 600, cursor: "pointer" }}>{children}</button> }
function TransactionCard({ transaction, onEdit, onDelete }) {
  const isIncome = transaction.type === "ingreso";
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: ".9rem", padding: ".85rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".7rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: ".75rem", minWidth: 0 }}>
      <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: isIncome ? `${C.green}15` : `${C.red}12` }}>{isIncome ? <TrendingUp size={17} color={C.green} /> : <TrendingDown size={17} color={C.red} />}</div>
      <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontWeight: 600, fontSize: ".82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{transaction.category}</p><p style={{ margin: ".2rem 0 0", color: C.muted, fontSize: ".68rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formatDate(transaction.date)}{transaction.note ? ` · ${transaction.note}` : ""}</p></div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexShrink: 0 }}>
      <span className="mono" style={{ color: isIncome ? C.green : C.red, fontSize: ".75rem", fontWeight: 700 }}>{isIncome ? "+" : "-"}{formatCOP(transaction.amount)}</span>
      <button onClick={() => onEdit(transaction)} title="Editar" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: ".2rem", display: "flex" }}><Pencil size={15} /></button>
      <button onClick={() => onDelete(transaction.id)} title="Eliminar" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: ".2rem", display: "flex" }}><Trash2 size={15} /></button>
    </div>
  </div>
}
