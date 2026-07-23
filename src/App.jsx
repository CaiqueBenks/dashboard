import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine, PieChart, Pie } from "recharts";
import { TrendingUp, ShoppingCart, BarChart2, DollarSign, AlertTriangle, Package, CheckCircle, Clock, XCircle, Plus, Save, Trash2, ChevronDown, ChevronUp, Edit2, Sun, Moon, Archive, ArrowUpRight, ArrowDownRight, Minus, Calendar, Download, Home as HomeIcon, Maximize2, X } from "lucide-react";

const THEMES = {
  dark:  { bg:"#0f172a", card:"#1e293b", card2:"#162032", border:"#334155", text:"#f1f5f9", sub:"#94a3b8", muted:"#64748b", faint:"#475569", inputBg:"#0f172a" },
  light: { bg:"#f1f5f9", card:"#ffffff",  card2:"#f8fafc",  border:"#e2e8f0", text:"#0f172a", sub:"#475569", muted:"#64748b", faint:"#94a3b8", inputBg:"#f8fafc" },
};

const TIPOS  = ["Cobre","Latão","Alumínio","Tubos","Barras","Laminados"];
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
const EMPTY_PROD_METAS = Object.fromEntries(TIPOS.map(t => [t,""]));
const mkMF = () => ({ mes:new Date().toISOString().slice(0,7), fRS:"", fKG:"", vRS:"", vKG:"", produtos:TIPOS.map(t=>({tipo:t,rs:"",kg:""})) });

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

const getWDInfo = (year,month) => {
  const now=new Date(); now.setHours(23,59,59,0);
  let total=0,passed=0;
  const d=new Date(year,month-1,1);
  while(d.getMonth()===month-1){ const dow=d.getDay(); if(dow!==0&&dow!==6){total++;if(d<=now)passed++;} d.setDate(d.getDate()+1); }
  return{total,passed,remaining:total-passed};
};

const exportCSV = (rows,headers,filename) => {
  const csv=[headers,...rows].map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(";")).join("\n");
  const uri="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);
  const a=document.createElement("a"); a.href=uri; a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
};
let _pdfCb=null;
const exportPDF=(html,title)=>{ if(_pdfCb)_pdfCb(html,title); };

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
          srcDoc={`<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:24px;font-size:13px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}th{background:#f1f5f9;font-weight:600;font-size:12px}h2{font-size:18px;margin-bottom:4px}p{color:#64748b;font-size:12px;margin-bottom:12px}tr:nth-child(even){background:#f8fafc}</style></head><body>${content}</body></html>`}
        />
      </div>
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────────
function StatusBadge({s}) {
  const cfg={Pendente:{color:"#f59e0b",icon:<Clock size={11}/>},Aprovado:{color:"#10b981",icon:<CheckCircle size={11}/>},Recusado:{color:"#ef4444",icon:<XCircle size={11}/>}};
  const{color="#64748b",icon=null}=cfg[s]||{};
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:500,background:color+"20",color}}>{icon}{s}</span>;
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

// ── DailyChart ───────────────────────────────────────────────
function DailyChart({entries,T}) {
  const [active,setActive]=useState(["faturamento","prevMes"]);
  const toggle=(k)=>setActive(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);
  const data=entries.map(e=>({dia:toDisplay(e.date),faturamento:e.faturamento,atrasos:e.atrasos,vendas:e.vendas,prevMes:e.prevMes,prevProxMes:e.prevProxMes}));
  const ttStyle={background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:14,fontWeight:600,color:T.text}}>Evolução por Dia</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {KPI_OPTIONS.map(({key,label,color})=>{
            const on=active.includes(key);
            return (
              <button key={key} onClick={()=>toggle(key)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:on?color+"25":"transparent",color:on?color:T.faint,border:`1.5px solid ${on?color:T.border}`}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:on?color:T.border,display:"inline-block",flexShrink:0}}/>{label}
              </button>
            );
          })}
        </div>
      </div>
      {active.length===0 ? (
        <div style={{textAlign:"center",padding:"32px 0",color:T.faint,fontSize:13}}>Selecione ao menos um KPI.</div>
      ):(
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>{KPI_OPTIONS.map(({key,color})=>(
              <linearGradient key={key} id={`g_${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25}/><stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            ))}</defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="dia" tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v>=1000000?(v/1000000).toFixed(1)+"M":(v/1000).toFixed(0)+"k")}/>
            <Tooltip formatter={(v,n)=>[fmtRS(v),KPI_OPTIONS.find(o=>o.key===n)?.label||n]} contentStyle={ttStyle} labelStyle={{color:T.sub}}/>
            <Legend wrapperStyle={{color:T.sub,fontSize:12}} formatter={n=>KPI_OPTIONS.find(o=>o.key===n)?.label||n}/>
            {KPI_OPTIONS.filter(o=>active.includes(o.key)).map(({key,color})=>(
              <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} fill={`url(#g_${key})`} dot={{fill:color,r:4}} activeDot={{r:6}}/>
            ))}
          </AreaChart>
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
function DiasUteisProjecao({entries,metaFaturamento,T}) {
  if(entries.length===0)return null;
  const latest=entries[entries.length-1];
  const d=new Date((latest.date||today())+"T12:00:00");
  const wd=getWDInfo(d.getFullYear(),d.getMonth()+1);
  const fat=latest.faturamento;
  const meta=parseBRL(metaFaturamento);
  let dailyAvg=null,projecao=null,neededPerDay=null;
  if(fat!=null&&wd.passed>0){dailyAvg=fat/wd.passed;projecao=dailyAvg*wd.total;if(meta&&wd.remaining>0)neededPerDay=(meta-fat)/wd.remaining;}
  const pctDias=(wd.passed/wd.total)*100;
  const pctProj=meta&&projecao?(projecao/meta)*100:null;
  const projColor=pctProj==null?"#64748b":pctProj>=100?"#10b981":pctProj>=80?"#f59e0b":"#ef4444";
  const sem=calcSem(projecao,meta);
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20};
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
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
  const [metas,  setMetas]  =useState(EMPTY_METAS);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("diario_entries");if(r)setEntries(JSON.parse(r.value));}catch(_){}
      try{const m=await window.storage.get("diario_metas");if(m)setMetas(JSON.parse(m.value));}catch(_){}
      setLoading(false);
    })();
    const fn=(e)=>{if(e.key==="Escape")onExit();};
    window.addEventListener("keydown",fn);
    return()=>window.removeEventListener("keydown",fn);
  },[]);
  const latest=entries.length>0?entries[entries.length-1]:null;
  const metaFat=parseBRL(metas.faturamento);
  let projecao=null,wd=null;
  if(latest?.faturamento&&latest?.date){
    const dd=new Date(latest.date+"T12:00:00");
    wd=getWDInfo(dd.getFullYear(),dd.getMonth()+1);
    if(wd.passed>0)projecao=(latest.faturamento/wd.passed)*wd.total;
  }
  const sem=calcSem(projecao,metaFat);
  const kpiDefs=[
    {title:"Faturamento Acumulado",val:latest?.faturamento,color:"#3b82f6",Icon:DollarSign},
    {title:"Atrasos",              val:latest?.atrasos,    color:"#ef4444",Icon:AlertTriangle},
    {title:"Vendas Acumuladas",    val:latest?.vendas,     color:"#10b981",Icon:ShoppingCart},
    {title:"Prev. Fat. Mês",       val:latest?.prevMes,    color:"#8b5cf6",Icon:TrendingUp},
    {title:"Prev. Fat. Próx. Mês", val:latest?.prevProxMes,color:"#06b6d4",Icon:TrendingUp},
  ];
  return (
    <div style={{position:"fixed",inset:0,background:"#080e1a",zIndex:9999,display:"flex",flexDirection:"column",padding:36,overflowY:"auto"}}>
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
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:20}}>
            {kpiDefs.map(({title,val,color,Icon})=>(
              <div key={title} style={{background:"#1e293b",border:`1px solid #334155`,borderTop:`4px solid ${color}`,borderRadius:14,padding:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:.8}}>{title}</div>
                  <div style={{background:color+"30",borderRadius:8,padding:7}}><Icon size={16} color={color}/></div>
                </div>
                <div style={{fontSize:26,fontWeight:800,color:val!=null?color:"#334155"}}>{val!=null?fmtRS(val):"—"}</div>
                <div style={{fontSize:11,color:"#475569",marginTop:8}}>{latest?`Até ${toDisplay(latest.date)}`:"Sem dados"}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
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
  const [metas,  setMetas]  =useState(EMPTY_METAS);
  const [closed, setClosed] =useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("diario_entries");if(r)setDaily(JSON.parse(r.value));}catch(_){}
      try{const r=await window.storage.get("diario_metas");if(r)setMetas(JSON.parse(r.value));}catch(_){}
      try{const r=await window.storage.get("closed_months");if(r)setClosed(JSON.parse(r.value));}catch(_){}
      setLoading(false);
    })();
  },[]);
  if(loading)return <div style={{color:T.muted,padding:40,textAlign:"center"}}>Carregando...</div>;

  const latest=daily.length>0?daily[daily.length-1]:null;
  const metaAtr=parseBRL(metas.atrasos);
  const atrasoAlt=metaAtr!=null&&latest?.atrasos!=null&&latest.atrasos>metaAtr;
  const lastClosed=closed.length>0?closed[closed.length-1]:null;
  const prevFat=lastClosed?.summary?.faturamento;
  const prevVendas=lastClosed?.summary?.vendas;
  const currFat=latest?.faturamento;
  const currVendas=latest?.vendas;
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20};

  const summaryCards=[
    {label:"Faturamento Acumulado",val:currFat,       color:"#3b82f6",Icon:DollarSign,   sub:latest?`Até ${toDisplay(latest.date)}`:"Sem lançamentos",isRS:true},
    {label:"Atrasos",               val:latest?.atrasos,color:atrasoAlt?"#ef4444":"#10b981",Icon:AlertTriangle,sub:atrasoAlt?"⚠ Acima da meta":"✓ Dentro da meta",isRS:true},
    {label:"Vendas Acumuladas",     val:currVendas,   color:"#10b981",Icon:ShoppingCart,  sub:latest?`Até ${toDisplay(latest.date)}`:"Sem lançamentos",isRS:true},
    {label:"Meses Fechados",        val:closed.length,color:"#8b5cf6",Icon:Archive,        sub:"no histórico",isRS:false},
  ];
  const quickLinks=[
    {id:"diario",    label:"Fechamento Diário", Icon:BarChart2,  color:"#3b82f6", desc:"Lançar e visualizar KPIs do dia"},
    {id:"mensal",    label:"Fechamento Mensal", Icon:TrendingUp, color:"#10b981", desc:"Dados consolidados do mês"},
    {id:"fechados",  label:"Meses Fechados",    Icon:Archive,    color:"#8b5cf6", desc:"Histórico de meses arquivados"},
    {id:"biblioteca",label:"Biblioteca",        Icon:Package,    color:"#06b6d4", desc:"Ferramentas e tabelas técnicas"},
  ];

  return (
    <>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:700,color:T.text,marginBottom:4}}>{getGreeting()}! 👋</div>
        <div style={{fontSize:14,color:T.muted,textTransform:"capitalize"}}>{getDynDate()}</div>
      </div>

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

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
        {summaryCards.map(({label,val,color,Icon,sub,isRS})=>(
          <div key={label} style={{...cSt,borderTop:`3px solid ${color}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{label}</div>
              <div style={{background:color+"20",borderRadius:8,padding:7,flexShrink:0}}><Icon size={15} color={color}/></div>
            </div>
            <div style={{fontSize:22,fontWeight:700,color}}>{val!=null?(isRS?fmtRS(val):fmtN(val)):"—"}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:4}}>{sub}</div>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[
              {label:"Faturamento",curr:currFat,prev:prevFat,color:"#3b82f6",inv:false},
              {label:"Vendas",     curr:currVendas,prev:prevVendas,color:"#10b981",inv:false},
            ].map(({label,curr,prev,color,inv})=>{
              const d=calcDelta(curr,prev);
              const gc=d==null?"#64748b":(!inv?d.up:"not up")===true?"#10b981":"#ef4444";
              return (
                <div key={label} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:8}}>{label} — Acumulado vs Fechamento Anterior</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {quickLinks.map(({id,label,Icon,color,desc})=>(
            <button key={id} onClick={()=>onNavigate(id)} style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8,padding:16,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left"}}>
              <div style={{background:color+"20",borderRadius:8,padding:8}}><Icon size={18} color={color}/></div>
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
function FechamentoDiario({T,onMonthClosed,onAtrasoAlert}) {
  const initForm={...EMPTY_FORM,date:today()};
  const [entries,    setEntries]    =useState([]);
  const [form,       setForm]       =useState(initForm);
  const [showForm,   setShowForm]   =useState(false);
  const [loading,    setLoading]    =useState(true);
  const [editId,     setEditId]     =useState(null);
  const [showHist,   setShowHist]   =useState(false);
  const [saved,      setSaved]      =useState(false);
  const [showMetas,  setShowMetas]  =useState(false);
  const [metas,      setMetas]      =useState(EMPTY_METAS);
  const [metasForm,  setMetasForm]  =useState(EMPTY_METAS);
  const [metasSaved, setMetasSaved] =useState(false);
  const [showFechar, setShowFechar] =useState(false);
  const [clearAfter, setClearAfter] =useState(true);

  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("diario_entries");if(r)setEntries(JSON.parse(r.value));}catch(_){}
      try{const m=await window.storage.get("diario_metas");if(m){const v=JSON.parse(m.value);setMetas(v);setMetasForm(v);}}catch(_){}
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{
    if(entries.length>0&&metas.atrasos){
      const lat=entries[entries.length-1];
      const mv=parseBRL(metas.atrasos);
      onAtrasoAlert&&onAtrasoAlert(mv!=null&&lat.atrasos!=null&&lat.atrasos>mv);
    }else{onAtrasoAlert&&onAtrasoAlert(false);}
  },[entries,metas]);

  const persist  =async(d)=>{try{await window.storage.set("diario_entries",JSON.stringify(d));}catch(_){}};
  const setField =(k)=>(e)=>setForm(p=>({...p,[k]:e.target.value}));
  const setMetaF =(k)=>(e)=>setMetasForm(p=>({...p,[k]:e.target.value}));

  const saveMetas=async()=>{
    setMetas(metasForm);
    try{await window.storage.set("diario_metas",JSON.stringify(metasForm));}catch(_){}
    setMetasSaved(true);setTimeout(()=>setMetasSaved(false),2000);
  };

  const saveEntry=async()=>{
    if(!form.date)return;
    const entry={id:editId||form.date,date:form.date,faturamento:parseBRL(form.faturamento),atrasos:parseBRL(form.atrasos),vendas:parseBRL(form.vendas),prevMes:parseBRL(form.prevMes),prevProxMes:parseBRL(form.prevProxMes),obs:form.obs||""};
    let updated=editId?entries.map(e=>e.id===editId?entry:e):(()=>{const ex=entries.find(e=>e.date===form.date);return ex?entries.map(e=>e.date===form.date?entry:e):[...entries,entry];})();
    updated=updated.sort((a,b)=>a.date.localeCompare(b.date));
    setEntries(updated);await persist(updated);
    setForm(initForm);setShowForm(false);setEditId(null);
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  const deleteEntry=async(id)=>{const u=entries.filter(e=>e.id!==id);setEntries(u);await persist(u);};
  const startEdit=(e)=>{setForm({date:e.date,faturamento:e.faturamento??"",atrasos:e.atrasos??"",vendas:e.vendas??"",prevMes:e.prevMes??"",prevProxMes:e.prevProxMes??"",obs:e.obs||""});setEditId(e.id);setShowForm(true);setShowHist(false);setShowMetas(false);setShowFechar(false);};
  const closeAll=(which)=>{setShowForm(which==="form");setShowMetas(which==="metas");setShowHist(which==="hist");setShowFechar(which==="fechar");if(which!=="form")setEditId(null);};

  const confirmarFechamento=async()=>{
    if(entries.length===0)return;
    const monthKey=entries[0].date.slice(0,7);
    const lastEntry=entries[entries.length-1];
    const record={id:monthKey,label:monthLabel(entries[0].date),closedAt:today(),entries:[...entries],summary:{faturamento:lastEntry.faturamento,atrasos:lastEntry.atrasos,vendas:lastEntry.vendas,prevMes:lastEntry.prevMes,prevProxMes:lastEntry.prevProxMes}};
    let list=[];
    try{const ex=await window.storage.get("closed_months");list=ex?JSON.parse(ex.value):[];}catch(_){}
    try{await window.storage.set("closed_months",JSON.stringify([...list.filter(m=>m.id!==monthKey),record]));}catch(_){}
    // Auto-consolidation prefill for FechamentoMensal
    const prefill={mes:monthKey,fRS:lastEntry.faturamento??"",vRS:lastEntry.vendas??"",fromDiario:true};
    try{await window.storage.set("mensal_prefill",JSON.stringify(prefill));}catch(_){}
    if(clearAfter){setEntries([]);await persist([]);}
    setShowFechar(false);
    if(onMonthClosed)onMonthClosed();
  };

  const doCSV=()=>exportCSV(entries.map(e=>[toDisplay(e.date),e.faturamento??'',e.atrasos??'',e.vendas??'',e.prevMes??'',e.prevProxMes??'',e.obs||'']),["Data","Faturamento R$","Atrasos R$","Vendas R$","Prev.Mês R$","Prev.Próx.Mês R$","Obs"],"fechamento_diario.csv");
  const doPDF=()=>exportPDF(`<h2>Fechamento Diário</h2><p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p><table><thead><tr><th>Data</th><th>Faturamento</th><th>Atrasos</th><th>Vendas</th><th>Prev. Mês</th><th>Prev. Próx. Mês</th><th>Observações</th></tr></thead><tbody>${entries.map(e=>`<tr><td>${toDisplay(e.date)}</td><td>${fmtRS(e.faturamento)}</td><td>${fmtRS(e.atrasos)}</td><td>${fmtRS(e.vendas)}</td><td>${fmtRS(e.prevMes)}</td><td>${fmtRS(e.prevProxMes)}</td><td>${e.obs||''}</td></tr>`).join('')}</tbody></table>`,"Fechamento Diário");

  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20};
  const iSt={background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:14,width:"100%",boxSizing:"border-box",outline:"none"};
  const lSt={fontSize:12,color:T.sub,marginBottom:4,display:"block"};
  const latest=entries.length>0?entries[entries.length-1]:null;
  const hasData=!!latest;
  const metaAtr=parseBRL(metas.atrasos);
  const pcts={fat:rawPct(latest?.faturamento,metas.faturamento),atr:rawPct(latest?.atrasos,metas.atrasos),ven:rawPct(latest?.vendas,metas.vendas),pm:rawPct(latest?.prevMes,metas.prevMes),ppx:rawPct(latest?.prevProxMes,metas.prevProxMes)};

  // Semáforo
  let semaforo=null;
  if(latest?.faturamento&&latest?.date){
    const dd=new Date(latest.date+"T12:00:00");
    const wdInfo=getWDInfo(dd.getFullYear(),dd.getMonth()+1);
    if(wdInfo.passed>0){const proj=(latest.faturamento/wdInfo.passed)*wdInfo.total;semaforo=calcSem(proj,parseBRL(metas.faturamento));}
  }

  const kpiDefs=[
    {title:"Faturamento Acumulado",val:latest?.faturamento,p:pcts.fat,color:"#3b82f6",Icon:DollarSign,inv:false,showSem:true},
    {title:"Atrasos",              val:latest?.atrasos,    p:pcts.atr,color:"#ef4444",Icon:AlertTriangle,inv:true, showSem:false},
    {title:"Vendas Acumuladas",    val:latest?.vendas,     p:pcts.ven,color:"#10b981",Icon:ShoppingCart,inv:false,showSem:false},
    {title:"Prev. Fat. Mês",       val:latest?.prevMes,    p:pcts.pm, color:"#8b5cf6",Icon:TrendingUp,  inv:false,showSem:false},
    {title:"Prev. Fat. Próx. Mês", val:latest?.prevProxMes,p:pcts.ppx,color:"#06b6d4",Icon:TrendingUp,  inv:false,showSem:false},
  ];

  if(loading)return <div style={{color:T.muted,padding:40,textAlign:"center"}}>Carregando...</div>;

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div style={{color:T.muted,fontSize:14}}>{hasData?`Último lançamento: ${toDisplay(latest.date)}`:"Nenhum lançamento cadastrado"}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {entries.length>0&&(
            <div style={{display:"flex",gap:4}}>
              <button onClick={doCSV} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> CSV</button>
              <button onClick={doPDF} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> PDF</button>
            </div>
          )}
          <button onClick={()=>closeAll(showMetas?"":"metas")} style={{display:"flex",alignItems:"center",gap:6,background:showMetas?"#f59e0b":"#f59e0b20",color:showMetas?"#000":"#f59e0b",border:"1px solid #f59e0b",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>⚙ Configurar Metas</button>
          {entries.length>0&&(
            <>
              <button onClick={()=>closeAll(showHist?"":"hist")} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:14}}>
                <BarChart2 size={15}/> Histórico {showHist?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
              </button>
              <button onClick={()=>closeAll(showFechar?"":"fechar")} style={{display:"flex",alignItems:"center",gap:6,background:showFechar?"#10b981":"#10b98120",color:showFechar?"#fff":"#10b981",border:"1px solid #10b981",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>
                <Archive size={15}/> Fechar Mês
              </button>
            </>
          )}
          <button onClick={()=>closeAll(showForm?"":"form")} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>
            <Plus size={15}/>{showForm?"Cancelar":"Lançar KPIs"}
          </button>
        </div>
      </div>

      {showMetas&&(
        <div style={{...cSt,borderTop:"3px solid #f59e0b",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:4,color:T.text}}>⚙ Configuração de Metas</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Defina as metas em R$ para cada KPI.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:14}}>
            {[{k:"faturamento",label:"Faturamento"},{k:"atrasos",label:"Atrasos"},{k:"vendas",label:"Vendas"},{k:"prevMes",label:"Prev. Mês"},{k:"prevProxMes",label:"Prev. Próx. Mês"}].map(({k,label})=>(
              <div key={k}><label style={lSt}>{label} (R$)</label><input style={iSt} value={metasForm[k]} onChange={setMetaF(k)} placeholder="Ex: 3200000"/></div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:12,color:T.faint}}>Atrasos: verde quando <strong style={{color:T.text}}>abaixo</strong> da meta.</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {metasSaved&&<span style={{fontSize:13,color:"#10b981"}}>✓ Salvo!</span>}
              <button onClick={saveMetas} style={{display:"flex",alignItems:"center",gap:6,background:"#f59e0b",color:"#000",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:14}}><Save size={14}/> Salvar Metas</button>
            </div>
          </div>
        </div>
      )}

      {showFechar&&entries.length>0&&(
        <div style={{...cSt,borderTop:"3px solid #10b981",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Archive size={18} color="#10b981"/><div style={{fontSize:15,fontWeight:700,color:T.text}}>Fechar Mês</div></div>
          <div style={{fontSize:13,color:T.muted,marginBottom:16}}>Irá arquivar <strong style={{color:T.text}}>{entries.length} lançamento(s)</strong> em <strong style={{color:"#10b981"}}>Meses Fechados</strong> e disponibilizar os dados para o Fechamento Mensal.</div>
          <div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,color:T.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Resumo do Período</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[{label:"Período",value:`${toDisplay(entries[0].date)} → ${toDisplay(entries[entries.length-1].date)}`},{label:"Faturamento Final",value:fmtRS(latest?.faturamento)},{label:"Vendas Finais",value:fmtRS(latest?.vendas)},{label:"Atrasos Finais",value:fmtRS(latest?.atrasos)},{label:"Prev. Fat. Mês",value:fmtRS(latest?.prevMes)},{label:"Prev. Próx. Mês",value:fmtRS(latest?.prevProxMes)}].map(({label,value})=>(
                <div key={label}><div style={{fontSize:11,color:T.muted,marginBottom:3}}>{label}</div><div style={{fontSize:14,fontWeight:600,color:T.text}}>{value}</div></div>
              ))}
            </div>
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
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:12}}>
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
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:12,color:T.faint}}>* Valores acumulados até a data selecionada</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {saved&&<span style={{fontSize:13,color:"#10b981"}}>✓ Salvo!</span>}
              <button onClick={()=>{setShowForm(false);setEditId(null);}} style={{background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:14}}>Cancelar</button>
              <button onClick={saveEntry} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:600,fontSize:14}}><Save size={14}/>{editId?"Salvar Edição":"Salvar Lançamento"}</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:16}}>
        {kpiDefs.map(({title,val,p,color,Icon,inv,showSem})=>(
          <div key={title} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,borderTop:`3px solid ${color}`,minWidth:0,opacity:hasData?1:0.45}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{title}</div>
              <div style={{background:color+"20",borderRadius:8,padding:7,flexShrink:0}}><Icon size={15} color={color}/></div>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:T.text,wordBreak:"break-word"}}>{val!=null?fmtRS(val):"—"}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>{hasData?`Até ${toDisplay(latest.date)}`:"Sem dados"}</div>
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

      {hasData&&<DiasUteisProjecao entries={entries} metaFaturamento={metas.faturamento} T={T}/>}

      {entries.length>0&&(
        <div style={{...cSt,marginBottom:16}}>
          <DailyChart entries={entries} T={T}/>
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
                      <button onClick={()=>deleteEntry(e.id)} style={{background:"#ef444420",color:"#ef4444",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {!hasData&&!showForm&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:48,textAlign:"center"}}>
          <BarChart2 size={36} color={T.border} style={{margin:"0 auto 12px"}}/>
          <div style={{color:T.muted,fontSize:15,marginBottom:8}}>Nenhum dado lançado ainda</div>
          <div style={{color:T.faint,fontSize:13}}>Clique em <strong style={{color:"#60a5fa"}}>Lançar KPIs</strong> para começar</div>
        </div>
      )}
    </>
  );
}

// ── FechamentoMensal ─────────────────────────────────────────
function FechamentoMensal({T}) {
  const [records,    setRecords]    =useState([]);
  const [form,       setForm]       =useState(mkMF());
  const [showForm,   setShowForm]   =useState(false);
  const [loading,    setLoading]    =useState(true);
  const [saved,      setSaved]      =useState(false);
  const [prodMetas,  setProdMetas]  =useState(EMPTY_PROD_METAS);
  const [prodMetasF, setProdMetasF] =useState(EMPTY_PROD_METAS);
  const [showPMetas, setShowPMetas] =useState(false);
  const [pmSaved,    setPmSaved]    =useState(false);
  const [prefill,    setPrefill]    =useState(null);

  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("mensal_records");if(r)setRecords(JSON.parse(r.value));}catch(_){}
      try{const r=await window.storage.get("mensal_prod_metas");if(r){const v=JSON.parse(r.value);setProdMetas(v);setProdMetasF(v);}}catch(_){}
      try{const r=await window.storage.get("mensal_prefill");if(r){const v=JSON.parse(r.value);if(v?.fromDiario)setPrefill(v);}}catch(_){}
      setLoading(false);
    })();
  },[]);

  const persist  =async(d)=>{try{await window.storage.set("mensal_records",JSON.stringify(d));}catch(_){}};
  const setField =(k)=>(e)=>setForm(p=>({...p,[k]:e.target.value}));
  const setProd  =(i,k)=>(e)=>setForm(p=>{const ps=[...p.produtos];ps[i]={...ps[i],[k]:e.target.value};return{...p,produtos:ps};});
  const setPMeta =(t)=>(e)=>setProdMetasF(p=>({...p,[t]:e.target.value}));

  const saveRecord=async()=>{
    if(!form.mes)return;
    const rec={id:form.mes,label:monthLabel(form.mes),savedAt:today(),faturamentoRS:parseBRL(form.fRS),faturamentoKG:parseBRL(form.fKG),vendidoRS:parseBRL(form.vRS),vendidoKG:parseBRL(form.vKG),produtos:form.produtos.map(p=>({tipo:p.tipo,rs:parseBRL(p.rs),kg:parseBRL(p.kg)}))};
    const updated=[...records.filter(r=>r.id!==form.mes),rec].sort((a,b)=>a.id.localeCompare(b.id));
    setRecords(updated);await persist(updated);
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  const saveProdMetas=async()=>{
    setProdMetas(prodMetasF);
    try{await window.storage.set("mensal_prod_metas",JSON.stringify(prodMetasF));}catch(_){}
    setPmSaved(true);setTimeout(()=>setPmSaved(false),2000);
  };

  const applyPrefill=async()=>{
    if(!prefill)return;
    setForm(p=>({...p,mes:prefill.mes,fRS:prefill.fRS||p.fRS,vRS:prefill.vRS||p.vRS}));
    setShowForm(true);setPrefill(null);
    try{await window.storage.set("mensal_prefill","");}catch(_){}
  };

  const editRecord=(rec)=>{
    setForm({mes:rec.id,fRS:rec.faturamentoRS??"",fKG:rec.faturamentoKG??"",vRS:rec.vendidoRS??"",vKG:rec.vendidoKG??"",
      produtos:TIPOS.map(t=>{const p=rec.produtos?.find(x=>x.tipo===t)||{tipo:t,rs:null,kg:null};return{tipo:t,rs:p.rs??"",kg:p.kg??""};})
    });
    setShowForm(true);
  };
  const deleteRecord=async(id)=>{const u=records.filter(r=>r.id!==id);setRecords(u);await persist(u);};

  const current  =records.length>0?records[records.length-1]:null;
  const previous =records.length>1?records[records.length-2]:null;
  const histData =records.slice(-8).map(r=>({mes:r.label,fat:r.faturamentoRS,vendido:r.vendidoRS}));
  const cSt      ={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20};
  const iSt      ={background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px",color:T.text,fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"};
  const lSt      ={fontSize:12,color:T.sub,marginBottom:4,display:"block"};
  const ttStyle  ={background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text};

  const doCSV=()=>exportCSV(records.map(r=>[r.label,r.faturamentoRS??'',r.faturamentoKG??'',r.vendidoRS??'',r.vendidoKG??'']),["Mês","Faturamento R$","Faturamento KG","Vendido R$","Vendido KG"],"fechamento_mensal.csv");
  const doPDF=()=>exportPDF(`<h2>Fechamento Mensal</h2><p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p><table><thead><tr><th>Mês</th><th>Fat. R$</th><th>Fat. KG</th><th>Vendido R$</th><th>Vendido KG</th></tr></thead><tbody>${records.map(r=>`<tr><td>${r.label}</td><td>${fmtRS(r.faturamentoRS)}</td><td>${fmtN(r.faturamentoKG)} kg</td><td>${fmtRS(r.vendidoRS)}</td><td>${fmtN(r.vendidoKG)} kg</td></tr>`).join('')}</tbody></table>`,"Fechamento Mensal");

  if(loading)return <div style={{color:T.muted,padding:40,textAlign:"center"}}>Carregando...</div>;

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div style={{color:T.muted,fontSize:14}}>{current?`Último registro: ${current.label}`:"Nenhum dado lançado"}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {records.length>0&&(
            <div style={{display:"flex",gap:4}}>
              <button onClick={doCSV} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> CSV</button>
              <button onClick={doPDF} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> PDF</button>
            </div>
          )}
          <button onClick={()=>{setShowPMetas(!showPMetas);setShowForm(false);}} style={{display:"flex",alignItems:"center",gap:6,background:showPMetas?"#f59e0b":"#f59e0b20",color:showPMetas?"#000":"#f59e0b",border:"1px solid #f59e0b",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:600,fontSize:14}}>⚙ Metas por Produto</button>
          <button onClick={()=>{setShowForm(!showForm);setShowPMetas(false);if(showForm)setForm(mkMF());}} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:14}}>
            <Plus size={15}/>{showForm?"Cancelar":"Lançar Mês"}
          </button>
        </div>
      </div>

      {/* Auto-consolidation banner */}
      {prefill&&!showForm&&(
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#3b82f615",border:"1px solid #3b82f6",borderRadius:10,marginBottom:16}}>
          <TrendingUp size={18} color="#3b82f6"/>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#3b82f6"}}>📊 Dados do Fechamento Diário disponíveis!</div>
            <div style={{fontSize:12,color:T.muted}}>Faturamento e Vendas do mês <strong>{monthLabel(prefill.mes)}</strong> foram importados automaticamente.</div>
          </div>
          <button onClick={applyPrefill} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0}}>Importar e Preencher</button>
          <button onClick={()=>setPrefill(null)} style={{background:"transparent",color:T.muted,border:"none",cursor:"pointer",padding:4}}><X size={15}/></button>
        </div>
      )}

      {/* Product metas panel */}
      {showPMetas&&(
        <div style={{...cSt,borderTop:"3px solid #f59e0b",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:4,color:T.text}}>⚙ Metas por Produto (R$)</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Configure a meta de faturamento individual para cada tipo de produto.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:14}}>
            {TIPOS.map(t=>(
              <div key={t}><label style={lSt}>{t} (R$)</label><input style={iSt} value={prodMetasF[t]} onChange={setPMeta(t)} placeholder="Ex: 850000"/></div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,alignItems:"center"}}>
            {pmSaved&&<span style={{fontSize:13,color:"#10b981"}}>✓ Salvo!</span>}
            <button onClick={saveProdMetas} style={{display:"flex",alignItems:"center",gap:6,background:"#f59e0b",color:"#000",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:14}}><Save size={14}/> Salvar Metas</button>
          </div>
        </div>
      )}

      {/* Launch form */}
      {showForm&&(
        <div style={{...cSt,borderTop:"3px solid #3b82f6",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:16,color:T.text}}>Lançamento Mensal</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16}}>
            <div><label style={lSt}>Mês de Referência *</label><input type="month" style={iSt} value={form.mes} onChange={setField("mes")}/></div>
            <div><label style={lSt}>Faturamento R$</label><input style={iSt} value={form.fRS} onChange={setField("fRS")} placeholder="Ex: 2850000"/></div>
            <div><label style={lSt}>Faturamento KG</label><input style={iSt} value={form.fKG} onChange={setField("fKG")} placeholder="Ex: 185400"/></div>
            <div><label style={lSt}>Vendido R$</label><input style={iSt} value={form.vRS} onChange={setField("vRS")} placeholder="Ex: 3100000"/></div>
            <div><label style={lSt}>Vendido KG</label><input style={iSt} value={form.vKG} onChange={setField("vKG")} placeholder="Ex: 201200"/></div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:10}}>Faturamento por Produto</div>
            <div style={{border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"140px 1fr 1fr",background:T.card2}}>
                {["Produto","Faturado R$","Faturado KG"].map(h=><div key={h} style={{padding:"8px 12px",fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:.4}}>{h}</div>)}
              </div>
              {form.produtos.map((p,i)=>(
                <div key={p.tipo} style={{display:"grid",gridTemplateColumns:"140px 1fr 1fr",borderTop:`1px solid ${T.border}`}}>
                  <div style={{padding:"8px 12px",color:T.sub,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:COLORS[i%COLORS.length],flexShrink:0}}/>
                    {p.tipo}
                  </div>
                  <div style={{padding:5}}><input style={{...iSt,padding:"6px 10px"}} value={p.rs} onChange={setProd(i,"rs")} placeholder="0,00"/></div>
                  <div style={{padding:5}}><input style={{...iSt,padding:"6px 10px"}} value={p.kg} onChange={setProd(i,"kg")} placeholder="0,00"/></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,alignItems:"center"}}>
            {saved&&<span style={{fontSize:13,color:"#10b981"}}>✓ Salvo!</span>}
            <button onClick={()=>{setShowForm(false);setForm(mkMF());}} style={{background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:14}}>Cancelar</button>
            <button onClick={saveRecord} style={{display:"flex",alignItems:"center",gap:6,background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontWeight:600,fontSize:14}}><Save size={14}/> Salvar</button>
          </div>
        </div>
      )}

      {current ? (
        <>
          {/* Summary KPI cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
            {[{title:"Faturamento R$",value:fmtRS(current.faturamentoRS),sub:current.label,Icon:DollarSign,color:"#3b82f6"},{title:"Faturamento KG",value:fmtN(current.faturamentoKG)+" kg",sub:"Total expedido",Icon:Package,color:"#06b6d4"},{title:"Vendido R$",value:fmtRS(current.vendidoRS),sub:"Total pedidos",Icon:TrendingUp,color:"#10b981"},{title:"Vendido KG",value:fmtN(current.vendidoKG)+" kg",sub:"Pedidos em peso",Icon:Package,color:"#8b5cf6"}].map(({title,value,sub,Icon,color})=>(
              <div key={title} style={{...cSt,borderTop:`3px solid ${color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{title}</div>
                  <div style={{background:color+"20",borderRadius:8,padding:7}}><Icon size={15} color={color}/></div>
                </div>
                <div style={{fontSize:22,fontWeight:700,color:T.text}}>{value}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:4}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Comparativo mês a mês */}
          {previous&&(
            <div style={{...cSt,marginBottom:16,borderTop:"3px solid #3b82f6"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <TrendingUp size={16} color="#3b82f6"/>
                <div style={{fontSize:14,fontWeight:600,color:T.text}}>
                  Comparativo Mês a Mês <span style={{fontSize:12,fontWeight:400,color:T.muted,marginLeft:8}}>{current.label} vs {previous.label}</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                <DeltaCard label="Faturamento R$" curr={current.faturamentoRS} prev={previous.faturamentoRS} color="#3b82f6" T={T}/>
                <DeltaCard label="Faturamento KG" curr={current.faturamentoKG} prev={previous.faturamentoKG} color="#06b6d4" T={T}/>
                <DeltaCard label="Vendido R$"     curr={current.vendidoRS}     prev={previous.vendidoRS}     color="#10b981" T={T}/>
                <DeltaCard label="Vendido KG"     curr={current.vendidoKG}     prev={previous.vendidoKG}     color="#8b5cf6" T={T}/>
              </div>
            </div>
          )}

          {/* Product ranking */}
          {current.produtos&&current.produtos.length>0&&(
            <div style={{...cSt,marginBottom:16}}>
              <ProductRanking current={current} previous={previous} prodMetas={prodMetas} T={T}/>
            </div>
          )}

          {/* Product mix pie */}
          {current.produtos&&current.produtos.some(p=>p.rs)&&(
            <div style={{...cSt,marginBottom:16}}>
              <ProductMixPie produtos={current.produtos} T={T}/>
            </div>
          )}

          {/* History chart */}
          {histData.length>1&&(
            <div style={{...cSt,marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:T.text}}>Histórico — Últimos Meses</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={histData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="mes" tick={{fill:T.muted,fontSize:12}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.muted,fontSize:12}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v/1000000).toFixed(1)+"M"}/>
                  <Tooltip formatter={v=>[fmtRS(v)]} contentStyle={ttStyle} labelStyle={{color:T.sub}}/>
                  <Legend wrapperStyle={{color:T.sub,fontSize:12}}/>
                  <Bar dataKey="fat"     name="Faturado" fill="#3b82f6" radius={[4,4,0,0]}/>
                  <Bar dataKey="vendido" name="Vendido"  fill="#06b6d4" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Records table */}
          <div style={cSt}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:14,color:T.text}}>Registros Mensais</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Mês","Fat. R$","Fat. KG","Vendido R$","Vendido KG","Salvo em",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.muted,fontSize:11,textTransform:"uppercase",letterSpacing:.5,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>{[...records].reverse().map(r=>(
                  <tr key={r.id} style={{borderBottom:`1px solid ${T.border}50`}}>
                    <td style={{padding:"11px 12px",color:"#60a5fa",fontWeight:600}}>{r.label}</td>
                    <td style={{padding:"11px 12px",color:T.text}}>{fmtRS(r.faturamentoRS)}</td>
                    <td style={{padding:"11px 12px",color:T.sub}}>{fmtN(r.faturamentoKG)} kg</td>
                    <td style={{padding:"11px 12px",color:T.sub}}>{fmtRS(r.vendidoRS)}</td>
                    <td style={{padding:"11px 12px",color:T.sub}}>{fmtN(r.vendidoKG)} kg</td>
                    <td style={{padding:"11px 12px",color:T.muted}}>{toDisplay(r.savedAt)}</td>
                    <td style={{padding:"11px 12px"}}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>editRecord(r)} style={{background:"#3b82f620",color:"#60a5fa",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}><Edit2 size={12}/></button>
                        <button onClick={()=>deleteRecord(r.id)} style={{background:"#ef444420",color:"#ef4444",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      ):(
        <div style={{...cSt,textAlign:"center",padding:48}}>
          <TrendingUp size={36} color={T.border} style={{margin:"0 auto 12px"}}/>
          <div style={{color:T.muted,fontSize:15,marginBottom:8}}>Nenhum dado mensal lançado</div>
          <div style={{color:T.faint,fontSize:13}}>Clique em <strong style={{color:"#60a5fa"}}>Lançar Mês</strong> para começar</div>
        </div>
      )}
    </>
  );
}

// ── BibliotecaPage ───────────────────────────────────────────
function BibliotecaPage({T}) {
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20};
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
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
function MesesFechados({T,reloadKey}) {
  const [months,  setMonths]  =useState([]);
  const [loading, setLoading] =useState(true);
  const [selected,setSelected]=useState(null);
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{const r=await window.storage.get("closed_months");setMonths(r?JSON.parse(r.value):[]);}catch(_){setMonths([]);}
      setLoading(false);
    })();
  },[reloadKey]);
  const deleteMth=async(id)=>{const u=months.filter(m=>m.id!==id);setMonths(u);try{await window.storage.set("closed_months",JSON.stringify(u));}catch(_){}if(selected?.id===id)setSelected(null);};
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20};
  if(loading)return <div style={{color:T.muted,padding:40,textAlign:"center"}}>Carregando...</div>;
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
    const doPDF=()=>exportPDF(`<h2>Fechamento — ${s.label}</h2><p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p><table><thead><tr><th>Data</th><th>Faturamento</th><th>Atrasos</th><th>Vendas</th><th>Prev. Mês</th><th>Prev. Próx. Mês</th><th>Obs</th></tr></thead><tbody>${s.entries.map(e=>`<tr><td>${toDisplay(e.date)}</td><td>${fmtRS(e.faturamento)}</td><td>${fmtRS(e.atrasos)}</td><td>${fmtRS(e.vendas)}</td><td>${fmtRS(e.prevMes)}</td><td>${fmtRS(e.prevProxMes)}</td><td>${e.obs||''}</td></tr>`).join('')}</tbody></table>`,`Fechamento ${s.label}`);
    return (
      <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:T.card,color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>← Voltar</button>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:T.text}}>{s.label}</div>
              <div style={{fontSize:12,color:T.muted}}>Fechado em {toDisplay(s.closedAt)} · {s.entries.length} lançamentos {prev&&<span style={{color:T.faint}}>· vs <strong style={{color:T.sub}}>{prev.label}</strong></span>}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={doCSV} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}><Download size={14}/> CSV</button>
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
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
            {sumDefs.map(({label,curr,prevVal,color,inv})=>(
              <DeltaCard key={label} label={label} curr={curr} prev={prevVal} color={color} T={T} inv={inv}/>
            ))}
          </div>
        </div>
        <div style={{...cSt,borderLeft:"4px solid #ef4444",marginBottom:16}}><AtrasoChart entries={s.entries} metaValue={null} T={T}/></div>
        <div style={{...cSt,marginBottom:16}}><DailyChart entries={s.entries} T={T}/></div>
        {s.entries.length>1&&<div style={{...cSt,marginBottom:16}}><WeekdayChart entries={s.entries} T={T}/></div>}
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
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:56,textAlign:"center"}}>
      <Archive size={40} color={T.border} style={{margin:"0 auto 14px"}}/>
      <div style={{color:T.muted,fontSize:15,marginBottom:8}}>Nenhum mês fechado ainda</div>
      <div style={{color:T.faint,fontSize:13}}>Use <strong style={{color:"#10b981"}}>Fechar Mês</strong> no Fechamento Diário.</div>
    </div>
  );
  return (
    <>
      <div style={{color:T.muted,fontSize:14,marginBottom:16}}>{months.length} mês(es) arquivado(s)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
        {[...months].reverse().map(m=>(
          <div key={m.id} onClick={()=>setSelected(m)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><div style={{fontSize:20,fontWeight:700,color:T.text}}>{m.label}</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>Fechado em {toDisplay(m.closedAt)} · {m.entries.length} dias</div></div>
              <div style={{background:"#10b98120",borderRadius:8,padding:7}}><Archive size={15} color="#10b981"/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[{label:"Faturamento",val:m.summary.faturamento,color:"#3b82f6"},{label:"Vendas",val:m.summary.vendas,color:"#10b981"},{label:"Atrasos",val:m.summary.atrasos,color:"#ef4444"},{label:"Prev. Próx.",val:m.summary.prevProxMes,color:"#06b6d4"}].map(({label,val,color})=>(
                <div key={label} style={{background:T.card2,borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:10,color:T.faint,marginBottom:3}}>{label}</div>
                  <div style={{fontSize:13,fontWeight:600,color}}>{fmtRS(val)}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#60a5fa",fontWeight:500}}>Ver detalhes →</span>
              <button onClick={e=>{e.stopPropagation();deleteMth(m.id);}} style={{background:"#ef444415",color:"#ef4444",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
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
  const cSt={background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20};
  const iSt={background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:14,width:"100%",boxSizing:"border-box",outline:"none"};
  const lSt={fontSize:12,color:T.sub,marginBottom:4,display:"block"};
  if(loading)return <div style={{color:T.muted,padding:40,textAlign:"center"}}>Carregando...</div>;
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
  const [reloadKey,     setReloadKey]     =useState(0);
  const [atrasoAlert,   setAtrasoAlert]   =useState(false);
  const [presentMode,   setPresentMode]   =useState(false);
  const [pdfContent,    setPdfContent]    =useState(null);
  const [pdfTitle,      setPdfTitle]      =useState("");
  const T=THEMES[dark?"dark":"light"];

  useEffect(()=>{ _pdfCb=(html,t)=>{setPdfContent(html);setPdfTitle(t);}; },[]);

  const nav=[
    {section:"Principal",items:[{id:"home",label:"Início",icon:HomeIcon}]},
    {section:"Painel de Vendas",items:[
      {id:"diario",   label:"Fechamento Diário", icon:BarChart2,  alertDot:atrasoAlert},
      {id:"mensal",   label:"Fechamento Mensal", icon:TrendingUp},
      {id:"fechados", label:"Meses Fechados",    icon:Archive},
    ]},
    {section:"Biblioteca",items:[{id:"biblioteca",label:"Biblioteca",icon:Package}]},
    {section:"Em Breve",items:[{id:"__s1",label:"Financeiro",icon:DollarSign,disabled:true},{id:"__s2",label:"Estoque",icon:ShoppingCart,disabled:true}]},
  ];
  const titles={home:"Início",diario:"Fechamento Diário",mensal:"Fechamento Mensal",fechados:"Meses Fechados",biblioteca:"Biblioteca"};
  const handleMonthClosed=()=>{setReloadKey(k=>k+1);setPage("fechados");};

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter',system-ui,sans-serif",transition:"background .2s,color .2s"}}>
      {presentMode&&<PresentMode onExit={()=>setPresentMode(false)}/>}
      {pdfContent&&<PDFModal content={pdfContent} title={pdfTitle} onClose={()=>setPdfContent(null)}/>}

      {/* Sidebar */}
      <div style={{width:240,background:T.card,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",zIndex:100,transition:"background .2s"}}>
        <div style={{padding:"20px 16px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:14,fontWeight:700,color:T.text,display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:"#3b82f620",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📊</div>
            Dashboard Gerencial
          </div>
          <div style={{fontSize:11,color:T.muted,marginTop:3,marginLeft:40}}>Painel de Gestão</div>
        </div>
        <nav style={{flex:1,padding:"12px 0",overflowY:"auto"}}>
          {nav.map(({section,items})=>(
            <div key={section}>
              <div style={{padding:"10px 16px 4px",fontSize:10,color:T.faint,textTransform:"uppercase",letterSpacing:1}}>{section}</div>
              {items.map(({id,label,icon:Icon,disabled,badge,alertDot})=>{
                const active=page===id;
                return (
                  <div key={id} onClick={()=>!disabled&&setPage(id)}
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
        <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`,fontSize:11,color:T.faint}}>v1.7.0 · Dashboard Gerencial</div>
      </div>

      {/* Main */}
      <div style={{marginLeft:240,flex:1,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,transition:"background .2s"}}>
          <div style={{fontSize:18,fontWeight:700,color:T.text}}>{titles[page]}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setPresentMode(true)} style={{display:"flex",alignItems:"center",gap:6,background:T.card2,color:T.sub,border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>
              <Maximize2 size={14}/> Apresentação
            </button>
            <button onClick={()=>setDark(!dark)} style={{display:"flex",alignItems:"center",gap:6,background:dark?"#1e3a5f":"#fef9c3",color:dark?"#60a5fa":"#b45309",border:`1px solid ${dark?"#3b82f6":"#fbbf24"}`,borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600,transition:"all .2s"}}>
              {dark?(<><Sun size={14}/> Tema Claro</>):(<><Moon size={14}/> Tema Escuro</>)}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981"}}/>
              <span style={{fontSize:12,color:T.muted,textTransform:"capitalize"}}>{getDynDate()}</span>
            </div>
          </div>
        </div>
        <div style={{padding:24,flex:1}}>
          {page==="home"     &&<HomePage         T={T} onNavigate={setPage}/>}
          {page==="diario"   &&<FechamentoDiario T={T} onMonthClosed={handleMonthClosed} onAtrasoAlert={setAtrasoAlert}/>}
          {page==="mensal"   &&<FechamentoMensal T={T}/>}
          {page==="fechados" &&<MesesFechados    T={T} reloadKey={reloadKey}/>}
          {page==="biblioteca"&&<BibliotecaPage  T={T}/>}
        </div>
      </div>
    </div>
  );
}
