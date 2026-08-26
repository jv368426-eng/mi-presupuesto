import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar,
  Pencil, Search, X, Car, Fuel, Target, BarChart3, Check,
  AlertTriangle
} from "lucide-react";

const CATEGORIES_GASTO = ["Gasolina","Alimentos y bebidas","Mantenimiento","Parqueadero","Peajes","Otros"];
const CATEGORIES_INGRESO = ["UBER","INDRIVER","Extra","Otro"];

const C = {
  bg:"#080D18", card:"#0E1728", card2:"#111D31", cardGradTop:"#15243D",
  border:"#22314A", muted:"#7183A0", text:"#EAF0F7", green:"#34D399",
  greenSoft:"#86E8C1", blue:"#3B82F6", blueSoft:"#60A5FA",
  red:"#F87171", yellow:"#FBBF24", white:"#FFFFFF"
};

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(value)||0);
}
function todayStr() {
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function startOfWeek(dateStr) {
  const d=new Date(`${dateStr}T00:00:00`), day=d.getDay();
  d.setDate(d.getDate()+((day===0?-6:1)-day));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function monthStr(){ return todayStr().slice(0,7); }
function formatDate(date){
  if(!date)return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"});
}
const inputStyle={background:C.bg,border:`1px solid ${C.border}`,borderRadius:"0.65rem",padding:"0.7rem 0.8rem",fontSize:"0.875rem",color:C.text,outline:"none",width:"100%"};

function Button({children,onClick,variant="primary",disabled=false,style={}}){
  const styles={
    primary:{background:C.blue,color:C.white,border:`1px solid ${C.blue}`},
    secondary:{background:C.card2,color:C.text,border:`1px solid ${C.border}`},
    danger:{background:"transparent",color:C.red,border:`1px solid ${C.border}`},
    success:{background:C.green,color:C.bg,border:`1px solid ${C.green}`}
  };
  return <button onClick={onClick} disabled={disabled} style={{...styles[variant],borderRadius:"0.65rem",padding:"0.65rem 0.85rem",fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",...style}}>{children}</button>;
}

export default function App(){
  const [transactions,setTransactions]=useState([]);
  const [weeklyIncome,setWeeklyIncome]=useState(0);
  const [savingGoal,setSavingGoal]=useState(0);
  const [loaded,setLoaded]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [type,setType]=useState("gasto");
  const [amount,setAmount]=useState("");
  const [category,setCategory]=useState(CATEGORIES_GASTO[0]);
  const [note,setNote]=useState("");
  const [date,setDate]=useState(todayStr());
  const [editingIncome,setEditingIncome]=useState(false);
  const [incomeInput,setIncomeInput]=useState("");
  const [editingGoal,setEditingGoal]=useState(false);
  const [goalInput,setGoalInput]=useState("");
  const [editingId,setEditingId]=useState(null);
  const [search,setSearch]=useState("");
  const [filterType,setFilterType]=useState("todos");
  const [filterCategory,setFilterCategory]=useState("todas");

  useEffect(()=>{
    async function loadData(){
      try{
        if(window.storage?.get){
          const result=await window.storage.get("budget-data");
          if(result?.value){
            const p=JSON.parse(result.value);
            setTransactions(p.transactions||[]);
            setWeeklyIncome(p.weeklyIncome||0);
            setSavingGoal(p.savingGoal||0);
          }
        }else{
          const saved=localStorage.getItem("budget-data");
          if(saved){
            const p=JSON.parse(saved);
            setTransactions(p.transactions||[]);
            setWeeklyIncome(p.weeklyIncome||0);
            setSavingGoal(p.savingGoal||0);
          }
        }
      }catch(e){console.error("Error cargando datos:",e)}
      finally{setLoaded(true)}
    }
    loadData();
  },[]);

  async function persist(nextTransactions,nextWeeklyIncome=weeklyIncome,nextSavingGoal=savingGoal){
    const data={transactions:nextTransactions,weeklyIncome:nextWeeklyIncome,savingGoal:nextSavingGoal};
    setSaving(true);
    try{
      if(window.storage?.set) await window.storage.set("budget-data",JSON.stringify(data));
      else localStorage.setItem("budget-data",JSON.stringify(data));
      setMessage("Guardado ✓");
      setTimeout(()=>setMessage(""),1800);
    }catch(e){console.error("Error guardando datos:",e);setMessage("Error al guardar")}
    finally{setSaving(false)}
  }

  function changeType(newType){
    setType(newType);
    setCategory(newType==="gasto"?CATEGORIES_GASTO[0]:CATEGORIES_INGRESO[0]);
  }

  function addTransaction(){
    const num=Number(amount);
    if(!num||num<=0){setMessage("Ingresa un monto válido");return}
    if(!date){setMessage("Selecciona una fecha");return}
    if(editingId){
      const next=transactions.map(t=>t.id===editingId?{...t,type,amount:num,category,note:note.trim(),date}:t);
      setTransactions(next);persist(next);setEditingId(null);setAmount("");setNote("");setMessage("Movimiento actualizado ✓");setTimeout(()=>setMessage(""),1800);return;
    }
    const newTx={id:`${Date.now()}-${Math.random()}`,type,amount:num,category,note:note.trim(),date};
    const next=[newTx,...transactions];
    setTransactions(next);persist(next);setAmount("");setNote("");setMessage("Movimiento agregado ✓");setTimeout(()=>setMessage(""),1800);
  }

  function editTransaction(t){
    setEditingId(t.id);setType(t.type);setAmount(String(t.amount));setCategory(t.category);setNote(t.note||"");setDate(t.date);
    window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
  }
  function cancelEdit(){
    setEditingId(null);setAmount("");setNote("");setDate(todayStr());setType("gasto");setCategory(CATEGORIES_GASTO[0]);
  }
  function deleteTransaction(id){
    const next=transactions.filter(t=>t.id!==id);
    setTransactions(next);persist(next);setMessage("Movimiento eliminado");setTimeout(()=>setMessage(""),1800);
  }
  function saveIncome(){
    const num=Number(incomeInput), next=Number.isFinite(num)&&num>=0?num:0;
    setWeeklyIncome(next);persist(transactions,next,savingGoal);setEditingIncome(false);
  }
  function saveGoal(){
    const num=Number(goalInput), next=Number.isFinite(num)&&num>=0?num:0;
    setSavingGoal(next);persist(transactions,weeklyIncome,next);setEditingGoal(false);
  }

  const totals=useMemo(()=>{
    const ingresosRegistrados=transactions.filter(t=>t.type==="ingreso").reduce((s,t)=>s+Number(t.amount),0);
    const gastos=transactions.filter(t=>t.type==="gasto").reduce((s,t)=>s+Number(t.amount),0);
    const gasolina=transactions.filter(t=>t.type==="gasto"&&t.category==="Gasolina").reduce((s,t)=>s+Number(t.amount),0);
    return {ingresos:ingresosRegistrados+weeklyIncome,ingresosRegistrados,gastos,gasolina,balance:ingresosRegistrados+weeklyIncome-gastos};
  },[transactions,weeklyIncome]);

  const week=useMemo(()=>{
    const start=startOfWeek(todayStr()),days=[];
    for(let i=0;i<7;i++){
      const d=new Date(`${start}T00:00:00`);d.setDate(d.getDate()+i);
      const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const gasto=transactions.filter(t=>t.type==="gasto"&&t.date===iso).reduce((s,t)=>s+Number(t.amount),0);
      const ingreso=transactions.filter(t=>t.type==="ingreso"&&t.date===iso).reduce((s,t)=>s+Number(t.amount),0);
      days.push({iso,gasto,ingreso,label:d.toLocaleDateString("es-CO",{weekday:"short"}).replace(".","")});
    }
    return days;
  },[transactions]);

  const weeklyStats=useMemo(()=>{
    const start=startOfWeek(todayStr()),end=todayStr();
    const wt=transactions.filter(t=>t.date>=start&&t.date<=end);
    const income=wt.filter(t=>t.type==="ingreso").reduce((s,t)=>s+Number(t.amount),0);
    const expenses=wt.filter(t=>t.type==="gasto").reduce((s,t)=>s+Number(t.amount),0);
    const gasolina=wt.filter(t=>t.type==="gasto"&&t.category==="Gasolina").reduce((s,t)=>s+Number(t.amount),0);
    return {income,expenses,gasolina,profit:weeklyIncome+income-expenses};
  },[transactions,weeklyIncome]);

  const monthlyStats=useMemo(()=>{
    const current=transactions.filter(t=>t.date.startsWith(monthStr()));
    const income=current.filter(t=>t.type==="ingreso").reduce((s,t)=>s+Number(t.amount),0);
    const expenses=current.filter(t=>t.type==="gasto").reduce((s,t)=>s+Number(t.amount),0);
    return {income,expenses,profit:income-expenses};
  },[transactions]);

  const averageDailyExpense=useMemo(()=>{
    const start=startOfWeek(todayStr());
    const daysPassed=Math.max(1,Math.floor((new Date(`${todayStr()}T00:00:00`)-new Date(`${start}T00:00:00`))/86400000)+1);
    return weeklyStats.expenses/daysPassed;
  },[weeklyStats.expenses]);

  const savingProgress=useMemo(()=>savingGoal?Math.max(0,Math.min(100,(weeklyStats.profit/savingGoal)*100)):0,[weeklyStats.profit,savingGoal]);

  const filteredTransactions=useMemo(()=>transactions.filter(t=>{
    const q=search.toLowerCase();
    return (t.category.toLowerCase().includes(q)||(t.note||"").toLowerCase().includes(q)) &&
      (filterType==="todos"||t.type===filterType) &&
      (filterCategory==="todas"||t.category===filterCategory);
  }),[transactions,search,filterType,filterCategory]);

  const maxDia=Math.max(1,...week.map(d=>Math.max(d.gasto,d.ingreso))),maxBarPx=70;

  if(!loaded)return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.greenSoft,fontFamily:"monospace"}}>Cargando presupuesto...</div>;

  return <div style={{minHeight:"100vh",background:C.bg,color:C.text,paddingBottom:"3rem"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
      *{box-sizing:border-box}body{margin:0;background:${C.bg}}button,input,select{font-family:'Inter',sans-serif}
      input::placeholder{color:${C.muted}}select option{background:${C.bg};color:${C.text}}
      button{transition:all .15s ease}button:hover{filter:brightness(1.08)}
      .display{font-family:'Space Grotesk',sans-serif}.mono{font-family:'JetBrains Mono',monospace}
      @media(max-width:500px){.main-container{padding:1rem!important}.balance-number{font-size:1.65rem!important}.stats-grid{grid-template-columns:1fr 1fr!important}.filter-row,.form-row{flex-direction:column!important}.date-input{width:100%!important}}
    `}</style>

    <div className="main-container" style={{maxWidth:"720px",margin:"0 auto",padding:"2rem 1rem"}}>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
        <div><p className="mono" style={{color:C.muted,fontSize:"0.7rem",letterSpacing:"0.12em",textTransform:"uppercase",margin:0}}>Control financiero</p>
          <h1 className="display" style={{margin:"0.2rem 0 0",fontSize:"1.7rem",fontWeight:700}}>Mi Presupuesto</h1></div>
        <div style={{width:46,height:46,borderRadius:14,background:`${C.green}18`,border:`1px solid ${C.green}33`,display:"flex",alignItems:"center",justifyContent:"center"}}><Wallet color={C.green} size={25}/></div>
      </header>

      {message&&<div style={{background:`${C.green}15`,border:`1px solid ${C.green}35`,color:C.greenSoft,borderRadius:".65rem",padding:".7rem .8rem",marginBottom:"1rem",fontSize:".8rem",display:"flex",alignItems:"center",gap:".4rem"}}><Check size={15}/>{message}</div>}

      <section style={{background:`linear-gradient(135deg,${C.cardGradTop},${C.card})`,border:`1px solid ${C.border}`,borderRadius:"1.2rem",padding:"1.3rem",marginBottom:"1rem",boxShadow:"0 15px 40px rgba(0,0,0,.18)"}}>
        <p className="mono" style={{color:C.muted,fontSize:".7rem",textTransform:"uppercase",letterSpacing:".08em",margin:0}}>Balance disponible</p>
        <div className="display balance-number" style={{fontSize:"2.1rem",fontWeight:700,margin:".25rem 0 1.1rem",color:totals.balance>=0?C.green:C.red}}>{formatCOP(totals.balance)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem"}}>
          <MoneyBox icon={<TrendingUp size={13}/>} label="INGRESOS" value={formatCOP(totals.ingresos)} color={C.green}/>
          <MoneyBox icon={<TrendingDown size={13}/>} label="GASTOS" value={formatCOP(totals.gastos)} color={C.red}/>
        </div>
        {!editingIncome?<button onClick={()=>{setIncomeInput(String(weeklyIncome||""));setEditingIncome(true)}} style={{marginTop:"1rem",background:"none",border:"none",padding:0,color:C.muted,cursor:"pointer",textDecoration:"underline dotted",fontSize:".75rem"}}>Ingreso base semanal: <strong style={{color:C.text}}>{formatCOP(weeklyIncome)}</strong> · editar</button>:
        <div style={{display:"flex",gap:".5rem",marginTop:"1rem"}}><input type="number" autoFocus value={incomeInput} onChange={e=>setIncomeInput(e.target.value)} placeholder="Ingreso base semanal" className="mono" style={inputStyle}/><Button onClick={saveIncome} variant="success">Guardar</Button></div>}
      </section>

      <div className="stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:".6rem",marginBottom:"1rem"}}>
        <StatCard icon={<Car size={16}/>} label="Neto semana" value={formatCOP(weeklyStats.profit)} color={weeklyStats.profit>=0?C.green:C.red}/>
        <StatCard icon={<Fuel size={16}/>} label="Gasolina" value={formatCOP(weeklyStats.gasolina)} color={C.yellow}/>
        <StatCard icon={<Calendar size={16}/>} label="Promedio/día" value={formatCOP(averageDailyExpense)} color={C.blueSoft}/>
        <StatCard icon={<BarChart3 size={16}/>} label="Mes" value={formatCOP(monthlyStats.profit)} color={monthlyStats.profit>=0?C.green:C.red}/>
      </div>

      <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"1rem",padding:"1rem",marginBottom:"1rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:".5rem"}}><Target size={17} color={C.green}/><span style={{fontWeight:600,fontSize:".85rem"}}>Meta de ahorro semanal</span></div>{!editingGoal&&<button onClick={()=>{setGoalInput(String(savingGoal||""));setEditingGoal(true)}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:".72rem"}}>Editar</button>}</div>
        {editingGoal?<div style={{display:"flex",gap:".5rem",marginTop:".8rem"}}><input type="number" value={goalInput} onChange={e=>setGoalInput(e.target.value)} placeholder="Ej: 300000" className="mono" style={inputStyle}/><Button onClick={saveGoal} variant="success">Guardar</Button></div>:
        <>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:".8rem",fontSize:".75rem",color:C.muted}}><span>{formatCOP(Math.max(0,weeklyStats.profit))}</span><span>{savingGoal?formatCOP(savingGoal):"Sin meta"}</span></div>
          <div style={{height:7,background:C.bg,borderRadius:20,overflow:"hidden",marginTop:".4rem"}}><div style={{width:`${savingProgress}%`,height:"100%",background:C.green,borderRadius:20,transition:"width .3s ease"}}/></div>
          {savingGoal>0&&<p style={{color:savingProgress>=100?C.green:C.muted,fontSize:".7rem",margin:".5rem 0 0"}}>{savingProgress>=100?"🎯 Meta alcanzada":`${Math.round(savingProgress)}% completado`}</p>}
        </>}
      </section>

      {weeklyStats.expenses>weeklyIncome*.7&&weeklyIncome>0&&<div style={{display:"flex",gap:".6rem",alignItems:"flex-start",background:`${C.yellow}10`,border:`1px solid ${C.yellow}30`,borderRadius:".8rem",padding:".8rem",marginBottom:"1rem"}}><AlertTriangle size={17} color={C.yellow}/><div><p style={{margin:0,fontWeight:600,fontSize:".8rem",color:C.yellow}}>Gastos elevados</p><p style={{margin:".2rem 0 0",fontSize:".72rem",color:C.muted}}>Tus gastos ya superan el 70% de tu ingreso base semanal.</p></div></div>}

      <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"1rem",padding:"1.2rem",marginBottom:"1rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem"}}><div className="mono" style={{display:"flex",gap:".5rem",alignItems:"center",color:C.muted,fontSize:".7rem",textTransform:"uppercase"}}><Calendar size={14}/>Semana actual</div><div style={{display:"flex",gap:".7rem",fontSize:".62rem",color:C.muted}}><span><i style={{display:"inline-block",width:7,height:7,borderRadius:2,background:C.green,marginRight:4}}/>Ingreso</span><span><i style={{display:"inline-block",width:7,height:7,borderRadius:2,background:C.blue,marginRight:4}}/>Gasto</span></div></div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:".5rem",height:115}}>
          {week.map(d=>{const ingresoPx=d.ingreso>0?Math.max(6,Math.round(d.ingreso/maxDia*maxBarPx)):2,gastoPx=d.gasto>0?Math.max(6,Math.round(d.gasto/maxDia*maxBarPx)):2,isToday=d.iso===todayStr();return <div key={d.iso} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end"}}><div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:4,width:"100%",height:maxBarPx}}><div title={`Ingreso: ${formatCOP(d.ingreso)}`} style={{width:9,background:C.green,height:ingresoPx,borderRadius:"3px 3px 0 0"}}/><div title={`Gasto: ${formatCOP(d.gasto)}`} style={{width:9,background:C.blue,height:gastoPx,borderRadius:"3px 3px 0 0"}}/></div><span className="mono" style={{marginTop:".6rem",fontSize:".6rem",color:isToday?C.text:C.muted,fontWeight:isToday?700:400,textTransform:"capitalize"}}>{d.label}</span></div>})}
        </div>
      </section>

      <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"1rem",padding:"1.2rem",marginBottom:"1rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".8rem"}}><p className="mono" style={{margin:0,color:C.muted,fontSize:".7rem",textTransform:"uppercase"}}>{editingId?"Editar movimiento":"Nuevo movimiento"}</p>{editingId&&<button onClick={cancelEdit} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",display:"flex",gap:".3rem",alignItems:"center",fontSize:".72rem"}}><X size={14}/>Cancelar</button>}</div>
        <div style={{display:"flex",gap:".5rem",marginBottom:".7rem"}}><TypeButton active={type==="gasto"} onClick={()=>changeType("gasto")}>Gasto</TypeButton><TypeButton active={type==="ingreso"} onClick={()=>changeType("ingreso")}>Ingreso</TypeButton></div>
        <input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Monto en COP" className="mono" style={{...inputStyle,marginBottom:".55rem"}}/>
        <div className="form-row" style={{display:"flex",gap:".5rem",marginBottom:".55rem"}}><select value={category} onChange={e=>setCategory(e.target.value)} style={{...inputStyle,flex:1}}>{(type==="gasto"?CATEGORIES_GASTO:CATEGORIES_INGRESO).map(c=><option key={c} value={c}>{c}</option>)}</select><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mono date-input" style={{...inputStyle,width:"auto"}}/></div>
        <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="Nota opcional" style={{...inputStyle,marginBottom:".7rem"}}/>
        <Button onClick={addTransaction} variant="primary" style={{width:"100%"}}>{editingId?<><Check size={16}/>Actualizar movimiento</>:<><Plus size={17}/>Agregar movimiento</>}</Button>
      </section>

      <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"1rem",padding:"1rem",marginBottom:"1rem"}}>
        <div style={{position:"relative",marginBottom:".6rem"}}><Search size={16} color={C.muted} style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)"}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar movimiento..." style={{...inputStyle,paddingLeft:"2.2rem"}}/></div>
        <div className="filter-row" style={{display:"flex",gap:".5rem"}}><select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{...inputStyle,flex:1}}><option value="todos">Todos los movimientos</option><option value="ingreso">Solo ingresos</option><option value="gasto">Solo gastos</option></select><select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} style={{...inputStyle,flex:1}}><option value="todas">Todas las categorías</option>{[...new Set([...CATEGORIES_GASTO,...CATEGORIES_INGRESO])].map(c=><option key={c} value={c}>{c}</option>)}</select>{(search||filterType!=="todos"||filterCategory!=="todas")&&<Button variant="secondary" onClick={()=>{setSearch("");setFilterType("todos");setFilterCategory("todas")}} style={{padding:".6rem"}}><X size={16}/></Button>}</div>
      </section>

      <section>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".7rem",padding:"0 .2rem"}}><p className="mono" style={{color:C.muted,fontSize:".7rem",textTransform:"uppercase",margin:0}}>Movimientos</p><span style={{color:C.muted,fontSize:".7rem"}}>{filteredTransactions.length} registrados</span></div>
        {filteredTransactions.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"1rem",padding:"2rem 1rem",textAlign:"center",color:C.muted}}><Wallet size={30} strokeWidth={1.2} style={{marginBottom:".5rem",opacity:.5}}/><p style={{margin:0,fontSize:".85rem"}}>No hay movimientos que mostrar.</p></div>:
        <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>{filteredTransactions.map(t=><TransactionCard key={t.id} transaction={t} onEdit={editTransaction} onDelete={deleteTransaction}/>)}</div>}
      </section>

      <div style={{textAlign:"center",color:C.muted,fontSize:".65rem",marginTop:"2rem"}}>{saving?"Guardando datos...":"Tus datos se guardan automáticamente"}</div>
    </div>
  </div>;
}

function MoneyBox({icon,label,value,color}){return <div style={{background:`${color}0C`,border:`1px solid ${color}20`,borderRadius:".8rem",padding:".8rem"}}><div style={{color:C.muted,fontSize:".7rem",display:"flex",gap:".3rem",alignItems:"center"}}>{icon}{label}</div><div className="mono" style={{color,fontSize:".9rem",marginTop:".35rem"}}>{value}</div></div>}
function StatCard({icon,label,value,color}){return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:".85rem",padding:".75rem",minWidth:0}}><div style={{color,marginBottom:".35rem"}}>{icon}</div><p style={{margin:0,color:C.muted,fontSize:".62rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</p><p className="mono" style={{margin:".25rem 0 0",color:C.text,fontSize:".72rem",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{value}</p></div>}
function TypeButton({active,onClick,children}){return <button onClick={onClick} style={{flex:1,padding:".65rem",borderRadius:".6rem",border:`1px solid ${active?`${C.blue}66`:C.border}`,background:active?`${C.blue}18`:C.bg,color:active?C.blueSoft:C.muted,fontWeight:600,cursor:"pointer"}}>{children}</button>}
function TransactionCard({transaction,onEdit,onDelete}){
  const isIncome=transaction.type==="ingreso";
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:".9rem",padding:".85rem",display:"flex",justifyContent:"space-between",alignItems:"center",gap:".7rem"}}>
    <div style={{display:"flex",alignItems:"center",gap:".75rem",minWidth:0}}>
      <div style={{width:36,height:36,flexShrink:0,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:isIncome?`${C.green}15`:`${C.red}12`}}>{isIncome?<TrendingUp size={17} color={C.green}/>:<TrendingDown size={17} color={C.red}/>}</div>
      <div style={{minWidth:0}}><p style={{margin:0,fontWeight:600,fontSize:".82rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{transaction.category}</p><p style={{margin:".2rem 0 0",color:C.muted,fontSize:".68rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{formatDate(transaction.date)}{transaction.note?` · ${transaction.note}`:""}</p></div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:".5rem",flexShrink:0}}>
      <span className="mono" style={{color:isIncome?C.green:C.red,fontSize:".75rem",fontWeight:700}}>{isIncome?"+":"-"}{formatCOP(transaction.amount)}</span>
      <button onClick={()=>onEdit(transaction)} title="Editar" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:".2rem",display:"flex"}}><Pencil size={15}/></button>
      <button onClick={()=>onDelete(transaction.id)} title="Eliminar" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:".2rem",display:"flex"}}><Trash2 size={15}/></button>
    </div>
  </div>
}
