import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine, PieChart, Pie, ComposedChart, Line } from "recharts";
import { TrendingUp, ShoppingCart, BarChart2, DollarSign, AlertTriangle, Package, CheckCircle, Clock, XCircle, Plus, Save, Trash2, ChevronDown, ChevronUp, Edit2, Sun, Moon, Archive, ArrowUpRight, ArrowDownRight, Minus, Calendar, Download, Home as HomeIcon, Maximize2, X, Menu, LogOut, UserPlus, Shield, User, Eye, EyeOff, Lock, Users as UsersIcon } from "lucide-react";

// ─── CSS Global ───────────────────────────────────────────────
function useGlobalCSS() {
  useEffect(() => {
    if (document.getElementById("dg-css")) return;
    const el = document.createElement("style");
    el.id = "dg-css";
    el.textContent = `
      @keyframes shimmer {
        0%   { background-position: -400% 0 }
        100% { background-position:  400% 0 }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(10px) }
        to   { opacity: 1; transform: translateY(0) }
      }
      @keyframes toastIn {
        from { opacity: 0; transform: translateY(12px) scale(.95) }
        to   { opacity: 1; transform: translateY(0) scale(1) }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateY(0) scale(1) }
        to   { opacity: 0; transform: translateY(8px) scale(.95) }
      }
      @keyframes emptyPulse {
        0%,100% { transform: scale(1); opacity: .85 }
        50%     { transform: scale(1.05); opacity: 1 }
      }
      .dg-lift {
        transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        cursor: default;
      }
      .dg-lift:hover {
        transform: translateY(-4px) scale(1.012);
        box-shadow: 0 14px 32px rgba(0,0,0,.26);
      }
      .dg-toast {
        animation: toastIn .25s ease;
      }
      .dg-toast.dg-toast-leaving {
        animation: toastOut .2s ease forwards;
      }
      .dg-empty-icon {
        animation: emptyPulse 2.6s ease-in-out infinite;
      }
      .dg-page { animation: fadeUp .28s ease; }
      .dg-btn  { transition: opacity .15s, transform .12s; }
      .dg-btn:active { transform: scale(.96); }

      /* ── Responsive grids ─────────────────────────────── */
      .dg-grid-2 { grid-template-columns: repeat(2,1fr); }
      .dg-grid-3 { grid-template-columns: repeat(3,1fr); }
      .dg-grid-4 { grid-template-columns: repeat(4,1fr); }
      .dg-grid-5 { grid-template-columns: repeat(5,1fr); }
      .dg-grid-6 { grid-template-columns: repeat(6,1fr); }

      /* ── Sidebar / hamburger (mobile) ─────────────────── */
      .dg-hamburger { display: none; }
      .dg-overlay   { display: none; }

      @media (max-width: 1024px) {
        .dg-grid-4, .dg-grid-5, .dg-grid-6 { grid-template-columns: repeat(3,1fr); }
      }
      @media (max-width: 768px) {
        .dg-grid-3, .dg-grid-4, .dg-grid-5, .dg-grid-6 { grid-template-columns: repeat(2,1fr); }
        .dg-hamburger { display: flex !important; }
        .dg-sidebar {
          position: fixed; left: 0; top: 0; height: 100vh; z-index: 200;
          transform: translateX(-100%);
          transition: transform .22s ease;
        }
        .dg-sidebar.dg-sidebar-open { transform: translateX(0); box-shadow: 0 0 32px rgba(0,0,0,.4); }
        .dg-main { margin-left: 0 !important; }
        .dg-overlay.dg-overlay-open {
          display: block; position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 150;
        }
        .dg-topbar-label { display: none; }
        .dg-present { padding: 16px !important; }
      }
      @media (max-width: 520px) {
        .dg-grid-2, .dg-grid-3, .dg-grid-4, .dg-grid-5, .dg-grid-6 { grid-template-columns: repeat(1,1fr); }
      }

      @media print {
        .no-print { display: none !important; }
        .dg-main  { margin-left: 0 !important; }
        @page { margin: 10mm; size: A4 landscape; }
      }
    `;
    document.head.appendChild(el);
  }, []);
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skelet({ w = "100%", h = 18, r = 6, T }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: `linear-gradient(90deg, ${T.border} 25%, ${T.card2} 50%, ${T.border} 75%)`,
      backgroundSize: "400% 100%",
      animation: "shimmer 1.6s infinite",
    }} />
  );
}

function SkeletonCard({ T }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Skelet w={110} h={11} r={4} T={T} />
        <Skelet w={32} h={32} r={8} T={T} />
      </div>
      <Skelet w="70%" h={26} r={6} T={T} />
      <div style={{ marginTop: 10 }}><Skelet w="50%" h={10} r={4} T={T} /></div>
      <div style={{ marginTop: 14 }}><Skelet w="100%" h={5} r={3} T={T} /></div>
    </div>
  );
}

function SkeletonChart({ T }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <Skelet w={160} h={14} r={4} T={T} />
        <div style={{ display: "flex", gap: 8 }}>
          {[80, 80, 80, 100, 110].map((w, i) => <Skelet key={i} w={w} h={28} r={20} T={T} />)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
        {[60, 90, 50, 120, 80, 140, 70, 110, 55, 130].map((h, i) => (
          <div key={i} style={{ flex: 1, borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
            <Skelet w="100%" h={h} r={4} T={T} />
          </div>
        ))}
      </div>
    </div>
  );
}

const THEMES = {
  dark:  { bg:"#0f172a", card:"#1e293b", card2:"#162032", border:"#334155", text:"#f1f5f9", sub:"#94a3b8", muted:"#64748b", faint:"#475569", inputBg:"#0f172a" },
  light: { bg:"#f1f5f9", card:"#ffffff",  card2:"#f8fafc",  border:"#e2e8f0", text:"#0f172a", sub:"#475569", muted:"#64748b", faint:"#94a3b8", inputBg:"#f8fafc" },
};

const MATERIAIS = ["Tubo","Barra","Vergalhão","Arame","Chapa","Laminado","Conexão","Diversos"];
const LIGAS     = ["Cobre","Latão","Alumínio","Inox","Diversas"];
const mkProdRow = (overrides={}) => ({id:"p_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),material:MATERIAIS[0],liga:LIGAS[0],vendidoRS:"",vendidoKG:"",faturadoRS:"",faturadoKG:"",...overrides});
// Mapeia categorias antigas (flat) para a nova taxonomia material×liga, na migração automática
const mapLegacyTipo = (tipo) => {
  const t=(tipo||"").toLowerCase();
  if(t==="cobre")return{material:"Diversos",liga:"Cobre"};
  if(t.startsWith("latã")||t.startsWith("lata"))return{material:"Diversos",liga:"Latão"};
  if(t.startsWith("alum"))return{material:"Diversos",liga:"Alumínio"};
  if(t.startsWith("tubo"))return{material:"Tubo",liga:"Diversas"};
  if(t.startsWith("barra"))return{material:"Barra",liga:"Diversas"};
  if(t.startsWith("lamin"))return{material:"Laminado",liga:"Diversas"};
  return{material:"Diversos",liga:"Diversas"};
};
const COLORS = ["#3b82f6","#06b6d4","#8b5cf6","#f59e0b","#10b981","#ef4444"];
const KPI_OPTIONS = [
  { key:"faturamento", label:"Faturamento",    color:"#3b82f6" },
  { key:"atrasos",     label:"Atrasos",         color:"#ef4444" },
  { key:"vendas",      label:"Vendas",          color:"#10b981" },
  { key:"prevMes",     label:"Prev. Fat. Mês",  color:"#8b5cf6" },
  { key:"prevProxMes", label:"Prev. Próx. Mês", color:"#06b6d4" },
];
const EMPTY_METAS      = { faturamento:"", atrasos:"", vendas:"", prevMes:"", prevProxMes:"" };
const EMPTY_FORM       = { date:"", faturamento:"", atrasos:"", vendas:"", prevMes:"", prevProxMes:"", obs:"" };
const EMPTY_PROD_METAS = Object.fromEntries(MATERIAIS.map(m => [m,""]));

// ── Autenticação (login simples: usuário/senha no Firestore) ──
const ROLES = { admin:"Administrador", operador:"Operador" };
const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
};
const isAdmin = (u) => u?.role === "admin";

const fmtRS  = (n) => n!=null ? new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n) : "—";
const fmtN   = (n) => n!=null ? new Intl.NumberFormat("pt-BR").format(n) : "—";
const today  = () => new Date().toISOString().split("T")[0];
const toDisplay  = (iso) => { if(!iso)return""; const[y,m,d]=iso.split("-"); return`${d}/${m}/${y}`; };
const monthLabel = (iso) => { if(!iso)return""; const[y,m]=iso.split("-"); const ns=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]; return`${ns[+m-1]}/${y}`; };
const parseBRL   = (v) => { if(!v&&v!==0)return null; const s=String(v).replace(/[R$\s.]/g,"").replace(",","."); const n=parseFloat(s); return isNaN(n)?null:n; };
const rawPct     = (val,meta) => { const v=parseBRL(val??""),m=parseBRL(meta??""); if(!v||!m||m===0)return null; return(v/m)*100; };
const pctColor   = (p,inv) => { if(p==null)return"#64748b"; if(inv)return p<=80?"#10b981":p<=100?"#f59e0b":"#ef4444"; return p>=100?"#10b981":p>=70?"#f59e0b":"#ef4444"; };
const calcDelta  = (curr,prev) => { if(curr==null||prev==null||prev===0)return null; const d=curr-prev; return{d,pct:(d/prev)*100,up:d>=0}; };
const getDynDate = () => new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const getGreeting= () => { const h=new Date().getHours(); return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite"; };
const calcSem    = (proj,meta) => { if(!proj||!meta)return null; const r=proj/meta; if(r>=1)return{emoji:"🟢",label:"No ritmo!",color:"#10b981"}; if(r>=0.8)return{emoji:"🟡",label:"Atenção",color:"#f59e0b"}; return{emoji:"🔴",label:"Abaixo do ritmo",color:"#ef4444"}; };

const FERIADOS_BR = new Set([
  "2025-01-01","2025-04-18","2025-04-21","2025-05-01","2025-06-19",
  "2025-09-07","2025-10-12","2025-11-02","2025-11-15","2025-11-20","2025-12-25",
  "2026-01-01","2026-02-16","2026-02-17","2026-04-03","2026-04-21","2026-05-01",
  "2026-06-04","2026-09-07","2026-10-12","2026-11-02","2026-11-15","2026-11-20","2026-12-25",
  "2027-01-01","2027-04-02","2027-04-21","2027-05-01","2027-09-07",
  "2027-10-12","2027-11-02","2027-11-15","2027-11-20","2027-12-25",
]);

const getWDInfo = (year, month, extraHols = [], refDate = new Date()) => {
  const now  = new Date(refDate); now.setHours(23,59,59,0);
  const hols = new Set([...FERIADOS_BR, ...extraHols]);
  let total=0, passed=0;
  const d = new Date(year, month-1, 1);
  while (d.getMonth() === month-1) {
    const dow = d.getDay();
    const ds  = d.toISOString().split("T")[0];
    if (dow !== 0 && dow !== 6 && !hols.has(ds)) {
      total++;
      if (d <= now) passed++;
    }
    d.setDate(d.getDate()+1);
  }
  return { total, passed, remaining: total-passed };
};

const exportCSV = (rows,headers,filename) => {
  const csv=[headers,...rows].map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(";")).join("\n");
  const uri="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);
  const a=document.createElement("a"); a.href=uri; a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
};
const exportXLSX = (rows,headers,filename,sheetName="Dados") => {
  const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);
  ws["!cols"]=headers.map((h,i)=>({wch:Math.max(12,String(h).length+2,...rows.map(r=>String(r[i]??'').length+2))}));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,sheetName);
  XLSX.writeFile(wb,filename);
};
let _pdfCb=null;
const exportPDF=(html,title)=>{ if(_pdfCb)_pdfCb(html,title); };
let _toastCb=null;
const toast=(msg,type="success")=>{ if(_toastCb)_toastCb(msg,type); };
// ── Log de auditoria: registra ações sensíveis no Firestore (chave "audit_log", capado em 500 registros) ──
const logAudit = async (user, action, details="") => {
  try{
    let log=[];
    try{const r=await window.storage.get("audit_log"); if(r) log=JSON.parse(r.value);}catch(_){}
    log.push({id:"a_"+Date.now()+"_"+Math.random().toString(36).slice(2,6), ts:new Date().toISOString(), userId:user?.id||null, userName:user?.nome||"Sistema", role:user?.role||null, action, details});
    if(log.length>500) log=log.slice(-500);
    await window.storage.set("audit_log", JSON.stringify(log));
  }catch(_){}
};

const printDashboard = () => {
  const style = document.createElement("style");
  style.id = "print-override";
  style.innerHTML = `
    @media print {
      body > div > div:first-child { display: none !important; }
      body > div > div:last-child > div:first-child { display: none !important; }
      body > div > div:last-child { margin-left: 0 !important; }
      body { background: #fff !important; }
      button { display: none !important; }
      @page { margin: 15mm; size: A4 landscape; }
    }
  `;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => { const s = document.getElementById("print-override"); if(s) s.remove(); }, 1000);
};

// ── PDFModal ─────────────────────────────────────────────────
function PDFModal({content,title,onClose}) {
  if(!content) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#fff",borderRadius:12,width:"100%",maxWidth:880,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 25px 50px rgba(0,0,0,.5)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{title}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{const f=document.getElementById("pdf-frame");if(f)f.contentWindow.print();}} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>🖨️ Imprimir / Salvar PDF</button>
            <button onClick={onClose} style={{background:"transparent",color:"#64748b",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center"}}><X size={15}/></button>
          </div>
        </div>
        <iframe id="pdf-frame" style={{flex:1,border:"none"}}
          srcDoc={`<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:24px;font-size:13px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}th{background:#f1f5f9;font-weight:600;font-size:12px}h2{font-size:20px;margin-bottom:2px}p.sub{color:#64748b;font-size:12px;margin-bottom:4px}tr:nth-child(even){background:#f8fafc}.pdf-cover{border-bottom:3px solid #3b82f6;padding-bottom:16px;margin-bottom:20px}.pdf-kpis{display:flex;gap:12px;margin-top:16px;flex-wrap:wrap}.pdf-kpi{flex:1;min-width:120px;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;background:#f8fafc}.pdf-kpi .lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.4px}.pdf-kpi .val{font-size:19px;font-weight:700;color:#0f172a;margin-top:4px}.pdf-kpi.accent{border-left:4px solid #3b82f6}</style></head><body>${content}</body></html>`}
        />
      </div>
    </div>
  );
}

// ── ToastContainer ───────────────────────────────────────────
function ToastContainer({toasts}) {
  const cfg={
    success:{bg:"#10b981",icon:"✓"},
    error:  {bg:"#ef4444",icon:"✕"},
    info:   {bg:"#3b82f6",icon:"ℹ"},
  };
  return (
    <div style={{position:"fixed",bottom:20,right:20,zIndex:100000,display:"flex",flexDirection:"column",gap:10,alignItems:"flex-end",pointerEvents:"none"}}>
      {toasts.map(t=>{
        const c=cfg[t.type]||cfg.success;
        return (
          <div key={t.id} className={`dg-toast${t.leaving?" dg-toast-leaving":""}`} style={{display:"flex",alignItems:"center",gap:10,background:"#1e293b",color:"#f1f5f9",border:`1px solid ${c.bg}55`,borderLeft:`4px solid ${c.bg}`,borderRadius:10,padding:"12px 16px",boxShadow:"0 12px 28px rgba(0,0,0,.35)",fontSize:13.5,fontWeight:500,maxWidth:320,pointerEvents:"auto"}}>
            <span style={{background:c.bg,color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{c.icon}</span>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}

// ── OnboardingModal: fluxo guiado para novos Operadores ────────
function OnboardingModal({T,userName,onDismiss}) {
  const steps=[
    {emoji:"📊",title:"1. Lance os KPIs do dia",desc:"No Fechamento Diário, registre Faturamento, Atrasos, Vendas e Previsões acumulados do dia."},
    {emoji:"📦",title:"2. Feche o mês",desc:"No fim do mês, use \"Fechar Mês\" e, se for Admin, lance também os produtos (Vendido e Faturado por material e liga)."},
    {emoji:"🗂️",title:"3. Consulte em Meses Fechados",desc:"Todo o histórico, comparativos e análises de produtos ficam arquivados e disponíveis para consulta."},
  ];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="dg-page" style={{width:"100%",maxWidth:460,background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:32,boxShadow:"0 20px 50px rgba(0,0,0,.35)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:34,marginBottom:10}}>👋</div>
          <div style={{fontSize:18,fontWeight:700,color:T.text}}>Bem-vindo(a), {userName}!</div>
          <div style={{fontSize:13,color:T.muted,marginTop:4}}>Veja rapidinho como funciona o fluxo do dashboard:</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:26}}>
          {steps.map(s=>(
            <div key={s.title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{fontSize:22,flexShrink:0}}>{s.emoji}</div>
              <div>
                <div style={{fontSize:13.5,fontWeight:600,color:T.text,marginBottom:2}}>{s.title}</div>
                <div style={{fontSize:12.5,color:T.sub,lineHeight:1.5}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onDismiss} style={{width:"100%",background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"12px",cursor:"pointer",fontWeight:700,fontSize:14}}>Entendi, vamos começar!</button>
      </div>
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────────

// ── AuthScreen: login OU criação do primeiro admin (first-run) ──
function AuthScreen({dark,setDark,usersExist,onLogin}) {
  const T=THEMES[dark?"dark":"light"];
  const [mode]=useState(usersExist?"login":"setup");
  const [nome,setNome]=useState("");
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);

  const MAX_ATTEMPTS=5, LOCK_MS=5*60*1000;
  const doLogin=async()=>{
    setErr("");
    if(!username||!password){setErr("Preencha usuário e senha.");return;}
    setBusy(true);
    const uname=username.trim().toLowerCase();
    try{
      let attempts={};
      try{const r=await window.storage.get("login_attempts");if(r)attempts=JSON.parse(r.value);}catch(_){}
      const rec=attempts[uname];
      if(rec?.lockedUntil&&rec.lockedUntil>Date.now()){
        const mins=Math.ceil((rec.lockedUntil-Date.now())/60000);
        setErr(`Muitas tentativas erradas. Tente novamente em ${mins} min.`);
        setBusy(false);return;
      }
      let users=[];
      try{const r=await window.storage.get("app_users");if(r)users=JSON.parse(r.value);}catch(_){}
      const hash=await sha256(password);
      const u=users.find(x=>x.username===uname&&x.passwordHash===hash);
      if(!u){
        const count=(rec?.count||0)+1;
        const locked=count>=MAX_ATTEMPTS;
        const updated={...attempts,[uname]:{count,lockedUntil:locked?Date.now()+LOCK_MS:null}};
        try{await window.storage.set("login_attempts",JSON.stringify(updated));}catch(_){}
        setErr(locked?`Muitas tentativas erradas. Login bloqueado por 5 minutos.`:`Usuário ou senha inválidos. (${count}/${MAX_ATTEMPTS} tentativas antes do bloqueio)`);
        await logAudit(null,"login_falhou",`Tentativa malsucedida para "${uname}" (${count}/${MAX_ATTEMPTS})`);
        setBusy(false);return;
      }
      if(u.active===false){setErr("Este usuário está desativado. Fale com um administrador.");setBusy(false);return;}
      if(rec){const{[uname]:_,...rest}=attempts;try{await window.storage.set("login_attempts",JSON.stringify(rest));}catch(_){}}
      await logAudit(u,"login",`Login realizado`);
      onLogin(u);
    }catch(_){setErr("Erro ao autenticar. Tente novamente.");}
    setBusy(false);
  };

  const doSetup=async()=>{
    setErr("");
    if(!nome||!username||!password){setErr("Preencha todos os campos.");return;}
    if(password.length<4){setErr("A senha deve ter ao menos 4 caracteres.");return;}
    if(password!==confirm){setErr("As senhas não coincidem.");return;}
    setBusy(true);
    try{
      const hash=await sha256(password);
      const admin={id:"u_"+Date.now(),nome,username:username.trim().toLowerCase(),passwordHash:hash,role:"admin",active:true,createdAt:today()};
      try{await window.storage.set("app_users",JSON.stringify([admin]));}catch(_){}
      await logAudit(admin,"criar_admin",`Conta de administrador criada (primeiro acesso)`);
      onLogin(admin);
    }catch(_){setErr("Erro ao criar administrador. Tente novamente.");}
    setBusy(false);
  };

  const iSt={width:"100%",padding:"11px 14px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,boxSizing:"border-box"};
  const lSt={display:"block",fontSize:12,color:T.muted,marginBottom:6,fontWeight:600};

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div className="dg-page" style={{width:"100%",maxWidth:400,background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:32,boxShadow:"0 20px 50px rgba(0,0,0,.25)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{background:"#3b82f620",borderRadius:14,width:56,height:56,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>📊</div>
          <div style={{fontSize:19,fontWeight:700,color:T.text}}>Dashboard Gerencial</div>
          <div style={{fontSize:13,color:T.muted,marginTop:4}}>{mode==="setup"?"Primeiro acesso — crie a conta de administrador":"Entre com seu usuário e senha"}</div>
        </div>

        {mode==="setup"&&(
          <div style={{marginBottom:14}}>
            <label style={lSt}>Seu nome</label>
            <input style={iSt} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Caique Silva"/>
          </div>
        )}
        <div style={{marginBottom:14}}>
          <label style={lSt}>Usuário</label>
          <input style={iSt} value={username} onChange={e=>setUsername(e.target.value)} placeholder="Ex: caique" autoCapitalize="none"
            onKeyDown={e=>{if(e.key==="Enter")(mode==="setup"?doSetup:doLogin)();}}/>
        </div>
        <div style={{marginBottom:mode==="setup"?14:8}}>
          <label style={lSt}>Senha</label>
          <div style={{position:"relative"}}>
            <input type={showPw?"text":"password"} style={{...iSt,paddingRight:40}} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e=>{if(e.key==="Enter")(mode==="setup"?doSetup:doLogin)();}}/>
            <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:T.muted,cursor:"pointer",display:"flex"}}>
              {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
        </div>
        {mode==="setup"&&(
          <div style={{marginBottom:8}}>
            <label style={lSt}>Confirmar senha</label>
            <input type={showPw?"text":"password"} style={iSt} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••"
              onKeyDown={e=>{if(e.key==="Enter")doSetup();}}/>
          </div>
        )}

        {err&&<div style={{background:"#ef444415",border:"1px solid #ef444440",color:"#ef4444",borderRadius:8,padding:"9px 12px",fontSize:12.5,marginBottom:14}}>{err}</div>}

        <button onClick={mode==="setup"?doSetup:doLogin} disabled={busy} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"12px",cursor:busy?"default":"pointer",fontWeight:700,fontSize:14,opacity:busy?.7:1,marginTop:mode==="setup"?8:14}}>
          <Lock size={15}/> {busy?"Aguarde...":mode==="setup"?"Criar Administrador e Entrar":"Entrar"}
        </button>

        <div style={{textAlign:"center",marginTop:20}}>
          <button onClick={()=>setDark(!dark)} style={{background:"transparent",border:"none",color:T.faint,cursor:"pointer",fontSize:12,display:"inline-flex",alignItems:"center",gap:5}}>
            {dark?<Sun size={13}/>:<Moon size={13}/>} Alternar tema
          </button>
        </div>
      </div>
    </div>
  );
}

// ── UsersPage: gestão de usuários (somente Admin) ──────────────
function UsersPage({T,currentUser,onUserUpdated}) {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({nome:"",username:"",password:"",role:"operador"});
  const [resetId,setResetId]=useState(null);
  const [resetPw,setResetPw]=useState("");

  const load=async()=>{
    try{const r=await window.storage.get("app_users");if(r)setUsers(JSON.parse(r.value));}catch(_){}
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const persist=async(d)=>{setUsers(d);try{await window.storage.set("app_users",JSON.stringify(d));}catch(_){}};

  const createUser=async()=>{
    if(!form.nome||!form.username||!form.password){toast("Preencha todos os campos.","error");return;}
    if(form.password.length<4){toast("A senha deve ter ao menos 4 caracteres.","error");return;}
    const uname=form.username.trim().toLowerCase();
    if(users.some(u=>u.username===uname)){toast("Já existe um usuário com esse login.","error");return;}
    const hash=await sha256(form.password);
    const novo={id:"u_"+Date.now(),nome:form.nome,username:uname,passwordHash:hash,role:form.role,active:true,createdAt:today()};
    await persist([...users,novo]);
    setForm({nome:"",username:"",password:"",role:"operador"});
    setShowForm(false);
    toast(`Usuário "${novo.nome}" criado com sucesso!`);
    logAudit(currentUser,"criar_usuario",`"${novo.nome}" (@${novo.username}) — ${ROLES[novo.role]}`);
  };

  const toggleActive=async(u)=>{
    if(u.id===currentUser.id){toast("Você não pode desativar seu próprio usuário.","error");return;}
    if(u.role==="admin"&&u.active!==false&&users.filter(x=>x.role==="admin"&&x.active!==false).length<=1){
      toast("É preciso manter ao menos um administrador ativo.","error");return;
    }
    await persist(users.map(x=>x.id===u.id?{...x,active:x.active===false}:x));
    toast(u.active===false?`"${u.nome}" reativado.`:`"${u.nome}" desativado.`,"info");
    logAudit(currentUser,u.active===false?"reativar_usuario":"desativar_usuario",`"${u.nome}" (@${u.username})`);
  };

  const changeRole=async(u,role)=>{
    if(u.id===currentUser.id&&role!=="admin"){toast("Você não pode remover seu próprio nível de administrador.","error");return;}
    if(u.role==="admin"&&role!=="admin"&&users.filter(x=>x.role==="admin"&&x.active!==false).length<=1){
      toast("É preciso manter ao menos um administrador ativo.","error");return;
    }
    await persist(users.map(x=>x.id===u.id?{...x,role}:x));
    toast(`Nível de "${u.nome}" alterado para ${ROLES[role]}.`,"info");
    logAudit(currentUser,"alterar_nivel",`"${u.nome}" (@${u.username}) — ${ROLES[u.role]} → ${ROLES[role]}`);
    if(u.id===currentUser.id&&onUserUpdated)onUserUpdated({...u,role});
  };

  const doResetPw=async(u)=>{
    if(resetPw.length<4){toast("A senha deve ter ao menos 4 caracteres.","error");return;}
    const hash=await sha256(resetPw);
    await persist(users.map(x=>x.id===u.id?{...x,passwordHash:hash}:x));
    setResetId(null);setResetPw("");
    toast(`Senha de "${u.nome}" redefinida.`);
    logAudit(currentUser,"redefinir_senha",`Senha de "${u.nome}" (@${u.username}) redefinida por administrador`);
  };

  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20};
  const iSt={width:"100%",padding:"9px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:13.5,boxSizing:"border-box"};
  const lSt={display:"block",fontSize:11,color:T.muted,marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:.4};

  if(loading)return (
    <div className="dg-page">
      <div className="dg-grid dg-grid-3" style={{display:"grid",gap:14}}>
        {Array.from({length:3}).map((_,i)=><SkeletonCard key={i} T={T}/>)}
      </div>
    </div>
  );

  return (
    <div className="dg-page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:13,color:T.muted}}>{users.length} usuário{users.length!==1?"s":""} cadastrado{users.length!==1?"s":""}</div>
        <button onClick={()=>setShowForm(!showForm)} style={{display:"flex",alignItems:"center",gap:6,background:showForm?T.card2:"#3b82f6",color:showForm?T.sub:"#fff",border:showForm?`1px solid ${T.border}`:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>
          <UserPlus size={15}/> {showForm?"Cancelar":"Novo Usuário"}
        </button>
      </div>

      {showForm&&(
        <div style={{...cSt,borderTop:"3px solid #3b82f6",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:16,color:T.text}}>👤 Novo Usuário</div>
          <div className="dg-grid dg-grid-2" style={{display:"grid",gap:12,marginBottom:14}}>
            <div><label style={lSt}>Nome completo</label><input style={iSt} value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Ex: João Souza"/></div>
            <div><label style={lSt}>Usuário (login)</label><input style={iSt} value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} placeholder="Ex: joao.souza"/></div>
            <div><label style={lSt}>Senha</label><input type="password" style={iSt} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Mínimo 4 caracteres"/></div>
            <div>
              <label style={lSt}>Nível de acesso</label>
              <select style={iSt} value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <button onClick={createUser} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:600,fontSize:14}}><Save size={14}/> Criar Usuário</button>
        </div>
      )}

      {users.length===0?(
        <div style={{...cSt,textAlign:"center",padding:52}}>
          <div className="dg-empty-icon" style={{width:64,height:64,borderRadius:"50%",background:"#3b82f620",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:30}}>👥</div>
          <div style={{color:T.text,fontSize:16,fontWeight:600}}>Nenhum usuário cadastrado</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {users.map(u=>(
            <div key={u.id} style={{...cSt,padding:16,opacity:u.active===false?.55:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{background:u.role==="admin"?"#8b5cf620":"#3b82f620",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {u.role==="admin"?<Shield size={16} color="#8b5cf6"/>:<User size={16} color="#3b82f6"/>}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:T.text,display:"flex",alignItems:"center",gap:8}}>
                      {u.nome}
                      {u.id===currentUser.id&&<span style={{fontSize:10,background:"#3b82f620",color:"#3b82f6",borderRadius:6,padding:"2px 7px",fontWeight:700}}>VOCÊ</span>}
                      {u.active===false&&<span style={{fontSize:10,background:"#ef444420",color:"#ef4444",borderRadius:6,padding:"2px 7px",fontWeight:700}}>INATIVO</span>}
                    </div>
                    <div style={{fontSize:12,color:T.muted}}>@{u.username} · desde {toDisplay(u.createdAt)}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <select value={u.role} onChange={e=>changeRole(u,e.target.value)} style={{...iSt,width:"auto",padding:"7px 10px",fontSize:12.5}}>
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button onClick={()=>{setResetId(resetId===u.id?null:u.id);setResetPw("");}} style={{background:T.card2,color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:12.5,fontWeight:600}}>Redefinir Senha</button>
                  <button onClick={()=>toggleActive(u)} style={{background:u.active===false?"#10b98120":"#ef444420",color:u.active===false?"#10b981":"#ef4444",border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:12.5,fontWeight:600}}>{u.active===false?"Reativar":"Desativar"}</button>
                </div>
              </div>
              {resetId===u.id&&(
                <div style={{display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                  <input type="password" style={iSt} value={resetPw} onChange={e=>setResetPw(e.target.value)} placeholder="Nova senha (mín. 4 caracteres)"/>
                  <button onClick={()=>doResetPw(u)} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:13,whiteSpace:"nowrap"}}>Salvar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AuditLogPage: histórico de ações sensíveis (somente Admin) ──
const ACTION_LABELS = {
  login:"Login", login_falhou:"Login falhou", logout:"Logout", criar_admin:"Criar administrador",
  criar_lancamento:"Criar lançamento", editar_lancamento:"Editar lançamento", excluir_lancamento:"Excluir lançamento",
  fechar_mes:"Fechar mês", salvar_meta:"Salvar meta", adicionar_feriado:"Adicionar feriado", remover_feriado:"Remover feriado",
  criar_usuario:"Criar usuário", desativar_usuario:"Desativar usuário", reativar_usuario:"Reativar usuário",
  alterar_nivel:"Alterar nível de acesso", redefinir_senha:"Redefinir senha", editar_produtos_mes:"Editar produtos do mês",
  excluir_mes_fechado:"Excluir mês fechado",
};
const ACTION_COLORS = {
  login:"#10b981", login_falhou:"#ef4444", logout:"#64748b", criar_admin:"#8b5cf6",
  criar_lancamento:"#3b82f6", editar_lancamento:"#3b82f6", excluir_lancamento:"#ef4444",
  fechar_mes:"#10b981", salvar_meta:"#f59e0b", adicionar_feriado:"#8b5cf6", remover_feriado:"#ef4444",
  criar_usuario:"#3b82f6", desativar_usuario:"#ef4444", reativar_usuario:"#10b981",
  alterar_nivel:"#f59e0b", redefinir_senha:"#f59e0b", editar_produtos_mes:"#3b82f6", excluir_mes_fechado:"#ef4444",
};
function AuditLogPage({T}) {
  const [log,setLog]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filterUser,setFilterUser]=useState("");
  const [filterAction,setFilterAction]=useState("");
  const [confirmClear,setConfirmClear]=useState(false);
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("audit_log");if(r)setLog(JSON.parse(r.value));}catch(_){}
      setLoading(false);
    })();
  },[]);
  const clearLog=async()=>{
    setLog([]);
    try{await window.storage.set("audit_log",JSON.stringify([]));}catch(_){}
    setConfirmClear(false);
    toast("Log de auditoria limpo.","info");
  };
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20};
  const iSt={background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",color:T.text,fontSize:12.5,outline:"none"};
  const users=[...new Set(log.map(l=>l.userName))].filter(Boolean).sort();
  const actions=[...new Set(log.map(l=>l.action))].sort();
  const filtered=[...log].reverse().filter(l=>(!filterUser||l.userName===filterUser)&&(!filterAction||l.action===filterAction));

  if(loading)return (
    <div className="dg-page">
      <div className="dg-grid dg-grid-3" style={{display:"grid",gap:14}}>
        {Array.from({length:3}).map((_,i)=><SkeletonCard key={i} T={T}/>)}
      </div>
    </div>
  );

  return (
    <div className="dg-page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:13,color:T.muted}}>{log.length} registro(s) no log {log.length>=500&&<span style={{color:"#f59e0b"}}>(limite de 500 — registros mais antigos são descartados)</span>}</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <select value={filterUser} onChange={e=>setFilterUser(e.target.value)} style={iSt}>
            <option value="">Todos os usuários</option>
            {users.map(u=><option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filterAction} onChange={e=>setFilterAction(e.target.value)} style={iSt}>
            <option value="">Todas as ações</option>
            {actions.map(a=><option key={a} value={a}>{ACTION_LABELS[a]||a}</option>)}
          </select>
          {confirmClear?(
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{fontSize:11,color:T.faint}}>Confirmar?</span>
              <button onClick={clearLog} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:6,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>Sim</button>
              <button onClick={()=>setConfirmClear(false)} style={{background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",cursor:"pointer",fontSize:12}}>Não</button>
            </div>
          ):(
            <button onClick={()=>setConfirmClear(true)} style={{display:"flex",alignItems:"center",gap:5,background:"#ef444420",color:"#ef4444",border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:12.5,fontWeight:600}}><Trash2 size={12}/> Limpar Log</button>
          )}
        </div>
      </div>

      {filtered.length===0?(
        <div style={{...cSt,textAlign:"center",padding:52}}>
          <div className="dg-empty-icon" style={{width:64,height:64,borderRadius:"50%",background:"#64748b20",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:30}}>📋</div>
          <div style={{color:T.text,fontSize:16,fontWeight:600}}>Nenhum registro encontrado</div>
        </div>
      ):(
        <div style={cSt}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Data/Hora","Usuário","Ação","Detalhes"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(l=>{
                const color=ACTION_COLORS[l.action]||"#64748b";
                const dt=new Date(l.ts);
                return (
                  <tr key={l.id} style={{borderBottom:`1px solid ${T.border}50`}}>
                    <td style={{padding:"10px 12px",color:T.muted,whiteSpace:"nowrap",fontSize:12}}>{dt.toLocaleDateString("pt-BR")} {dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</td>
                    <td style={{padding:"10px 12px",color:T.text,fontWeight:600,whiteSpace:"nowrap"}}>{l.userName||"—"}{l.role&&<span style={{fontSize:10,color:T.faint,fontWeight:400,marginLeft:5}}>({ROLES[l.role]||l.role})</span>}</td>
                    <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}><span style={{background:color+"20",color,borderRadius:6,padding:"3px 9px",fontSize:11.5,fontWeight:600}}>{ACTION_LABELS[l.action]||l.action}</span></td>
                    <td style={{padding:"10px 12px",color:T.sub,fontSize:12.5}}>{l.details}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────────
function StatusBadge({s}) {
  const cfg={Pendente:{color:"#f59e0b",icon:<Clock size={11}/>},Aprovado:{color:"#10b981",icon:<CheckCircle size={11}/>},Recusado:{color:"#ef4444",icon:<XCircle size={11}/>}};
  const{color="#64748b",icon=null}=cfg[s]||{};
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:500,background:color+"20",color}}>{icon}{s}</span>;
}

// ── AnimatedNumber: conta suavemente de 0 até o valor final ao entrar em tela ──
function AnimatedNumber({value,format}) {
  const [display,setDisplay]=useState(0);
  const prevRef=useRef(0);
  useEffect(()=>{
    const target=typeof value==="number"?value:0;
    const start=prevRef.current;
    const startTime=performance.now();
    const DURATION=700;
    let raf;
    const tick=(now)=>{
      const t=Math.min(1,(now-startTime)/DURATION);
      const eased=1-Math.pow(1-t,3); // ease-out cubic
      setDisplay(start+(target-start)*eased);
      if(t<1)raf=requestAnimationFrame(tick);
      else prevRef.current=target;
    };
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[value]);
  if(value==null)return <>—</>;
  return <>{format?format(display):Math.round(display)}</>;
}

// ── Sparkline: mini-gráfico de tendência em SVG, sem dependências ──
function Sparkline({data,color="#3b82f6",width=90,height=28}) {
  if(!data||data.length<2)return <div style={{width,height}}/>;
  const min=Math.min(...data), max=Math.max(...data);
  const range=(max-min)||1;
  const step=width/(data.length-1);
  const pts=data.map((v,i)=>`${(i*step).toFixed(1)},${(height-((v-min)/range)*height).toFixed(1)}`);
  const last=data[data.length-1];
  const lastY=(height-((last-min)/range)*height).toFixed(1);
  return (
    <svg width={width} height={height} style={{overflow:"visible"}}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
      <circle cx={width} cy={lastY} r="2.5" fill={color}/>
    </svg>
  );
}

function PctBadge({p,inv=false,T}) {
  if(p==null)return <div style={{fontSize:11,color:T.faint,marginTop:6}}>Meta não definida</div>;
  const c=pctColor(p,inv);
  const label=inv?(p<=80?"✓ Abaixo da meta":p<=100?"⚠ Na meta":"✕ Acima da meta"):(p>=100?"✓ Meta atingida":p>=70?"⚠ Em andamento":"✕ Abaixo do esperado");
  return (
    <div style={{marginTop:10}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
        <span style={{color:c,fontWeight:500}}>{label}</span>
        <span style={{color:c,fontWeight:700}}>{Math.round(Math.min(p,999))}%</span>
      </div>
      <div style={{background:T.border,borderRadius:4,height:5}}>
        <div style={{width:Math.min(p,100)+"%",height:"100%",borderRadius:4,background:c,transition:"width .5s"}}/>
      </div>
    </div>
  );
}

function DeltaCard({label,curr,prev,color,T,inv=false}) {
  const d=calcDelta(curr,prev);
  const good=d==null?null:(inv?!d.up:d.up);
  const gc=good===null?"#64748b":good?"#10b981":"#ef4444";
  return (
    <div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
      <div style={{fontSize:11,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>{label}</div>
      <div style={{fontSize:18,fontWeight:700,color}}>{fmtRS(curr)}</div>
      {d!=null ? (
        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}>
          {d.d===0?<Minus size={14} color="#64748b"/>:d.up?<ArrowUpRight size={14} color={gc}/>:<ArrowDownRight size={14} color={gc}/>}
          <span style={{fontSize:12,color:gc,fontWeight:600}}>{d.up?"+":""}{fmtRS(d.d)}</span>
          <span style={{fontSize:11,color:T.faint}}>({d.up?"+":""}{d.pct.toFixed(1)}%)</span>
        </div>
      ):(
        <div style={{fontSize:11,color:T.faint,marginTop:6}}>Sem mês anterior</div>
      )}
      <div style={{fontSize:10,color:T.faint,marginTop:4}}>vs mês anterior</div>
    </div>
  );
}

// ── TrendBadge ───────────────────────────────────────────────
function TrendBadge({ entries, T }) {
  const trend = useMemo(() => {
    const d = entries.filter(e => e.faturamento != null);
    if (d.length < 4) return null;
    const h = Math.max(2, Math.floor(d.length / 2));
    const recent = d.slice(-h);
    const older  = d.slice(Math.max(0, d.length - h * 2), d.length - h);
    if (!older.length) return null;
    const avgR = recent.reduce((s, e) => s + e.faturamento, 0) / recent.length;
    const avgO = older.reduce((s, e) => s + e.faturamento, 0) / older.length;
    const pct  = ((avgR - avgO) / avgO) * 100;
    return { pct, up: pct >= 0 };
  }, [entries]);
  if (!trend) return null;
  const c = trend.up ? "#10b981" : "#ef4444";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px",
      background:c+"18", border:`1px solid ${c}`, borderRadius:20 }}>
      {trend.up ? <ArrowUpRight size={13} color={c}/> : <ArrowDownRight size={13} color={c}/>}
      <span style={{ fontSize:12, color:c, fontWeight:600 }}>
        {trend.up?"+":""}{trend.pct.toFixed(1)}% ritmo vs período anterior
      </span>
    </div>
  );
}

// ── Top5Days ──────────────────────────────────────────────────
function Top5Days({ entries, T }) {
  const top5 = useMemo(() => (
    [...entries].filter(e => e.faturamento != null)
      .sort((a, b) => b.faturamento - a.faturamento).slice(0, 5)
  ), [entries]);
  if (top5.length === 0) return null;
  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
  return (
    <div>
      <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:12 }}>
        🏆 Top 5 Melhores Dias do Período
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {top5.map((e, i) => (
          <div key={e.id} style={{ display:"flex", alignItems:"center", gap:12,
            padding:"10px 14px", background:T.card2, borderRadius:8,
            border:`1px solid ${T.border}` }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{medals[i]}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{toDisplay(e.date)}</div>
              {e.obs && <div style={{ fontSize:11, color:T.faint, fontStyle:"italic", marginTop:2 }}>{e.obs}</div>}
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:"#3b82f6", flexShrink:0 }}>{fmtRS(e.faturamento)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DailyChart ───────────────────────────────────────────────
function DailyChart({entries,T,metaFaturamento,extraHols=[]}) {
  const [active, setActive] = useState(["faturamento","prevMes"]);
  const [range,  setRange]  = useState(30);
  const [showMeta, setShowMeta] = useState(true);
  const [customFrom,setCustomFrom]=useState("");
  const [customTo,  setCustomTo]  =useState("");
  const toggle = (k) => setActive(p => p.includes(k) ? p.filter(x=>x!==k) : [...p,k]);
  const filtered = range==="custom"
    ? entries.filter(e=>(!customFrom||e.date>=customFrom)&&(!customTo||e.date<=customTo))
    : (range === 0 ? entries : entries.slice(-range));
  const metaVal = parseBRL(metaFaturamento);
  const data = filtered.map(e => {
    let metaLinha=null;
    if(metaVal&&e.date){
      const d=new Date(e.date+"T12:00:00");
      const wd=getWDInfo(d.getFullYear(),d.getMonth()+1,extraHols,d);
      if(wd.total>0)metaLinha=(metaVal/wd.total)*wd.passed;
    }
    return { dia:toDisplay(e.date), faturamento:e.faturamento, atrasos:e.atrasos,
      vendas:e.vendas, prevMes:e.prevMes, prevProxMes:e.prevProxMes, metaLinha };
  });
  const ttStyle = {background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text};
  const RANGES  = [{l:"7d",v:7},{l:"15d",v:15},{l:"30d",v:30},{l:"Tudo",v:0},{l:"Personalizado",v:"custom"}];
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:8 }}>
        <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Evolução por Dia</div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {RANGES.map(({l,v}) => (
            <button key={v} onClick={() => setRange(v)} style={{
              padding:"4px 10px", borderRadius:6, fontSize:12, cursor:"pointer",
              background: range===v ? "#3b82f6" : "transparent",
              color:      range===v ? "#fff"    : T.muted,
              border:     `1px solid ${range===v ? "#3b82f6" : T.border}`,
              transition: "all .15s",
            }}>{l}</button>
          ))}
        </div>
      </div>
      {range==="custom"&&(
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 10px",color:T.text,fontSize:12.5}}/>
          <span style={{fontSize:12,color:T.faint}}>até</span>
          <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 10px",color:T.text,fontSize:12.5}}/>
          {(customFrom||customTo)&&<button onClick={()=>{setCustomFrom("");setCustomTo("");}} style={{background:"transparent",border:"none",color:T.faint,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Limpar</button>}
        </div>
      )}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {KPI_OPTIONS.map(({key,label,color}) => {
          const on = active.includes(key);
          return (
            <button key={key} onClick={() => toggle(key)} style={{
              display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
              borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
              background: on?color+"25":"transparent", color:on?color:T.faint,
              border:`1.5px solid ${on?color:T.border}`, transition:"all .15s",
            }}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:on?color:T.border,display:"inline-block",flexShrink:0 }}/>{label}
            </button>
          );
        })}
        {metaVal>0&&(
          <button onClick={()=>setShowMeta(!showMeta)} style={{
            display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
            borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
            background: showMeta?"#f59e0b25":"transparent", color:showMeta?"#f59e0b":T.faint,
            border:`1.5px dashed ${showMeta?"#f59e0b":T.border}`, transition:"all .15s",
          }}>
            <span style={{ width:8,height:8,borderRadius:"50%",background:showMeta?"#f59e0b":T.border,display:"inline-block",flexShrink:0 }}/>Meta Prorata
          </button>
        )}
      </div>
      {active.length===0 ? (
        <div style={{textAlign:"center",padding:"32px 0",color:T.faint,fontSize:13}}>Selecione ao menos um KPI.</div>
      ):(
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data}>
            <defs>{KPI_OPTIONS.map(({key,color})=>(
              <linearGradient key={key} id={`g_${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25}/><stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            ))}</defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="dia" tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v>=1000000?(v/1000000).toFixed(1)+"M":(v/1000).toFixed(0)+"k")}/>
            <Tooltip formatter={(v,n)=>[fmtRS(v),n==="metaLinha"?"Meta Prorata":(KPI_OPTIONS.find(o=>o.key===n)?.label||n)]} contentStyle={ttStyle} labelStyle={{color:T.sub}}/>
            <Legend wrapperStyle={{color:T.sub,fontSize:12}} formatter={n=>n==="metaLinha"?"Meta Prorata":(KPI_OPTIONS.find(o=>o.key===n)?.label||n)}/>
            {KPI_OPTIONS.filter(o=>active.includes(o.key)).map(({key,color})=>(
              <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} fill={`url(#g_${key})`} dot={{fill:color,r:4}} activeDot={{r:6}}/>
            ))}
            {showMeta&&metaVal>0&&(
              <Line type="monotone" dataKey="metaLinha" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{r:5}} connectNulls/>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── AtrasoChart ──────────────────────────────────────────────
function AtrasoChart({entries,metaValue,T}) {
  const data=entries.map(e=>({dia:toDisplay(e.date),atrasos:e.atrasos}));
  const latest=entries.length>0?entries[entries.length-1]:null;
  const isOver=metaValue!=null&&latest?.atrasos!=null&&latest.atrasos>metaValue;
  const ttStyle={background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <AlertTriangle size={16} color="#ef4444"/>
          <div style={{fontSize:14,fontWeight:600,color:T.text}}>Evolução de Atrasos</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {metaValue!=null&&<span style={{fontSize:12,color:T.muted}}>Meta: <strong style={{color:"#f59e0b"}}>{fmtRS(metaValue)}</strong></span>}
          {metaValue!=null&&(isOver
            ?<div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",background:"#ef444420",border:"1px solid #ef4444",borderRadius:20}}><AlertTriangle size={12} color="#ef4444"/><span style={{fontSize:12,color:"#ef4444",fontWeight:600}}>Acima da meta!</span></div>
            :<div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",background:"#10b98120",border:"1px solid #10b981",borderRadius:20}}><CheckCircle size={12} color="#10b981"/><span style={{fontSize:12,color:"#10b981",fontWeight:600}}>Dentro da meta</span></div>
          )}
        </div>
      </div>
      {data.length===0 ? (
        <div style={{textAlign:"center",padding:"24px 0",color:T.faint,fontSize:13}}>Sem dados de atrasos lançados.</div>
      ):(
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gAtr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="dia" tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v>=1000000?(v/1000000).toFixed(1)+"M":(v/1000).toFixed(0)+"k")}/>
            <Tooltip formatter={v=>[fmtRS(v),"Atrasos"]} contentStyle={ttStyle} labelStyle={{color:T.sub}}/>
            {metaValue!=null&&<ReferenceLine y={metaValue} stroke="#f59e0b" strokeDasharray="5 3" strokeWidth={2} label={{value:`Meta: ${fmtRS(metaValue)}`,fill:"#f59e0b",fontSize:11,position:"insideTopRight"}}/>}
            <Area type="monotone" dataKey="atrasos" stroke="#ef4444" strokeWidth={2} fill="url(#gAtr)" dot={{fill:"#ef4444",r:4}} activeDot={{r:6}}/>
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── WeekdayChart (NEW) ───────────────────────────────────────
function WeekdayChart({entries,T}) {
  const names=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const byDay={};
  entries.forEach(e=>{
    if(e.faturamento==null)return;
    const dow=new Date(e.date+"T12:00:00").getDay();
    if(!byDay[dow])byDay[dow]={count:0,total:0};
    byDay[dow].count++;byDay[dow].total+=e.faturamento;
  });
  const data=[1,2,3,4,5].map(d=>({dia:names[d],media:byDay[d]?Math.round(byDay[d].total/byDay[d].count):0,n:byDay[d]?.count||0}));
  const hasAny=data.some(d=>d.media>0);
  const ttStyle={background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text};
  return (
    <div>
      <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:14}}>⚡ Ritmo por Dia da Semana</div>
      {!hasAny ? (
        <div style={{textAlign:"center",padding:"28px 0",color:T.faint,fontSize:13}}>Lance dados em múltiplos dias para ver o padrão semanal.</div>
      ):(
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="dia" tick={{fill:T.muted,fontSize:12}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v>=1000000?(v/1000000).toFixed(1)+"M":(v/1000).toFixed(0)+"k")}/>
            <Tooltip formatter={(v,_,p)=>[fmtRS(v),`Média (${p.payload.n} dia${p.payload.n!==1?"s":""})`]} contentStyle={ttStyle} labelStyle={{color:T.sub}}/>
            <Bar dataKey="media" radius={[4,4,0,0]}>
              {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── ProductMixPie (NEW) ──────────────────────────────────────
function ProductMixPie({produtos,T}) {
  const data=produtos.filter(p=>p.rs&&p.rs>0);
  const totalRS=data.reduce((s,p)=>s+(p.rs||0),0);
  const ttStyle={background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text};
  if(data.length===0)return <div style={{textAlign:"center",padding:"24px 0",color:T.faint,fontSize:13}}>Sem dados de faturamento por produto.</div>;
  return (
    <div>
      <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:14}}>Mix de Produtos — Participação no Faturamento</div>
      <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie data={data} dataKey="rs" nameKey="tipo" cx="50%" cy="50%" outerRadius={90} innerRadius={46}>
              {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie>
            <Tooltip formatter={v=>[fmtRS(v),"Faturado"]} contentStyle={ttStyle}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}>
          {data.map((p,i)=>{
            const pct=totalRS>0?((p.rs/totalRS)*100):0;
            return (
              <div key={p.tipo} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:COLORS[i%COLORS.length],flexShrink:0}}/>
                <div style={{flex:1,fontSize:12,color:T.text,fontWeight:500}}>{p.tipo}</div>
                <div style={{fontSize:12,fontWeight:600,color:COLORS[i%COLORS.length]}}>{fmtRS(p.rs)}</div>
                <div style={{fontSize:11,color:T.muted,minWidth:38,textAlign:"right"}}>{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── ProductRanking (NEW) ─────────────────────────────────────
function ProductRanking({current,previous,prodMetas,T}) {
  if(!current?.produtos||current.produtos.length===0)return null;
  const sorted=[...current.produtos].filter(p=>p.rs!=null||p.kg!=null).sort((a,b)=>(b.rs||0)-(a.rs||0));
  const totalRS=sorted.reduce((s,p)=>s+(p.rs||0),0);
  return (
    <div>
      <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:14}}>🏆 Ranking de Produtos</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${T.border}`}}>
              {["#","Produto","Fat. R$","Fat. KG","% do Total","vs Mês Ant.","Meta R$","% Meta"].map(h=>(
                <th key={h} style={{padding:"9px 12px",textAlign:"left",color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.4,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p,i)=>{
              const pct=totalRS>0?((p.rs||0)/totalRS*100):0;
              const prevP=previous?.produtos?.find(x=>x.tipo===p.tipo);
              const delta=calcDelta(p.rs,prevP?.rs);
              const meta=parseBRL(prodMetas?.[p.tipo]??"");
              const pctMeta=meta&&p.rs?(p.rs/meta*100):null;
              const mc=pctColor(pctMeta,false);
              return (
                <tr key={p.tipo} style={{borderBottom:`1px solid ${T.border}50`}}>
                  <td style={{padding:"11px 12px",color:T.faint,fontWeight:800,fontSize:15}}>{i+1}</td>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:COLORS[i%COLORS.length],flexShrink:0}}/>
                      <span style={{color:T.text,fontWeight:500}}>{p.tipo}</span>
                    </div>
                  </td>
                  <td style={{padding:"11px 12px",color:COLORS[i%COLORS.length],fontWeight:600}}>{fmtRS(p.rs)}</td>
                  <td style={{padding:"11px 12px",color:T.sub}}>{fmtN(p.kg)} kg</td>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:Math.max(pct/1.2,2)+"%",maxWidth:50,height:6,background:COLORS[i%COLORS.length],borderRadius:3,flexShrink:0}}/>
                      <span style={{color:T.muted,fontSize:12}}>{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={{padding:"11px 12px"}}>
                    {delta!=null ? (
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        {delta.up?<ArrowUpRight size={13} color="#10b981"/>:<ArrowDownRight size={13} color="#ef4444"/>}
                        <span style={{fontSize:12,color:delta.up?"#10b981":"#ef4444",fontWeight:600}}>{delta.up?"+":""}{delta.pct.toFixed(1)}%</span>
                      </div>
                    ):<span style={{fontSize:12,color:T.faint}}>—</span>}
                  </td>
                  <td style={{padding:"11px 12px",color:T.muted,fontSize:12}}>{meta?fmtRS(meta):"—"}</td>
                  <td style={{padding:"11px 12px"}}>
                    {pctMeta!=null ? (
                      <div>
                        <div style={{fontSize:12,color:mc,fontWeight:600,marginBottom:3}}>{pctMeta.toFixed(0)}%</div>
                        <div style={{background:T.border,borderRadius:3,height:4,width:56}}>
                          <div style={{width:Math.min(pctMeta,100)+"%",height:"100%",borderRadius:3,background:mc}}/>
                        </div>
                      </div>
                    ):<span style={{fontSize:12,color:T.faint}}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── DiasUteisProjecao ────────────────────────────────────────
function DiasUteisProjecao({entries,metaFaturamento,T,extraHols=[]}) {
  if(entries.length===0)return null;
  const latest=entries[entries.length-1];
  const d=new Date((latest.date||today())+"T12:00:00");
  const wd=getWDInfo(d.getFullYear(),d.getMonth()+1,extraHols,d);
  const fat=latest.faturamento;
  const meta=parseBRL(metaFaturamento);
  let dailyAvg=null,projecao=null,neededPerDay=null;
  if(fat!=null&&wd.passed>0){dailyAvg=fat/wd.passed;projecao=dailyAvg*wd.total;if(meta&&wd.remaining>0)neededPerDay=(meta-fat)/wd.remaining;}
  const pctDias=(wd.passed/wd.total)*100;
  const pctProj=meta&&projecao?(projecao/meta)*100:null;
  const projColor=pctProj==null?"#64748b":pctProj>=100?"#10b981":pctProj>=80?"#f59e0b":"#ef4444";
  const sem=calcSem(projecao,meta);
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20};
  return (
    <div className="dg-grid dg-grid-2" style={{display:"grid",gap:14,marginBottom:16}}>
      <div style={cSt}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Dias Úteis do Mês</div>
            <div style={{fontSize:22,fontWeight:700,color:T.text}}>{wd.passed} <span style={{fontSize:14,color:T.muted,fontWeight:400}}>/ {wd.total} dias</span></div>
          </div>
          <div style={{background:"#3b82f620",borderRadius:8,padding:7}}><Calendar size={15} color="#3b82f6"/></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.muted,marginBottom:6}}>
          <span>{wd.passed} passados</span><span style={{color:"#f59e0b"}}>{wd.remaining} restantes</span>
        </div>
        <div style={{background:T.border,borderRadius:4,height:8}}>
          <div style={{width:pctDias+"%",height:"100%",borderRadius:4,background:"linear-gradient(90deg,#3b82f6,#06b6d4)"}}/>
        </div>
        {dailyAvg!=null&&(
          <div style={{marginTop:12,padding:"10px 12px",background:T.card2,borderRadius:8,fontSize:13}}>
            <span style={{color:T.muted}}>Média diária: </span><strong style={{color:"#3b82f6"}}>{fmtRS(dailyAvg)}/dia útil</strong>
          </div>
        )}
      </div>
      <div style={{...cSt,borderLeft:`4px solid ${projColor}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Projeção de Fechamento</div>
            <div style={{fontSize:22,fontWeight:700,color:projColor}}>{projecao!=null?fmtRS(projecao):"—"}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <div style={{background:projColor+"20",borderRadius:8,padding:7}}><TrendingUp size={15} color={projColor}/></div>
            {sem&&<div style={{fontSize:12,fontWeight:600,color:sem.color}}>{sem.emoji} {sem.label}</div>}
          </div>
        </div>
        {meta!=null&&projecao!=null&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.muted,marginBottom:6}}>
              <span>vs Meta: {fmtRS(meta)}</span><span style={{color:projColor,fontWeight:600}}>{pctProj.toFixed(1)}%</span>
            </div>
            <div style={{background:T.border,borderRadius:4,height:8}}>
              <div style={{width:Math.min(pctProj,100)+"%",height:"100%",borderRadius:4,background:projColor}}/>
            </div>
          </>
        )}
        {neededPerDay!=null&&(
          <div style={{marginTop:12,padding:"10px 12px",background:neededPerDay>0?"#ef444415":"#10b98115",borderRadius:8,fontSize:13}}>
            <span style={{color:T.muted}}>Necessário/dia restante: </span>
            <strong style={{color:neededPerDay>0?"#ef4444":"#10b981"}}>{fmtRS(Math.max(neededPerDay,0))}</strong>
          </div>
        )}
        {meta==null&&<div style={{fontSize:12,color:T.faint,marginTop:8}}>Configure uma meta para ver a comparação.</div>}
      </div>
    </div>
  );
}

// ── PresentMode ──────────────────────────────────────────────
function PresentMode({onExit}) {
  const [entries,setEntries]=useState([]);
  const [metasByMonth,setMetasByMonth]=useState({});
  const [holidays,setHolidays]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("diario_entries");if(r)setEntries(JSON.parse(r.value));}catch(_){}
      let mbm={};
      try{const r=await window.storage.get("diario_metas_by_month");if(r)mbm=JSON.parse(r.value);}catch(_){}
      if(Object.keys(mbm).length===0){try{const m=await window.storage.get("diario_metas");if(m)mbm={default:JSON.parse(m.value)};}catch(_){}}
      setMetasByMonth(mbm);
      try{const h=await window.storage.get("custom_holidays");if(h)setHolidays(JSON.parse(h.value));}catch(_){}
      setLoading(false);
    })();
    const fn=(e)=>{if(e.key==="Escape")onExit();};
    window.addEventListener("keydown",fn);
    return()=>window.removeEventListener("keydown",fn);
  },[]);
  const latest=entries.length>0?entries[entries.length-1]:null;
  const activeMonth=latest?latest.date.slice(0,7):today().slice(0,7);
  const metas=metasByMonth[activeMonth]||metasByMonth.default||EMPTY_METAS;
  const extraHols=holidays.map(h=>h.date);
  const metaFat=parseBRL(metas.faturamento);
  let projecao=null,wd=null;
  if(latest?.faturamento&&latest?.date){
    const dd=new Date(latest.date+"T12:00:00");
    wd=getWDInfo(dd.getFullYear(),dd.getMonth()+1,extraHols,dd);
    if(wd.passed>0)projecao=(latest.faturamento/wd.passed)*wd.total;
  }
  const sem=calcSem(projecao,metaFat);
  const kpiDefs=[
    {title:"Faturamento Acumulado",val:latest?.faturamento,color:"#3b82f6",emoji:"💰"},
    {title:"Atrasos",              val:latest?.atrasos,    color:"#ef4444",emoji:"⏰"},
    {title:"Vendas Acumuladas",    val:latest?.vendas,     color:"#10b981",emoji:"🛒"},
    {title:"Prev. Fat. Mês",       val:latest?.prevMes,    color:"#8b5cf6",emoji:"📈"},
    {title:"Prev. Fat. Próx. Mês", val:latest?.prevProxMes,color:"#06b6d4",emoji:"🔮"},
  ];
  return (
    <div className="dg-present" style={{position:"fixed",inset:0,background:"#080e1a",zIndex:9999,display:"flex",flexDirection:"column",padding:36,overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <div style={{fontSize:26,fontWeight:800,color:"#f1f5f9",letterSpacing:-0.5}}>Dashboard Gerencial</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:4,textTransform:"capitalize"}}>{getDynDate()}</div>
        </div>
        <button onClick={onExit} style={{display:"flex",alignItems:"center",gap:6,background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",borderRadius:10,padding:"10px 18px",cursor:"pointer",fontSize:14}}>
          <X size={16}/> Sair
        </button>
      </div>
      {loading ? (
        <div style={{color:"#64748b",textAlign:"center",marginTop:80,fontSize:16}}>Carregando...</div>
      ):(
        <>
          <div className="dg-grid dg-grid-5" style={{display:"grid",gap:16,marginBottom:20}}>
            {kpiDefs.map(({title,val,color,emoji})=>(
              <div key={title} style={{background:"#1e293b",border:`1px solid #334155`,borderTop:`4px solid ${color}`,borderRadius:14,padding:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:.8}}>{title}</div>
                  <div style={{background:color+"30",borderRadius:8,padding:7,display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30}}><span style={{fontSize:17,lineHeight:1}}>{emoji}</span></div>
                </div>
                <div style={{fontSize:26,fontWeight:800,color:val!=null?color:"#334155"}}>{val!=null?fmtRS(val):"—"}</div>
                <div style={{fontSize:11,color:"#475569",marginTop:8}}>{latest?`Até ${toDisplay(latest.date)}`:"Sem dados"}</div>
              </div>
            ))}
          </div>
          <div className="dg-grid dg-grid-3" style={{display:"grid",gap:16}}>
            <div style={{background:"#1e293b",border:"1px solid #334155",borderLeft:"4px solid #3b82f6",borderRadius:14,padding:24}}>
              <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:12}}>Projeção de Fechamento</div>
              <div style={{fontSize:30,fontWeight:800,color:"#3b82f6"}}>{projecao!=null?fmtRS(projecao):"—"}</div>
              {sem&&<div style={{fontSize:14,color:sem.color,fontWeight:600,marginTop:8}}>{sem.emoji} {sem.label}</div>}
              {metaFat&&projecao&&(
                <>
                  <div style={{fontSize:13,color:"#64748b",marginTop:8,marginBottom:6}}>Meta: {fmtRS(metaFat)} · {((projecao/metaFat)*100).toFixed(1)}%</div>
                  <div style={{background:"#334155",borderRadius:4,height:6}}>
                    <div style={{width:Math.min((projecao/metaFat)*100,100)+"%",height:"100%",borderRadius:4,background:projecao>=metaFat?"#10b981":"#3b82f6"}}/>
                  </div>
                </>
              )}
            </div>
            <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:24}}>
              <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:12}}>Dias Úteis do Mês</div>
              {wd ? (
                <>
                  <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
                    <div style={{fontSize:30,fontWeight:800,color:"#f1f5f9"}}>{wd.passed}</div>
                    <div style={{fontSize:15,color:"#64748b"}}>/ {wd.total} úteis</div>
                  </div>
                  <div style={{background:"#334155",borderRadius:4,height:8,marginBottom:10}}>
                    <div style={{width:`${(wd.passed/wd.total)*100}%`,height:"100%",borderRadius:4,background:"linear-gradient(90deg,#3b82f6,#06b6d4)"}}/>
                  </div>
                  <div style={{fontSize:13,color:"#f59e0b"}}>{wd.remaining} dias úteis restantes</div>
                </>
              ):(
                <div style={{fontSize:13,color:"#475569"}}>Lance dados para calcular.</div>
              )}
            </div>
            <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:24}}>
              <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:12}}>Último Lançamento</div>
              {latest ? (
                <>
                  <div style={{fontSize:22,fontWeight:700,color:"#f1f5f9",marginBottom:8}}>{toDisplay(latest.date)}</div>
                  {latest.obs&&<div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic",marginTop:8,borderLeft:"2px solid #334155",paddingLeft:10}}>{latest.obs}</div>}
                </>
              ):(
                <div style={{fontSize:13,color:"#475569"}}>Sem dados lançados.</div>
              )}
            </div>
          </div>
        </>
      )}
      <div style={{marginTop:"auto",textAlign:"center",color:"#334155",fontSize:12,paddingTop:24}}>
        Pressione <kbd style={{background:"#1e293b",border:"1px solid #334155",borderRadius:4,padding:"2px 6px",color:"#64748b"}}>ESC</kbd> para sair
      </div>
    </div>
  );
}

// ── HomePage ─────────────────────────────────────────────────
function HomePage({T,onNavigate}) {
  const [daily,  setDaily]  =useState([]);
  const [metasByMonth,setMetasByMonth]=useState({});
  const [closed, setClosed] =useState([]);
  const [loading,setLoading]=useState(true);
  const [cardOrder,setCardOrder]=useState(null); // array de labels, ordem preferida do usuário
  const [dragId,   setDragId]   =useState(null);
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("diario_entries");if(r)setDaily(JSON.parse(r.value));}catch(_){}
      let mbm={};
      try{const r=await window.storage.get("diario_metas_by_month");if(r)mbm=JSON.parse(r.value);}catch(_){}
      if(Object.keys(mbm).length===0){try{const m=await window.storage.get("diario_metas");if(m)mbm={default:JSON.parse(m.value)};}catch(_){}}
      setMetasByMonth(mbm);
      try{const r=await window.storage.get("closed_months");if(r)setClosed(JSON.parse(r.value));}catch(_){}
      try{const r=await window.storage.get("home_card_order");if(r)setCardOrder(JSON.parse(r.value));}catch(_){}
      setLoading(false);
    })();
  },[]);
  if(loading)return (
    <div className="dg-page">
      <div className="dg-grid dg-grid-4" style={{display:"grid",gap:14,marginBottom:16}}>
        {Array.from({length:4}).map((_,i)=><SkeletonCard key={i} T={T}/>)}
      </div>
      <div style={{marginBottom:16}}><SkeletonChart T={T}/></div>
    </div>
  );

  const latest=daily.length>0?daily[daily.length-1]:null;
  const activeMonth=latest?latest.date.slice(0,7):today().slice(0,7);
  const metas=metasByMonth[activeMonth]||metasByMonth.default||EMPTY_METAS;
  const metaAtr=parseBRL(metas.atrasos);
  const atrasoAlt=metaAtr!=null&&latest?.atrasos!=null&&latest.atrasos>metaAtr;
  const lastClosed=closed.length>0?closed[closed.length-1]:null;
  const prevFat=lastClosed?.summary?.faturamento;
  const prevVendas=lastClosed?.summary?.vendas;
  const currFat=latest?.faturamento;
  const currVendas=latest?.vendas;
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20};

  // Lembrete: existe lançamento de um mês anterior ao atual que ainda não foi fechado?
  const monthNotClosed=latest&&activeMonth<today().slice(0,7)?activeMonth:null;

  // Sparklines: para campos acumulados, usamos o incremento diário real (não o valor bruto)
  const deltaSeries=(field)=>daily.map((e,i)=>{
    if(e[field]==null)return null;
    const prev=i>0&&daily[i-1][field]!=null?daily[i-1][field]:0;
    const d=e[field]-prev; return d>=0?d:null;
  }).filter(v=>v!=null).slice(-14);
  const fatSpark=deltaSeries("faturamento");
  const venSpark=deltaSeries("vendas");
  const atrSpark=daily.filter(e=>e.atrasos!=null).slice(-14).map(e=>e.atrasos);

  const summaryCards=[
    {label:"Faturamento Acumulado",val:currFat,       color:"#3b82f6",emoji:"💰",   sub:latest?`Até ${toDisplay(latest.date)}`:"Sem lançamentos",isRS:true,spark:fatSpark},
    {label:"Atrasos",               val:latest?.atrasos,color:atrasoAlt?"#ef4444":"#10b981",emoji:"⏰",sub:atrasoAlt?"⚠ Acima da meta":"✓ Dentro da meta",isRS:true,spark:atrSpark},
    {label:"Vendas Acumuladas",     val:currVendas,   color:"#10b981",emoji:"🛒",  sub:latest?`Até ${toDisplay(latest.date)}`:"Sem lançamentos",isRS:true,spark:venSpark},
    {label:"Meses Fechados",        val:closed.length,color:"#8b5cf6",emoji:"🗂️",        sub:"no histórico",isRS:false,spark:null},
  ].sort((a,b)=>{
    if(!cardOrder)return 0;
    const ia=cardOrder.indexOf(a.label),ib=cardOrder.indexOf(b.label);
    if(ia===-1&&ib===-1)return 0; if(ia===-1)return 1; if(ib===-1)return -1;
    return ia-ib;
  });
  const reorderCards=(fromLabel,toLabel)=>{
    if(fromLabel===toLabel)return;
    const labels=summaryCards.map(c=>c.label);
    const from=labels.indexOf(fromLabel),to=labels.indexOf(toLabel);
    const next=[...labels]; next.splice(from,1); next.splice(to,0,fromLabel);
    setCardOrder(next);
    window.storage.set("home_card_order",JSON.stringify(next)).catch(()=>{});
  };
  const quickLinks=[
    {id:"diario",    label:"Fechamento Diário", emoji:"📊",  color:"#3b82f6", desc:"Lançar KPIs e fechar o mês"},
    {id:"fechados",  label:"Meses Fechados",    emoji:"🗄️",    color:"#8b5cf6", desc:"Histórico de meses arquivados"},
    {id:"biblioteca",label:"Biblioteca",        emoji:"📚",    color:"#06b6d4", desc:"Ferramentas e tabelas técnicas"},
  ];

  return (
    <>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:700,color:T.text,marginBottom:4}}>{getGreeting()}! 👋</div>
        <div style={{fontSize:14,color:T.muted,textTransform:"capitalize"}}>{getDynDate()}</div>
      </div>

      {monthNotClosed&&(
        <div onClick={()=>onNavigate("diario")} style={{display:"flex",alignItems:"center",gap:12,background:"#f59e0b15",border:"1px solid #f59e0b50",borderRadius:10,padding:"14px 16px",marginBottom:20,cursor:"pointer"}}>
          <span style={{fontSize:22,flexShrink:0}}>⏰</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13.5,fontWeight:600,color:"#f59e0b"}}>{monthLabel(monthNotClosed+"-01")} já terminou e ainda não foi fechado</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Vá até o Fechamento Diário e use "Fechar Mês" para arquivar os dados.</div>
          </div>
          <span style={{fontSize:12,color:"#f59e0b",fontWeight:600,flexShrink:0}}>Resolver →</span>
        </div>
      )}

      {atrasoAlt&&(
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#ef444415",border:"1px solid #ef4444",borderRadius:10,marginBottom:20}}>
          <AlertTriangle size={18} color="#ef4444"/>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#ef4444"}}>⚠ Atrasos acima da meta!</div>
            <div style={{fontSize:12,color:T.muted}}>O valor de atrasos atual ultrapassou a meta configurada.</div>
          </div>
          <button onClick={()=>onNavigate("diario")} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0}}>Ver</button>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,color:T.faint,fontSize:11.5}}>
        <Menu size={12}/> Arraste os cards pelo cabeçalho para reordenar
      </div>
      <div className="dg-grid dg-grid-4" style={{display:"grid",gap:14,marginBottom:16}}>
        {summaryCards.map(({label,val,color,emoji,sub,isRS,spark})=>(
          <div key={label}
            draggable
            onDragStart={()=>setDragId(label)}
            onDragOver={e=>e.preventDefault()}
            onDrop={()=>{reorderCards(dragId,label);setDragId(null);}}
            onDragEnd={()=>setDragId(null)}
            className="dg-lift" style={{...cSt,borderTop:`3px solid ${color}`,opacity:dragId===label?0.4:1,cursor:"grab"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                <Menu size={10} style={{opacity:.5}}/>{label}
              </div>
              <div style={{background:color+"20",borderRadius:8,padding:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",width:29,height:29}}><span style={{fontSize:16,lineHeight:1}}>{emoji}</span></div>
            </div>
            <div style={{fontSize:22,fontWeight:700,color}}>{val!=null?<AnimatedNumber value={val} format={isRS?fmtRS:fmtN}/>:"—"}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:4,gap:8}}>
              <div style={{fontSize:12,color:T.muted}}>{sub}</div>
              {spark&&spark.length>=2&&<Sparkline data={spark} color={color}/>}
            </div>
          </div>
        ))}
      </div>

      {/* Comparativo Diário vs Mensal (NEW) */}
      {(currFat!=null||prevFat!=null)&&(
        <div style={{...cSt,marginBottom:16,borderTop:"3px solid #3b82f6"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <TrendingUp size={16} color="#3b82f6"/>
            <div style={{fontSize:14,fontWeight:600,color:T.text}}>
              Mês Atual vs Mês Anterior
              {lastClosed&&<span style={{fontSize:12,fontWeight:400,color:T.muted,marginLeft:8}}>comparando com {lastClosed.label}</span>}
            </div>
          </div>
          <div className="dg-grid dg-grid-2" style={{display:"grid",gap:12}}>
            {[
              {label:"Faturamento",curr:currFat,prev:prevFat,color:"#3b82f6",inv:false},
              {label:"Vendas",     curr:currVendas,prev:prevVendas,color:"#10b981",inv:false},
            ].map(({label,curr,prev,color,inv})=>{
              const d=calcDelta(curr,prev);
              const gc=d==null?"#64748b":(!inv?d.up:"not up")===true?"#10b981":"#ef4444";
              return (
                <div key={label} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:8}}>{label} — Acumulado vs Fechamento Anterior</div>
                  <div className="dg-grid dg-grid-2" style={{display:"grid",gap:12,marginBottom:12}}>
                    <div>
                      <div style={{fontSize:10,color:T.faint,marginBottom:4}}>Mês Atual</div>
                      <div style={{fontSize:18,fontWeight:700,color}}>{curr!=null?fmtRS(curr):"—"}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:T.faint,marginBottom:4}}>Mês Anterior</div>
                      <div style={{fontSize:18,fontWeight:600,color:T.sub}}>{prev!=null?fmtRS(prev):"—"}</div>
                    </div>
                  </div>
                  {d!=null&&(
                    <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:d.up?"#10b98115":"#ef444415",borderRadius:8}}>
                      {d.up?<ArrowUpRight size={14} color="#10b981"/>:<ArrowDownRight size={14} color="#ef4444"/>}
                      <span style={{fontSize:13,color:d.up?"#10b981":"#ef4444",fontWeight:600}}>{d.up?"+":""}{fmtRS(d.d)} ({d.up?"+":""}{d.pct.toFixed(1)}%)</span>
                    </div>
                  )}
                  {!d&&<div style={{fontSize:12,color:T.faint}}>Feche um mês para comparar.</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{...cSt,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:16}}>Acesso Rápido</div>
        <div className="dg-grid dg-grid-4" style={{display:"grid",gap:12}}>
          {quickLinks.map(({id,label,emoji,color,desc})=>(
            <button key={id} onClick={()=>onNavigate(id)} className="dg-lift" style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8,padding:16,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left"}}>
              <div style={{background:color+"20",borderRadius:8,padding:8,display:"flex",alignItems:"center",justifyContent:"center",width:34,height:34}}><span style={{fontSize:18,lineHeight:1}}>{emoji}</span></div>
              <div style={{fontSize:13,fontWeight:600,color:T.text}}>{label}</div>
              <div style={{fontSize:11,color:T.muted}}>{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {daily.length>0&&(
        <div style={cSt}>
          <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:14}}>Últimos Lançamentos Diários</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Data","Faturamento","Atrasos","Vendas","Prev. Mês","Obs."].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...daily].reverse().slice(0,5).map(e=>(
                  <tr key={e.id} style={{borderBottom:`1px solid ${T.border}50`}}>
                    <td style={{padding:"10px 12px",color:"#60a5fa",fontWeight:600}}>{toDisplay(e.date)}</td>
                    <td style={{padding:"10px 12px",color:T.text}}>{fmtRS(e.faturamento)}</td>
                    <td style={{padding:"10px 12px",color:"#ef4444"}}>{fmtRS(e.atrasos)}</td>
                    <td style={{padding:"10px 12px",color:T.sub}}>{fmtRS(e.vendas)}</td>
                    <td style={{padding:"10px 12px",color:T.sub}}>{fmtRS(e.prevMes)}</td>
                    <td style={{padding:"10px 12px",color:T.faint,fontSize:12,fontStyle:"italic",maxWidth:140}}>{e.obs||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ── FechamentoDiario ─────────────────────────────────────────
function FechamentoDiario({T,onMonthClosed,onAtrasoAlert,currentUser}) {
  const canManage=isAdmin(currentUser);
  const initForm={...EMPTY_FORM,date:today()};
  const [entries,    setEntries]    =useState([]);
  const [form,       setForm]       =useState(initForm);
  const [showForm,   setShowForm]   =useState(false);
  const [loading,    setLoading]    =useState(true);
  const [editId,     setEditId]     =useState(null);
  const [showHist,   setShowHist]   =useState(false);
  const [showMetas,  setShowMetas]  =useState(false);
  // ── Metas por período: mapa {mesYYYY-MM: {faturamento,...}}, "default" = meta padrão ──
  const [metasByMonth,  setMetasByMonth]  =useState({});
  const [metaMonth,     setMetaMonth]     =useState(today().slice(0,7));
  const [metasForm,     setMetasForm]     =useState(EMPTY_METAS);
  const [showFechar, setShowFechar] =useState(false);
  const [clearAfter, setClearAfter] =useState(true);
  // ── Feriados customizados ──
  const [holidays,     setHolidays]     =useState([]); // [{date,desc}]
  const [showFeriados, setShowFeriados] =useState(false);
  const [holForm,       setHolForm]      =useState({date:"",desc:""});
  // ── Produtos do Mês (Vendido/Faturado por material×liga, lançado só no fechamento) ──
  const [produtosMes,   setProdutosMes]  =useState([]);
  const [prodLoading,   setProdLoading]  =useState(false);

  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("diario_entries");if(r)setEntries(JSON.parse(r.value));}catch(_){}
      let mbm={};
      try{const r=await window.storage.get("diario_metas_by_month");if(r)mbm=JSON.parse(r.value);}catch(_){}
      if(Object.keys(mbm).length===0){
        // migração: metas antigas (globais) viram a meta "default"
        try{const m=await window.storage.get("diario_metas");if(m){const v=JSON.parse(m.value);mbm={default:v};}}catch(_){}
      }
      setMetasByMonth(mbm);
      try{const h=await window.storage.get("custom_holidays");if(h)setHolidays(JSON.parse(h.value));}catch(_){}
      setLoading(false);
    })();
  },[]);

  // Meta efetiva do mês do último lançamento (cai para "default" se não houver meta específica)
  const activeMonth = entries.length>0 ? entries[entries.length-1].date.slice(0,7) : metaMonth;
  const metas = metasByMonth[activeMonth] || metasByMonth.default || EMPTY_METAS;
  const extraHols = holidays.map(h=>h.date);

  useEffect(()=>{
    // Sincroniza o formulário de metas com o mês selecionado para edição
    setMetasForm(metasByMonth[metaMonth] || metasByMonth.default || EMPTY_METAS);
  },[metaMonth,metasByMonth]);

  useEffect(()=>{
    if(entries.length>0&&metas.atrasos){
      const lat=entries[entries.length-1];
      const mv=parseBRL(metas.atrasos);
      onAtrasoAlert&&onAtrasoAlert(mv!=null&&lat.atrasos!=null&&lat.atrasos>mv);
    }else{onAtrasoAlert&&onAtrasoAlert(false);}
  },[entries,metas]);

  const persist  =async(d)=>{try{await window.storage.set("diario_entries",JSON.stringify(d));}catch(_){}};
  const setField =(k)=>(e)=>setForm(p=>({...p,[k]:e.target.value}));

  // Faturamento e Vendas são campos acumulados — nunca deveriam cair em relação ao lançamento vizinho.
  // Retorna avisos (não bloqueia o salvamento, apenas alerta contra erro de digitação).
  const checkMonotonic=(dateStr,fatVal,venVal,excludeId)=>{
    if(!dateStr)return[];
    const others=entries.filter(e=>e.id!==excludeId).sort((a,b)=>a.date.localeCompare(b.date));
    const prevE=[...others].reverse().find(e=>e.date<dateStr);
    const nextE=others.find(e=>e.date>dateStr);
    const issues=[];
    [{label:"Faturamento",val:fatVal},{label:"Vendas",val:venVal}].forEach(({label,val})=>{
      if(val==null)return;
      if(prevE&&prevE[label==="Faturamento"?"faturamento":"vendas"]!=null&&val<prevE[label==="Faturamento"?"faturamento":"vendas"]){
        issues.push(`${label} (${fmtRS(val)}) é menor que o lançamento anterior de ${toDisplay(prevE.date)} (${fmtRS(prevE[label==="Faturamento"?"faturamento":"vendas"])})`);
      }
      if(nextE&&nextE[label==="Faturamento"?"faturamento":"vendas"]!=null&&val>nextE[label==="Faturamento"?"faturamento":"vendas"]){
        issues.push(`${label} (${fmtRS(val)}) é maior que o lançamento seguinte de ${toDisplay(nextE.date)} (${fmtRS(nextE[label==="Faturamento"?"faturamento":"vendas"])})`);
      }
    });
    return issues;
  };
  const formIssues=showForm?checkMonotonic(form.date,parseBRL(form.faturamento),parseBRL(form.vendas),editId):[];
  const setMetaF =(k)=>(e)=>setMetasForm(p=>({...p,[k]:e.target.value}));

  const saveMetas=async(asDefault=false)=>{
    const key=asDefault?"default":metaMonth;
    const updated={...metasByMonth,[key]:metasForm};
    setMetasByMonth(updated);
    try{await window.storage.set("diario_metas_by_month",JSON.stringify(updated));}catch(_){}
    toast(asDefault?"Meta padrão salva com sucesso!":`Meta de ${monthLabel(metaMonth+"-01")} salva com sucesso!`);
    logAudit(currentUser,"salvar_meta",asDefault?"Meta padrão atualizada":`Meta de ${monthLabel(metaMonth+"-01")} atualizada`);
  };

  const persistHolidays=async(d)=>{try{await window.storage.set("custom_holidays",JSON.stringify(d));}catch(_){}};
  const addHoliday=async()=>{
    if(!holForm.date)return;
    const updated=[...holidays.filter(h=>h.date!==holForm.date),{date:holForm.date,desc:holForm.desc||"Feriado customizado"}].sort((a,b)=>a.date.localeCompare(b.date));
    setHolidays(updated);await persistHolidays(updated);
    setHolForm({date:"",desc:""});
    toast("Feriado adicionado!");
    logAudit(currentUser,"adicionar_feriado",`${toDisplay(holForm.date)} — ${holForm.desc||"Feriado customizado"}`);
  };
  const removeHoliday=async(date)=>{
    const updated=holidays.filter(h=>h.date!==date);
    setHolidays(updated);await persistHolidays(updated);
    toast("Feriado removido.","info");
    logAudit(currentUser,"remover_feriado",toDisplay(date));
  };

  const saveEntry=async()=>{
    if(!form.date)return;
    const entry={id:editId||form.date,date:form.date,faturamento:parseBRL(form.faturamento),atrasos:parseBRL(form.atrasos),vendas:parseBRL(form.vendas),prevMes:parseBRL(form.prevMes),prevProxMes:parseBRL(form.prevProxMes),obs:form.obs||""};
    let updated=editId?entries.map(e=>e.id===editId?entry:e):(()=>{const ex=entries.find(e=>e.date===form.date);return ex?entries.map(e=>e.date===form.date?entry:e):[...entries,entry];})();
    updated=updated.sort((a,b)=>a.date.localeCompare(b.date));
    setEntries(updated);await persist(updated);
    setForm(initForm);setShowForm(false);setEditId(null);
    toast(editId?"Lançamento atualizado!":"Lançamento salvo com sucesso!");
    logAudit(currentUser,editId?"editar_lancamento":"criar_lancamento",`${toDisplay(entry.date)} — Faturamento: ${fmtRS(entry.faturamento)}`);
  };

  const deleteEntry=async(id)=>{const e=entries.find(x=>x.id===id);const u=entries.filter(x=>x.id!==id);setEntries(u);await persist(u);toast("Lançamento excluído.","info");logAudit(currentUser,"excluir_lancamento",e?toDisplay(e.date):id);};
  const startEdit=(e)=>{setForm({date:e.date,faturamento:e.faturamento??"",atrasos:e.atrasos??"",vendas:e.vendas??"",prevMes:e.prevMes??"",prevProxMes:e.prevProxMes??"",obs:e.obs||""});setEditId(e.id);setShowForm(true);setShowHist(false);setShowMetas(false);setShowFechar(false);setShowFeriados(false);};
  const closeAll=(which)=>{setShowForm(which==="form");setShowMetas(which==="metas");setShowHist(which==="hist");setShowFechar(which==="fechar");setShowFeriados(which==="feriados");if(which!=="form")setEditId(null);};

  const loadProdutosMes=async(monthKey)=>{
    setProdLoading(true);
    let all={};
    try{const r=await window.storage.get("diario_produtos_mensais");if(r)all=JSON.parse(r.value);}catch(_){}
    const rows=all[monthKey];
    setProdutosMes(rows&&rows.length>0?rows:[mkProdRow()]);
    setProdLoading(false);
  };
  const openFechar=()=>{
    if(entries.length>0)loadProdutosMes(entries[0].date.slice(0,7));
    closeAll(showFechar?"":"fechar");
  };
  const addProdRow    =()=>setProdutosMes(p=>[...p,mkProdRow()]);
  const removeProdRow =(id)=>setProdutosMes(p=>p.filter(r=>r.id!==id));
  const setProdField  =(id,k)=>(e)=>setProdutosMes(p=>p.map(r=>r.id===id?{...r,[k]:e.target.value}:r));
  const persistProdutosMes=async(monthKey,rows)=>{
    let all={};
    try{const r=await window.storage.get("diario_produtos_mensais");if(r)all=JSON.parse(r.value);}catch(_){}
    all={...all,[monthKey]:rows};
    try{await window.storage.set("diario_produtos_mensais",JSON.stringify(all));}catch(_){}
  };

  const confirmarFechamento=async()=>{
    if(entries.length===0)return;
    const monthKey=entries[0].date.slice(0,7);
    const lastEntry=entries[entries.length-1];
    const record={id:monthKey,label:monthLabel(entries[0].date),closedAt:today(),entries:[...entries],summary:{faturamento:lastEntry.faturamento,atrasos:lastEntry.atrasos,vendas:lastEntry.vendas,prevMes:lastEntry.prevMes,prevProxMes:lastEntry.prevProxMes}};
    let list=[];
    try{const ex=await window.storage.get("closed_months");list=ex?JSON.parse(ex.value):[];}catch(_){}
    try{await window.storage.set("closed_months",JSON.stringify([...list.filter(m=>m.id!==monthKey),record]));}catch(_){}
    // Produtos do mês (Vendido/Faturado por material×liga) — fonte única também usada em Meses Fechados
    const validRows=produtosMes.filter(r=>parseBRL(r.vendidoRS)||parseBRL(r.vendidoKG)||parseBRL(r.faturadoRS)||parseBRL(r.faturadoKG));
    await persistProdutosMes(monthKey,validRows);
    if(clearAfter){setEntries([]);await persist([]);}
    setShowFechar(false);
    if(onMonthClosed)onMonthClosed();
    toast(`Mês de ${monthLabel(entries[0].date)} fechado com sucesso!`);
    logAudit(currentUser,"fechar_mes",`${monthLabel(entries[0].date)} — ${entries.length} lançamentos, ${validRows.length} produtos`);
  };

  const doCSV=()=>exportCSV(entries.map(e=>[toDisplay(e.date),e.faturamento??'',e.atrasos??'',e.vendas??'',e.prevMes??'',e.prevProxMes??'',e.obs||'']),["Data","Faturamento R$","Atrasos R$","Vendas R$","Prev.Mês R$","Prev.Próx.Mês R$","Obs"],"fechamento_diario.csv");
  const doXLSX=()=>exportXLSX(entries.map(e=>[toDisplay(e.date),e.faturamento??'',e.atrasos??'',e.vendas??'',e.prevMes??'',e.prevProxMes??'',e.obs||'']),["Data","Faturamento R$","Atrasos R$","Vendas R$","Prev.Mês R$","Prev.Próx.Mês R$","Obs"],"fechamento_diario.xlsx","Fechamento Diário");
  const doPDF=()=>exportPDF(`
    <div class="pdf-cover">
      <h2>Fechamento Diário</h2>
      <p class="sub">Gerado em ${new Date().toLocaleDateString("pt-BR")} · ${entries.length} lançamento(s) · Último: ${hasData?toDisplay(latest.date):"—"}</p>
      <div class="pdf-kpis">
        <div class="pdf-kpi accent"><div class="lbl">Faturamento Acumulado</div><div class="val">${fmtRS(latest?.faturamento)}</div></div>
        <div class="pdf-kpi"><div class="lbl">Atrasos</div><div class="val">${fmtRS(latest?.atrasos)}</div></div>
        <div class="pdf-kpi"><div class="lbl">Vendas Acumuladas</div><div class="val">${fmtRS(latest?.vendas)}</div></div>
        <div class="pdf-kpi"><div class="lbl">Ticket Médio Diário</div><div class="val">${ticketMedio!=null?fmtRS(ticketMedio):"—"}</div></div>
      </div>
    </div>
    <table><thead><tr><th>Data</th><th>Faturamento</th><th>Atrasos</th><th>Vendas</th><th>Prev. Mês</th><th>Prev. Próx. Mês</th><th>Observações</th></tr></thead><tbody>${entries.map(e=>`<tr><td>${toDisplay(e.date)}</td><td>${fmtRS(e.faturamento)}</td><td>${fmtRS(e.atrasos)}</td><td>${fmtRS(e.vendas)}</td><td>${fmtRS(e.prevMes)}</td><td>${fmtRS(e.prevProxMes)}</td><td>${e.obs||''}</td></tr>`).join('')}</tbody></table>`,"Fechamento Diário");

  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20};
  const iSt={background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:14,width:"100%",boxSizing:"border-box",outline:"none"};
  const lSt={fontSize:12,color:T.sub,marginBottom:4,display:"block"};
  const latest=entries.length>0?entries[entries.length-1]:null;
  const hasData=!!latest;
  const metaAtr=parseBRL(metas.atrasos);

  // Incrementos diários reais (o campo faturamento é acumulado) → ticket médio e melhor dia
  const dailyDeltas=entries.map((e,i)=>{
    if(e.faturamento==null)return null;
    const prev=i>0&&entries[i-1].faturamento!=null?entries[i-1].faturamento:0;
    const d=e.faturamento-prev;
    return d>=0?{date:e.date,delta:d}:null;
  }).filter(Boolean);
  const ticketMedio=dailyDeltas.length?dailyDeltas.reduce((s,d)=>s+d.delta,0)/dailyDeltas.length:null;
  const melhorDia=dailyDeltas.length?dailyDeltas.reduce((a,b)=>b.delta>a.delta?b:a):null;

  // Dias úteis decorridos no mês do último lançamento (para prorata da meta)
  let wdInfo=null;
  if(latest?.date){
    const dd=new Date(latest.date+"T12:00:00");
    wdInfo=getWDInfo(dd.getFullYear(),dd.getMonth()+1,extraHols,dd);
  }
  // Meta do dia = meta mensal ÷ dias úteis do mês. Meta esperada até a data = meta do dia × dias úteis decorridos.
  const metaDiaria   =(metaStr)=>{const m=parseBRL(metaStr);if(!m||!wdInfo||wdInfo.total===0)return null;return m/wdInfo.total;};
  const metaProrated =(metaStr)=>{const md=metaDiaria(metaStr);if(md==null||!wdInfo)return null;return md*Math.max(wdInfo.passed,0)||null;};
  const pcts={
    fat:rawPct(latest?.faturamento,metaProrated(metas.faturamento)??metas.faturamento),
    atr:rawPct(latest?.atrasos,    metaProrated(metas.atrasos)    ??metas.atrasos),
    ven:rawPct(latest?.vendas,     metaProrated(metas.vendas)     ??metas.vendas),
    pm: rawPct(latest?.prevMes,    metas.prevMes),
    ppx:rawPct(latest?.prevProxMes,metas.prevProxMes),
  };

  // Semáforo (ritmo de faturamento projetado para o mês inteiro)
  let semaforo=null;
  if(latest?.faturamento&&wdInfo?.passed>0){
    const proj=(latest.faturamento/wdInfo.passed)*wdInfo.total;
    semaforo=calcSem(proj,parseBRL(metas.faturamento));
  }

  const kpiDefs=[
    {title:"Faturamento Acumulado",val:latest?.faturamento,p:pcts.fat,color:"#3b82f6",emoji:"💰",inv:false,showSem:true, prorated:true, metaRaw:metas.faturamento},
    {title:"Atrasos",              val:latest?.atrasos,    p:pcts.atr,color:"#ef4444",emoji:"⏰",inv:true, showSem:false,prorated:true, metaRaw:metas.atrasos},
    {title:"Vendas Acumuladas",    val:latest?.vendas,     p:pcts.ven,color:"#10b981",emoji:"🛒",inv:false,showSem:false,prorated:true, metaRaw:metas.vendas},
    {title:"Prev. Fat. Mês",       val:latest?.prevMes,    p:pcts.pm, color:"#8b5cf6",emoji:"📈",inv:false,showSem:false,prorated:false,metaRaw:metas.prevMes},
    {title:"Prev. Fat. Próx. Mês", val:latest?.prevProxMes,p:pcts.ppx,color:"#06b6d4",emoji:"🔮",inv:false,showSem:false,prorated:false,metaRaw:metas.prevProxMes},
  ];

  if(loading)return (
    <div className="dg-page">
      <div className="dg-grid dg-grid-5" style={{display:"grid",gap:14,marginBottom:16}}>
        {Array.from({length:5}).map((_,i)=><SkeletonCard key={i} T={T}/>)}
      </div>
      <div style={{marginBottom:16}}><SkeletonChart T={T}/></div>
      <div style={{marginBottom:16}}><SkeletonChart T={T}/></div>
    </div>
  );

  return (
    <>
      {hasData&&canManage&&latest.date.slice(0,7)<today().slice(0,7)&&(
        <div style={{display:"flex",alignItems:"center",gap:12,background:"#f59e0b15",border:"1px solid #f59e0b50",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          <span style={{fontSize:22,flexShrink:0}}>⏰</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13.5,fontWeight:600,color:"#f59e0b"}}>{monthLabel(latest.date)} já terminou e ainda não foi fechado</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Use o botão "Fechar Mês" abaixo para arquivar os lançamentos deste mês.</div>
          </div>
          <button onClick={openFechar} style={{background:"#f59e0b",color:"#000",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:600,fontSize:13,flexShrink:0}}>Fechar agora</button>
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <div style={{ color:T.muted, fontSize:14 }}>
            {hasData ? `Último lançamento: ${toDisplay(latest.date)}` : "Nenhum lançamento cadastrado"}
          </div>
          {hasData && <TrendBadge entries={entries} T={T}/>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {entries.length>0&&(
            <div style={{display:"flex",gap:4}}>
              <button onClick={doCSV} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> CSV</button>
              <button onClick={doXLSX} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> Excel</button>
              <button onClick={doPDF} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> PDF</button>
            </div>
          )}
          {canManage&&<button onClick={()=>closeAll(showMetas?"":"metas")} style={{display:"flex",alignItems:"center",gap:6,background:showMetas?"#f59e0b":"#f59e0b20",color:showMetas?"#000":"#f59e0b",border:"1px solid #f59e0b",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>⚙ Metas por Período</button>}
          {canManage&&<button onClick={()=>closeAll(showFeriados?"":"feriados")} style={{display:"flex",alignItems:"center",gap:6,background:showFeriados?"#8b5cf6":"#8b5cf620",color:showFeriados?"#fff":"#8b5cf6",border:"1px solid #8b5cf6",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}><Calendar size={15}/> Feriados</button>}
          {entries.length>0&&(
            <>
              <button onClick={()=>closeAll(showHist?"":"hist")} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:14}}>
                <BarChart2 size={15}/> Histórico {showHist?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
              </button>
              {canManage&&<button onClick={openFechar} style={{display:"flex",alignItems:"center",gap:6,background:showFechar?"#10b981":"#10b98120",color:showFechar?"#fff":"#10b981",border:"1px solid #10b981",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>
                <Archive size={15}/> Fechar Mês
              </button>}
            </>
          )}
          <button onClick={()=>closeAll(showForm?"":"form")} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>
            <Plus size={15}/>{showForm?"Cancelar":"Lançar KPIs"}
          </button>
        </div>
      </div>

      {showMetas&&(
        <div style={{...cSt,borderTop:"3px solid #f59e0b",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:4,color:T.text}}>⚙ Metas por Período</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Configure metas específicas para cada mês, ou salve como meta padrão para meses sem configuração própria.</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{minWidth:160}}>
              <label style={lSt}>Mês de referência da meta</label>
              <input type="month" style={iSt} value={metaMonth} onChange={e=>setMetaMonth(e.target.value)}/>
            </div>
            <div style={{fontSize:12,color:T.faint,paddingBottom:10}}>
              {metasByMonth[metaMonth]
                ? <span style={{color:"#10b981"}}>✓ Este mês tem meta específica configurada.</span>
                : <span>Sem meta específica — usando a <strong style={{color:T.text}}>meta padrão</strong> {Object.keys(metasByMonth).length?"":"(ainda não definida)"}.</span>}
            </div>
          </div>
          {(()=>{const[my,mm]=metaMonth.split("-").map(Number);const wdCfg=getWDInfo(my,mm,extraHols);return(
            <div style={{display:"flex",alignItems:"center",gap:8,background:"#f59e0b12",border:"1px solid #f59e0b30",borderRadius:8,padding:"9px 12px",marginBottom:14,fontSize:12,color:T.sub}}>
              <Calendar size={13} color="#f59e0b"/>
              <span><strong style={{color:T.text}}>{wdCfg.total} dias úteis</strong> em {monthLabel(metaMonth+"-01")} — a meta de Faturamento, Atrasos e Vendas é dividida por esse número para calcular a meta esperada de cada dia.</span>
            </div>
          );})()}
          <div className="dg-grid dg-grid-5" style={{display:"grid",gap:12,marginBottom:14}}>
            {[{k:"faturamento",label:"Faturamento",prorated:true},{k:"atrasos",label:"Atrasos",prorated:true},{k:"vendas",label:"Vendas",prorated:true},{k:"prevMes",label:"Prev. Mês",prorated:false},{k:"prevProxMes",label:"Prev. Próx. Mês",prorated:false}].map(({k,label,prorated})=>{
              const[my,mm]=metaMonth.split("-").map(Number);
              const wdCfg=getWDInfo(my,mm,extraHols);
              const mVal=parseBRL(metasForm[k]);
              const diaria=prorated&&mVal&&wdCfg.total>0?mVal/wdCfg.total:null;
              return (
                <div key={k}>
                  <label style={lSt}>{label} (R$)</label>
                  <input style={iSt} value={metasForm[k]} onChange={setMetaF(k)} placeholder="Ex: 3200000"/>
                  {diaria!=null&&<div style={{fontSize:10.5,color:T.faint,marginTop:4}}>≈ {fmtRS(diaria)}/dia útil</div>}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:12,color:T.faint}}>Faturamento, Atrasos e Vendas comparam o acumulado à meta <strong style={{color:T.text}}>prorata até a data do último lançamento</strong>. Atrasos: verde quando <strong style={{color:T.text}}>abaixo</strong> da meta do dia.</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>saveMetas(true)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",color:"#f59e0b",border:"1px solid #f59e0b",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>Salvar como Padrão</button>
              <button onClick={()=>saveMetas(false)} style={{display:"flex",alignItems:"center",gap:6,background:"#f59e0b",color:"#000",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:14}}><Save size={14}/> Salvar Meta de {monthLabel(metaMonth+"-01")}</button>
            </div>
          </div>
        </div>
      )}

      {showFeriados&&(
        <div style={{...cSt,borderTop:"3px solid #8b5cf6",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:4,color:T.text}}>📅 Feriados Customizados</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Além dos feriados nacionais já considerados automaticamente, adicione feriados estaduais, municipais ou pontos facultativos da empresa — eles serão descontados dos dias úteis nas projeções.</div>
          <div style={{display:"flex",gap:10,alignItems:"flex-end",marginBottom:16,flexWrap:"wrap"}}>
            <div><label style={lSt}>Data</label><input type="date" style={iSt} value={holForm.date} onChange={e=>setHolForm(p=>({...p,date:e.target.value}))}/></div>
            <div style={{flex:1,minWidth:160}}><label style={lSt}>Descrição</label><input style={iSt} value={holForm.desc} onChange={e=>setHolForm(p=>({...p,desc:e.target.value}))} placeholder="Ex: Aniversário da cidade"/></div>
            <button onClick={addHoliday} style={{display:"flex",alignItems:"center",gap:6,background:"#8b5cf6",color:"#fff",border:"none",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}><Plus size={15}/> Adicionar</button>
          </div>
          {holidays.length===0 ? (
            <div style={{fontSize:13,color:T.faint,textAlign:"center",padding:"16px 0"}}>Nenhum feriado customizado cadastrado.</div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {holidays.map(h=>(
                <div key={h.date} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#a78bfa"}}>{toDisplay(h.date)}</span>
                    <span style={{fontSize:13,color:T.sub}}>{h.desc}</span>
                  </div>
                  <button onClick={()=>removeHoliday(h.date)} style={{background:"#ef444420",color:"#ef4444",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showFechar&&entries.length>0&&(
        <div style={{...cSt,borderTop:"3px solid #10b981",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Archive size={18} color="#10b981"/><div style={{fontSize:15,fontWeight:700,color:T.text}}>Fechar Mês</div></div>
          <div style={{fontSize:13,color:T.muted,marginBottom:16}}>Irá arquivar <strong style={{color:T.text}}>{entries.length} lançamento(s)</strong> em <strong style={{color:"#10b981"}}>Meses Fechados</strong>, junto com a análise de produtos.</div>
          <div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,color:T.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Resumo do Período</div>
            <div className="dg-grid dg-grid-3" style={{display:"grid",gap:12}}>
              {[{label:"Período",value:`${toDisplay(entries[0].date)} → ${toDisplay(entries[entries.length-1].date)}`},{label:"Faturamento Final",value:fmtRS(latest?.faturamento)},{label:"Vendas Finais",value:fmtRS(latest?.vendas)},{label:"Atrasos Finais",value:fmtRS(latest?.atrasos)},{label:"Prev. Fat. Mês",value:fmtRS(latest?.prevMes)},{label:"Prev. Próx. Mês",value:fmtRS(latest?.prevProxMes)}].map(({label,value})=>(
                <div key={label}><div style={{fontSize:11,color:T.muted,marginBottom:3}}>{label}</div><div style={{fontSize:14,fontWeight:600,color:T.text}}>{value}</div></div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:600,color:T.text}}>📦 Produtos do Mês — Vendido e Faturado</div>
              <button onClick={addProdRow} style={{display:"flex",alignItems:"center",gap:5,background:"#3b82f620",color:"#3b82f6",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}><Plus size={12}/> Produto</button>
            </div>
            <div style={{fontSize:11.5,color:T.faint,marginBottom:10}}>Um produto vendido pode ser faturado só no mês seguinte — por isso Vendido e Faturado são lançados separadamente. Esses dados alimentam automaticamente a análise de produtos em Meses Fechados.</div>
            {prodLoading?(
              <div style={{padding:16,textAlign:"center",color:T.faint,fontSize:12}}>Carregando produtos do mês…</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {produtosMes.map(row=>(
                  <div key={row.id} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:10}}>
                    <div className="dg-grid dg-grid-6" style={{display:"grid",gap:8,alignItems:"end"}}>
                      <div>
                        <label style={{...lSt,fontSize:10}}>Material</label>
                        <select style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.material} onChange={setProdField(row.id,"material")}>
                          {MATERIAIS.map(m=><option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{...lSt,fontSize:10}}>Liga</label>
                        <select style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.liga} onChange={setProdField(row.id,"liga")}>
                          {LIGAS.map(l=><option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div><label style={{...lSt,fontSize:10}}>Vendido R$</label><input style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.vendidoRS} onChange={setProdField(row.id,"vendidoRS")} placeholder="0,00"/></div>
                      <div><label style={{...lSt,fontSize:10}}>Vendido KG</label><input style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.vendidoKG} onChange={setProdField(row.id,"vendidoKG")} placeholder="0,00"/></div>
                      <div><label style={{...lSt,fontSize:10}}>Faturado R$</label><input style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.faturadoRS} onChange={setProdField(row.id,"faturadoRS")} placeholder="0,00"/></div>
                      <div style={{display:"flex",gap:6,alignItems:"end"}}>
                        <div style={{flex:1}}><label style={{...lSt,fontSize:10}}>Faturado KG</label><input style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.faturadoKG} onChange={setProdField(row.id,"faturadoKG")} placeholder="0,00"/></div>
                        {produtosMes.length>1&&<button onClick={()=>removeProdRow(row.id)} style={{background:"#ef444420",color:"#ef4444",border:"none",borderRadius:6,padding:"7px 9px",cursor:"pointer",flexShrink:0}}><Trash2 size={12}/></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"12px 14px",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8}}>
            <input type="checkbox" id="clearAfter" checked={clearAfter} onChange={e=>setClearAfter(e.target.checked)} style={{width:16,height:16,cursor:"pointer",accentColor:"#10b981"}}/>
            <label htmlFor="clearAfter" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>Limpar lançamentos após o fechamento <span style={{color:T.faint}}>(recomendado)</span></label>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setShowFechar(false)} style={{background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 18px",cursor:"pointer",fontSize:14}}>Cancelar</button>
            <button onClick={confirmarFechamento} style={{display:"flex",alignItems:"center",gap:6,background:"#10b981",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:14}}><Archive size={14}/> Confirmar Fechamento</button>
          </div>
        </div>
      )}

      {showForm&&(
        <div style={{...cSt,borderTop:"3px solid #3b82f6",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:16,color:T.text}}>{editId?"Editar Lançamento":"Novo Lançamento — KPIs Acumulados"}</div>
          <div className="dg-grid dg-grid-3" style={{display:"grid",gap:12,marginBottom:12}}>
            <div><label style={lSt}>Data *</label><input type="date" style={iSt} value={form.date} onChange={setField("date")}/></div>
            <div><label style={lSt}>Faturamento Acumulado (R$)</label><input style={iSt} value={form.faturamento} onChange={setField("faturamento")} placeholder="Ex: 287450,00"/></div>
            <div><label style={lSt}>Atrasos (R$)</label><input style={iSt} value={form.atrasos} onChange={setField("atrasos")} placeholder="Ex: 45200,00"/></div>
            <div><label style={lSt}>Vendas Acumuladas (R$)</label><input style={iSt} value={form.vendas} onChange={setField("vendas")} placeholder="Ex: 150000,00"/></div>
            <div><label style={lSt}>Previsão Fat. Mês (R$)</label><input style={iSt} value={form.prevMes} onChange={setField("prevMes")} placeholder="Ex: 3240000,00"/></div>
            <div><label style={lSt}>Previsão Fat. Próx. Mês (R$)</label><input style={iSt} value={form.prevProxMes} onChange={setField("prevProxMes")} placeholder="Ex: 3850000,00"/></div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={lSt}>Observações do dia</label>
            <input style={iSt} value={form.obs} onChange={setField("obs")} placeholder="Ex: feriado, pedido grande, variação pontual…"/>
          </div>
          {formIssues.length>0&&(
            <div style={{background:"#f59e0b15",border:"1px solid #f59e0b50",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:14}}>⚠️</span>
                <span style={{fontSize:12.5,fontWeight:600,color:"#f59e0b"}}>Confira antes de salvar — pode ser erro de digitação:</span>
              </div>
              {formIssues.map((msg,i)=>(
                <div key={i} style={{fontSize:12,color:T.sub,marginLeft:20}}>• {msg}</div>
              ))}
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:12,color:T.faint}}>* Valores acumulados até a data selecionada</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>{setShowForm(false);setEditId(null);}} style={{background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:14}}>Cancelar</button>
              <button onClick={saveEntry} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:600,fontSize:14}}><Save size={14}/>{editId?"Salvar Edição":"Salvar Lançamento"}</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="dg-grid dg-grid-5" style={{display:"grid",gap:14,marginBottom:16}}>
        {kpiDefs.map(({title,val,p,color,emoji,inv,showSem,prorated,metaRaw})=>(
          <div key={title} className="dg-lift" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20,borderTop:`3px solid ${color}`,minWidth:0,opacity:hasData?1:0.45}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{title}</div>
              <div style={{background:color+"20",borderRadius:8,padding:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",width:29,height:29}}><span style={{fontSize:16,lineHeight:1}}>{emoji}</span></div>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:T.text,wordBreak:"break-word"}}>{val!=null?<AnimatedNumber value={val} format={fmtRS}/>:"—"}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>{hasData?`Até ${toDisplay(latest.date)}`:"Sem dados"}</div>
            {prorated&&wdInfo&&metaDiaria(metaRaw)!=null&&(
              <div style={{fontSize:10.5,color:T.faint,marginTop:3}}>Meta do dia: {fmtRS(metaDiaria(metaRaw))} · {wdInfo.passed}/{wdInfo.total}d úteis</div>
            )}
            {showSem&&semaforo&&(
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,padding:"5px 10px",background:semaforo.color+"15",borderRadius:8}}>
                <span style={{fontSize:13}}>{semaforo.emoji}</span>
                <span style={{fontSize:11,color:semaforo.color,fontWeight:600}}>{semaforo.label}</span>
              </div>
            )}
            <PctBadge p={p} inv={inv} T={T}/>
          </div>
        ))}
      </div>

      {hasData&&<DiasUteisProjecao entries={entries} metaFaturamento={metas.faturamento} T={T} extraHols={extraHols}/>}

      {dailyDeltas.length>1&&(
        <div className="dg-grid dg-grid-2" style={{display:"grid",gap:14,marginBottom:16}}>
          <div className="dg-lift" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20,borderTop:"3px solid #f59e0b"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:16}}>🎯</span>
              <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5}}>Ticket Médio Diário</div>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:T.text}}>{fmtRS(ticketMedio)}</div>
            <div style={{fontSize:11,color:T.faint,marginTop:2}}>Média do incremento diário de faturamento ({dailyDeltas.length} dias)</div>
          </div>
          <div className="dg-lift" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20,borderTop:"3px solid #10b981"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:16}}>🏆</span>
              <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5}}>Melhor Dia do Mês</div>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:T.text}}>{fmtRS(melhorDia?.delta)}</div>
            <div style={{fontSize:11,color:T.faint,marginTop:2}}>{melhorDia?toDisplay(melhorDia.date):"—"}</div>
          </div>
        </div>
      )}

      {entries.length>0&&(
        <div style={{...cSt,marginBottom:16}}>
          <DailyChart entries={entries} T={T} metaFaturamento={metas.faturamento} extraHols={extraHols}/>
        </div>
      )}
      {entries.length>1&&(
        <div style={{...cSt,marginBottom:16}}>
          <WeekdayChart entries={entries} T={T}/>
        </div>
      )}
      {entries.length>0&&(
        <div style={{...cSt,borderLeft:"4px solid #ef4444",marginBottom:16}}>
          <AtrasoChart entries={entries} metaValue={metaAtr} T={T}/>
        </div>
      )}

      {showHist&&entries.length>0&&(
        <div style={cSt}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:14,color:T.text}}>Histórico de Lançamentos</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Data / Obs","Faturamento","Atrasos","Vendas","Prev. Mês","Prev. Próx. Mês",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{[...entries].reverse().map(e=>(
                <tr key={e.id} style={{borderBottom:`1px solid ${T.border}50`}}>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{color:"#60a5fa",fontWeight:600}}>{toDisplay(e.date)}</div>
                    {e.obs&&<div style={{color:T.faint,fontSize:11,fontStyle:"italic",marginTop:2,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={e.obs}>{e.obs}</div>}
                  </td>
                  <td style={{padding:"11px 12px",color:T.text}}>{fmtRS(e.faturamento)}</td>
                  <td style={{padding:"11px 12px",color:"#ef4444"}}>{fmtRS(e.atrasos)}</td>
                  <td style={{padding:"11px 12px",color:T.sub}}>{fmtRS(e.vendas)}</td>
                  <td style={{padding:"11px 12px",color:T.sub}}>{fmtRS(e.prevMes)}</td>
                  <td style={{padding:"11px 12px",color:T.sub}}>{fmtRS(e.prevProxMes)}</td>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>startEdit(e)} style={{background:"#3b82f620",color:"#60a5fa",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}><Edit2 size={12}/></button>
                      {canManage&&<button onClick={()=>deleteEntry(e.id)} style={{background:"#ef444420",color:"#ef4444",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}><Trash2 size={12}/></button>}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {!hasData&&!showForm&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:52,textAlign:"center"}}>
          <div className="dg-empty-icon" style={{width:64,height:64,borderRadius:"50%",background:"#3b82f620",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:30}}>📊</div>
          <div style={{color:T.text,fontSize:16,fontWeight:600,marginBottom:6}}>Nenhum dado lançado ainda</div>
          <div style={{color:T.faint,fontSize:13}}>Clique em <strong style={{color:"#60a5fa"}}>Lançar KPIs</strong> para começar a acompanhar seu mês</div>
        </div>
      )}
    </>
  );
}

// ── BibliotecaPage ───────────────────────────────────────────
function BibliotecaPage({T}) {
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20};
  const comingSoon=[
    {emoji:"⚖️", label:"Calculadora de Pesos",    desc:"Calcule o peso de barras, tubos e perfis a partir das dimensões e do material."},
    {emoji:"📏", label:"Tabela de Barras",          desc:"Medidas padronizadas de barras chatas, redondas, quadradas e sextavadas."},
    {emoji:"🔩", label:"Tabela de Tubos",           desc:"Dimensões e espessuras de tubos estruturais e industriais."},
    {emoji:"📐", label:"Tabela de Laminados",       desc:"Perfis U, I, L e T com dimensões e pesos por metro."},
    {emoji:"🪙", label:"Tabela de Ligas",            desc:"Composição e propriedades das principais ligas de cobre, latão e alumínio."},
    {emoji:"🔄", label:"Conversor de Unidades",     desc:"Converta entre kg, lb, polegadas, milímetros e outras unidades comuns."},
  ];
  return (
    <div>
      <div style={{...cSt,marginBottom:24,textAlign:"center",padding:"48px 24px",borderTop:"3px solid #3b82f6"}}>
        <div style={{fontSize:40,marginBottom:16}}>📚</div>
        <div style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:8}}>Biblioteca Técnica</div>
        <div style={{fontSize:14,color:T.muted,maxWidth:480,margin:"0 auto"}}>
          Espaço reservado para ferramentas técnicas de consulta rápida. Em breve você terá acesso a calculadoras, tabelas de medidas e conversores diretamente aqui.
        </div>
      </div>

      <div style={{fontSize:13,fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:12}}>
        Módulos previstos
      </div>
      <div className="dg-grid dg-grid-3" style={{display:"grid",gap:14}}>
        {comingSoon.map(({emoji,label,desc})=>(
          <div key={label} style={{...cSt,opacity:.65,cursor:"default",borderLeft:`3px solid ${T.border}`}}>
            <div style={{fontSize:26,marginBottom:10}}>{emoji}</div>
            <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:6}}>{label}</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.5}}>{desc}</div>
            <div style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",background:T.card2,border:`1px solid ${T.border}`,borderRadius:20,fontSize:11,color:T.faint}}>
              Em breve
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function MesesFechados({T,reloadKey,currentUser}) {
  const canManage=isAdmin(currentUser);
  const [months,  setMonths]  =useState([]);
  const [produtosByMonth, setProdutosByMonth] =useState({});
  const [prodMetas,       setProdMetas]       =useState(EMPTY_PROD_METAS);
  const [prodMetasF,      setProdMetasF]      =useState(EMPTY_PROD_METAS);
  const [showPMetas,      setShowPMetas]      =useState(false);
  const [metasByMonth,    setMetasByMonth]     =useState({});
  const [holidays,        setHolidays]         =useState([]);
  const [loading, setLoading] =useState(true);
  const [selected,setSelected]=useState(null);
  const [editProd,  setEditProd]  =useState(false);
  const [editRows,  setEditRows]  =useState([]);
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{const r=await window.storage.get("closed_months");setMonths(r?JSON.parse(r.value):[]);}catch(_){setMonths([]);}
      try{const r=await window.storage.get("diario_produtos_mensais");if(r)setProdutosByMonth(JSON.parse(r.value));}catch(_){}
      try{const r=await window.storage.get("mensal_prod_metas");if(r){const v=JSON.parse(r.value);setProdMetas(v);setProdMetasF(v);}}catch(_){}
      try{const r=await window.storage.get("diario_metas_by_month");if(r)setMetasByMonth(JSON.parse(r.value));}catch(_){}
      try{const r=await window.storage.get("custom_holidays");if(r)setHolidays(JSON.parse(r.value).map(h=>h.date));}catch(_){}
      setLoading(false);
    })();
  },[reloadKey]);
  const deleteMth=async(id)=>{const m=months.find(x=>x.id===id);const u=months.filter(m=>m.id!==id);setMonths(u);try{await window.storage.set("closed_months",JSON.stringify(u));}catch(_){}if(selected?.id===id)setSelected(null);logAudit(currentUser,"excluir_mes_fechado",m?m.label:id);};
  const setPMeta=(m)=>(e)=>setProdMetasF(p=>({...p,[m]:e.target.value}));
  const saveProdMetas=async()=>{
    setProdMetas(prodMetasF);
    try{await window.storage.set("mensal_prod_metas",JSON.stringify(prodMetasF));}catch(_){}
    toast("Metas por material salvas com sucesso!");
  };
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20};
  const iSt={background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px",color:T.text,fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"};
  const lSt={fontSize:12,color:T.sub,marginBottom:4,display:"block"};

  // Deriva o resumo de produtos (por material e por material×liga) de um mês a partir das linhas lançadas no Diário
  const prodSummary=(monthKey)=>{
    const rows=produtosByMonth[monthKey]||[];
    if(rows.length===0)return null;
    const sum=(f)=>rows.reduce((s,r)=>s+(parseBRL(r[f])||0),0);
    const porMaterial=MATERIAIS.map(m=>{
      const rs=rows.filter(r=>r.material===m).reduce((s,r)=>s+(parseBRL(r.faturadoRS)||0),0);
      const kg=rows.filter(r=>r.material===m).reduce((s,r)=>s+(parseBRL(r.faturadoKG)||0),0);
      return rs||kg?{tipo:m,rs,kg}:null;
    }).filter(Boolean);
    const detalhado=rows.filter(r=>parseBRL(r.faturadoRS)>0).map(r=>({tipo:`${r.material} · ${r.liga}`,rs:parseBRL(r.faturadoRS),kg:parseBRL(r.faturadoKG)}));
    return{faturamentoRS:sum("faturadoRS"),faturamentoKG:sum("faturadoKG"),vendidoRS:sum("vendidoRS"),vendidoKG:sum("vendidoKG"),produtos:porMaterial,produtosDetalhado:detalhado};
  };

  const openEditProd=(monthKey)=>{
    const rows=produtosByMonth[monthKey];
    setEditRows(rows&&rows.length>0?rows:[mkProdRow()]);
    setEditProd(true);
  };
  const addEditRow    =()=>setEditRows(p=>[...p,mkProdRow()]);
  const removeEditRow =(id)=>setEditRows(p=>p.filter(r=>r.id!==id));
  const setEditField  =(id,k)=>(e)=>setEditRows(p=>p.map(r=>r.id===id?{...r,[k]:e.target.value}:r));
  const saveEditRows=async(monthKey)=>{
    const validRows=editRows.filter(r=>parseBRL(r.vendidoRS)||parseBRL(r.vendidoKG)||parseBRL(r.faturadoRS)||parseBRL(r.faturadoKG));
    const updated={...produtosByMonth,[monthKey]:validRows};
    setProdutosByMonth(updated);
    try{await window.storage.set("diario_produtos_mensais",JSON.stringify(updated));}catch(_){}
    setEditProd(false);
    toast(`Produtos de ${monthLabel(monthKey+"-01")} atualizados!`);
    logAudit(currentUser,"editar_produtos_mes",`${monthLabel(monthKey+"-01")} — ${validRows.length} linha(s)`);
  };

  // Taxa de metas atingidas (só considera meses com meta de faturamento definida) + sequência atual
  const metasStats=(()=>{
    const withGoal=[...months].sort((a,b)=>a.id.localeCompare(b.id)).map(m=>{
      const meta=parseBRL((metasByMonth[m.id]||metasByMonth.default||{}).faturamento);
      if(!meta)return null;
      return{id:m.id,hit:(m.summary.faturamento||0)>=meta};
    }).filter(Boolean);
    if(withGoal.length===0)return null;
    const hits=withGoal.filter(x=>x.hit).length;
    let streak=0;
    for(let i=withGoal.length-1;i>=0;i--){ if(withGoal[i].hit)streak++; else break; }
    return{total:withGoal.length,hits,pct:(hits/withGoal.length)*100,streak};
  })();

  if(loading)return (
    <div className="dg-page">
      <div className="dg-grid dg-grid-3" style={{display:"grid",gap:14,marginBottom:16}}>
        {Array.from({length:3}).map((_,i)=><SkeletonCard key={i} T={T}/>)}
      </div>
    </div>
  );
  if(selected){
    const s=selected;
    const sorted=[...months].sort((a,b)=>a.id.localeCompare(b.id));
    const idx=sorted.findIndex(m=>m.id===s.id);
    const prev=idx>0?sorted[idx-1]:null;
    const sumDefs=[
      {label:"Faturamento Final",curr:s.summary.faturamento,prevVal:prev?.summary.faturamento,color:"#3b82f6",inv:false},
      {label:"Atrasos Finais",   curr:s.summary.atrasos,    prevVal:prev?.summary.atrasos,    color:"#ef4444",inv:true},
      {label:"Vendas Finais",    curr:s.summary.vendas,     prevVal:prev?.summary.vendas,     color:"#10b981",inv:false},
      {label:"Prev. Fat. Mês",   curr:s.summary.prevMes,    prevVal:prev?.summary.prevMes,    color:"#8b5cf6",inv:false},
      {label:"Prev. Próx. Mês",  curr:s.summary.prevProxMes,prevVal:prev?.summary.prevProxMes,color:"#06b6d4",inv:false},
    ];
    const doCSV=()=>exportCSV(s.entries.map(e=>[toDisplay(e.date),e.faturamento??'',e.atrasos??'',e.vendas??'',e.prevMes??'',e.prevProxMes??'',e.obs||'']),["Data","Faturamento","Atrasos","Vendas","Prev.Mês","Prev.Próx.Mês","Obs"],`fechamento_${s.label}.csv`);
    const doXLSX=()=>exportXLSX(s.entries.map(e=>[toDisplay(e.date),e.faturamento??'',e.atrasos??'',e.vendas??'',e.prevMes??'',e.prevProxMes??'',e.obs||'']),["Data","Faturamento","Atrasos","Vendas","Prev.Mês","Prev.Próx.Mês","Obs"],`fechamento_${s.label}.xlsx`,s.label);
    const doPDF=()=>exportPDF(`
      <div class="pdf-cover">
        <h2>Fechamento — ${s.label}</h2>
        <p class="sub">Gerado em ${new Date().toLocaleDateString("pt-BR")} · Fechado em ${toDisplay(s.closedAt)} · ${s.entries.length} lançamentos</p>
        <div class="pdf-kpis">
          <div class="pdf-kpi accent"><div class="lbl">Faturamento Final</div><div class="val">${fmtRS(s.summary.faturamento)}</div></div>
          <div class="pdf-kpi"><div class="lbl">Atrasos Finais</div><div class="val">${fmtRS(s.summary.atrasos)}</div></div>
          <div class="pdf-kpi"><div class="lbl">Vendas Finais</div><div class="val">${fmtRS(s.summary.vendas)}</div></div>
          <div class="pdf-kpi"><div class="lbl">Ticket Médio Diário</div><div class="val">${ticketMedio!=null?fmtRS(ticketMedio):"—"}</div></div>
          ${gap!=null?`<div class="pdf-kpi"><div class="lbl">Gap Vendido vs Faturado</div><div class="val">${fmtRS(Math.abs(gap))}</div></div>`:""}
        </div>
      </div>
      <table><thead><tr><th>Data</th><th>Faturamento</th><th>Atrasos</th><th>Vendas</th><th>Prev. Mês</th><th>Prev. Próx. Mês</th><th>Obs</th></tr></thead><tbody>${s.entries.map(e=>`<tr><td>${toDisplay(e.date)}</td><td>${fmtRS(e.faturamento)}</td><td>${fmtRS(e.atrasos)}</td><td>${fmtRS(e.vendas)}</td><td>${fmtRS(e.prevMes)}</td><td>${fmtRS(e.prevProxMes)}</td><td>${e.obs||''}</td></tr>`).join('')}</tbody></table>`,`Fechamento ${s.label}`);

    const prodCurr=prodSummary(s.id);
    const prodPrev=prev?prodSummary(prev.id):null;
    const gap=prodCurr?prodCurr.vendidoRS-prodCurr.faturamentoRS:null;

    // Ticket médio diário (a partir dos incrementos reais do faturamento acumulado)
    const deltas=s.entries.map((e,i)=>{
      if(e.faturamento==null)return null;
      const p=i>0&&s.entries[i-1].faturamento!=null?s.entries[i-1].faturamento:0;
      const d=e.faturamento-p; return d>=0?d:null;
    }).filter(v=>v!=null);
    const ticketMedio=deltas.length?deltas.reduce((a,b)=>a+b,0)/deltas.length:null;

    // Comparativo Ano vs Ano (mesmo mês, ano anterior)
    const [yy,mmn]=s.id.split("-").map(Number);
    const yoyId=`${yy-1}-${String(mmn).padStart(2,"0")}`;
    const yoy=months.find(m=>m.id===yoyId)||null;

    return (
      <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>{setSelected(null);setEditProd(false);}} style={{display:"flex",alignItems:"center",gap:6,background:T.card,color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>← Voltar</button>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:T.text}}>{s.label}</div>
              <div style={{fontSize:12,color:T.muted}}>Fechado em {toDisplay(s.closedAt)} · {s.entries.length} lançamentos {prev&&<span style={{color:T.faint}}>· vs <strong style={{color:T.sub}}>{prev.label}</strong></span>}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={doCSV} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> CSV</button>
            <button onClick={doXLSX} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> Excel</button>
            <button onClick={doPDF} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> PDF</button>
          </div>
        </div>
        <div style={{...cSt,marginBottom:16,borderTop:"3px solid #3b82f6"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <TrendingUp size={16} color="#3b82f6"/>
            <div style={{fontSize:14,fontWeight:600,color:T.text}}>
              Comparativo Mês a Mês {prev?<span style={{fontSize:12,fontWeight:400,color:T.muted,marginLeft:8}}>{s.label} vs {prev.label}</span>:<span style={{fontSize:12,fontWeight:400,color:T.faint,marginLeft:8}}>— feche mais meses para comparar</span>}
            </div>
          </div>
          <div className="dg-grid dg-grid-5" style={{display:"grid",gap:12}}>
            {sumDefs.map(({label,curr,prevVal,color,inv})=>(
              <DeltaCard key={label} label={label} curr={curr} prev={prevVal} color={color} T={T} inv={inv}/>
            ))}
          </div>
        </div>
        <div className="dg-grid dg-grid-2" style={{display:"grid",gap:14,marginBottom:16}}>
          <div className="dg-lift" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20,borderTop:"3px solid #f59e0b"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:16}}>🎯</span>
              <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5}}>Ticket Médio Diário</div>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:T.text}}>{ticketMedio!=null?fmtRS(ticketMedio):"—"}</div>
            <div style={{fontSize:11,color:T.faint,marginTop:2}}>Média do incremento diário de faturamento</div>
          </div>
          <div className="dg-lift" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20,borderTop:`3px solid ${gap==null?T.border:gap>0?"#f59e0b":"#10b981"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:16}}>📦</span>
              <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5}}>Gap Vendido vs Faturado</div>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:gap==null?T.text:gap>0?"#f59e0b":"#10b981"}}>{gap!=null?fmtRS(Math.abs(gap)):"—"}</div>
            <div style={{fontSize:11,color:T.faint,marginTop:2}}>{gap==null?"Sem produtos lançados":gap>0?"Pendente de faturamento":gap<0?"Faturado além do vendido no mês (backlog anterior)":"Vendido = Faturado"}</div>
          </div>
        </div>

        {yoy&&(
          <div style={{...cSt,marginBottom:16,borderTop:"3px solid #06b6d4"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <span style={{fontSize:16}}>📆</span>
              <div style={{fontSize:14,fontWeight:600,color:T.text}}>
                Comparativo Ano vs Ano <span style={{fontSize:12,fontWeight:400,color:T.muted,marginLeft:8}}>{s.label} vs {yoy.label}</span>
              </div>
            </div>
            <div className="dg-grid dg-grid-3" style={{display:"grid",gap:12}}>
              <DeltaCard label="Faturamento" curr={s.summary.faturamento} prev={yoy.summary.faturamento} color="#3b82f6" T={T}/>
              <DeltaCard label="Vendas"      curr={s.summary.vendas}      prev={yoy.summary.vendas}      color="#10b981" T={T}/>
              <DeltaCard label="Atrasos"     curr={s.summary.atrasos}     prev={yoy.summary.atrasos}     color="#ef4444" T={T} inv/>
            </div>
          </div>
        )}

        <div style={{...cSt,borderLeft:"4px solid #ef4444",marginBottom:16}}><AtrasoChart entries={s.entries} metaValue={null} T={T}/></div>
        <div style={{...cSt,marginBottom:16}}><DailyChart entries={s.entries} T={T} metaFaturamento={(metasByMonth[s.id]||metasByMonth.default||{}).faturamento} extraHols={holidays}/></div>
        {s.entries.length>1&&<div style={{...cSt,marginBottom:16}}><WeekdayChart entries={s.entries} T={T}/></div>}

        {prodCurr&&(
          <>
            <div style={{...cSt,marginBottom:16,borderTop:"3px solid #10b981"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>📦</span>
                  <div style={{fontSize:14,fontWeight:600,color:T.text}}>Produtos do Mês — Vendido e Faturado</div>
                </div>
                {canManage&&!editProd&&<button onClick={()=>openEditProd(s.id)} style={{display:"flex",alignItems:"center",gap:5,background:"#3b82f620",color:"#3b82f6",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}><Edit2 size={12}/> Editar Produtos</button>}
              </div>
              <div className="dg-grid dg-grid-4" style={{display:"grid",gap:12}}>
                <DeltaCard label="Faturamento R$" curr={prodCurr.faturamentoRS} prev={prodPrev?.faturamentoRS} color="#3b82f6" T={T}/>
                <DeltaCard label="Faturamento KG" curr={prodCurr.faturamentoKG} prev={prodPrev?.faturamentoKG} color="#06b6d4" T={T}/>
                <DeltaCard label="Vendido R$"     curr={prodCurr.vendidoRS}     prev={prodPrev?.vendidoRS}     color="#10b981" T={T}/>
                <DeltaCard label="Vendido KG"     curr={prodCurr.vendidoKG}     prev={prodPrev?.vendidoKG}     color="#8b5cf6" T={T}/>
              </div>
            </div>
            {prodCurr.produtos.length>0&&(
              <div style={{...cSt,marginBottom:16}}>
                <ProductRanking current={prodCurr} previous={prodPrev} prodMetas={prodMetas} T={T}/>
              </div>
            )}
            {prodCurr.produtosDetalhado.some(p=>p.rs)&&(
              <div style={{...cSt,marginBottom:16}}>
                <ProductMixPie produtos={prodCurr.produtosDetalhado} T={T}/>
              </div>
            )}
          </>
        )}
        {!prodCurr&&canManage&&!editProd&&(
          <div style={{...cSt,marginBottom:16,textAlign:"center",padding:32}}>
            <div style={{fontSize:13,color:T.faint,marginBottom:10}}>Nenhum produto lançado para {s.label}.</div>
            <button onClick={()=>openEditProd(s.id)} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14,margin:"0 auto"}}><Plus size={15}/> Lançar Produtos deste Mês</button>
          </div>
        )}
        {editProd&&(
          <div style={{...cSt,marginBottom:16,borderTop:"3px solid #3b82f6"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:600,color:T.text}}>✏️ Editando Produtos — {s.label}</div>
              <button onClick={addEditRow} style={{display:"flex",alignItems:"center",gap:5,background:"#3b82f620",color:"#3b82f6",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}><Plus size={12}/> Produto</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {editRows.map(row=>(
                <div key={row.id} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:10}}>
                  <div className="dg-grid dg-grid-6" style={{display:"grid",gap:8,alignItems:"end"}}>
                    <div>
                      <label style={{...lSt,fontSize:10}}>Material</label>
                      <select style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.material} onChange={setEditField(row.id,"material")}>
                        {MATERIAIS.map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{...lSt,fontSize:10}}>Liga</label>
                      <select style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.liga} onChange={setEditField(row.id,"liga")}>
                        {LIGAS.map(l=><option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div><label style={{...lSt,fontSize:10}}>Vendido R$</label><input style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.vendidoRS} onChange={setEditField(row.id,"vendidoRS")} placeholder="0,00"/></div>
                    <div><label style={{...lSt,fontSize:10}}>Vendido KG</label><input style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.vendidoKG} onChange={setEditField(row.id,"vendidoKG")} placeholder="0,00"/></div>
                    <div><label style={{...lSt,fontSize:10}}>Faturado R$</label><input style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.faturadoRS} onChange={setEditField(row.id,"faturadoRS")} placeholder="0,00"/></div>
                    <div style={{display:"flex",gap:6,alignItems:"end"}}>
                      <div style={{flex:1}}><label style={{...lSt,fontSize:10}}>Faturado KG</label><input style={{...iSt,padding:"7px 8px",fontSize:12.5}} value={row.faturadoKG} onChange={setEditField(row.id,"faturadoKG")} placeholder="0,00"/></div>
                      {editRows.length>1&&<button onClick={()=>removeEditRow(row.id)} style={{background:"#ef444420",color:"#ef4444",border:"none",borderRadius:6,padding:"7px 9px",cursor:"pointer",flexShrink:0}}><Trash2 size={12}/></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <button onClick={()=>setEditProd(false)} style={{background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:14}}>Cancelar</button>
              <button onClick={()=>saveEditRows(s.id)} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:600,fontSize:14}}><Save size={14}/> Salvar Produtos</button>
            </div>
          </div>
        )}

        <div style={cSt}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:14,color:T.text}}>Lançamentos do Mês</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Data / Obs","Faturamento","Atrasos","Vendas","Prev. Mês","Prev. Próx. Mês"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{[...s.entries].reverse().map((e,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}50`}}>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{color:"#60a5fa",fontWeight:600}}>{toDisplay(e.date)}</div>
                    {e.obs&&<div style={{color:T.faint,fontSize:11,fontStyle:"italic",marginTop:2}}>{e.obs}</div>}
                  </td>
                  <td style={{padding:"11px 12px",color:T.text}}>{fmtRS(e.faturamento)}</td>
                  <td style={{padding:"11px 12px",color:"#ef4444"}}>{fmtRS(e.atrasos)}</td>
                  <td style={{padding:"11px 12px",color:T.sub}}>{fmtRS(e.vendas)}</td>
                  <td style={{padding:"11px 12px",color:T.sub}}>{fmtRS(e.prevMes)}</td>
                  <td style={{padding:"11px 12px",color:T.sub}}>{fmtRS(e.prevProxMes)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </>
    );
  }
  if(months.length===0)return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:60,textAlign:"center"}}>
      <div className="dg-empty-icon" style={{width:72,height:72,borderRadius:"50%",background:"#8b5cf620",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:34}}>🗂️</div>
      <div style={{color:T.text,fontSize:16,fontWeight:600,marginBottom:6}}>Nenhum mês fechado ainda</div>
      <div style={{color:T.faint,fontSize:13}}>Use <strong style={{color:"#10b981"}}>Fechar Mês</strong> no Fechamento Diário.</div>
    </div>
  );
  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div style={{color:T.muted,fontSize:14}}>{months.length} mês(es) arquivado(s)</div>
        {canManage&&<button onClick={()=>setShowPMetas(!showPMetas)} style={{display:"flex",alignItems:"center",gap:6,background:showPMetas?"#f59e0b":"#f59e0b20",color:showPMetas?"#000":"#f59e0b",border:"1px solid #f59e0b",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:600,fontSize:14}}>⚙ Metas por Material</button>}
      </div>
      {metasStats&&(
        <div style={{...cSt,marginBottom:16,borderTop:"3px solid #10b981"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{fontSize:16}}>🏁</span>
            <div style={{fontSize:14,fontWeight:600,color:T.text}}>Taxa de Metas Atingidas <span style={{fontSize:12,fontWeight:400,color:T.muted,marginLeft:8}}>(meses com meta de faturamento definida)</span></div>
          </div>
          <div className="dg-grid dg-grid-3" style={{display:"grid",gap:12}}>
            <div style={{background:T.card2,borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T.faint,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Taxa de Sucesso</div>
              <div style={{fontSize:20,fontWeight:700,color:metasStats.pct>=70?"#10b981":metasStats.pct>=40?"#f59e0b":"#ef4444"}}>{metasStats.pct.toFixed(0)}%</div>
            </div>
            <div style={{background:T.card2,borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T.faint,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Meses no Alvo</div>
              <div style={{fontSize:20,fontWeight:700,color:T.text}}>{metasStats.hits} <span style={{fontSize:13,color:T.faint,fontWeight:400}}>de {metasStats.total}</span></div>
            </div>
            <div style={{background:T.card2,borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T.faint,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Sequência Atual</div>
              <div style={{fontSize:20,fontWeight:700,color:metasStats.streak>0?"#10b981":T.text}}>{metasStats.streak>0?`🔥 ${metasStats.streak}`:"0"} <span style={{fontSize:13,color:T.faint,fontWeight:400}}>{metasStats.streak===1?"mês":"meses"}</span></div>
            </div>
          </div>
        </div>
      )}
      {showPMetas&&(
        <div style={{...cSt,borderTop:"3px solid #f59e0b",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:4,color:T.text}}>⚙ Metas por Material (R$)</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Configure a meta de faturamento individual para cada tipo de material (somando todas as ligas). Usada no ranking de produtos de cada mês fechado.</div>
          <div className="dg-grid dg-grid-6" style={{display:"grid",gap:12,marginBottom:14}}>
            {MATERIAIS.map(m=>(
              <div key={m}><label style={lSt}>{m} (R$)</label><input style={iSt} value={prodMetasF[m]} onChange={setPMeta(m)} placeholder="Ex: 850000"/></div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={saveProdMetas} style={{display:"flex",alignItems:"center",gap:6,background:"#f59e0b",color:"#000",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:14}}><Save size={14}/> Salvar Metas</button>
          </div>
        </div>
      )}
      <div className="dg-grid dg-grid-3" style={{display:"grid",gap:16}}>
        {[...months].reverse().map(m=>{
          const metaVal=parseBRL((metasByMonth[m.id]||metasByMonth.default||{}).faturamento);
          const hit=metaVal?(m.summary.faturamento||0)>=metaVal:null;
          return(
          <div key={m.id} onClick={()=>setSelected(m)} className="dg-lift" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><div style={{fontSize:20,fontWeight:700,color:T.text}}>{m.label}</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>Fechado em {toDisplay(m.closedAt)} · {m.entries.length} dias</div></div>
              <div style={{background:"#10b98120",borderRadius:8,padding:7}}><Archive size={15} color="#10b981"/></div>
            </div>
            {hit!=null&&(
              <div style={{display:"inline-flex",alignItems:"center",gap:5,background:hit?"#10b98120":"#ef444420",color:hit?"#10b981":"#ef4444",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,marginBottom:10}}>
                {hit?"🎯 Meta batida":"📉 Abaixo da meta"}
              </div>
            )}
            <div className="dg-grid dg-grid-2" style={{display:"grid",gap:8,marginBottom:14}}>
              {[{label:"Faturamento",val:m.summary.faturamento,color:"#3b82f6"},{label:"Vendas",val:m.summary.vendas,color:"#10b981"},{label:"Atrasos",val:m.summary.atrasos,color:"#ef4444"},{label:"Prev. Próx.",val:m.summary.prevProxMes,color:"#06b6d4"}].map(({label,val,color})=>(
                <div key={label} style={{background:T.card2,borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:10,color:T.faint,marginBottom:3}}>{label}</div>
                  <div style={{fontSize:13,fontWeight:600,color}}>{fmtRS(val)}</div>
                </div>
              ))}
            </div>
            {produtosByMonth[m.id]?.length>0&&(
              <div style={{fontSize:11,color:"#a78bfa",marginBottom:10,display:"flex",alignItems:"center",gap:5}}>📦 Produtos lançados</div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#60a5fa",fontWeight:500}}>Ver detalhes →</span>
              <button onClick={e=>{e.stopPropagation();deleteMth(m.id);}} style={{background:"#ef444415",color:"#ef4444",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}><Trash2 size={12}/></button>
            </div>
          </div>
        );})}
      </div>
    </>
  );
}

// ── Compras ──────────────────────────────────────────────────
function Compras({T,onPendingChange}) {
  const INIT=[{id:"REQ-001",item:"Bobinas de Cobre 1mm",categoria:"Matéria Prima",qtd:500,un:"kg",valor:"45000",urgencia:"Alta",solicitante:"João Silva",status:"Pendente",data:"29/04/2026",justificativa:"Reposição"},{id:"REQ-002",item:"Luvas de Segurança",categoria:"EPI",qtd:50,un:"pares",valor:"750",urgencia:"Normal",solicitante:"Maria Costa",status:"Aprovado",data:"28/04/2026",justificativa:""},{id:"REQ-003",item:"Óleo Lubrificante",categoria:"Insumo",qtd:200,un:"L",valor:"1800",urgencia:"Normal",solicitante:"Carlos Mendes",status:"Recusado",data:"27/04/2026",justificativa:""},{id:"REQ-004",item:"Barras de Alumínio 50mm",categoria:"Matéria Prima",qtd:1000,un:"kg",valor:"28000",urgencia:"Alta",solicitante:"Ana Ferreira",status:"Pendente",data:"29/04/2026",justificativa:"Urgente"}];
  const emptyF={item:"",categoria:"Matéria Prima",qtd:"",un:"kg",valor:"",urgencia:"Normal",justificativa:"",solicitante:""};
  const [lista,    setLista]    =useState([]);
  const [archived, setArchived] =useState([]);
  const [loading,  setLoading]  =useState(true);
  const [form,     setForm]     =useState(emptyF);
  const [open,     setOpen]     =useState(false);
  const [filtro,   setFiltro]   =useState("Todos");
  const [showArch, setShowArch] =useState(false);
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("compras_entries");setLista(r?JSON.parse(r.value):INIT);}catch(_){setLista(INIT);}
      try{const a=await window.storage.get("compras_archived");if(a)setArchived(JSON.parse(a.value));}catch(_){}
      setLoading(false);
    })();
  },[]);
  useEffect(()=>{onPendingChange&&onPendingChange(lista.filter(r=>r.status==="Pendente").length);},[lista]);
  const persistL=async(d)=>{try{await window.storage.set("compras_entries",JSON.stringify(d));}catch(_){}};
  const persistA=async(d)=>{try{await window.storage.set("compras_archived",JSON.stringify(d));}catch(_){}};
  const setField=(k)=>(e)=>setForm(p=>({...p,[k]:e.target.value}));
  const urgColor=(u)=>u==="Alta"?"#ef4444":u==="Média"?"#f59e0b":"#64748b";
  const submit=async()=>{if(!form.item||!form.qtd||!form.solicitante)return;const novo={...form,id:"REQ-"+Date.now(),status:"Pendente",data:new Date().toLocaleDateString("pt-BR")};const u=[novo,...lista];setLista(u);await persistL(u);setForm(emptyF);setOpen(false);};
  const updateStatus=async(id,s)=>{const u=lista.map(r=>r.id===id?{...r,status:s}:r);setLista(u);await persistL(u);};
  const arquivar=async()=>{const res=lista.filter(r=>r.status!=="Pendente").map(r=>({...r,archivedAt:new Date().toLocaleDateString("pt-BR")}));const ativos=lista.filter(r=>r.status==="Pendente");const na=[...archived,...res];setLista(ativos);setArchived(na);await persistL(ativos);await persistA(na);};
  const delArch=async(id)=>{const u=archived.filter(r=>r.id!==id);setArchived(u);await persistA(u);};
  const doCSV=(data,fn)=>exportCSV(data.map(r=>[r.id,r.item,r.categoria,r.qtd,r.un,r.valor??'',r.urgencia,r.solicitante,r.data,r.status]),["ID","Item","Cat","Qtd","Un","Valor","Urgência","Solicitante","Data","Status"],fn);
  const cats=["Matéria Prima","Insumo","EPI","Manutenção","Escritório","Outros"];
  const uns=["kg","un","pç","L","m","m²","caixa","pares","rolo"];
  const sc={Todos:lista.length,Pendente:lista.filter(r=>r.status==="Pendente").length,Aprovado:lista.filter(r=>r.status==="Aprovado").length,Recusado:lista.filter(r=>r.status==="Recusado").length};
  const filtered=filtro==="Todos"?lista:lista.filter(r=>r.status===filtro);
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:T.compact?14:20};
  const iSt={background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:14,width:"100%",boxSizing:"border-box",outline:"none"};
  const lSt={fontSize:12,color:T.sub,marginBottom:4,display:"block"};
  if(loading)return (
    <div className="dg-page">
      <div className="dg-grid dg-grid-4" style={{display:"grid",gap:14,marginBottom:16}}>
        {Array.from({length:4}).map((_,i)=><SkeletonCard key={i} T={T}/>)}
      </div>
      <div style={{marginBottom:16}}><SkeletonChart T={T}/></div>
    </div>
  );
  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["Todos","Pendente","Aprovado","Recusado"].map(s=>{const c=sc[s],active=filtro===s,color=s==="Pendente"?"#f59e0b":s==="Aprovado"?"#10b981":s==="Recusado"?"#ef4444":"#3b82f6";return(
            <button key={s} onClick={()=>setFiltro(s)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:20,fontSize:13,fontWeight:active?600:400,cursor:"pointer",background:active?color+"20":"transparent",color:active?color:T.muted,border:`1.5px solid ${active?color:T.border}`}}>
              {s} <span style={{background:active?color:"transparent",color:active?"#fff":T.muted,borderRadius:10,padding:"1px 6px",fontSize:11,fontWeight:700,border:`1px solid ${active?color:T.border}`}}>{c}</span>
            </button>
          );})}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {archived.length>0&&<button onClick={()=>setShowArch(!showArch)} style={{display:"flex",alignItems:"center",gap:5,background:showArch?"#8b5cf620":"transparent",color:"#8b5cf6",border:"1px solid #8b5cf6",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}><Archive size={14}/> Histórico ({archived.length})</button>}
          {lista.filter(r=>r.status!=="Pendente").length>0&&<button onClick={arquivar} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}><Archive size={14}/> Arquivar Resolvidos</button>}
          <button onClick={()=>doCSV(lista,"requisicoes.csv")} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> CSV</button>
          <button onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}><Plus size={15}/> Nova Solicitação</button>
        </div>
      </div>
      {open&&(
        <div style={{...cSt,marginBottom:16,borderTop:"3px solid #3b82f6"}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:16,color:T.text}}>Nova Requisição de Compra</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
            <div style={{gridColumn:"1/3"}}><label style={lSt}>Item / Produto *</label><input style={iSt} value={form.item} onChange={setField("item")} placeholder="Descrição do item"/></div>
            <div><label style={lSt}>Categoria</label><select style={iSt} value={form.categoria} onChange={setField("categoria")}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={lSt}>Quantidade *</label><input style={iSt} type="number" value={form.qtd} onChange={setField("qtd")}/></div>
            <div><label style={lSt}>Unidade</label><select style={iSt} value={form.un} onChange={setField("un")}>{uns.map(u=><option key={u}>{u}</option>)}</select></div>
            <div><label style={lSt}>Valor Estimado (R$)</label><input style={iSt} value={form.valor} onChange={setField("valor")} placeholder="Ex: 5000,00"/></div>
            <div><label style={lSt}>Urgência</label><select style={iSt} value={form.urgencia} onChange={setField("urgencia")}>{["Normal","Média","Alta"].map(u=><option key={u}>{u}</option>)}</select></div>
            <div><label style={lSt}>Solicitante *</label><input style={iSt} value={form.solicitante} onChange={setField("solicitante")} placeholder="Nome completo"/></div>
            <div style={{gridColumn:"1/4"}}><label style={lSt}>Justificativa</label><textarea style={{...iSt,resize:"vertical",minHeight:64}} value={form.justificativa} onChange={setField("justificativa")}/></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setOpen(false)} style={{background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 18px",cursor:"pointer",fontSize:14}}>Cancelar</button>
            <button onClick={submit} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600,fontSize:14}}>Enviar Solicitação</button>
          </div>
        </div>
      )}
      {showArch&&archived.length>0&&(
        <div style={{...cSt,borderTop:"3px solid #8b5cf6",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600,color:T.text}}>Histórico Arquivado ({archived.length})</div>
            <button onClick={()=>doCSV(archived,"historico_compras.csv")} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}><Download size={13}/> CSV</button>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Item","Categoria","Valor Est.","Solicitante","Data","Status","Arquivado em",""].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{archived.map(r=>(
                <tr key={r.id} style={{borderBottom:`1px solid ${T.border}50`}}>
                  <td style={{padding:"10px 12px",color:T.text}}>{r.item}</td>
                  <td style={{padding:"10px 12px",color:T.sub}}>{r.categoria}</td>
                  <td style={{padding:"10px 12px",color:"#10b981"}}>{r.valor?fmtRS(parseBRL(r.valor)):"—"}</td>
                  <td style={{padding:"10px 12px",color:T.sub}}>{r.solicitante}</td>
                  <td style={{padding:"10px 12px",color:T.muted}}>{r.data}</td>
                  <td style={{padding:"10px 12px"}}><StatusBadge s={r.status}/></td>
                  <td style={{padding:"10px 12px",color:T.faint,fontSize:12}}>{r.archivedAt}</td>
                  <td style={{padding:"10px 12px"}}><button onClick={()=>delArch(r.id)} style={{background:"#ef444415",color:"#ef4444",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer"}}><Trash2 size={12}/></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      <div style={cSt}>
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"32px 0",color:T.faint,fontSize:13}}>Nenhuma requisição {filtro!=="Todos"?`com status "${filtro}"`:""} encontrada.</div>
        ):(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["ID","Item","Cat.","Qtd","Valor Est.","Urgência","Solicitante","Data","Status","Ações"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(r=>(
                <tr key={r.id} style={{borderBottom:`1px solid ${T.border}50`}}>
                  <td style={{padding:"12px",color:"#60a5fa",fontWeight:600,fontSize:12}}>{r.id}</td>
                  <td style={{padding:"12px",color:T.text}}>{r.item}</td>
                  <td style={{padding:"12px",color:T.sub}}>{r.categoria}</td>
                  <td style={{padding:"12px",color:T.sub,whiteSpace:"nowrap"}}>{r.qtd} {r.un}</td>
                  <td style={{padding:"12px",color:"#10b981",fontWeight:600}}>{r.valor?fmtRS(parseBRL(r.valor)):"—"}</td>
                  <td style={{padding:"12px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:500,background:urgColor(r.urgencia)+"20",color:urgColor(r.urgencia)}}>{r.urgencia}</span></td>
                  <td style={{padding:"12px",color:T.sub}}>{r.solicitante}</td>
                  <td style={{padding:"12px",color:T.muted}}>{r.data}</td>
                  <td style={{padding:"12px"}}><StatusBadge s={r.status}/></td>
                  <td style={{padding:"12px"}}>
                    {r.status==="Pendente"&&(
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>updateStatus(r.id,"Aprovado")} style={{background:"#10b98120",color:"#10b981",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>✓</button>
                        <button onClick={()=>updateStatus(r.id,"Recusado")} style={{background:"#ef444420",color:"#ef4444",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>✕</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ── App Shell ────────────────────────────────────────────────
export default function App() {
  const [page,          setPage]          =useState("home");
  const [dark,          setDark]          =useState(true);
  const [compact,       setCompact]       =useState(false);
  const [sidebarOpen,   setSidebarOpen]   =useState(false);
  const [reloadKey,     setReloadKey]     =useState(0);
  const [atrasoAlert,   setAtrasoAlert]   =useState(false);
  const [presentMode,   setPresentMode]   =useState(false);
  const [pdfContent,    setPdfContent]    =useState(null);
  const [pdfTitle,      setPdfTitle]      =useState("");
  const [toasts,        setToasts]        =useState([]);
  const [currentUser,   setCurrentUser]   =useState(null);
  const [usersExist,    setUsersExist]    =useState(true);
  const [authLoading,   setAuthLoading]   =useState(true);
  const T={...THEMES[dark?"dark":"light"],compact};
  useGlobalCSS();

  useEffect(()=>{ _pdfCb=(html,t)=>{setPdfContent(html);setPdfTitle(t);}; },[]);
  useEffect(()=>{
    _toastCb=(msg,type)=>{
      const id=Date.now()+Math.random();
      setToasts(p=>[...p,{id,msg,type}]);
      setTimeout(()=>setToasts(p=>p.map(t=>t.id===id?{...t,leaving:true}:t)),2600);
      setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),2900);
    };
  },[]);
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("app_users");const list=r?JSON.parse(r.value):[];setUsersExist(list.length>0);}catch(_){setUsersExist(false);}
      setAuthLoading(false);
    })();
  },[]);

  const logout=()=>{logAudit(currentUser,"logout",`Logout realizado`);setCurrentUser(null);setPage("home");setSidebarOpen(false);toast("Sessão encerrada.","info");};

  const goTo=(id)=>{setPage(id);setSidebarOpen(false);};

  const nav=[
    {section:"Principal",items:[{id:"home",label:"Início",icon:HomeIcon}]},
    {section:"Painel de Vendas",items:[
      {id:"diario",   label:"Fechamento Diário", icon:BarChart2,  alertDot:atrasoAlert},
      {id:"fechados", label:"Meses Fechados",    icon:Archive},
    ]},
    {section:"Biblioteca",items:[{id:"biblioteca",label:"Biblioteca",icon:Package}]},
    ...(isAdmin(currentUser)?[{section:"Administração",items:[{id:"usuarios",label:"Usuários",icon:UsersIcon},{id:"auditoria",label:"Log de Auditoria",icon:Shield}]}]:[]),
  ];
  const titles={home:"Início",diario:"Fechamento Diário",fechados:"Meses Fechados",biblioteca:"Biblioteca",usuarios:"Usuários",auditoria:"Log de Auditoria"};
  const handleMonthClosed=()=>{setReloadKey(k=>k+1);setPage("fechados");};

  if(authLoading){
    return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontSize:14}}>Carregando…</div>;
  }
  if(!currentUser){
    return <AuthScreen dark={dark} setDark={setDark} usersExist={usersExist} onLogin={(u)=>{setCurrentUser(u);setUsersExist(true);toast(`Bem-vindo(a), ${u.nome}!`);}}/>;
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter',system-ui,sans-serif",transition:"background .2s,color .2s"}}>
      {presentMode&&<PresentMode onExit={()=>setPresentMode(false)}/>}
      {pdfContent&&<PDFModal content={pdfContent} title={pdfTitle} onClose={()=>setPdfContent(null)}/>}
      <ToastContainer toasts={toasts}/>
      {currentUser?.role==="operador"&&!currentUser.onboarded&&(
        <OnboardingModal T={T} userName={currentUser.nome} onDismiss={async()=>{
          const updated={...currentUser,onboarded:true};
          setCurrentUser(updated);
          try{
            const r=await window.storage.get("app_users");
            const list=r?JSON.parse(r.value):[];
            await window.storage.set("app_users",JSON.stringify(list.map(u=>u.id===updated.id?updated:u)));
          }catch(_){}
        }}/>
      )}

      {/* Overlay (mobile only, closes sidebar) */}
      <div className={`dg-overlay${sidebarOpen?" dg-overlay-open":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* Sidebar */}
      <div className={`dg-sidebar${sidebarOpen?" dg-sidebar-open":""}`} style={{width:240,background:T.card,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",zIndex:100,transition:"background .2s"}}>
        <div style={{padding:"20px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,display:"flex",alignItems:"center",gap:8}}>
              <div style={{background:"#3b82f620",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📊</div>
              Dashboard Gerencial
            </div>
            <div style={{fontSize:11,color:T.muted,marginTop:3,marginLeft:40}}>Painel de Gestão</div>
          </div>
          <button onClick={()=>setSidebarOpen(false)} className="dg-hamburger" style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",padding:4}}><X size={18}/></button>
        </div>
        <nav style={{flex:1,padding:"12px 0",overflowY:"auto"}}>
          {nav.map(({section,items})=>(
            <div key={section}>
              <div style={{padding:"10px 16px 4px",fontSize:10,color:T.faint,textTransform:"uppercase",letterSpacing:1}}>{section}</div>
              {items.map(({id,label,icon:Icon,disabled,badge,alertDot})=>{
                const active=page===id;
                return (
                  <div key={id} onClick={()=>!disabled&&goTo(id)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:disabled?"default":"pointer",borderRadius:6,margin:"2px 8px",background:active?"#3b82f620":"transparent",color:disabled?T.border:active?"#60a5fa":T.sub,borderLeft:`3px solid ${active?"#3b82f6":"transparent"}`,fontSize:13,fontWeight:active?600:400,opacity:disabled?.4:1,transition:"all .15s"}}>
                    <div style={{position:"relative",flexShrink:0}}>
                      <Icon size={15}/>
                      {alertDot&&<span style={{position:"absolute",top:-3,right:-3,width:7,height:7,borderRadius:"50%",background:"#ef4444",boxShadow:"0 0 4px #ef4444"}}/>}
                    </div>
                    <span style={{flex:1}}>{label}</span>
                    {badge&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700,flexShrink:0}}>{badge}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{background:isAdmin(currentUser)?"#8b5cf620":"#3b82f620",borderRadius:"50%",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {isAdmin(currentUser)?<Shield size={14} color="#8b5cf6"/>:<User size={14} color="#3b82f6"/>}
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.nome}</div>
              <div style={{fontSize:10.5,color:T.faint}}>{ROLES[currentUser.role]}</div>
            </div>
          </div>
          <button onClick={logout} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:600}}>
            <LogOut size={13}/> Sair
          </button>
          <div style={{fontSize:10,color:T.faint,marginTop:8,textAlign:"center"}}>v1.9.0 · Dashboard Gerencial</div>
        </div>
      </div>

      {/* Main */}
      <div className="dg-main" style={{marginLeft:240,flex:1,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:T.compact?"10px 24px":"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,transition:"background .2s",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
            <button onClick={()=>setSidebarOpen(true)} className="dg-hamburger" style={{background:T.card2,border:`1px solid ${T.border}`,color:T.sub,borderRadius:8,padding:8,cursor:"pointer",alignItems:"center"}}><Menu size={16}/></button>
            <div style={{fontSize:18,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{titles[page]}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <button onClick={printDashboard} className="no-print" style={{display:"flex",alignItems:"center",gap:6,background:T.card2,color:T.sub,border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>
              <Download size={14}/> <span className="dg-topbar-label">Exportar PDF</span>
            </button>
            <button onClick={()=>setPresentMode(true)} className="no-print" style={{display:"flex",alignItems:"center",gap:6,background:T.card2,color:T.sub,border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>
              <Maximize2 size={14}/> <span className="dg-topbar-label">Apresentação</span>
            </button>
            <button onClick={()=>setCompact(!compact)} title="Modo compacto" style={{display:"flex",alignItems:"center",gap:6,background:compact?"#8b5cf6":"#8b5cf620",color:compact?"#fff":"#8b5cf6",border:"1px solid #8b5cf6",borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600,transition:"all .2s"}}>
              <Minus size={14}/> <span className="dg-topbar-label">{compact?"Modo Normal":"Modo Compacto"}</span>
            </button>
            <button onClick={()=>setDark(!dark)} style={{display:"flex",alignItems:"center",gap:6,background:dark?"#1e3a5f":"#fef9c3",color:dark?"#60a5fa":"#b45309",border:`1px solid ${dark?"#3b82f6":"#fbbf24"}`,borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600,transition:"all .2s"}}>
              {dark?(<><Sun size={14}/> <span className="dg-topbar-label">Tema Claro</span></>):(<><Moon size={14}/> <span className="dg-topbar-label">Tema Escuro</span></>)}
            </button>
            <div className="dg-topbar-label" style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981"}}/>
              <span style={{fontSize:12,color:T.muted,textTransform:"capitalize"}}>{getDynDate()}</span>
            </div>
          </div>
        </div>
        <div className="dg-page" style={{padding:compact?16:24,flex:1}}>
          {page==="home"     &&<HomePage         T={T} onNavigate={setPage}/>}
          {page==="diario"   &&<FechamentoDiario T={T} onMonthClosed={handleMonthClosed} onAtrasoAlert={setAtrasoAlert} currentUser={currentUser}/>}
          {page==="fechados" &&<MesesFechados    T={T} reloadKey={reloadKey} currentUser={currentUser}/>}
          {page==="biblioteca"&&<BibliotecaPage  T={T}/>}
          {page==="usuarios"&&isAdmin(currentUser)&&<UsersPage T={T} currentUser={currentUser} onUserUpdated={setCurrentUser}/>}
          {page==="auditoria"&&isAdmin(currentUser)&&<AuditLogPage T={T}/>}
        </div>
      </div>
    </div>
  );
}
