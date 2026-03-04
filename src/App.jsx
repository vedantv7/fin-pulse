import { useState, useRef, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─── SUPABASE CLIENT (inline, no install needed) ──────────────────────────────
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function db(table, method = "GET", body = null, id = null) {
  const url = `${SUPA_URL}/rest/v1/${table}${id ? `?id=eq.${id}` : ""}`;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPA_KEY,
    "Authorization": `Bearer ${SUPA_KEY}`,
    "Prefer": method === "POST" ? "return=representation" : "return=minimal",
  };
  if (method === "GET") {
    const res = await fetch(`${SUPA_URL}/rest/v1/${table}?order=created_at.desc`, { headers });
    return res.json();
  }
  if (method === "POST") {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    return res.json();
  }
  if (method === "PATCH") {
    await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
  }
  if (method === "DELETE") {
    await fetch(url, { method: "DELETE", headers });
  }
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:"#07090F", surface:"#0F1420", card:"rgba(255,255,255,0.04)",
  border:"rgba(255,255,255,0.08)", accent:"#6366F1", green:"#10B981",
  yellow:"#F59E0B", red:"#EF4444", pink:"#EC4899", cyan:"#06B6D4", purple:"#8B5CF6",
  text:"#F1F5F9", sub:"rgba(241,245,249,0.5)", muted:"rgba(241,245,249,0.25)",
};
const g = (a, b) => `linear-gradient(135deg,${a},${b})`;

// ─── SEED DATA (shown first load only) ───────────────────────────────────────
const SEED = {
  transactions:[
    {id:"t1",name:"Monthly Salary",category:"Salary",amount:90000,type:"income",date:"2026-03-01",method:"Bank Transfer",status:"Completed",note:""},
    {id:"t2",name:"House Rent",category:"Housing",amount:-18000,type:"expense",date:"2026-03-01",method:"Bank Transfer",status:"Completed",note:""},
    {id:"t3",name:"Groceries",category:"Food",amount:-4200,type:"expense",date:"2026-03-03",method:"UPI",status:"Completed",note:""},
    {id:"t4",name:"Freelance Project",category:"Freelance",amount:22000,type:"income",date:"2026-02-28",method:"Bank Transfer",status:"Completed",note:""},
    {id:"t5",name:"Electricity Bill",category:"Utilities",amount:-1800,type:"expense",date:"2026-03-05",method:"UPI",status:"Completed",note:""},
  ],
  investments:[
    {id:"i1",name:"Nifty 50 Index Fund",type:"Mutual Fund",subtype:"Index Fund",amount:10000,units:142.3,nav:70.27,start_date:"2024-06-01",frequency:"Monthly SIP",broker:"Zerodha",returns:12.4,status:"Active",note:""},
    {id:"i2",name:"PPF Account",type:"Government Scheme",subtype:"PPF",amount:150000,units:1,nav:150000,start_date:"2020-04-01",frequency:"Yearly",broker:"SBI",returns:7.1,status:"Active",note:"Tax saving u/s 80C"},
  ],
  savings:[
    {id:"s1",name:"Emergency Fund - SBI",type:"Savings Account",subtype:"Regular Savings",amount:85000,interest_rate:3.5,maturity_date:"",bank:"SBI",goal:"Emergency",status:"Active",note:"6 months buffer"},
    {id:"s2",name:"Fixed Deposit - HDFC",type:"Fixed Deposit",subtype:"Cumulative FD",amount:200000,interest_rate:7.25,maturity_date:"2027-03-01",bank:"HDFC Bank",goal:"House Down Payment",status:"Active",note:""},
  ],
  loans:[
    {id:"l1",name:"Home Loan - SBI",type:"Home Loan",amount:3500000,outstanding:2800000,emi:28500,interest_rate:8.5,start_date:"2022-01-01",end_date:"2042-01-01",bank:"SBI",status:"Active",note:""},
    {id:"l2",name:"Car Loan - HDFC",type:"Car Loan",amount:650000,outstanding:320000,emi:12800,interest_rate:9.2,start_date:"2023-06-01",end_date:"2028-06-01",bank:"HDFC Bank",status:"Active",note:""},
  ],
};

const CASHFLOW=[
  {m:"Oct",inc:95000,exp:62000},{m:"Nov",inc:88000,exp:58000},{m:"Dec",inc:112000,exp:75000},
  {m:"Jan",inc:90000,exp:61000},{m:"Feb",inc:112000,exp:64000},{m:"Mar",inc:112000,exp:30399},
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const INV_TYPES=["Mutual Fund","Stocks","ETF","Gold","Cryptocurrency","Bonds","Government Scheme","NPS","ELSS","Real Estate"];
const INV_SUBS={"Mutual Fund":["Large Cap","Mid Cap","Small Cap","Index Fund","Flexi Cap","ELSS","Debt","Hybrid"],"Stocks":["Large Cap","Mid Cap","Small Cap"],"ETF":["Nifty ETF","Gold ETF","Sector ETF"],"Gold":["Digital Gold","Gold Coins","Sovereign Gold Bond"],"Cryptocurrency":["Bitcoin","Ethereum","Altcoin"],"Government Scheme":["PPF","NPS","SSY","NSC","KVP"],"Bonds":["Government Bond","Corporate Bond","Tax-Free Bond"],"NPS":["Tier 1","Tier 2"],"ELSS":["ELSS Fund"],"Real Estate":["Residential","Commercial"]};
const SAV_TYPES=["Savings Account","Fixed Deposit","Recurring Deposit","Government Scheme","Liquid Fund"];
const SAV_SUBS={"Savings Account":["Regular Savings","High Yield","Salary Account"],"Fixed Deposit":["Cumulative FD","Non-Cumulative FD","Tax Saver FD"],"Recurring Deposit":["Monthly RD"],"Government Scheme":["PPF","NPS","SSY","NSC"],"Liquid Fund":["Liquid Mutual Fund"]};
const LOAN_TYPES=["Home Loan","Car Loan","Personal Loan","Education Loan","Business Loan","Gold Loan","Credit Card Loan","Loan Against Property"];
const EXP_CATS=["Housing","Food","Transport","Health","Education","Entertainment","Utilities","Clothing","Travel","EMI","Subscription","Other"];
const INC_CATS=["Salary","Freelance","Business","Rental","Dividend","Interest","Bonus","Other Income"];
const METHODS=["Bank Transfer","UPI","Credit Card","Debit Card","Cash","Cheque"];
const STATUSES=["Completed","Pending","Failed"];
const BROKERS=["Zerodha","Groww","Upstox","Angel One","HDFC Securities","ICICI Direct","SBI Securities","PhonePe","Paytm Money","Other"];
const BANKS=["SBI","HDFC Bank","ICICI Bank","Axis Bank","Kotak Bank","PNB","Bank of Baroda","Canara Bank","IndusInd Bank","Yes Bank","Other"];
const FREQS=["Monthly SIP","Quarterly","Yearly","One-time","Weekly"];
const GOALS=["Emergency","House Down Payment","Retirement","Education","Holiday","Wedding","Car","Medical","Other"];
const PIE_COLORS=["#6366F1","#10B981","#F59E0B","#EF4444","#EC4899","#06B6D4","#8B5CF6","#F97316","#84CC16","#14B8A6"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt=(n,short=true)=>{const a=Math.abs(n);if(short){if(a>=10000000)return`₹${(a/10000000).toFixed(2)}Cr`;if(a>=100000)return`₹${(a/100000).toFixed(2)}L`;if(a>=1000)return`₹${(a/1000).toFixed(1)}K`;}return`₹${a.toLocaleString("en-IN")}`;};
const pct=(a,b)=>b>0?+((a/b)*100).toFixed(1):0;
const uid=()=>Math.random().toString(36).slice(2,10);
const today=()=>new Date().toISOString().slice(0,10);

// ─── BASE UI ──────────────────────────────────────────────────────────────────
const Card=({children,style={}})=><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:16,...style}}>{children}</div>;
const Btn=({children,onClick,variant="primary",style={},disabled=false})=>{
  const s={primary:{background:g(T.accent,T.purple),color:"#fff"},success:{background:g(T.green,"#059669"),color:"#fff"},warning:{background:g(T.yellow,"#D97706"),color:"#fff"},ghost:{background:"rgba(255,255,255,0.06)",border:`1px solid ${T.border}`,color:T.sub},danger:{background:`${T.red}22`,border:`1px solid ${T.red}44`,color:T.red}};
  return<button onClick={onClick} disabled={disabled} style={{border:"none",borderRadius:12,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",opacity:disabled?0.5:1,...(s[variant]||s.primary),...style}}>{children}</button>;
};
const Inp=({label,type="text",value,onChange,placeholder,required})=>(
  <div style={{marginBottom:12}}>
    {label&&<label style={{display:"block",fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{label}{required&&<span style={{color:T.red}}> *</span>}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
  </div>
);
const Sel=({label,value,onChange,options,required})=>(
  <div style={{marginBottom:12}}>
    {label&&<label style={{display:"block",fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{label}{required&&<span style={{color:T.red}}> *</span>}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);
const Textarea=({label,value,onChange,placeholder,rows=2})=>(
  <div style={{marginBottom:12}}>
    {label&&<label style={{display:"block",fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{label}</label>}
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
  </div>
);
const Tag=({label,color=T.accent})=><span style={{background:`${color}22`,color,padding:"2px 9px",borderRadius:99,fontSize:10,fontWeight:700}}>{label}</span>;
const StatusBadge=({s})=>{const m={Completed:{b:"#052e16",c:"#34d399"},Pending:{b:"#422006",c:"#fbbf24"},Failed:{b:"#450a0a",c:"#f87171"},Active:{b:"#1e1b4b",c:"#818cf8"},Closed:{b:"#1a1a1a",c:"#6b7280"},Matured:{b:"#042f2e",c:"#34d399"}};const s2=m[s]||m.Active;return<span style={{background:s2.b,color:s2.c,padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700}}>{s}</span>;};

// ─── TOAST NOTIFICATION ───────────────────────────────────────────────────────
function Toast({message,type="success",onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2500);return()=>clearTimeout(t);},[]);
  const colors={success:{bg:"#052e16",border:"#34d399",color:"#34d399",icon:"✅"},error:{bg:"#450a0a",border:"#f87171",color:"#f87171",icon:"❌"},loading:{bg:"#1e1b4b",border:"#818cf8",color:"#818cf8",icon:"⏳"}};
  const c=colors[type]||colors.success;
  return<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:c.bg,border:`1px solid ${c.border}`,color:c.color,borderRadius:12,padding:"10px 18px",fontSize:13,fontWeight:700,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 24px rgba(0,0,0,0.4)"}}>{c.icon} {message}</div>;
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen(){
  return(
    <div style={{position:"fixed",inset:0,background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9000}}>
      <div style={{fontSize:48,marginBottom:16}}>💰</div>
      <div style={{color:T.text,fontSize:22,fontWeight:900,marginBottom:8}}>
        <span style={{background:g(T.accent,T.purple),WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Fin</span>Pulse
      </div>
      <div style={{color:T.muted,fontSize:13,marginBottom:24}}>Loading your finances…</div>
      <div style={{width:40,height:4,background:`${T.accent}33`,borderRadius:99,overflow:"hidden"}}>
        <div style={{width:"60%",height:"100%",background:T.accent,borderRadius:99,animation:"slide 1s ease-in-out infinite"}}/>
      </div>
      <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}

// ─── BOTTOM SHEET ─────────────────────────────────────────────────────────────
function Sheet({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#111827",border:`1px solid ${T.border}`,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",padding:"22px 18px 40px"}}>
        <div style={{width:36,height:4,background:"rgba(255,255,255,0.15)",borderRadius:99,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h3 style={{color:T.text,fontSize:16,fontWeight:800,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",color:T.sub,borderRadius:10,width:32,height:32,cursor:"pointer",fontSize:15,fontFamily:"inherit"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── STEP WIZARD ──────────────────────────────────────────────────────────────
function StepWizard({steps,onDone,onClose,title,accentColor=T.accent,saving=false}){
  const [step,setStep]=useState(0);
  const cur=steps[step];
  return(
    <Sheet title={title} onClose={onClose}>
      <div style={{display:"flex",gap:4,marginBottom:20}}>
        {steps.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:99,background:i<=step?accentColor:"rgba(255,255,255,0.1)",transition:"background 0.3s"}}/>)}
      </div>
      <div style={{color:T.muted,fontSize:11,marginBottom:4}}>Step {step+1} of {steps.length}</div>
      <div style={{color:T.text,fontSize:14,fontWeight:700,marginBottom:16}}>{cur.heading}</div>
      {cur.content}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        {step>0&&<Btn variant="ghost" onClick={()=>setStep(s=>s-1)} style={{flex:1}}>← Back</Btn>}
        {step<steps.length-1
          ?<Btn onClick={()=>!cur.validate||cur.validate()?setStep(s=>s+1):null} style={{flex:2,background:g(accentColor,accentColor+"aa")}}>Continue →</Btn>
          :<Btn onClick={onDone} disabled={saving} style={{flex:2,background:g(accentColor,accentColor+"aa")}}>{saving?"Saving…":"✓ Save Entry"}</Btn>}
      </div>
    </Sheet>
  );
}

// ─── TRANSACTION WIZARD ───────────────────────────────────────────────────────
function TxWizard({item,onClose,onSave,saving}){
  const isEdit=!!item?.id;
  const [f,setF]=useState(item||{name:"",category:"Food",amount:"",type:"expense",date:today(),method:"UPI",status:"Completed",note:""});
  const u=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const steps=[
    {heading:"What type of transaction?",content:(
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        {[{t:"expense",emoji:"💸",label:"Expense",color:T.red},{t:"income",emoji:"💰",label:"Income",color:T.green}].map(x=>(
          <button key={x.t} onClick={()=>u("type")(x.t)} style={{flex:1,padding:"18px 10px",borderRadius:16,border:"2px solid",borderColor:f.type===x.t?x.color:"rgba(255,255,255,0.08)",background:f.type===x.t?`${x.color}18`:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:6}}>{x.emoji}</div>
            <div style={{color:f.type===x.t?x.color:T.sub,fontWeight:700,fontSize:15}}>{x.label}</div>
          </button>
        ))}
      </div>
    )},
    {heading:"Description & amount",validate:()=>f.name&&f.amount,content:(
      <div>
        <Inp label="Description" value={f.name} onChange={u("name")} placeholder={f.type==="income"?"e.g. Monthly Salary":"e.g. Grocery Shopping"} required/>
        <Inp label="Amount (₹)" type="number" value={f.amount} onChange={u("amount")} placeholder="0" required/>
        <Inp label="Date" type="date" value={f.date} onChange={u("date")}/>
      </div>
    )},
    {heading:"Category & payment method",content:(
      <div>
        <Sel label="Category" value={f.category} onChange={u("category")} options={f.type==="income"?INC_CATS:EXP_CATS} required/>
        <Sel label="Payment Method" value={f.method} onChange={u("method")} options={METHODS}/>
        <Sel label="Status" value={f.status} onChange={u("status")} options={STATUSES}/>
        <Textarea label="Note (optional)" value={f.note} onChange={u("note")} placeholder="Any extra details..."/>
      </div>
    )},
  ];
  const save=()=>{
    if(!f.name||!f.amount)return;
    onSave({...f,id:item?.id||uid(),amount:f.type==="expense"?-Math.abs(+f.amount):Math.abs(+f.amount)});
  };
  return<StepWizard steps={steps} onDone={save} onClose={onClose} title={isEdit?"Edit Transaction":"Log Transaction"} accentColor={f.type==="income"?T.green:T.red} saving={saving}/>;
}

// ─── INVESTMENT WIZARD ────────────────────────────────────────────────────────
function InvWizard({item,onClose,onSave,saving}){
  const isEdit=!!item?.id;
  const [f,setF]=useState(item||{name:"",type:"Mutual Fund",subtype:"Index Fund",amount:"",units:"",nav:"",start_date:today(),frequency:"Monthly SIP",broker:"Zerodha",returns:"",status:"Active",note:""});
  const u=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const subs=INV_SUBS[f.type]||["Other"];
  const typeEmojis={"Mutual Fund":"📊","Stocks":"📈","ETF":"🔀","Gold":"🪙","Cryptocurrency":"₿","Government Scheme":"🏛️","NPS":"👴","ELSS":"💹","Bonds":"📜","Real Estate":"🏘️"};
  const steps=[
    {heading:"What type of investment?",content:(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:300,overflowY:"auto"}}>
        {INV_TYPES.map(t=>(
          <button key={t} onClick={()=>{u("type")(t);u("subtype")((INV_SUBS[t]||["Other"])[0]);}} style={{padding:"12px 8px",borderRadius:14,border:"2px solid",borderColor:f.type===t?T.accent:"rgba(255,255,255,0.08)",background:f.type===t?`${T.accent}18`:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{typeEmojis[t]||"💼"}</div>
            <div style={{color:f.type===t?T.accent:T.sub,fontWeight:700,fontSize:11,lineHeight:1.3}}>{t}</div>
          </button>
        ))}
      </div>
    )},
    {heading:"Name & amount",validate:()=>f.name&&f.amount,content:(
      <div>
        <Sel label="Sub-type" value={f.subtype} onChange={u("subtype")} options={subs}/>
        <Inp label="Investment Name" value={f.name} onChange={u("name")} placeholder="e.g. Nifty 50 Index Fund" required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Amount Invested (₹)" type="number" value={f.amount} onChange={u("amount")} placeholder="0" required/>
          <Inp label="Returns % p.a." type="number" value={f.returns} onChange={u("returns")} placeholder="0"/>
        </div>
      </div>
    )},
    {heading:"Units, NAV & schedule",content:(
      <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Units / Qty" type="number" value={f.units} onChange={u("units")} placeholder="0"/>
          <Inp label="Current NAV (₹)" type="number" value={f.nav} onChange={u("nav")} placeholder="0"/>
          <Inp label="Start Date" type="date" value={f.start_date} onChange={u("start_date")}/>
          <Sel label="Frequency" value={f.frequency} onChange={u("frequency")} options={FREQS}/>
        </div>
        <Sel label="Broker / Platform" value={f.broker} onChange={u("broker")} options={BROKERS}/>
        <Sel label="Status" value={f.status} onChange={u("status")} options={["Active","Paused","Redeemed","Closed"]}/>
        <Textarea label="Notes" value={f.note} onChange={u("note")} placeholder="e.g. Tax saving, goal..."/>
      </div>
    )},
  ];
  return<StepWizard steps={steps} onDone={()=>onSave({...f,id:item?.id||uid()})} onClose={onClose} title={isEdit?"Edit Investment":"Log Investment"} accentColor={T.accent} saving={saving}/>;
}

// ─── SAVINGS WIZARD ───────────────────────────────────────────────────────────
function SavWizard({item,onClose,onSave,saving}){
  const isEdit=!!item?.id;
  const [f,setF]=useState(item||{name:"",type:"Fixed Deposit",subtype:"Cumulative FD",amount:"",interest_rate:"",maturity_date:"",bank:"HDFC Bank",goal:"Emergency",status:"Active",note:""});
  const u=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const subs=SAV_SUBS[f.type]||["Other"];
  const typeEmojis={"Savings Account":"🏦","Fixed Deposit":"🔒","Recurring Deposit":"🔄","Government Scheme":"🏛️","Liquid Fund":"💧"};
  const steps=[
    {heading:"What type of savings?",content:(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {SAV_TYPES.map(t=>(
          <button key={t} onClick={()=>{u("type")(t);u("subtype")((SAV_SUBS[t]||["Other"])[0]);}} style={{padding:"16px 10px",borderRadius:14,border:"2px solid",borderColor:f.type===t?T.green:"rgba(255,255,255,0.08)",background:f.type===t?`${T.green}18`:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:6}}>{typeEmojis[t]||"💰"}</div>
            <div style={{color:f.type===t?T.green:T.sub,fontWeight:700,fontSize:11,lineHeight:1.3}}>{t}</div>
          </button>
        ))}
      </div>
    )},
    {heading:"Account details",validate:()=>f.name&&f.amount,content:(
      <div>
        <Sel label="Sub-type" value={f.subtype} onChange={u("subtype")} options={subs}/>
        <Inp label="Account / Scheme Name" value={f.name} onChange={u("name")} placeholder="e.g. HDFC FD - March 2026" required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Amount (₹)" type="number" value={f.amount} onChange={u("amount")} placeholder="0" required/>
          <Inp label="Interest Rate %" type="number" value={f.interest_rate} onChange={u("interest_rate")} placeholder="0"/>
        </div>
      </div>
    )},
    {heading:"Bank, goal & maturity",content:(
      <div>
        <Sel label="Bank / Institution" value={f.bank} onChange={u("bank")} options={BANKS}/>
        <Sel label="Savings Goal" value={f.goal} onChange={u("goal")} options={GOALS}/>
        <Inp label="Maturity Date (if any)" type="date" value={f.maturity_date} onChange={u("maturity_date")}/>
        <Sel label="Status" value={f.status} onChange={u("status")} options={["Active","Matured","Closed"]}/>
        <Textarea label="Notes" value={f.note} onChange={u("note")} placeholder="e.g. Auto-renew on/off..."/>
      </div>
    )},
  ];
  return<StepWizard steps={steps} onDone={()=>onSave({...f,id:item?.id||uid()})} onClose={onClose} title={isEdit?"Edit Savings":"Log Savings"} accentColor={T.green} saving={saving}/>;
}

// ─── LOAN WIZARD ──────────────────────────────────────────────────────────────
function LoanWizard({item,onClose,onSave,saving}){
  const isEdit=!!item?.id;
  const [f,setF]=useState(item||{name:"",type:"Personal Loan",amount:"",outstanding:"",emi:"",interest_rate:"",start_date:today(),end_date:"",bank:"HDFC Bank",status:"Active",note:""});
  const u=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const typeEmojis={"Home Loan":"🏠","Car Loan":"🚗","Personal Loan":"👤","Education Loan":"🎓","Business Loan":"🏢","Gold Loan":"🪙","Credit Card Loan":"💳","Loan Against Property":"🏘️"};
  const steps=[
    {heading:"What type of loan?",content:(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:300,overflowY:"auto"}}>
        {LOAN_TYPES.map(t=>(
          <button key={t} onClick={()=>u("type")(t)} style={{padding:"12px 8px",borderRadius:14,border:"2px solid",borderColor:f.type===t?T.yellow:"rgba(255,255,255,0.08)",background:f.type===t?`${T.yellow}18`:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:4}}>{typeEmojis[t]||"💳"}</div>
            <div style={{color:f.type===t?T.yellow:T.sub,fontWeight:700,fontSize:11,lineHeight:1.3}}>{t}</div>
          </button>
        ))}
      </div>
    )},
    {heading:"Loan amount & EMI",validate:()=>f.name&&f.amount,content:(
      <div>
        <Inp label="Loan Name" value={f.name} onChange={u("name")} placeholder="e.g. Home Loan - SBI" required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Total Loan (₹)" type="number" value={f.amount} onChange={u("amount")} placeholder="0" required/>
          <Inp label="Outstanding (₹)" type="number" value={f.outstanding} onChange={u("outstanding")} placeholder="0"/>
          <Inp label="Monthly EMI (₹)" type="number" value={f.emi} onChange={u("emi")} placeholder="0"/>
          <Inp label="Interest Rate %" type="number" value={f.interest_rate} onChange={u("interest_rate")} placeholder="0"/>
        </div>
      </div>
    )},
    {heading:"Bank & timeline",content:(
      <div>
        <Sel label="Lender / Bank" value={f.bank} onChange={u("bank")} options={BANKS}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Start Date" type="date" value={f.start_date} onChange={u("start_date")}/>
          <Inp label="End Date" type="date" value={f.end_date} onChange={u("end_date")}/>
        </div>
        <Sel label="Status" value={f.status} onChange={u("status")} options={["Active","Closed","Defaulted"]}/>
        <Textarea label="Notes" value={f.note} onChange={u("note")} placeholder="e.g. Collateral, co-applicant..."/>
      </div>
    )},
  ];
  return<StepWizard steps={steps} onDone={()=>onSave({...f,id:item?.id||uid()})} onClose={onClose} title={isEdit?"Edit Loan":"Log Loan"} accentColor={T.yellow} saving={saving}/>;
}

// ─── CSV IMPORT ───────────────────────────────────────────────────────────────
function ImportSheet({onClose,onImport}){
  const [tab,setTab]=useState("transactions");
  const [preview,setPreview]=useState([]);
  const [mapped,setMapped]=useState([]);
  const [step,setStep]=useState(0);
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const fileRef=useRef();
  const TEMPLATES={
    transactions:{headers:["name","category","amount","type","date","method","status","note"],sample:[["Monthly Salary","Salary","90000","income","2026-03-01","Bank Transfer","Completed",""],["House Rent","Housing","18000","expense","2026-03-01","Bank Transfer","Completed",""]]},
    investments:{headers:["name","type","subtype","amount","units","nav","start_date","frequency","broker","returns","status","note"],sample:[["Nifty 50 Index Fund","Mutual Fund","Index Fund","10000","142.3","70.27","2024-06-01","Monthly SIP","Zerodha","12.4","Active",""]]},
    savings:{headers:["name","type","subtype","amount","interest_rate","maturity_date","bank","goal","status","note"],sample:[["HDFC FD","Fixed Deposit","Cumulative FD","200000","7.25","2027-03-01","HDFC Bank","House Down Payment","Active",""]]},
    loans:{headers:["name","type","amount","outstanding","emi","interest_rate","start_date","end_date","bank","status","note"],sample:[["Home Loan","Home Loan","3500000","2800000","28500","8.5","2022-01-01","2042-01-01","SBI","Active",""]]}
  };
  const downloadTemplate=()=>{
    const t=TEMPLATES[tab];
    const csv=[t.headers,...t.sample].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`finpulse_${tab}_template.csv`;a.click();
  };
  const handleFile=(e)=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const lines=ev.target.result.trim().split("\n");
        const headers=lines[0].split(",").map(h=>h.replace(/"/g,"").trim().toLowerCase());
        const rows=lines.slice(1).filter(l=>l.trim()).map(line=>{
          const vals=line.split(",").map(v=>v.replace(/"/g,"").trim());
          const obj={};headers.forEach((h,i)=>obj[h]=vals[i]||"");return obj;
        });
        if(!rows.length){setMsg("File is empty.");return;}
        setPreview(rows.slice(0,3));
        const tmpl=TEMPLATES[tab];
        const processed=rows.map(row=>{
          const obj={id:uid()};
          tmpl.headers.forEach(h=>{obj[h]=row[h]||"";});
          if(tab==="transactions"&&obj.amount)obj.amount=obj.type==="expense"?-Math.abs(+obj.amount):Math.abs(+obj.amount);
          return obj;
        });
        setMapped(processed);setStep(1);setMsg("");
      }catch{setMsg("Could not read file. Please use a valid CSV.");}
    };
    reader.readAsText(file);
  };
  const confirm=async()=>{
    setSaving(true);
    await onImport(tab,mapped);
    setSaving(false);setStep(2);
  };
  return(
    <Sheet title="Import from Excel / CSV" onClose={onClose}>
      <div style={{display:"flex",gap:6,marginBottom:18,overflowX:"auto",paddingBottom:4}}>
        {Object.keys(TEMPLATES).map(t=><button key={t} onClick={()=>{setTab(t);setStep(0);setPreview([]);setMsg("");}} style={{padding:"7px 14px",borderRadius:99,border:"1px solid",borderColor:tab===t?T.accent:T.border,background:tab===t?`${T.accent}22`:"transparent",color:tab===t?T.accent:T.muted,fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize",whiteSpace:"nowrap",flexShrink:0,fontFamily:"inherit"}}>{t}</button>)}
      </div>
      {step===0&&(
        <div>
          <Card style={{marginBottom:14}}>
            <div style={{color:T.text,fontWeight:700,fontSize:13,marginBottom:10}}>📋 How to Import</div>
            {["1. Download the template CSV below","2. Open in Excel / Google Sheets and fill your data","3. Save as CSV (File → Save As → CSV)","4. Upload the saved CSV here"].map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
                <span style={{background:`${T.accent}22`,color:T.accent,borderRadius:99,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{i+1}</span>
                <span style={{color:T.sub,fontSize:12,lineHeight:1.5}}>{s}</span>
              </div>
            ))}
          </Card>
          <Btn variant="ghost" onClick={downloadTemplate} style={{width:"100%",marginBottom:14}}>⬇️ Download {tab} template CSV</Btn>
          <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${T.border}`,borderRadius:16,padding:"28px 20px",textAlign:"center",cursor:"pointer",marginBottom:10}}>
            <div style={{fontSize:36,marginBottom:8}}>📂</div>
            <div style={{color:T.sub,fontSize:13,fontWeight:600}}>Tap to choose your CSV file</div>
            <div style={{color:T.muted,fontSize:11,marginTop:4}}>Supports .csv files</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{display:"none"}}/>
          {msg&&<div style={{background:`${T.red}18`,border:`1px solid ${T.red}44`,borderRadius:10,padding:12,color:T.red,fontSize:12,marginTop:8}}>{msg}</div>}
        </div>
      )}
      {step===1&&(
        <div>
          <div style={{background:`${T.green}18`,border:`1px solid ${T.green}44`,borderRadius:12,padding:12,marginBottom:14}}>
            <div style={{color:T.green,fontWeight:700,fontSize:13}}>✅ {mapped.length} records ready to import</div>
            <div style={{color:T.sub,fontSize:12,marginTop:2}}>Preview of first {Math.min(3,preview.length)} rows:</div>
          </div>
          {preview.map((row,i)=>(
            <Card key={i} style={{marginBottom:8,padding:12}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {Object.entries(row).slice(0,5).map(([k,v])=>v?<div key={k} style={{fontSize:11}}><span style={{color:T.muted}}>{k}: </span><span style={{color:T.sub,fontWeight:600}}>{v}</span></div>:null)}
              </div>
            </Card>
          ))}
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn variant="ghost" onClick={()=>{setStep(0);setPreview([]);}} style={{flex:1}}>← Re-upload</Btn>
            <Btn variant="success" onClick={confirm} disabled={saving} style={{flex:2}}>{saving?"Importing…":`✓ Import ${mapped.length} Records`}</Btn>
          </div>
        </div>
      )}
      {step===2&&(
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontSize:56,marginBottom:12}}>🎉</div>
          <div style={{color:T.text,fontWeight:800,fontSize:18,marginBottom:6}}>Import Successful!</div>
          <div style={{color:T.sub,fontSize:13,marginBottom:20}}>{mapped.length} {tab} records saved to your database.</div>
          <Btn onClick={onClose} style={{width:"100%"}}>Go to Dashboard</Btn>
        </div>
      )}
    </Sheet>
  );
}

// ─── QUICK ADD PICKER ─────────────────────────────────────────────────────────
function QuickAdd({onPick,onImport,onClose}){
  const opts=[
    {key:"txn",emoji:"↔️",label:"Transaction",sub:"Income or expense",color:T.accent},
    {key:"inv",emoji:"📈",label:"Investment",sub:"Stocks, MF, Gold…",color:T.purple},
    {key:"sav",emoji:"🏦",label:"Savings",sub:"FD, RD, PPF…",color:T.green},
    {key:"loan",emoji:"🏠",label:"Loan / EMI",sub:"Home, Car, Personal…",color:T.yellow},
    {key:"import",emoji:"📂",label:"Import Excel",sub:"Upload CSV file",color:T.cyan},
  ];
  return(
    <Sheet title="What would you like to add?" onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {opts.map(o=>(
          <button key={o.key} onClick={()=>o.key==="import"?onImport():onPick(o.key)} style={{background:`${o.color}12`,border:`1px solid ${o.color}33`,borderRadius:16,padding:"16px 12px",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
            <div style={{fontSize:26,marginBottom:6}}>{o.emoji}</div>
            <div style={{color:T.text,fontWeight:700,fontSize:14}}>{o.label}</div>
            <div style={{color:T.muted,fontSize:11,marginTop:2}}>{o.sub}</div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
function HomeScreen({data,onAdd}){
  const {transactions,investments,savings,loans}=data;
  const income=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expenses=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const totalInv=investments.reduce((s,i)=>s+(+i.amount),0);
  const totalSav=savings.reduce((s,x)=>s+(+x.amount),0);
  const totalOutstanding=loans.reduce((s,l)=>s+(+l.outstanding),0);
  const totalEMI=loans.reduce((s,l)=>s+(+l.emi),0);
  const netWorth=totalInv+totalSav+(income-expenses)-totalOutstanding;
  const savRate=income>0?pct(income-expenses,income):0;
  const catMap={};transactions.filter(t=>t.type==="expense").forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+Math.abs(t.amount);});
  const pieData=Object.entries(catMap).map(([name,value])=>({name,value}));
  const recent=[...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  return(
    <div style={{paddingBottom:20}}>
      <div style={{background:"linear-gradient(160deg,#1e1b4b 0%,#0F1420 100%)",padding:"20px 16px 24px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{color:T.muted,fontSize:12,fontWeight:600}}>Good day 👋</div>
            <div style={{fontSize:22,fontWeight:900}}>
              <span style={{background:g(T.accent,T.purple),WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Fin</span>
              <span style={{color:T.text}}>Pulse</span>
            </div>
          </div>
          <button onClick={onAdd} style={{background:g(T.accent,T.purple),border:"none",borderRadius:14,padding:"9px 18px",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>＋ Add</button>
        </div>
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
          <div style={{color:T.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Estimated Net Worth</div>
          <div style={{color:T.text,fontSize:32,fontWeight:900,letterSpacing:"-0.03em"}}>{fmt(netWorth,false)}</div>
          <div style={{color:T.green,fontSize:12,fontWeight:600,marginTop:3}}>Updated live from your data</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[{l:"Income",v:fmt(income),c:T.green,e:"📈"},{l:"Expenses",v:fmt(expenses),c:T.red,e:"📉"},{l:"Saved",v:fmt(income-expenses),c:T.accent,e:"💰"}].map(s=>(
            <div key={s.l} style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:14,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:16}}>{s.e}</div><div style={{color:T.text,fontSize:13,fontWeight:800}}>{s.v}</div><div style={{color:T.muted,fontSize:10}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 14px",display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{color:T.text,fontWeight:800,fontSize:14}}>Financial Health</div>
            <Tag label={savRate>=20?"✓ On Track":"Needs Work"} color={savRate>=20?T.green:T.yellow}/>
          </div>
          {[{l:"Savings Rate",v:savRate,ideal:20,c:T.green},{l:"Investment %",v:pct(totalInv,income||1),ideal:15,c:T.accent},{l:"EMI Load",v:pct(totalEMI,(income||1)),ideal:40,c:T.yellow}].map(b=>(
            <div key={b.l} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color:T.sub,fontSize:12}}>{b.l}</span>
                <span style={{color:b.c,fontSize:12,fontWeight:700}}>{b.v}% <span style={{color:T.muted,fontWeight:400}}>/ {b.ideal}% ideal</span></span>
              </div>
              <div style={{background:"rgba(255,255,255,0.07)",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${Math.min(b.v,100)}%`,background:g(b.c+"88",b.c),height:"100%",borderRadius:99}}/>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{color:T.text,fontWeight:800,fontSize:14}}>6-Month Cashflow</div>
            <div style={{display:"flex",gap:10,fontSize:11}}>
              <span style={{color:T.green,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:T.green,display:"inline-block"}}/>In</span>
              <span style={{color:T.red,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block"}}/>Out</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={CASHFLOW}>
              <defs>
                <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity={0.4}/><stop offset="100%" stopColor={T.green} stopOpacity={0}/></linearGradient>
                <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.red} stopOpacity={0.4}/><stop offset="100%" stopColor={T.red} stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}K`}/>
              <Tooltip contentStyle={{background:"#1a1f3a",border:"none",borderRadius:10,color:"#fff",fontSize:11}} formatter={v=>[fmt(v,false)]}/>
              <Area type="monotone" dataKey="inc" stroke={T.green} strokeWidth={2} fill="url(#ig)" dot={false}/>
              <Area type="monotone" dataKey="exp" stroke={T.red} strokeWidth={2} fill="url(#eg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{l:"Investments",v:fmt(totalInv),s:`${investments.length} holdings`,c:T.accent,e:"📈"},{l:"Savings",v:fmt(totalSav),s:`${savings.length} accounts`,c:T.green,e:"🏦"},{l:"Loan Outstanding",v:fmt(totalOutstanding),s:`EMI: ${fmt(totalEMI)}/mo`,c:T.yellow,e:"📋"},{l:"Top Expense",v:pieData.length?pieData.sort((a,b)=>b.value-a.value)[0].name:"—",s:pieData.length?fmt(pieData.sort((a,b)=>b.value-a.value)[0].value):"",c:T.pink,e:"💸"}].map((b,i)=>(
            <Card key={i} style={{padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{color:T.muted,fontSize:10,fontWeight:700,textTransform:"uppercase"}}>{b.l}</div>
                <span style={{fontSize:18}}>{b.e}</span>
              </div>
              <div style={{color:T.text,fontSize:18,fontWeight:900}}>{b.v}</div>
              <div style={{color:b.c,fontSize:11,fontWeight:600,marginTop:3}}>{b.s}</div>
            </Card>
          ))}
        </div>
        {pieData.length>0&&(
          <Card>
            <div style={{color:T.text,fontWeight:800,fontSize:14,marginBottom:10}}>Expense Breakdown</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <PieChart width={100} height={100}>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={46} dataKey="value" strokeWidth={0}>
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:"#1a1f3a",border:"none",borderRadius:8,color:"#fff",fontSize:11}} formatter={v=>[fmt(v,false)]}/>
              </PieChart>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                {pieData.sort((a,b)=>b.value-a.value).slice(0,5).map((d,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{display:"flex",alignItems:"center",gap:5,color:T.sub,fontSize:11}}><span style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],display:"inline-block",flexShrink:0}}/>{d.name}</span>
                    <span style={{color:T.text,fontSize:11,fontWeight:700}}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
        <Card>
          <div style={{color:T.text,fontWeight:800,fontSize:14,marginBottom:12}}>Recent Transactions</div>
          {recent.length===0&&<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:"16px 0"}}>No transactions yet. Tap ＋ Add!</div>}
          {recent.map((t,i)=>(
            <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<recent.length-1?`1px solid ${T.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:12,background:t.type==="income"?`${T.green}22`:`${T.red}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{t.type==="income"?"💰":"💸"}</div>
                <div><div style={{color:T.text,fontSize:13,fontWeight:600}}>{t.name}</div><div style={{color:T.muted,fontSize:10}}>{t.category} · {t.date}</div></div>
              </div>
              <div style={{color:t.type==="income"?T.green:T.red,fontWeight:800,fontSize:13}}>{t.type==="income"?"+":"-"}{fmt(Math.abs(t.amount))}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── LIST SCREEN ──────────────────────────────────────────────────────────────
function ListScreen({title,items,onAdd,onEdit,onDelete,renderItem,statsBar,emptyMsg}){
  const [search,setSearch]=useState("");
  const filtered=items.filter(i=>JSON.stringify(i).toLowerCase().includes(search.toLowerCase()));
  return(
    <div style={{padding:"16px 14px",paddingBottom:80}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div><div style={{color:T.text,fontSize:18,fontWeight:900}}>{title}</div><div style={{color:T.muted,fontSize:11}}>{items.length} records</div></div>
        <Btn onClick={onAdd}>＋ Add</Btn>
      </div>
      {statsBar}
      <div style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"0 12px",display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{color:T.muted}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{background:"none",border:"none",color:T.text,fontSize:13,outline:"none",padding:"11px 0",flex:1,fontFamily:"inherit"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>✕</button>}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:T.muted,fontSize:13}}>{search?"No results found.":emptyMsg||"Nothing here yet. Tap ＋ Add!"}</div>}
      {filtered.map(item=>(
        <div key={item.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:14,marginBottom:10}}>
          {renderItem(item)}
          <div style={{display:"flex",gap:8,marginTop:10,justifyContent:"flex-end"}}>
            <Btn variant="ghost" onClick={()=>onEdit(item)} style={{padding:"6px 14px",fontSize:12}}>✏️ Edit</Btn>
            <Btn variant="danger" onClick={()=>onDelete(item.id)} style={{padding:"6px 14px",fontSize:12}}>🗑 Delete</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AI INSIGHTS ──────────────────────────────────────────────────────────────
function InsightsScreen({data}){
  const [q,setQ]=useState("");
  const [resp,setResp]=useState("");
  const [loading,setLoading]=useState(false);
  const {transactions,investments,savings,loans}=data;
  const income=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expenses=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const totalInv=investments.reduce((s,i)=>s+(+i.amount),0);
  const totalSav=savings.reduce((s,s2)=>s+(+s2.amount),0);
  const totalEMI=loans.reduce((s,l)=>s+(+l.emi),0);
  const savRate=income>0?pct(income-expenses,income):0;
  const byCat={};transactions.filter(t=>t.type==="expense").forEach(t=>{byCat[t.category]=(byCat[t.category]||0)+Math.abs(t.amount);});
  const topCat=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  const emiLoad=income>0?pct(totalEMI,income):0;
  const cards=[
    savRate>=20?{e:"✅",t:"Healthy Savings",b:`Saving ${savRate}% of income — above the 20% benchmark.`,type:"success"}:{e:"⚠️",t:"Low Savings Rate",b:`Saving ${savRate}% of income. Target 20%+ for financial security.`,type:"warn"},
    topCat?{e:"📊",t:`Top Spend: ${topCat[0]}`,b:`${topCat[0]} is ${pct(topCat[1],expenses)}% of expenses (${fmt(topCat[1],false)}). Review if essential.`,type:"info"}:null,
    emiLoad>40?{e:"🔴",t:"High EMI Load",b:`EMIs are ${emiLoad}% of income. Safe limit is 40%. Prepay high-interest loans first.`,type:"danger"}:{e:"💚",t:"EMI Load Healthy",b:`EMIs are ${emiLoad}% of income — within safe limits.`,type:"success"},
    investments.length>0?{e:"📈",t:"Top Investment",b:`Best performer: ${[...investments].sort((a,b)=>b.returns-a.returns)[0]?.name} at ${[...investments].sort((a,b)=>b.returns-a.returns)[0]?.returns}% p.a.`,type:"info"}:{e:"💡",t:"Start Investing",b:"No investments yet. A ₹500/month SIP in a Nifty index fund is a great start.",type:"info"},
    {e:"🎯",t:"Action Point",b:income-expenses>0?`Surplus of ${fmt(income-expenses,false)}. Suggested: 50% investments, 30% savings, 20% emergency fund.`:`Deficit of ${fmt(Math.abs(income-expenses),false)}. Cut subscriptions and dining first.`,type:income-expenses>0?"success":"danger"},
    totalSav<income*3?{e:"🚨",t:"Build Emergency Fund",b:`Savings cover ${Math.round(totalSav/(income||1))} months of income. Target: 6 months.`,type:"warn"}:{e:"🛡️",t:"Emergency Fund OK",b:`Savings cover ${Math.round(totalSav/(income||1))} months. Good safety net!`,type:"success"},
  ].filter(Boolean);
  const colorMap={success:{bg:"rgba(16,185,129,0.07)",bd:"rgba(16,185,129,0.25)"},warn:{bg:"rgba(245,158,11,0.07)",bd:"rgba(245,158,11,0.25)"},info:{bg:"rgba(99,102,241,0.07)",bd:"rgba(99,102,241,0.25)"},danger:{bg:"rgba(239,68,68,0.07)",bd:"rgba(239,68,68,0.25)"}};
  const quickQ=["How can I grow savings faster?","Am I investing enough?","Which loan to prepay first?","Best tax-saving options?","What SIP amount should I start?"];
  const ask=async()=>{
    if(!q.trim())return;setLoading(true);setResp("");
    const sum=`Income: ₹${income}, Expenses: ₹${expenses}, Investments: ₹${totalInv} (${investments.length} holdings), Savings: ₹${totalSav}, EMI: ₹${totalEMI}/mo, Savings rate: ${savRate}%`;
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"You are a personal finance advisor for Indian users. Give specific, actionable advice. Use Indian context: ₹, SIP, PPF, NPS, ELSS, 80C. Be concise.",messages:[{role:"user",content:`My finances: ${sum}\n\nQuestion: ${q}`}]})});
      const d=await r.json();setResp(d.content?.[0]?.text||"No response.");
    }catch{setResp("Connection error. Try again.");}
    setLoading(false);
  };
  return(
    <div style={{padding:"16px 14px",paddingBottom:80}}>
      <div style={{marginBottom:16}}><div style={{color:T.text,fontSize:18,fontWeight:900}}>AI Insights</div><div style={{color:T.muted,fontSize:11}}>Personalised analysis of your data</div></div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
        {cards.map((c,i)=>{const s=colorMap[c.type];return(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.bd}`,borderRadius:14,padding:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><span style={{fontSize:18}}>{c.e}</span><div style={{color:T.text,fontWeight:700,fontSize:13}}>{c.t}</div></div>
            <div style={{color:T.sub,fontSize:12,lineHeight:1.6}}>{c.b}</div>
          </div>
        );})}
      </div>
      <div style={{background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:18,padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{background:g(T.accent,T.green),borderRadius:12,padding:"7px 9px",fontSize:18}}>🤖</div>
          <div><div style={{color:T.text,fontWeight:800,fontSize:14}}>Ask Finance AI</div><div style={{color:T.muted,fontSize:11}}>Powered by Claude</div></div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ask anything about your finances..." style={{flex:1,background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={ask} disabled={loading||!q.trim()} style={{background:loading?"rgba(99,102,241,0.3)":g(T.accent,T.green),border:"none",borderRadius:10,padding:"10px 14px",color:"#fff",fontWeight:800,cursor:loading?"wait":"pointer",fontSize:13,fontFamily:"inherit"}}>{loading?"…":"Ask"}</button>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:resp?12:0}}>
          {quickQ.map(qk=><button key={qk} onClick={()=>setQ(qk)} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 11px",color:T.muted,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,fontFamily:"inherit"}}>{qk}</button>)}
        </div>
        {resp&&<div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:12,padding:14}}>
          <div style={{color:T.muted,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Claude's Analysis</div>
          <div style={{color:T.sub,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{resp}</div>
        </div>}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const NAV=[{id:"home",e:"🏠",l:"Home"},{id:"txn",e:"↔️",l:"Spend"},{id:"inv",e:"📈",l:"Invest"},{id:"sav",e:"🏦",l:"Save"},{id:"loan",e:"🏠",l:"Loans"},{id:"ai",e:"🤖",l:"AI"}];

export default function App(){
  const [tab,setTab]=useState("home");
  const [data,setData]=useState({transactions:[],investments:[],savings:[],loans:[]});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [modal,setModal]=useState(null);
  const [editItem,setEditItem]=useState(null);
  const [toast,setToast]=useState(null);

  const showToast=(message,type="success")=>{setToast({message,type});};

  // ── Load all data from Supabase on mount ──
  useEffect(()=>{
    (async()=>{
      try{
        const [txns,invs,savs,lns]=await Promise.all([
          db("transactions"),db("investments"),db("savings"),db("loans")
        ]);
        setData({
          transactions:Array.isArray(txns)&&txns.length?txns:SEED.transactions,
          investments:Array.isArray(invs)&&invs.length?invs:SEED.investments,
          savings:Array.isArray(savs)&&savs.length?savs:SEED.savings,
          loans:Array.isArray(lns)&&lns.length?lns:SEED.loans,
        });
        // Seed DB if empty
        if(!txns?.length){for(const r of SEED.transactions)await db("transactions","POST",r);}
        if(!invs?.length){for(const r of SEED.investments)await db("investments","POST",r);}
        if(!savs?.length){for(const r of SEED.savings)await db("savings","POST",r);}
        if(!lns?.length){for(const r of SEED.loans)await db("loans","POST",r);}
      }catch(e){
        console.error(e);
        setData(SEED);
        showToast("Running offline — data won't persist","error");
      }
      setLoading(false);
    })();
  },[]);

  // ── CRUD helpers ──
  const TABLE={txn:"transactions",inv:"investments",sav:"savings",loan:"loans"};

  const saveItem=async(type,item)=>{
    setSaving(true);
    const table=TABLE[type];
    const isEdit=data[table].some(x=>x.id===item.id);
    try{
      if(isEdit){
        await db(table,"PATCH",item,item.id);
        setData(d=>({...d,[table]:d[table].map(x=>x.id===item.id?item:x)}));
        showToast("Updated successfully ✓");
      }else{
        await db(table,"POST",item);
        setData(d=>({...d,[table]:[item,...d[table]]}));
        showToast("Saved successfully ✓");
      }
    }catch{showToast("Save failed — check connection","error");}
    setSaving(false);
    setModal(null);setEditItem(null);
  };

  const deleteItem=async(type,id)=>{
    const table=TABLE[type];
    try{
      await db(table,"DELETE",null,id);
      setData(d=>({...d,[table]:d[table].filter(x=>x.id!==id)}));
      showToast("Deleted");
    }catch{showToast("Delete failed","error");}
  };

  const handleImport=async(type,records)=>{
    const tableMap={transactions:"transactions",investments:"investments",savings:"savings",loans:"loans"};
    const table=tableMap[type];
    try{
      for(const r of records)await db(table,"POST",r);
      setData(d=>({...d,[table]:[...records,...d[table]]}));
      showToast(`${records.length} records imported ✓`);
    }catch{showToast("Import failed — check connection","error");}
  };

  // ── Render helpers ──
  const renderTx=(t)=>(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
        <div><div style={{color:T.text,fontSize:14,fontWeight:700}}>{t.name}</div><div style={{color:T.muted,fontSize:11,marginTop:2}}>{t.category} · {t.date} · {t.method}</div>{t.note&&<div style={{color:T.muted,fontSize:11}}>📝 {t.note}</div>}</div>
        <div style={{textAlign:"right"}}><div style={{color:t.type==="income"?T.green:T.red,fontWeight:900,fontSize:16}}>{t.type==="income"?"+":"-"}₹{Math.abs(t.amount).toLocaleString()}</div><StatusBadge s={t.status}/></div>
      </div>
    </div>
  );

  const renderInv=(inv)=>(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{flex:1}}><div style={{color:T.text,fontSize:14,fontWeight:700}}>{inv.name}</div><div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}><Tag label={inv.type} color={T.accent}/><Tag label={inv.subtype} color={T.purple}/><StatusBadge s={inv.status}/></div></div>
        <div style={{textAlign:"right"}}><div style={{color:T.text,fontWeight:900,fontSize:16}}>₹{(+inv.amount).toLocaleString()}</div><div style={{color:T.green,fontSize:11,fontWeight:600}}>▲ {inv.returns}% p.a.</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
        {[{l:"Broker",v:inv.broker},{l:"Frequency",v:inv.frequency},{l:"Since",v:inv.start_date}].map(r=>(
          <div key={r.l} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"6px 8px"}}><div style={{color:T.muted,fontSize:9}}>{r.l}</div><div style={{color:T.sub,fontSize:11,fontWeight:600}}>{r.v}</div></div>
        ))}
      </div>
      {inv.note&&<div style={{color:T.muted,fontSize:11,marginTop:7}}>📝 {inv.note}</div>}
    </div>
  );

  const renderSav=(s)=>(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{flex:1}}><div style={{color:T.text,fontSize:14,fontWeight:700}}>{s.name}</div><div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}><Tag label={s.type} color={T.green}/><Tag label={s.subtype} color={T.cyan}/></div></div>
        <div style={{textAlign:"right"}}><div style={{color:T.text,fontWeight:900,fontSize:16}}>₹{(+s.amount).toLocaleString()}</div><div style={{color:T.green,fontSize:11,fontWeight:600}}>{s.interest_rate}% p.a.</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
        {[{l:"Bank",v:s.bank},{l:"Goal",v:s.goal},{l:"Matures",v:s.maturity_date||"—"}].map(r=>(
          <div key={r.l} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"6px 8px"}}><div style={{color:T.muted,fontSize:9}}>{r.l}</div><div style={{color:T.sub,fontSize:11,fontWeight:600}}>{r.v}</div></div>
        ))}
      </div>
      {s.note&&<div style={{color:T.muted,fontSize:11,marginTop:7}}>📝 {s.note}</div>}
    </div>
  );

  const renderLoan=(l)=>{
    const repaid=(+l.amount)-(+l.outstanding);const rp=pct(repaid,+l.amount||1);
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{flex:1}}><div style={{color:T.text,fontSize:14,fontWeight:700}}>{l.name}</div><div style={{display:"flex",gap:5,marginTop:4}}><Tag label={l.type} color={T.yellow}/><StatusBadge s={l.status}/></div></div>
          <div style={{textAlign:"right"}}><div style={{color:T.red,fontWeight:900,fontSize:15}}>₹{(+l.outstanding).toLocaleString()}</div><div style={{color:T.muted,fontSize:10}}>outstanding</div></div>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:T.muted,fontSize:11}}>Repaid {rp}%</span><span style={{color:T.green,fontSize:11,fontWeight:700}}>₹{repaid.toLocaleString()} paid</span></div>
          <div style={{background:"rgba(255,255,255,0.07)",borderRadius:99,height:6,overflow:"hidden"}}><div style={{width:`${rp}%`,background:g(T.green,"#059669"),height:"100%",borderRadius:99}}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
          {[{l:"EMI/mo",v:`₹${(+l.emi).toLocaleString()}`},{l:"Rate",v:`${l.interest_rate}%`},{l:"Bank",v:l.bank}].map(r=>(
            <div key={r.l} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"6px 8px"}}><div style={{color:T.muted,fontSize:9}}>{r.l}</div><div style={{color:T.sub,fontSize:11,fontWeight:600}}>{r.v}</div></div>
          ))}
        </div>
      </div>
    );
  };

  const txStats=(
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[{l:"Total In",v:`₹${data.transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0).toLocaleString()}`,c:T.green},{l:"Total Out",v:`₹${data.transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+Math.abs(t.amount),0).toLocaleString()}`,c:T.red}].map(s=>(
        <div key={s.l} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 14px"}}><div style={{color:T.muted,fontSize:10,marginBottom:2}}>{s.l}</div><div style={{color:s.c,fontWeight:800,fontSize:15}}>{s.v}</div></div>
      ))}
    </div>
  );

  if(loading)return<LoadingScreen/>;

  return(
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',system-ui,sans-serif",position:"relative"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",top:-80,left:-80,width:300,height:300,background:"radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:60,right:-60,width:260,height:260,background:"radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {toast&&<Toast message={toast.message} type={toast.type} onDone={()=>setToast(null)}/>}

      <div style={{position:"relative",zIndex:1,overflowY:"auto",height:"100vh",paddingBottom:70}}>
        {tab==="home"&&<HomeScreen data={data} onAdd={()=>setModal("quickadd")}/>}
        {tab==="txn"&&<ListScreen title="Transactions" items={data.transactions} onAdd={()=>{setEditItem(null);setModal("txn");}} onEdit={item=>{setEditItem(item);setModal("txn");}} onDelete={id=>deleteItem("txn",id)} renderItem={renderTx} statsBar={txStats} emptyMsg="No transactions yet."/>}
        {tab==="inv"&&<ListScreen title="Investments" items={data.investments} onAdd={()=>{setEditItem(null);setModal("inv");}} onEdit={item=>{setEditItem(item);setModal("inv");}} onDelete={id=>deleteItem("inv",id)} renderItem={renderInv} emptyMsg="No investments yet."/>}
        {tab==="sav"&&<ListScreen title="Savings" items={data.savings} onAdd={()=>{setEditItem(null);setModal("sav");}} onEdit={item=>{setEditItem(item);setModal("sav");}} onDelete={id=>deleteItem("sav",id)} renderItem={renderSav} emptyMsg="No savings yet."/>}
        {tab==="loan"&&<ListScreen title="Loans & EMIs" items={data.loans} onAdd={()=>{setEditItem(null);setModal("loan");}} onEdit={item=>{setEditItem(item);setModal("loan");}} onDelete={id=>deleteItem("loan",id)} renderItem={renderLoan} emptyMsg="No loans yet."/>}
        {tab==="ai"&&<InsightsScreen data={data}/>}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(7,9,15,0.97)",backdropFilter:"blur(24px)",borderTop:`1px solid ${T.border}`,display:"flex",zIndex:100}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit"}}>
            <span style={{fontSize:tab===n.id?21:17,transition:"font-size 0.15s"}}>{n.e}</span>
            <span style={{fontSize:9,fontWeight:700,color:tab===n.id?T.accent:T.muted}}>{n.l}</span>
            {tab===n.id&&<div style={{width:14,height:3,background:T.accent,borderRadius:99,marginTop:1}}/>}
          </button>
        ))}
      </div>

      {modal==="quickadd"&&<QuickAdd onClose={()=>setModal(null)} onPick={t=>{setModal(t);}} onImport={()=>setModal("import")}/>}
      {modal==="import"&&<ImportSheet onClose={()=>setModal(null)} onImport={handleImport}/>}
      {modal==="txn"&&<TxWizard item={editItem} onClose={()=>{setModal(null);setEditItem(null);}} onSave={item=>saveItem("txn",item)} saving={saving}/>}
      {modal==="inv"&&<InvWizard item={editItem} onClose={()=>{setModal(null);setEditItem(null);}} onSave={item=>saveItem("inv",item)} saving={saving}/>}
      {modal==="sav"&&<SavWizard item={editItem} onClose={()=>{setModal(null);setEditItem(null);}} onSave={item=>saveItem("sav",item)} saving={saving}/>}
      {modal==="loan"&&<LoanWizard item={editItem} onClose={()=>{setModal(null);setEditItem(null);}} onSave={item=>saveItem("loan",item)} saving={saving}/>}
    </div>
  );
}
