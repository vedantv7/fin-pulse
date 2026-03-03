import { useState, useRef, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:"#07090F", surface:"#0F1420", card:"rgba(255,255,255,0.04)",
  border:"rgba(255,255,255,0.08)", borderHover:"rgba(255,255,255,0.16)",
  accent:"#6366F1", green:"#10B981", yellow:"#F59E0B", red:"#EF4444",
  pink:"#EC4899", cyan:"#06B6D4", purple:"#8B5CF6",
  text:"#F1F5F9", sub:"rgba(241,245,249,0.5)", muted:"rgba(241,245,249,0.25)",
};
const g = (a,b) => `linear-gradient(135deg,${a},${b})`;
const shadow = "0 4px 24px rgba(0,0,0,0.4)";

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED = {
  transactions:[
    {id:"t1",name:"Monthly Salary",category:"Salary",amount:90000,type:"income",date:"2026-03-01",method:"Bank Transfer",status:"Completed",note:""},
    {id:"t2",name:"House Rent",category:"Housing",amount:-18000,type:"expense",date:"2026-03-01",method:"Bank Transfer",status:"Completed",note:""},
    {id:"t3",name:"Groceries",category:"Food",amount:-4200,type:"expense",date:"2026-03-03",method:"UPI",status:"Completed",note:""},
    {id:"t4",name:"Electricity Bill",category:"Utilities",amount:-1800,type:"expense",date:"2026-03-05",method:"UPI",status:"Completed",note:""},
    {id:"t5",name:"Freelance Project",category:"Freelance",amount:22000,type:"income",date:"2026-02-28",method:"Bank Transfer",status:"Completed",note:""},
    {id:"t6",name:"OTT Subscriptions",category:"Entertainment",amount:-899,type:"expense",date:"2026-02-27",method:"Credit Card",status:"Completed",note:"Netflix+Prime"},
    {id:"t7",name:"Fuel",category:"Transport",amount:-2400,type:"expense",date:"2026-02-25",method:"Debit Card",status:"Completed",note:""},
  ],
  investments:[
    {id:"i1",name:"Nifty 50 Index Fund",type:"Mutual Fund",subtype:"Index Fund",amount:10000,units:142.3,nav:70.27,startDate:"2024-06-01",frequency:"Monthly SIP",broker:"Zerodha",returns:12.4,status:"Active",note:""},
    {id:"i2",name:"Reliance Industries",type:"Stocks",subtype:"Large Cap",amount:25000,units:10,nav:2500,startDate:"2025-01-15",frequency:"One-time",broker:"Zerodha",returns:8.2,status:"Active",note:""},
    {id:"i3",name:"PPF Account",type:"Government Scheme",subtype:"PPF",amount:150000,units:1,nav:150000,startDate:"2020-04-01",frequency:"Yearly",broker:"SBI",returns:7.1,status:"Active",note:"Tax saving u/s 80C"},
  ],
  savings:[
    {id:"s1",name:"Emergency Fund - SBI",type:"Savings Account",subtype:"Regular Savings",amount:85000,interestRate:3.5,maturityDate:"",bank:"SBI",goal:"Emergency",status:"Active",note:"6 months buffer"},
    {id:"s2",name:"Fixed Deposit - HDFC",type:"Fixed Deposit",subtype:"Cumulative FD",amount:200000,interestRate:7.25,maturityDate:"2027-03-01",bank:"HDFC Bank",goal:"House Down Payment",status:"Active",note:""},
  ],
  loans:[
    {id:"l1",name:"Home Loan - SBI",type:"Home Loan",amount:3500000,outstanding:2800000,emi:28500,interestRate:8.5,startDate:"2022-01-01",endDate:"2042-01-01",bank:"SBI",status:"Active",note:""},
    {id:"l2",name:"Car Loan - HDFC",type:"Car Loan",amount:650000,outstanding:320000,emi:12800,interestRate:9.2,startDate:"2023-06-01",endDate:"2028-06-01",bank:"HDFC Bank",status:"Active",note:""},
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
const PIE_COLORS=["#6366F1","#10B981","#F59E0B","#EF4444","#EC4899","#06B6D4","#8B5CF6","#F97316","#84CC16","#14B8A6"];
const GOALS=["Emergency","House Down Payment","Retirement","Education","Holiday","Wedding","Car","Medical","Other"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt=(n,short=true)=>{const a=Math.abs(n);if(short){if(a>=10000000)return`₹${(a/10000000).toFixed(2)}Cr`;if(a>=100000)return`₹${(a/100000).toFixed(2)}L`;if(a>=1000)return`₹${(a/1000).toFixed(1)}K`;}return`₹${a.toLocaleString("en-IN")}`;};
const pct=(a,b)=>b>0?+((a/b)*100).toFixed(1):0;
const uid=()=>Math.random().toString(36).slice(2,10);
const today=()=>new Date().toISOString().slice(0,10);

// ─── BASE UI ──────────────────────────────────────────────────────────────────
const Card=({children,style={}})=><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:16,...style}}>{children}</div>;

const Btn=({children,onClick,variant="primary",style={}})=>{
  const styles={primary:{background:g(T.accent,T.purple),color:"#fff"},
    success:{background:g(T.green,"#059669"),color:"#fff"},
    warning:{background:g(T.yellow,"#D97706"),color:"#fff"},
    ghost:{background:"rgba(255,255,255,0.06)",border:`1px solid ${T.border}`,color:T.sub},
    danger:{background:`${T.red}22`,border:`1px solid ${T.red}44`,color:T.red}};
  return<button onClick={onClick} style={{border:"none",borderRadius:12,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",...(styles[variant]||styles.primary),...style}}>{children}</button>;
};

const Inp=({label,type="text",value,onChange,placeholder,required})=>(
  <div style={{marginBottom:12}}>
    {label&&<label style={{display:"block",fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{label}{required&&<span style={{color:T.red}}> *</span>}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
  </div>
);

const Sel=({label,value,onChange,options,required})=>(
  <div style={{marginBottom:12}}>
    {label&&<label style={{display:"block",fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{label}{required&&<span style={{color:T.red}}> *</span>}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);

const Textarea=({label,value,onChange,placeholder,rows=2})=>(
  <div style={{marginBottom:12}}>
    {label&&<label style={{display:"block",fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{label}</label>}
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
  </div>
);

const Tag=({label,color=T.accent})=><span style={{background:`${color}22`,color,padding:"2px 9px",borderRadius:99,fontSize:10,fontWeight:700}}>{label}</span>;

const StatusBadge=({s})=>{
  const m={Completed:{b:"#052e16",c:"#34d399"},Pending:{b:"#422006",c:"#fbbf24"},Failed:{b:"#450a0a",c:"#f87171"},Active:{b:"#1e1b4b",c:"#818cf8"},Closed:{b:"#1a1a1a",c:"#6b7280"},Matured:{b:"#042f2e",c:"#34d399"}};
  const s2=m[s]||m.Active;return<span style={{background:s2.b,color:s2.c,padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700}}>{s}</span>;
};

// ─── BOTTOM SHEET MODAL ───────────────────────────────────────────────────────
function Sheet({title,onClose,children,wide=false}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#111827",border:`1px solid ${T.border}`,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:wide?560:480,maxHeight:"92vh",overflowY:"auto",padding:"22px 18px 40px",boxShadow:shadow}}>
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
function StepWizard({steps,onDone,onClose,title,accentColor=T.accent}){
  const [step,setStep]=useState(0);
  const cur=steps[step];
  return(
    <Sheet title={title} onClose={onClose}>
      {/* Progress */}
      <div style={{display:"flex",gap:4,marginBottom:20}}>
        {steps.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:99,background:i<=step?accentColor:"rgba(255,255,255,0.1)",transition:"background 0.3s"}}/>)}
      </div>
      <div style={{color:T.muted,fontSize:11,marginBottom:4}}>Step {step+1} of {steps.length}</div>
      <div style={{color:T.text,fontSize:14,fontWeight:700,marginBottom:16}}>{cur.heading}</div>
      {cur.content}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        {step>0&&<Btn variant="ghost" onClick={()=>setStep(s=>s-1)} style={{flex:1}}>← Back</Btn>}
        {step<steps.length-1
          ?<Btn onClick={()=>cur.validate&&!cur.validate()?null:setStep(s=>s+1)} style={{flex:2,background:g(accentColor,accentColor+"aa")}}>Continue →</Btn>
          :<Btn onClick={onDone} style={{flex:2,background:g(accentColor,accentColor+"aa")}}>✓ Save Entry</Btn>}
      </div>
    </Sheet>
  );
}

// ─── TRANSACTION WIZARD ───────────────────────────────────────────────────────
function TxWizard({item,onClose,onSave}){
  const isEdit=!!item?.id;
  const [f,setF]=useState(item||{name:"",category:"Food",amount:"",type:"expense",date:today(),method:"UPI",status:"Completed",note:""});
  const u=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const steps=[
    {heading:"What type of transaction?",validate:()=>true,content:(
      <div>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[{t:"expense",emoji:"💸",label:"Expense",color:T.red},{t:"income",emoji:"💰",label:"Income",color:T.green}].map(x=>(
            <button key={x.t} onClick={()=>u("type")(x.t)} style={{flex:1,padding:"18px 10px",borderRadius:16,border:`2px solid`,borderColor:f.type===x.t?x.color:"rgba(255,255,255,0.08)",background:f.type===x.t?`${x.color}18`:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:6}}>{x.emoji}</div>
              <div style={{color:f.type===x.t?x.color:T.sub,fontWeight:700,fontSize:15}}>{x.label}</div>
            </button>
          ))}
        </div>
      </div>
    )},
    {heading:"What did you spend/earn on?",validate:()=>f.name&&f.amount,content:(
      <div>
        <Inp label="Description" value={f.name} onChange={u("name")} placeholder={f.type==="income"?"e.g. Monthly Salary":"e.g. Grocery Shopping"} required/>
        <Inp label="Amount (₹)" type="number" value={f.amount} onChange={u("amount")} placeholder="0" required/>
        <Inp label="Date" type="date" value={f.date} onChange={u("date")}/>
      </div>
    )},
    {heading:"Category & payment method",validate:()=>true,content:(
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
  return<StepWizard steps={steps} onDone={save} onClose={onClose} title={isEdit?"Edit Transaction":"Log Transaction"} accentColor={f.type==="income"?T.green:T.red}/>;
}

// ─── INVESTMENT WIZARD ────────────────────────────────────────────────────────
function InvWizard({item,onClose,onSave}){
  const isEdit=!!item?.id;
  const [f,setF]=useState(item||{name:"",type:"Mutual Fund",subtype:"Index Fund",amount:"",units:"",nav:"",startDate:today(),frequency:"Monthly SIP",broker:"Zerodha",returns:"",status:"Active",note:""});
  const u=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const subs=INV_SUBS[f.type]||["Other"];
  const typeEmojis={"Mutual Fund":"📊","Stocks":"📈","ETF":"🔀","Gold":"🪙","Cryptocurrency":"₿","Government Scheme":"🏛️","NPS":"👴","ELSS":"💹","Bonds":"📜","Real Estate":"🏘️"};
  const steps=[
    {heading:"What type of investment?",validate:()=>true,content:(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:300,overflowY:"auto"}}>
        {INV_TYPES.map(t=>(
          <button key={t} onClick={()=>{u("type")(t);u("subtype")((INV_SUBS[t]||["Other"])[0]);}} style={{padding:"12px 8px",borderRadius:14,border:`2px solid`,borderColor:f.type===t?T.accent:"rgba(255,255,255,0.08)",background:f.type===t?`${T.accent}18`:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{typeEmojis[t]||"💼"}</div>
            <div style={{color:f.type===t?T.accent:T.sub,fontWeight:700,fontSize:11,lineHeight:1.3}}>{t}</div>
          </button>
        ))}
      </div>
    )},
    {heading:"Sub-type & basic details",validate:()=>f.name&&f.amount,content:(
      <div>
        <Sel label="Sub-type" value={f.subtype} onChange={u("subtype")} options={subs}/>
        <Inp label="Investment Name" value={f.name} onChange={u("name")} placeholder={`e.g. ${f.type==="Stocks"?"Reliance Industries":f.type==="Mutual Fund"?"Nifty 50 Index Fund":"Your investment name"}`} required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Amount Invested (₹)" type="number" value={f.amount} onChange={u("amount")} placeholder="0" required/>
          <Inp label="Expected Returns % p.a." type="number" value={f.returns} onChange={u("returns")} placeholder="0"/>
        </div>
      </div>
    )},
    {heading:"Units, NAV & schedule",validate:()=>true,content:(
      <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Units / Qty" type="number" value={f.units} onChange={u("units")} placeholder="0"/>
          <Inp label="Current NAV / Price (₹)" type="number" value={f.nav} onChange={u("nav")} placeholder="0"/>
          <Inp label="Start Date" type="date" value={f.startDate} onChange={u("startDate")}/>
          <Sel label="Frequency" value={f.frequency} onChange={u("frequency")} options={FREQS}/>
        </div>
        <Sel label="Broker / Platform" value={f.broker} onChange={u("broker")} options={BROKERS}/>
        <Sel label="Status" value={f.status} onChange={u("status")} options={["Active","Paused","Redeemed","Closed"]}/>
        <Textarea label="Notes" value={f.note} onChange={u("note")} placeholder="e.g. Tax saving, goal, strategy..."/>
      </div>
    )},
  ];
  return<StepWizard steps={steps} onDone={()=>onSave({...f,id:item?.id||uid()})} onClose={onClose} title={isEdit?"Edit Investment":"Log Investment"} accentColor={T.accent}/>;
}

// ─── SAVINGS WIZARD ───────────────────────────────────────────────────────────
function SavWizard({item,onClose,onSave}){
  const isEdit=!!item?.id;
  const [f,setF]=useState(item||{name:"",type:"Fixed Deposit",subtype:"Cumulative FD",amount:"",interestRate:"",maturityDate:"",bank:"HDFC Bank",goal:"Emergency",status:"Active",note:""});
  const u=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const subs=SAV_SUBS[f.type]||["Other"];
  const typeEmojis={"Savings Account":"🏦","Fixed Deposit":"🔒","Recurring Deposit":"🔄","Government Scheme":"🏛️","Liquid Fund":"💧"};
  const steps=[
    {heading:"What type of savings?",validate:()=>true,content:(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {SAV_TYPES.map(t=>(
          <button key={t} onClick={()=>{u("type")(t);u("subtype")((SAV_SUBS[t]||["Other"])[0]);}} style={{padding:"16px 10px",borderRadius:14,border:`2px solid`,borderColor:f.type===t?T.green:"rgba(255,255,255,0.08)",background:f.type===t?`${T.green}18`:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:6}}>{typeEmojis[t]||"💰"}</div>
            <div style={{color:f.type===t?T.green:T.sub,fontWeight:700,fontSize:11,lineHeight:1.3}}>{t}</div>
          </button>
        ))}
      </div>
    )},
    {heading:"Account details",validate:()=>f.name&&f.amount,content:(
      <div>
        <Sel label="Sub-type" value={f.subtype} onChange={u("subtype")} options={subs}/>
        <Inp label="Account / Scheme Name" value={f.name} onChange={u("name")} placeholder={`e.g. ${f.type==="Fixed Deposit"?"HDFC FD - March 2026":"SBI Emergency Savings"}`} required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Amount (₹)" type="number" value={f.amount} onChange={u("amount")} placeholder="0" required/>
          <Inp label="Interest Rate % p.a." type="number" value={f.interestRate} onChange={u("interestRate")} placeholder="0"/>
        </div>
      </div>
    )},
    {heading:"Bank, goal & maturity",validate:()=>true,content:(
      <div>
        <Sel label="Bank / Institution" value={f.bank} onChange={u("bank")} options={BANKS}/>
        <Sel label="Savings Goal" value={f.goal} onChange={u("goal")} options={GOALS}/>
        <Inp label="Maturity Date (if any)" type="date" value={f.maturityDate} onChange={u("maturityDate")}/>
        <Sel label="Status" value={f.status} onChange={u("status")} options={["Active","Matured","Closed"]}/>
        <Textarea label="Notes" value={f.note} onChange={u("note")} placeholder="e.g. Auto-renew on/off..."/>
      </div>
    )},
  ];
  return<StepWizard steps={steps} onDone={()=>onSave({...f,id:item?.id||uid()})} onClose={onClose} title={isEdit?"Edit Savings":"Log Savings"} accentColor={T.green}/>;
}

// ─── LOAN WIZARD ──────────────────────────────────────────────────────────────
function LoanWizard({item,onClose,onSave}){
  const isEdit=!!item?.id;
  const [f,setF]=useState(item||{name:"",type:"Personal Loan",amount:"",outstanding:"",emi:"",interestRate:"",startDate:today(),endDate:"",bank:"HDFC Bank",status:"Active",note:""});
  const u=(k)=>(v)=>setF(p=>({...p,[k]:v}));
  const typeEmojis={"Home Loan":"🏠","Car Loan":"🚗","Personal Loan":"👤","Education Loan":"🎓","Business Loan":"🏢","Gold Loan":"🪙","Credit Card Loan":"💳","Loan Against Property":"🏘️"};
  const steps=[
    {heading:"What type of loan?",validate:()=>true,content:(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:300,overflowY:"auto"}}>
        {LOAN_TYPES.map(t=>(
          <button key={t} onClick={()=>u("type")(t)} style={{padding:"12px 8px",borderRadius:14,border:`2px solid`,borderColor:f.type===t?T.yellow:"rgba(255,255,255,0.08)",background:f.type===t?`${T.yellow}18`:"rgba(255,255,255,0.03)",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:4}}>{typeEmojis[t]||"💳"}</div>
            <div style={{color:f.type===t?T.yellow:T.sub,fontWeight:700,fontSize:11,lineHeight:1.3}}>{t}</div>
          </button>
        ))}
      </div>
    )},
    {heading:"Loan amount & EMI",validate:()=>f.name&&f.amount,content:(
      <div>
        <Inp label="Loan Name / Description" value={f.name} onChange={u("name")} placeholder="e.g. Home Loan - SBI" required/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Total Loan (₹)" type="number" value={f.amount} onChange={u("amount")} placeholder="0" required/>
          <Inp label="Outstanding (₹)" type="number" value={f.outstanding} onChange={u("outstanding")} placeholder="0"/>
          <Inp label="Monthly EMI (₹)" type="number" value={f.emi} onChange={u("emi")} placeholder="0"/>
          <Inp label="Interest Rate %" type="number" value={f.interestRate} onChange={u("interestRate")} placeholder="0"/>
        </div>
      </div>
    )},
    {heading:"Bank & timeline",validate:()=>true,content:(
      <div>
        <Sel label="Lender / Bank" value={f.bank} onChange={u("bank")} options={BANKS}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Start Date" type="date" value={f.startDate} onChange={u("startDate")}/>
          <Inp label="End Date" type="date" value={f.endDate} onChange={u("endDate")}/>
        </div>
        <Sel label="Status" value={f.status} onChange={u("status")} options={["Active","Closed","Defaulted"]}/>
        <Textarea label="Notes" value={f.note} onChange={u("note")} placeholder="e.g. Collateral, co-applicant..."/>
      </div>
    )},
  ];
  return<StepWizard steps={steps} onDone={()=>onSave({...f,id:item?.id||uid()})} onClose={onClose} title={isEdit?"Edit Loan":"Log Loan"} accentColor={T.yellow}/>;
}

// ─── CSV / EXCEL IMPORT ───────────────────────────────────────────────────────
function ImportSheet({onClose,onImport}){
  const [tab,setTab]=useState("transactions");
  const [preview,setPreview]=useState([]);
  const [mapped,setMapped]=useState([]);
  const [step,setStep]=useState(0); // 0=upload, 1=preview, 2=done
  const [msg,setMsg]=useState("");
  const fileRef=useRef();

  const TEMPLATES={
    transactions:{headers:["name","category","amount","type","date","method","status","note"],sample:[["Monthly Salary","Salary","90000","income","2026-03-01","Bank Transfer","Completed",""],["House Rent","Housing","18000","expense","2026-03-01","Bank Transfer","Completed",""]]},
    investments:{headers:["name","type","subtype","amount","units","nav","startDate","frequency","broker","returns","status","note"],sample:[["Nifty 50 Index Fund","Mutual Fund","Index Fund","10000","142.3","70.27","2024-06-01","Monthly SIP","Zerodha","12.4","Active",""]]},
    savings:{headers:["name","type","subtype","amount","interestRate","maturityDate","bank","goal","status","note"],sample:[["HDFC FD","Fixed Deposit","Cumulative FD","200000","7.25","2027-03-01","HDFC Bank","House Down Payment","Active",""]]},
    loans:{headers:["name","type","amount","outstanding","emi","interestRate","startDate","endDate","bank","status","note"],sample:[["Home Loan","Home Loan","3500000","2800000","28500","8.5","2022-01-01","2042-01-01","SBI","Active",""]]}
  };

  const downloadTemplate=()=>{
    const t=TEMPLATES[tab];
    const rows=[t.headers,...t.sample];
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`finpulse_${tab}_template.csv`;a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV=(text)=>{
    const lines=text.trim().split("\n");
    const headers=lines[0].split(",").map(h=>h.replace(/"/g,"").trim().toLowerCase());
    return lines.slice(1).filter(l=>l.trim()).map(line=>{
      const vals=line.split(",").map(v=>v.replace(/"/g,"").trim());
      const obj={};
      headers.forEach((h,i)=>obj[h]=vals[i]||"");
      return obj;
    });
  };

  const handleFile=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    if(!file.name.match(/\.(csv|xlsx|xls)$/i)){setMsg("Please upload a .csv file. For Excel (.xlsx), first save as CSV in Excel: File → Save As → CSV.");return;}
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const rows=parseCSV(ev.target.result);
        if(rows.length===0){setMsg("File seems empty. Please check and re-upload.");return;}
        setPreview(rows.slice(0,3));
        const tmpl=TEMPLATES[tab];
        const processed=rows.map(row=>{
          const obj={id:uid()};
          tmpl.headers.forEach(h=>{obj[h]=row[h]||row[h.toLowerCase()]||"";});
          if(tab==="transactions"&&obj.amount){obj.amount=obj.type==="expense"?-Math.abs(+obj.amount):Math.abs(+obj.amount);}
          return obj;
        });
        setMapped(processed);
        setStep(1);setMsg("");
      }catch{setMsg("Could not read file. Please make sure it is a valid CSV.");}
    };
    reader.readAsText(file);
  };

  const confirm=()=>{onImport(tab,mapped);setStep(2);};

  return(
    <Sheet title="Import from Excel / CSV" onClose={onClose} wide>
      {/* Tab selector */}
      <div style={{display:"flex",gap:6,marginBottom:18,overflowX:"auto",paddingBottom:4}}>
        {Object.keys(TEMPLATES).map(t=><button key={t} onClick={()=>{setTab(t);setStep(0);setPreview([]);setMsg("");}} style={{padding:"7px 14px",borderRadius:99,border:"1px solid",borderColor:tab===t?T.accent:T.border,background:tab===t?`${T.accent}22`:"transparent",color:tab===t?T.accent:T.muted,fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize",whiteSpace:"nowrap",flexShrink:0,fontFamily:"inherit"}}>{t}</button>)}
      </div>

      {step===0&&(
        <div>
          <Card style={{marginBottom:14}}>
            <div style={{color:T.text,fontWeight:700,fontSize:13,marginBottom:8}}>📋 How to Import</div>
            {["1. Download the template CSV for this category below","2. Open in Excel/Google Sheets and fill your data","3. Save the file as CSV (File → Save As → CSV)","4. Upload the saved CSV file here"].map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:6}}>
                <span style={{background:`${T.accent}22`,color:T.accent,borderRadius:99,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{i+1}</span>
                <span style={{color:T.sub,fontSize:12,lineHeight:1.5}}>{s}</span>
              </div>
            ))}
          </Card>
          <Btn variant="ghost" onClick={downloadTemplate} style={{width:"100%",marginBottom:14,fontSize:13}}>⬇️ Download {tab.charAt(0).toUpperCase()+tab.slice(1)} Template CSV</Btn>
          <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${T.border}`,borderRadius:16,padding:"28px 20px",textAlign:"center",cursor:"pointer",marginBottom:10}}>
            <div style={{fontSize:36,marginBottom:8}}>📂</div>
            <div style={{color:T.sub,fontSize:13,fontWeight:600}}>Tap to choose your CSV file</div>
            <div style={{color:T.muted,fontSize:11,marginTop:4}}>Supports .csv files (converted from Excel)</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{display:"none"}}/>
          {msg&&<div style={{background:`${T.red}18`,border:`1px solid ${T.red}44`,borderRadius:10,padding:12,color:T.red,fontSize:12,marginTop:8}}>{msg}</div>}
        </div>
      )}

      {step===1&&(
        <div>
          <div style={{background:`${T.green}18`,border:`1px solid ${T.green}44`,borderRadius:12,padding:12,marginBottom:14}}>
            <div style={{color:T.green,fontWeight:700,fontSize:13}}>✅ {mapped.length} records ready to import</div>
            <div style={{color:T.sub,fontSize:12,marginTop:2}}>Preview of first {Math.min(3,preview.length)} rows below:</div>
          </div>
          {preview.map((row,i)=>(
            <Card key={i} style={{marginBottom:8,padding:12}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {Object.entries(row).slice(0,5).map(([k,v])=>(v&&<div key={k} style={{fontSize:11}}><span style={{color:T.muted}}>{k}: </span><span style={{color:T.sub,fontWeight:600}}>{v}</span></div>))}
              </div>
            </Card>
          ))}
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn variant="ghost" onClick={()=>{setStep(0);setPreview([]);}} style={{flex:1}}>← Re-upload</Btn>
            <Btn variant="success" onClick={confirm} style={{flex:2}}>✓ Import {mapped.length} Records</Btn>
          </div>
        </div>
      )}

      {step===2&&(
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontSize:56,marginBottom:12}}>🎉</div>
          <div style={{color:T.text,fontWeight:800,fontSize:18,marginBottom:6}}>Import Successful!</div>
          <div style={{color:T.sub,fontSize:13,marginBottom:20}}>{mapped.length} {tab} records added to your dashboard.</div>
          <Btn onClick={onClose} style={{width:"100%"}}>Go to Dashboard</Btn>
        </div>
      )}
    </Sheet>
  );
}

// ─── QUICK ADD PICKER ─────────────────────────────────────────────────────────
function QuickAdd({onPick,onImport,onClose}){
  const opts=[
    {key:"transaction",emoji:"↔️",label:"Transaction",sub:"Income or expense",color:T.accent},
    {key:"investment",emoji:"📈",label:"Investment",sub:"Stocks, MF, Gold…",color:T.purple},
    {key:"savings",emoji:"🏦",label:"Savings",sub:"FD, RD, PPF…",color:T.green},
    {key:"loan",emoji:"🏠",label:"Loan / EMI",sub:"Home, Car, Personal…",color:T.yellow},
    {key:"import",emoji:"📂",label:"Import Excel",sub:"Upload CSV file",color:T.cyan},
  ];
  return(
    <Sheet title="What would you like to add?" onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
        {opts.map(o=>(
          <button key={o.key} onClick={()=>o.key==="import"?onImport():onPick(o.key)} style={{background:`${o.color}12`,border:`1px solid ${o.color}33`,borderRadius:16,padding:"16px 12px",cursor:"pointer",textAlign:"left"}}>
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
  const netWorth=totalInv+totalSav+(income-expenses)*2-totalOutstanding;
  const savRate=income>0?pct(income-expenses,income):0;
  const catMap={};transactions.filter(t=>t.type==="expense").forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+Math.abs(t.amount);});
  const pieData=Object.entries(catMap).map(([name,value])=>({name,value}));
  const recent=[...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  return(
    <div style={{paddingBottom:20}}>
      {/* Hero */}
      <div style={{background:"linear-gradient(160deg,#1e1b4b 0%,#0F1420 100%)",padding:"20px 16px 24px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{color:T.muted,fontSize:12,fontWeight:600}}>Good morning 👋</div><div style={{color:T.text,fontSize:20,fontWeight:900}}>Your Finance Hub</div></div>
          <button onClick={onAdd} style={{background:g(T.accent,T.purple),border:"none",borderRadius:14,padding:"9px 18px",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>＋ Add</button>
        </div>
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
          <div style={{color:T.muted,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Estimated Net Worth</div>
          <div style={{color:T.text,fontSize:32,fontWeight:900,letterSpacing:"-0.03em"}}>{fmt(netWorth,false)}</div>
          <div style={{color:T.green,fontSize:12,fontWeight:600,marginTop:3}}>▲ 3.2% this month</div>
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
        {/* Health Bars */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{color:T.text,fontWeight:800,fontSize:14}}>Financial Health</div>
            <Tag label={savRate>=20?"✓ On Track":"Needs Work"} color={savRate>=20?T.green:T.yellow}/>
          </div>
          {[{l:"Savings Rate",v:savRate,ideal:20,c:T.green},{l:"Investment %",v:pct(totalInv,income),ideal:15,c:T.accent},{l:"EMI Load",v:pct(totalEMI,income*2),ideal:40,c:T.yellow}].map(b=>(
            <div key={b.l} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color:T.sub,fontSize:12}}>{b.l}</span>
                <span style={{color:b.c,fontSize:12,fontWeight:700}}>{b.v}% <span style={{color:T.muted,fontWeight:400}}>/ {b.ideal}% ideal</span></span>
              </div>
              <div style={{background:"rgba(255,255,255,0.07)",borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${Math.min(b.v,100)}%`,background:g(b.c+"88",b.c),height:"100%",borderRadius:99,transition:"width 0.8s ease"}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* Cashflow Chart */}
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

        {/* 4-box grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{l:"Investments",v:fmt(totalInv),s:`${investments.length} holdings`,c:T.accent,e:"📈"},{l:"Savings",v:fmt(totalSav),s:`${savings.length} accounts`,c:T.green,e:"🏦"},{l:"Loan Outstanding",v:fmt(totalOutstanding),s:`EMI: ${fmt(totalEMI)}/mo`,c:T.yellow,e:"📋"},{l:"Top Expense",v:catMap&&Object.keys(catMap).length?Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0][0]:"—",s:catMap&&Object.keys(catMap).length?fmt(Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0][1]):"",c:T.pink,e:"💸"}].map((b,i)=>(
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

        {/* Expense pie */}
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
                {pieData.slice(0,5).map((d,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{display:"flex",alignItems:"center",gap:5,color:T.sub,fontSize:11}}><span style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],display:"inline-block",flexShrink:0}}/>{d.name}</span>
                    <span style={{color:T.text,fontSize:11,fontWeight:700}}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Recent transactions */}
        <Card>
          <div style={{color:T.text,fontWeight:800,fontSize:14,marginBottom:12}}>Recent Transactions</div>
          {recent.length===0&&<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:"16px 0"}}>No transactions yet. Tap ＋ Add to log your first one!</div>}
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

// ─── GENERIC LIST SCREEN ──────────────────────────────────────────────────────
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
      {filtered.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:T.muted,fontSize:13}}>{search?"No results found.":emptyMsg||"Nothing here yet."}</div>}
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

// ─── INSIGHTS SCREEN ──────────────────────────────────────────────────────────
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
    savRate>=20?{e:"✅",t:"Healthy Savings",b:`You're saving ${savRate}% of income — above the 20% benchmark. Great discipline!`,type:"success"}:{e:"⚠️",t:"Low Savings Rate",b:`Saving ${savRate}% of income. Try to reach 20% by reducing discretionary spends.`,type:"warn"},
    topCat?{e:"📊",t:`Highest Spend: ${topCat[0]}`,b:`${topCat[0]} accounts for ${pct(topCat[1],expenses)}% of total expenses (${fmt(topCat[1],false)}). Review if this is essential.`,type:"info"}:null,
    emiLoad>40?{e:"🔴",t:"EMI Load High",b:`Your EMIs are ${emiLoad}% of income. The safe limit is 40%. Consider prepaying high-interest loans first.`,type:"danger"}:{e:"💚",t:"EMI Load Healthy",b:`Your EMIs are ${emiLoad}% of income — within the safe 40% threshold.`,type:"success"},
    investments.length>0?{e:"📈",t:"Top Investment",b:`Best performer: ${[...investments].sort((a,b)=>b.returns-a.returns)[0]?.name} at ${[...investments].sort((a,b)=>b.returns-a.returns)[0]?.returns}% p.a.`,type:"info"}:{e:"💡",t:"Start Investing",b:"You have no investments logged yet. Even a ₹500/month SIP in an index fund is a great start.",type:"info"},
    {e:"🎯",t:"This Month's Action",b:income-expenses>0?`You have a surplus of ${fmt(income-expenses,false)}. Suggested split: 50% investments + 30% savings + 20% emergency fund.`:`Deficit of ${fmt(Math.abs(income-expenses),false)} this period. Cut subscriptions and dining expenses first.`,type:income-expenses>0?"success":"danger"},
    totalSav<income*3?{e:"🚨",t:"Emergency Fund",b:`Your savings (${fmt(totalSav,false)}) are below 3 months of income. Build this first before increasing investments.`,type:"warn"}:{e:"🛡️",t:"Emergency Fund OK",b:`Your savings cover ${Math.round(totalSav/income)} months of income. Good safety net!`,type:"success"},
  ].filter(Boolean);
  const colorMap={success:{bg:"rgba(16,185,129,0.07)",bd:"rgba(16,185,129,0.25)"},warn:{bg:"rgba(245,158,11,0.07)",bd:"rgba(245,158,11,0.25)"},info:{bg:"rgba(99,102,241,0.07)",bd:"rgba(99,102,241,0.25)"},danger:{bg:"rgba(239,68,68,0.07)",bd:"rgba(239,68,68,0.25)"}};
  const quickQ=["How can I grow my savings faster?","Am I investing enough?","Which loan should I prepay first?","Best tax-saving options?","How to build emergency fund?","What SIP amount should I start with?"];
  const ask=async()=>{
    if(!q.trim())return;setLoading(true);setResp("");
    const sum=`Income: ₹${income}, Expenses: ₹${expenses}, Investments: ₹${totalInv} (${investments.length} holdings), Savings: ₹${totalSav}, EMI: ₹${totalEMI}/mo, Savings rate: ${savRate}%, Top expense: ${topCat?topCat[0]:"N/A"}`;
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"You are a personal finance advisor specializing in Indian personal finance. Give specific, actionable, practical advice. Use Indian context: ₹, SIP, PPF, NPS, ELSS, 80C, mutual funds. Be concise and direct.",messages:[{role:"user",content:`My finances: ${sum}\n\nQuestion: ${q}`}]})});
      const d=await r.json();setResp(d.content?.[0]?.text||"No response.");
    }catch{setResp("Connection error. Please try again.");}
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
          <div><div style={{color:T.text,fontWeight:800,fontSize:14}}>Ask Finance AI</div><div style={{color:T.muted,fontSize:11}}>Powered by Claude · Indian context</div></div>
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
const NAV=[{id:"home",e:"🏠",l:"Home"},{id:"txn",e:"↔️",l:"Spend"},{id:"invest",e:"📈",l:"Invest"},{id:"savings",e:"🏦",l:"Save"},{id:"loans",e:"🏠",l:"Loans"},{id:"ai",e:"🤖",l:"AI"}];

export default function App(){
  const [tab,setTab]=useState("home");
  const [data,setData]=useState(SEED);
  const [modal,setModal]=useState(null); // null | "quickadd" | "import" | "txn" | "inv" | "sav" | "loan"
  const [editItem,setEditItem]=useState(null);

  const upd=(key)=>(fn)=>setData(d=>({...d,[key]:fn(d[key])}));

  const openAdd=(type)=>{setEditItem(null);setModal(type);};
  const openEdit=(type,item)=>{setEditItem(item);setModal(type);};
  const del=(key,id)=>upd(key)(arr=>arr.filter(x=>x.id!==id));
  const save=(key,item)=>{
    upd(key)(arr=>{const exists=arr.find(x=>x.id===item.id);return exists?arr.map(x=>x.id===item.id?item:x):[item,...arr];})();
    setModal(null);setEditItem(null);
  };

  const handleImport=(type,records)=>{
    const keyMap={transactions:"transactions",investments:"investments",savings:"savings",loans:"loans"};
    const k=keyMap[type];
    if(k) upd(k)(arr=>[...records,...arr])();
  };

  // Reusable render functions
  const renderTx=(t)=>(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
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
        {[{l:"Broker",v:inv.broker},{l:"Freq.",v:inv.frequency},{l:"Since",v:inv.startDate}].map(r=>(
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
        <div style={{textAlign:"right"}}><div style={{color:T.text,fontWeight:900,fontSize:16}}>₹{(+s.amount).toLocaleString()}</div><div style={{color:T.green,fontSize:11,fontWeight:600}}>{s.interestRate}% p.a.</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
        {[{l:"Bank",v:s.bank},{l:"Goal",v:s.goal},{l:"Matures",v:s.maturityDate||"—"}].map(r=>(
          <div key={r.l} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"6px 8px"}}><div style={{color:T.muted,fontSize:9}}>{r.l}</div><div style={{color:T.sub,fontSize:11,fontWeight:600}}>{r.v}</div></div>
        ))}
      </div>
      {s.note&&<div style={{color:T.muted,fontSize:11,marginTop:7}}>📝 {s.note}</div>}
    </div>
  );

  const renderLoan=(l)=>{
    const repaid=(+l.amount)-(+l.outstanding);const rp=pct(repaid,+l.amount);
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
          {[{l:"EMI/mo",v:`₹${(+l.emi).toLocaleString()}`},{l:"Rate",v:`${l.interestRate}%`},{l:"Bank",v:l.bank}].map(r=>(
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

  return(
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",top:-80,left:-80,width:300,height:300,background:"radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:60,right:-60,width:260,height:260,background:"radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,overflowY:"auto",height:"100vh",paddingBottom:70}}>
        {tab==="home"&&<HomeScreen data={data} onAdd={()=>setModal("quickadd")}/>}
        {tab==="txn"&&<ListScreen title="Transactions" items={data.transactions} onAdd={()=>openAdd("txn")} onEdit={item=>openEdit("txn",item)} onDelete={id=>del("transactions",id)} renderItem={renderTx} statsBar={txStats} emptyMsg="No transactions yet. Tap ＋ Add to start!"/>}
        {tab==="invest"&&<ListScreen title="Investments" items={data.investments} onAdd={()=>openAdd("inv")} onEdit={item=>openEdit("inv",item)} onDelete={id=>del("investments",id)} renderItem={renderInv} emptyMsg="No investments logged yet."/>}
        {tab==="savings"&&<ListScreen title="Savings" items={data.savings} onAdd={()=>openAdd("sav")} onEdit={item=>openEdit("sav",item)} onDelete={id=>del("savings",id)} renderItem={renderSav} emptyMsg="No savings accounts logged yet."/>}
        {tab==="loans"&&<ListScreen title="Loans & EMIs" items={data.loans} onAdd={()=>openAdd("loan")} onEdit={item=>openEdit("loan",item)} onDelete={id=>del("loans",id)} renderItem={renderLoan} emptyMsg="No loans logged yet."/>}
        {tab==="ai"&&<InsightsScreen data={data}/>}
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(7,9,15,0.97)",backdropFilter:"blur(24px)",borderTop:`1px solid ${T.border}`,display:"flex",zIndex:100}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit"}}>
            <span style={{fontSize:tab===n.id?21:17,transition:"font-size 0.15s"}}>{n.e}</span>
            <span style={{fontSize:9,fontWeight:700,color:tab===n.id?T.accent:T.muted}}>{n.l}</span>
            {tab===n.id&&<div style={{width:14,height:3,background:T.accent,borderRadius:99,marginTop:1}}/>}
          </button>
        ))}
      </div>

      {/* Modals */}
      {modal==="quickadd"&&<QuickAdd onClose={()=>setModal(null)} onPick={t=>setModal(t)} onImport={()=>setModal("import")}/>}
      {modal==="import"&&<ImportSheet onClose={()=>setModal(null)} onImport={handleImport}/>}
      {modal==="txn"&&<TxWizard item={editItem} onClose={()=>{setModal(null);setEditItem(null);}} onSave={item=>save("transactions",item)}/>}
      {modal==="inv"&&<InvWizard item={editItem} onClose={()=>{setModal(null);setEditItem(null);}} onSave={item=>save("investments",item)}/>}
      {modal==="sav"&&<SavWizard item={editItem} onClose={()=>{setModal(null);setEditItem(null);}} onSave={item=>save("savings",item)}/>}
      {modal==="loan"&&<LoanWizard item={editItem} onClose={()=>{setModal(null);setEditItem(null);}} onSave={item=>save("loans",item)}/>}
    </div>
  );
}
