import React,{useEffect,useState,useRef}from'react';import{createRoot}from'react-dom/client';import{Menu,X,Phone,MapPin,Mail,ArrowRight,CheckCircle2,Pencil,Hammer}from'lucide-react';import'./style.css';import AdminApp from'./AdminApp.jsx';import CustomerApp from'./CustomerApp.jsx';import LoginPage from'./LoginPage.jsx';
const API='/api',fallback={services:['Residential Construction','Commercial Buildings','Renovation & Remodeling','Planning & Approval','Interior Works','Turnkey Projects'].map((title,id)=>({id,title,description:'Quality workmanship, transparent pricing and dependable project delivery.'})),projects:[{id:1,title:'Modern Family Residence',location:'Coimbatore',status:'Completed',imageUrl:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'},{id:2,title:'Premium Villa',location:'Erode',status:'Completed',imageUrl:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'},{id:3,title:'Urban Business Centre',location:'Tiruppur',status:'Ongoing',imageUrl:'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'}],testimonials:[{id:1,customerName:'Ramesh Kumar',location:'Coimbatore',message:'PSK Brothers built our home on time and exactly as planned.',rating:5},{id:2,customerName:'Priya Selvam',location:'Erode',message:'Professional team, honest pricing, excellent finish quality.',rating:5},{id:3,customerName:'Arun Prakash',location:'Tiruppur',message:'They handled our office renovation smoothly with minimal disruption.',rating:4}]};
const pillars={time:{label:'Time',title:'On schedule — every time.',body:'A construction delay is a cost, not just an inconvenience. We plan each project with a realistic timeline and hold to it.',points:['Milestone-based schedule agreed before work starts','One point of contact who owns your timeline','Delays flagged early, not discovered at handover']},transparency:{label:'Transparency',title:'What we quote is what you pay.',body:"No surprise bills mid-project. Your estimate is itemised so you know exactly what's included.",points:['Itemised cost estimate before work begins','Material brand & quantity specified upfront','Any change discussed and approved before billing']},tracking:{label:'Tracking',title:"You always know where things stand.",body:"You shouldn't have to visit site every week to know what's happening.",points:['Regular photo updates as work progresses','Site visits scheduled with you, not surprise drop-ins','A supervisor you can call directly, any time']},technology:{label:'Technology',title:'Simple tools, used properly.',body:'We keep it practical — the technology serves the build, not the other way round.',points:['Digital estimates and BOQ, not hand-written slips','Standard checklists for every construction stage','Enquiry-to-handover tracked in one system']}};
const buildingTiers=[
  {max:2000,label:'SMALL HOME',stage:'FOUNDATION',floors:1},
  {max:4000,label:'FAMILY HOME',stage:'STRUCTURE',floors:2},
  {max:8000,label:'VILLA',stage:'WALLS & ROOF',floors:3},
  {max:20000,label:'APARTMENT BLOCK',stage:'FINISHING',floors:5},
  {max:50000,label:'RESIDENTIAL COMPLEX',stage:'MULTI-BLOCK',floors:8},
  {max:100000,label:'COMMERCIAL TOWER',stage:'HIGH-RISE',floors:12}
];

function getTier(sqft){for(const t of buildingTiers){if(sqft<=t.max)return t}return buildingTiers[buildingTiers.length-1]}
function BuildingArt({sqft}){
  const t=getTier(sqft);
  const idx=buildingTiers.indexOf(t);
  const floors=Math.min(t.floors,12);
  const width=Math.min(70+floors*14,220);
  const maxBodyH=140; // keeps the tallest towers from growing past the card and clipping the sky
  const floorH=Math.min(Math.max(38-floors,20), maxBodyH/floors);
  const bodyH=floors*floorH;
  const baseY=225;
  const topY=baseY-bodyH;
  const bodyX=150-width/2;
  const grid=Math.min(3+Math.floor(floors/2),6);
  // colour theme shifts warm (small home) -> cool glass (tower) as sqft grows
  const theme=idx<=1?{roof:'#e2262b',roofDk:'#a81620',wall:'#fff8f0',wallDk:'#ffe6d9',win:'#ffd873'}
    :idx<=3?{roof:'#5a6472',roofDk:'#3d444d',wall:'#f2f4f6',wallDk:'#e2e7ea',win:'#ffd873'}
    :{roof:'#33415c',roofDk:'#222c40',wall:'#e9f1fb',wallDk:'#d3e3f4',win:'#bcd9ff'};
  const windows=[];
  for(let f=0;f<floors;f++){
    const winY=topY+f*floorH+floorH*0.26;
    const winH=Math.max(floorH*0.46,9);
    const gap=width/(grid+1);
    for(let w=0;w<grid;w++){
      const wx=bodyX+gap*(w+1)-7;
      windows.push(<g key={f+'-'+w}>
        <rect x={wx} y={winY} width="14" height={winH} rx="2" fill={theme.win}/>
        <line x1={wx+7} y1={winY} x2={wx+7} y2={winY+winH} stroke="#fff" strokeWidth="1" opacity=".6"/>
      </g>);
    }
  }
  return (
    <div className="buildingArt">
      <svg viewBox="0 0 300 250" width="230" height="192">
        <defs>
          <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eaf4ff"/><stop offset="1" stopColor="#fdfdfd"/>
          </linearGradient>
          <linearGradient id="wallG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={theme.wallDk}/><stop offset="1" stopColor={theme.wall}/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="300" height="250" rx="14" fill="url(#skyG)"/>
        <circle cx="256" cy="34" r="16" fill="#ffe8a3"/>
        <ellipse cx="46" cy="30" rx="22" ry="9" fill="#fff" opacity=".8"/>
        <ellipse cx="70" cy="24" rx="16" ry="7" fill="#fff" opacity=".8"/>
        <rect x="0" y={baseY} width="300" height="25" fill="#dff0e4"/>
        <line x1="0" y1={baseY} x2="300" y2={baseY} stroke="#2a2a2e" strokeWidth="2"/>
        {/* small tree beside the building */}
        <rect x={bodyX-26} y={baseY-26} width="6" height="26" fill="#8a5a3a"/>
        <circle cx={bodyX-23} cy={baseY-34} r="15" fill="#4f9c6b"/>
        <ellipse cx={150} cy={baseY+4} rx={width/2+14} ry="7" fill="#000" opacity=".08"/>
        <rect x={bodyX} y={topY} width={width} height={bodyH} fill="url(#wallG)" stroke="#2a2a2e" strokeWidth="2"/>
        {/* plinth accent stripe */}
        <rect x={bodyX} y={baseY-8} width={width} height="8" fill={theme.roof}/>
        {floors<=2
          ? <polygon points={`${bodyX-14},${topY} 150,${topY-36} ${bodyX+width+14},${topY}`} fill={theme.roof} stroke={theme.roofDk} strokeWidth="2"/>
          : <>
              <rect x={bodyX-6} y={topY-10} width={width+12} height="10" fill={theme.roof} stroke={theme.roofDk} strokeWidth="1.5"/>
              <rect x={150-6} y={topY-26} width="12" height="16" fill="#9aa3ab"/>
              <line x1="150" y1={topY-26} x2="150" y2={topY-38} stroke="#9aa3ab" strokeWidth="2"/>
              <circle cx="150" cy={topY-40} r="2.5" fill="#e2262b"/>
            </>}
        {windows}
        <rect x={150-15} y={baseY-8-42} width="30" height="42" rx="2" fill="#fff" stroke="#2a2a2e" strokeWidth="1.6"/>
        <line x1={150} y1={baseY-8-42} x2={150} y2={baseY-8} stroke="#2a2a2e" strokeWidth="1"/>
        <circle cx={146} cy={baseY-8-20} r="1.6" fill="#2a2a2e"/>
      </svg>
      <p className="buildingStage"><b>{sqft.toLocaleString('en-IN')} sqft</b> <span>·</span> {t.stage} <span>·</span> {t.label}</p>
    </div>
  );
}

function ServiceIcon({title,idKey}){
  const k=(title||'').toLowerCase();
  const uid='svc'+idKey;
  let cat='default',icon;
  if(k.includes('residential')||k.includes('home')){
    cat='residential';
    icon=<>
      <defs>
        <linearGradient id={`roof-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff6a5e"/><stop offset="1" stopColor="#c81e22"/></linearGradient>
        <linearGradient id={`wall-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#f2ece7"/></linearGradient>
      </defs>
      <polygon points="12,30 32,12 52,30" fill={`url(#roof-${uid})`}/>
      <polygon points="12,30 32,12 32,16 17,30" fill="#fff" opacity=".25"/>
      <rect x="15" y="30" width="34" height="22" rx="2" fill={`url(#wall-${uid})`} stroke="#2a2a2e" strokeWidth="2"/>
      <rect x="27" y="38" width="10" height="14" rx="1" fill="#2a2a2e"/>
      <rect x="19" y="35" width="7" height="7" rx="1.5" fill="#ffd873" stroke="#c9895a" strokeWidth=".6"/>
      <rect x="38" y="35" width="7" height="7" rx="1.5" fill="#ffd873" stroke="#c9895a" strokeWidth=".6"/>
    </>;
  }else if(k.includes('commercial')||k.includes('office')){
    cat='commercial';
    icon=<>
      <defs><linearGradient id={`tower-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c3d3e0"/><stop offset="1" stopColor="#8fa4b8"/></linearGradient></defs>
      <rect x="17" y="12" width="30" height="4" rx="1" fill="#5a6472"/>
      <line x1="32" y1="12" x2="32" y2="5" stroke="#5a6472" strokeWidth="2"/><circle cx="32" cy="4" r="2" fill="#e2262b"/>
      <rect x="19" y="16" width="26" height="36" rx="2" fill={`url(#tower-${uid})`} stroke="#2a2a2e" strokeWidth="2"/>
      <polygon points="19,16 45,16 45,22 19,30" fill="#fff" opacity=".18"/>
      {[0,1,2].map(r=>[0,1,2].map(c=><rect key={r+'-'+c} x={24+c*7} y={22+r*9} width="4" height="5" rx=".6" fill="#eef6ff" opacity=".9"/>))}
    </>;
  }else if(k.includes('renovat')||k.includes('remodel')){
    cat='renovation';
    icon=<>
      <defs><linearGradient id={`rroof-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e0a06e"/><stop offset="1" stopColor="#a8663a"/></linearGradient></defs>
      <polygon points="13,30 30,15 47,30" fill={`url(#rroof-${uid})`}/>
      <rect x="16" y="30" width="28" height="19" rx="2" fill="#fff" stroke="#2a2a2e" strokeWidth="2"/>
      <rect x="21" y="35" width="7" height="7" rx="1.5" fill="#ffd873"/>
      <g transform="translate(36,37) rotate(35)">
        <rect x="0" y="0" width="17" height="7.5" rx="2" fill="#e2262b" stroke="#2a2a2e" strokeWidth="1.5"/>
        <rect x="1.5" y="1.2" width="14" height="2" rx="1" fill="#fff" opacity=".35"/>
        <line x1="17" y1="3.75" x2="27" y2="3.75" stroke="#8a5a34" strokeWidth="3" strokeLinecap="round"/>
      </g>
    </>;
  }else if(k.includes('plan')||k.includes('approval')){
    cat='planning';
    icon=<>
      <defs><linearGradient id={`doc-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#eef1f7"/></linearGradient></defs>
      <rect x="17" y="9" width="27" height="40" rx="3" fill={`url(#doc-${uid})`} stroke="#2a2a2e" strokeWidth="2"/>
      <rect x="22" y="15" width="12" height="3" rx="1.5" fill="#e2262b" opacity=".85"/>
      <line x1="22" y1="24" x2="39" y2="24" stroke="#c7cdd6" strokeWidth="2"/>
      <line x1="22" y1="31" x2="39" y2="31" stroke="#c7cdd6" strokeWidth="2"/>
      <line x1="22" y1="38" x2="33" y2="38" stroke="#c7cdd6" strokeWidth="2"/>
      <circle cx="43" cy="43" r="11" fill="#2ea86f"/>
      <circle cx="43" cy="43" r="11" fill="#fff" opacity=".12"/>
      <path d="M37.5,43 l3.7,4.2 l7.3,-8.4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </>;
  }else if(k.includes('interior')){
    cat='interior';
    icon=<>
      <defs><linearGradient id={`sofa-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dcc0f2"/><stop offset="1" stopColor="#b28fd6"/></linearGradient></defs>
      <line x1="46" y1="10" x2="46" y2="21" stroke="#2a2a2e" strokeWidth="1.6"/>
      <polygon points="40,10 52,10 48,19 44,19" fill="#ffd873" stroke="#2a2a2e" strokeWidth="1.2"/>
      <rect x="14" y="25" width="36" height="11" rx="4.5" fill={`url(#sofa-${uid})`} stroke="#2a2a2e" strokeWidth="1.6"/>
      <rect x="16" y="34" width="32" height="11" rx="3.5" fill="#efe2fb" stroke="#2a2a2e" strokeWidth="1.6"/>
      <rect x="14" y="41" width="5" height="8" rx="1" fill="#8a6fae"/><rect x="45" y="41" width="5" height="8" rx="1" fill="#8a6fae"/>
      <rect x="16" y="27" width="12" height="4" rx="2" fill="#fff" opacity=".4"/>
    </>;
  }else if(k.includes('turnkey')){
    cat='turnkey';
    icon=<>
      <defs><linearGradient id={`key-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff6a5e"/><stop offset="1" stopColor="#c81e22"/></linearGradient></defs>
      <circle cx="22" cy="34" r="10" fill="none" stroke={`url(#key-${uid})`} strokeWidth="4.5"/>
      <circle cx="19" cy="31" r="2.4" fill="#fff" opacity=".6"/>
      <rect x="30" y="32" width="21" height="4.5" rx="1" fill={`url(#key-${uid})`}/>
      <rect x="42" y="36.5" width="4.5" height="6.5" fill="#c81e22"/><rect x="48" y="36.5" width="4.5" height="9" fill="#c81e22"/>
      <polygon points="23,15 34,7 45,15 45,21 23,21" fill="#2a2a2e"/>
      <polygon points="23,15 34,7 34,11 27,15" fill="#fff" opacity=".15"/>
    </>;
  }else{
    icon=<><polygon points="14,30 32,14 50,30" fill="#e2262b"/><rect x="16" y="30" width="32" height="20" fill="#fff" stroke="#2a2a2e" strokeWidth="2"/></>;
  }
  return <div className={'serviceIcon cat-'+cat}><svg viewBox="0 0 64 64" width="56" height="56">{icon}</svg></div>;
}
function ProjectSlideshow({images}){
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    if(!images||images.length<=1)return;
    const t=setInterval(()=>setIdx(i=>(i+1)%images.length),3500);
    return ()=>clearInterval(t);
  },[images]);
  if(!images||images.length===0)return null;
  return (
    <div className="projectSlideshow">
      {images.map((src,i)=><img key={i} src={src} alt="" className={i===idx?'active':''}/>)}
      {images.length>1&&<div className="slideDots">{images.map((_,i)=><span key={i} className={i===idx?'on':''}/>)}</div>}
    </div>
  );
}
function TrustHands(){
  return (
    <div className="trustHandWrap">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="cloudClip" clipPathUnits="objectBoundingBox">
            <path d="M 0.2, 0.9 C 0.05, 0.9, 0, 0.75, 0.05, 0.55 C 0.02, 0.35, 0.15, 0.2, 0.3, 0.25 C 0.35, 0.05, 0.55, 0.02, 0.7, 0.1 C 0.85, 0.1, 0.98, 0.25, 0.95, 0.45 C 1, 0.6, 0.98, 0.8, 0.85, 0.9 C 0.75, 0.95, 0.35, 0.95, 0.2, 0.9 Z" />
          </clipPath>
        </defs>
      </svg>
      <div className="trustHandsClipWrap">
        <img src="/trust-hands.png" alt="Your vision, safe in our hands" className="trustHandsImg"/>
      </div>
      <div className="trustBadge"><CheckCircle2 size={15}/> On-time handover, guaranteed</div>
    </div>
  );
}
function App(){const[d,setD]=useState(fallback),[open,setOpen]=useState(false),[msg,setMsg]=useState(''),[rate,setRate]=useState(1650),[sqft,setSqft]=useState(1500),[editingSqft,setEditingSqft]=useState(false),[pillar,setPillar]=useState('time'),[step,setStep]=useState(1),formRef=useRef(null),[scrolled,setScrolled]=useState(false);useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>40);onScroll();window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll)},[]);useEffect(()=>{['services','projects','testimonials'].forEach(key=>{fetch(`${API}/${key}`).then(r=>{if(!r.ok)throw new Error('bad response');return r.json()}).then(data=>{if(Array.isArray(data))setD(prev=>({...prev,[key]:data}))}).catch(()=>{/* keep fallback data for this section */})});fetch(`${API}/settings`).then(r=>r.json()).then(s=>s.ratePerSqft&&setRate(s.ratePerSqft)).catch(()=>{})},[]);useEffect(()=>{
    const sections=document.querySelectorAll('main > section');
    const targets=[];
    sections.forEach(sec=>{
      if(sec.classList.contains('hero'))return;
      const inner=sec.querySelector(':scope > .wrap')||sec.querySelector(':scope > div');
      const t=inner||sec;
      t.classList.add('reveal');
      targets.push(t);
    });
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
    },{threshold:.12});
    targets.forEach(t=>io.observe(t));
    return ()=>io.disconnect();
  },[]);function goNext(){const f=formRef.current;const name=f.elements['name'],phone=f.elements['phone'];if(!name.value.trim()||!phone.checkValidity()){f.reportValidity();return}setStep(2)}
function commitSqft(val){let n=Math.round(Number(val));if(!Number.isFinite(n))n=sqft;n=Math.min(100000,Math.max(500,n));setSqft(n);setEditingSqft(false)}
async function submit(e){e.preventDefault();const form=e.currentTarget;setMsg('Sending...');try{let r=await fetch(`${API}/enquiries`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});if(!r.ok){const errBody=await r.json().catch(()=>null);console.error('Enquiry failed:',r.status,errBody);setMsg(errBody?.message||`Error ${r.status}. Check console for details.`);return}setMsg('Thank you! We will contact you shortly.');form.reset();setStep(1)}catch(err){console.error('Unexpected error:',err);setMsg('Something went wrong — check console (F12) for the real error.')}}return <div className="site"><header className={scrolled?'scrolled':''}><a className="logo" href="#home"><img src="/logo.png" alt="PSK Brothers Builders & Constructions"/></a><nav className={open?'open':''}>{['Home','About','Services','Why','Pillars','Calculator','Process','Projects','Testimonials','Contact'].map(x=><a key={x} onClick={()=>setOpen(false)} href={'#'+x.toLowerCase()}>{x}</a>)}<a className="loginNav" href="/login">Login</a><a className="primary navCta" href="#contact">GET A QUOTE</a></nav><button className={'menu'+(!scrolled&&!open?' onHero':'')} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></header><main>
<section id="home" className="hero"><div className="shade"/><div className="heroText"><p className="eyebrow">BUILDING TRUST. CREATING LANDMARKS.</p><h1>We build spaces<br/>that inspire <em>life.</em></h1><p>Quality construction, honest communication and dependable delivery for homes and businesses across Tamil Nadu.</p><a className="primary" href="#projects">VIEW OUR WORK <ArrowRight size={18}/></a><a className="call" href="tel:+919003177934"><Phone size={18}/> +91 90031 77934 <br/>+91 99414 26479</a></div><div className="stats"><span><b>10+</b>YEARS EXPERIENCE</span><span><b>75+</b>PROJECTS COMPLETED</span><span><b>100%</b>QUALITY COMMITMENT</span></div></section>
<section id="about" className="about wrap"><div><p className="eyebrow">WHO WE ARE</p><h2>Strong foundations.<br/>Lasting relationships.</h2><p>PSK Brothers Builders & Constructions is committed to quality workmanship, transparent pricing and timely delivery.</p>{['Skilled and experienced team','Quality materials and standards','Clear estimates and regular updates'].map(x=><div className="check" key={x}><CheckCircle2/> {x}</div>)}</div><div className="aboutImg"><img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"/><b>Built with<br/>responsibility.</b></div></section>
<section id="services" className="light"><div className="wrap"><p className="eyebrow">WHAT WE DO</p><h2>Complete construction solutions</h2><div className="grid services">{(d.services || []).map((x,i)=>x && <article key={x.id}><ServiceIcon title={x.title} idKey={x.id}/><i>0{i+1}</i><h3>{x.title}</h3><p>{x.description}</p><a href="#contact">ENQUIRE <ArrowRight size={15}/></a></article>)}</div></div></section>
<section id="projects" className="wrap"><p className="eyebrow">SELECTED PROJECTS</p><h2>Work we're proud of</h2><div className="grid projects">{(d.projects || []).map(x=>x && <article key={x.id}><ProjectSlideshow images={x.imageUrls&&x.imageUrls.length?x.imageUrls:(x.imageUrl?[x.imageUrl]:[])}/><span className={'statusPill'+(x.status==='Completed'?' done':'')}>{x.status==='Completed'?<CheckCircle2 size={13}/>:<Hammer size={13}/>} {x.status}</span><div><small>{x.location}</small><h3>{x.title}</h3></div></article>)}</div></section>
<section id="why" className="wrap"><p className="eyebrow">WHY PSK BROTHERS</p><h2>Built on trust, backed by process</h2><div className="grid why">{[['Time','On-time delivery — no cost overruns from delayed schedules.'],['Transparency','Clear estimates, no hidden charges. Every cost explained upfront.'],['Quality Materials','We use only trusted, standard-grade materials — no shortcuts.'],['Regular Updates','You get progress updates at every stage, not just at handover.'],['In-house Team','Our own skilled masons and supervisors — no unreliable subcontracting.'],['Post-Construction Support','Issues after handover? We stay reachable, not gone with the payment.'],['Fair Pricing','Right quality for the right price — quotes tailored to your budget.'],['Local Expertise','Deep knowledge of Coimbatore soil, weather and approval processes.']].map(([t,d2])=><div key={t} className="whyCard"><h3>{t}</h3><p>{d2}</p></div>)}</div></section>
<section id="pillars" className="light"><div className="wrap"><p className="eyebrow">HOW WE WORK</p><h2>4 things we don't compromise on</h2><div className="pillarTabs">{Object.keys(pillars).map(k=><button key={k} className={'pillarTab'+(pillar===k?' active':'')} onClick={()=>setPillar(k)}>{pillars[k].label}</button>)}</div><div className="pillarPanel"><h3>{pillars[pillar].title}</h3><p>{pillars[pillar].body}</p><ul>{pillars[pillar].points.map(pt=><li key={pt}><CheckCircle2 size={16}/> {pt}</li>)}</ul></div></div></section>
<section id="calculator" className="wrap"><p className="eyebrow">ESTIMATE YOUR COST</p><h2>Compare construction cost & see your savings</h2><p className="calcSub">Move the slider to see how PSK Brothers' transparent, fixed-rate pricing compares to typical market rates.</p><div className="calcBox2"><div className="calcCards"><div className="calcCard best"><span className="calcBadge">BEST PRICE</span><div className="calcCardRow"><div><b className="calcCardLabel">PSK Brothers</b><span className="calcCardRate">₹{rate.toLocaleString('en-IN')} / sqft</span></div><div className="calcCardAmt">₹{Math.round(rate*sqft).toLocaleString('en-IN')}</div></div></div><div className="calcCard others"><span className="calcBadge grey">+20%</span><div className="calcCardRow"><div><b className="calcCardLabel">Other Builders</b><span className="calcCardRate">₹{Math.round(rate*1.2).toLocaleString('en-IN')} / sqft</span></div><div className="calcCardAmt">₹{Math.round(rate*1.2*sqft).toLocaleString('en-IN')}</div></div></div><div className="calcCard save"><div className="calcCardRow"><div><b className="calcCardLabel save">You Save</b><span className="calcCardRate save">~17% less</span></div><div className="calcCardAmt save">₹{Math.round(rate*1.2*sqft-rate*sqft).toLocaleString('en-IN')}</div></div></div><a className="primary calcCta" href="#contact">Get Exact Quote <ArrowRight size={16}/></a></div><div className="calcRight"><BuildingArt sqft={sqft}/><input type="range" min="500" max="100000" step="500" value={sqft} onChange={e=>setSqft(Number(e.target.value))}/><div className="calcRange"><span>500</span><span>100K</span></div>{editingSqft?<form className="calcSqft editing" onSubmit={e=>{e.preventDefault();commitSqft(e.target.elements.sqftVal.value)}}><input name="sqftVal" type="number" min="500" max="100000" defaultValue={sqft} autoFocus onBlur={e=>commitSqft(e.target.value)}/><small>SQFT</small></form>:<button type="button" className="calcSqft" onClick={()=>setEditingSqft(true)}>{sqft.toLocaleString('en-IN')} <small>SQFT</small> <Pencil size={14}/></button>}</div></div></section>
<section id="process" className="light"><div className="wrap"><p className="eyebrow">HOW IT WORKS</p><h2>From first call to handover</h2><div className="grid process">{[['01','Enquiry','Tell us about your project — home, office or renovation.'],['02','Site Visit','Our team visits your site and understands your requirements.'],['03','Estimate & Plan','You get a clear, itemised cost estimate and timeline.'],['04','Execution & Handover','We build with regular updates, and hand over on schedule.']].map(([n,t,d2])=><div key={n} className="processCard"><span>{n}</span><h3>{t}</h3><p>{d2}</p></div>)}</div></div></section>
<section id="testimonials" className="light"><div className="wrap"><p className="eyebrow">CLIENT WORDS</p><h2>What our clients say</h2><div className="grid testimonials">{(d.testimonials || []).map(x=>x && <article key={x.id}><div className="stars">{'★'.repeat(x.rating)}{'☆'.repeat(5-x.rating)}</div><p>"{x.message}"</p><b>{x.customerName}</b><span>{x.location}</span></article>)}</div></div></section>
<section className="promise"><div><p className="eyebrow">THE PSK PROMISE</p><h2>Your vision. Safe in our hands.</h2><p>From first conversation to final handover, we bring care, clarity and craftsmanship to every square foot — no shortcuts, no surprises.</p><a className="primary" href="#contact">START YOUR PROJECT <ArrowRight/></a></div><TrustHands/></section>
<section id="contact" className="contact wrap"><div><p className="eyebrow">LET'S BUILD TOGETHER</p><h2>Tell us about your project.</h2><p>Planning a home, office or renovation? Our team will call you.</p><p><Phone/> +91 90031 77934 <br></br> +91 99414 26479</p><p><Mail/> pskbrothersbuilders@gmail.com</p><p><MapPin/> Chooolaimedu, Chennai, Tamil Nadu - 600094</p></div><form onSubmit={submit} ref={formRef} className="multiStep"><div className="stepDots"><span className={step>=1?'on':''}/><span className={step>=2?'on':''}/></div><div style={{display:step===1?'contents':'none'}}><input name="name" placeholder="Your name" required/><input name="phone" placeholder="Phone number" required/><input name="email" type="email" placeholder="Email address (optional)"/><button type="button" className="primary stepNext" onClick={goNext}>NEXT <ArrowRight/></button></div><div style={{display:step===2?'contents':'none'}}><select name="service" required={step===2}><option value="">Select service</option>{(d.services || []).map(x=>x && <option key={x.id} value={x.title}>{x.title}</option>)}</select><textarea name="message" placeholder="Tell us about your project" required={step===2}/><div className="stepBtnRow"><button type="button" className="stepBack" onClick={()=>setStep(1)}>BACK</button><button className="primary">SEND ENQUIRY <ArrowRight/></button></div></div><small>{msg}</small></form></section></main><footer><div className="logo footer-logo"><img src="/logo.png" alt="PSK Brothers Builders & Constructions"/></div><p className="footerCopy">© 2026 PSK Brothers Builders & Constructions.</p><a className="portalLink" href="/login">Login →</a></footer></div>};
function IntroScreen({onEnter}){
  const [leaving,setLeaving]=useState(false);
  function handleEnter(){
    if(leaving)return;
    setLeaving(true);
    setTimeout(onEnter,600);
  }
  return (
    <div className={'introScreen'+(leaving?' leaving':'')} onClick={handleEnter}>
      <div className="introGrid"/>
      <div className="introContent">
        <p className="eyebrow introEyebrow">WELCOME TO</p>
        <h1 className="introTitle">PSK Brothers<br/><em>Builders &amp; Constructions</em></h1>
        <p className="introTag">Building trust. Creating landmarks.<br/><span className="introSubTag">We build what you imagine.</span></p>
        <div className="introHint"><span className="introChevron">⌄</span>Tap anywhere to enter</div>
      </div>
    </div>
  );
}

function SiteWithIntro(){
  const [entered,setEntered]=useState(()=>{
    try{return sessionStorage.getItem('psk_entered')==='1'}catch(e){return false}
  });
  function enter(){
    try{sessionStorage.setItem('psk_entered','1')}catch(e){}
    setEntered(true);
  }
  return entered?<App/>:<IntroScreen onEnter={enter}/>;
}
createRoot(document.getElementById('root')).render(window.location.pathname.startsWith('/admin')?<AdminApp/>:window.location.pathname.startsWith('/portal')?<CustomerApp/>:window.location.pathname.startsWith('/login')?<LoginPage/>:<SiteWithIntro/>);
