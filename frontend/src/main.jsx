import React,{useEffect,useState,useRef}from'react';import{createRoot}from'react-dom/client';import{Menu,X,Phone,MapPin,Mail,ArrowRight,CheckCircle2,Pencil,Hammer,MessageSquare,Send,ChevronLeft,ChevronRight,Printer,FileText,User,Building2,Sparkles,ShieldCheck,Award,Star,Plus}from'lucide-react';import'./style.css';import AdminApp from'./AdminApp.jsx';import CustomerApp from'./CustomerApp.jsx';import LoginPage from'./LoginPage.jsx';import LeadershipPage from'./LeadershipPage.jsx';import ProjectsPage, { PROJECTS_DATA } from'./ProjectsPage.jsx';import ReviewsPage, { INITIAL_TESTIMONIALS } from'./ReviewsPage.jsx';
const API=import.meta.env.VITE_API_URL||'/api',fallback={services:['Residential Construction','Commercial Buildings','Renovation & Remodeling','Planning & Approval','Interior Works','Turnkey Projects'].map((title,id)=>({id,title,description:'Quality workmanship, transparent pricing and dependable project delivery.'})),projects:[],testimonials:[]};
// Fire-and-forget fetch to warm up Render server immediately on load
fetch(`${API}/settings`).catch(()=>{});
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
  const maxBodyH=140; 
  const floorH=Math.min(Math.max(38-floors,20), maxBodyH/floors);
  const bodyH=floors*floorH;
  const baseY=225;
  const topY=baseY-bodyH;
  const bodyX=150-width/2;
  const grid=Math.min(3+Math.floor(floors/2),6);
  const theme=idx<=1?{roof:'#e2262b',roofDk:'#b71c1c',wall:'#ffffff',wallDk:'#e0e5ed',win:'#ffe600'}
    :idx<=3?{roof:'#ff6a5e',roofDk:'#e2262b',wall:'#f1f5f9',wallDk:'#cbd5e1',win:'#60a5fa'}
    :{roof:'#38bdf8',roofDk:'#0284c7',wall:'#f8fafc',wallDk:'#94a3b8',win:'#38bdf8'};
  const windows=[];
  for(let f=0;f<floors;f++){
    const winY=topY+f*floorH+floorH*0.26;
    const winH=Math.max(floorH*0.46,9);
    const gap=width/(grid+1);
    for(let w=0;w<grid;w++){
      const wx=bodyX+gap*(w+1)-7;
      windows.push(<g key={f+'-'+w}>
        <rect x={wx} y={winY} width="14" height={winH} rx="2" fill={theme.win} opacity="0.95"/>
        <line x1={wx+7} y1={winY} x2={wx+7} y2={winY+winH} stroke="#fff" strokeWidth="1" opacity=".7"/>
      </g>);
    }
  }
  return (
    <div className="buildingArt">
      <svg viewBox="0 0 300 250" width="280" height="210">
        <defs>
          <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0c12"/>
            <stop offset="1" stopColor="#161b26"/>
          </linearGradient>
          <linearGradient id="wallG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={theme.wallDk}/>
            <stop offset="1" stopColor={theme.wall}/>
          </linearGradient>
          <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect x="0" y="0" width="300" height="250" rx="16" fill="url(#skyG)"/>
        <rect x="0" y="0" width="300" height="250" rx="16" fill="url(#gridPattern)"/>
        <circle cx="256" cy="34" r="14" fill="#ff8a7a" opacity="0.3"/>
        <circle cx="256" cy="34" r="8" fill="#e2262b" opacity="0.8"/>
        
        {/* Ground level */}
        <rect x="0" y={baseY} width="300" height="25" fill="#1e2330"/>
        <line x1="0" y1={baseY} x2="300" y2={baseY} stroke="#e2262b" strokeWidth="2" opacity="0.8"/>
        
        {/* Building structure */}
        <ellipse cx={150} cy={baseY+4} rx={width/2+14} ry="7" fill="#000" opacity=".4"/>
        <rect x={bodyX} y={topY} width={width} height={bodyH} fill="url(#wallG)" stroke="#1e293b" strokeWidth="2" rx="2"/>
        <rect x={bodyX} y={baseY-8} width={width} height="8" fill={theme.roof}/>
        {floors<=2
          ? <polygon points={`${bodyX-14},${topY} 150,${topY-36} ${bodyX+width+14},${topY}`} fill={theme.roof} stroke={theme.roofDk} strokeWidth="2"/>
          : <>
              <rect x={bodyX-6} y={topY-10} width={width+12} height="10" fill={theme.roof} stroke={theme.roofDk} strokeWidth="1.5"/>
              <rect x={150-6} y={topY-26} width="12" height="16" fill="#64748b"/>
              <line x1="150" y1={topY-26} x2="150" y2={topY-38} stroke="#e2262b" strokeWidth="2"/>
              <circle cx="150" cy={topY-40} r="3" fill="#ff6a5e"/>
            </>}
        {windows}
        <rect x={150-15} y={baseY-8-42} width="30" height="42" rx="2" fill="#0f172a" stroke="#e2262b" strokeWidth="1.6"/>
        <line x1={150} y1={baseY-8-42} x2={150} y2={baseY-8} stroke="#e2262b" strokeWidth="1" opacity="0.6"/>
        <circle cx="146" cy={baseY-8-20} r="1.6" fill="#ff8a7a"/>
      </svg>
      <p className="buildingStage">
        <b>{sqft.toLocaleString('en-IN')} SQFT</b> <span>·</span> {t.stage} <span>·</span> {t.label} ({floors} {floors > 1 ? 'FLOORS' : 'FLOOR'})
      </p>
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
    const t=setInterval(()=>setIdx(i=>(i+1)%images.length),6500);
    return ()=>clearInterval(t);
  }, [images ? images.join(',') : '']);
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
    <div className="trustHandContainer">
      <div className="trustGlow" />
      <div className="trustBadgeFloatingTop">
        <ShieldCheck size={15} style={{ color: '#ff6a5e' }} />
        <span>Grade-53 Cement &amp; Fe-550 Steel Quality</span>
      </div>

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
      </div>

      <div className="trustBadge">
        <CheckCircle2 size={16}/> 
        <span>100% On-Time Handover Guaranteed • Zero Mid-Costs</span>
      </div>

      <div className="trustBadgeFloatingBottom">
        <Award size={15} style={{ color: '#ffd700' }} />
        <span>75+ Landmarks Delivered</span>
      </div>
    </div>
  );
}
function convertToTamil(text) {
  if (!text) return '';
  const words = text.split(' ');
  const converted = words.map(w => {
    if (/[\u0B80-\u0BFF]/.test(w)) return w;
    const cleanWord = w.replace(/[^a-zA-Z]/g, '');
    const punctuationPrefix = w.match(/^[^a-zA-Z]+/)?.[0] || '';
    const punctuationSuffix = w.match(/[^a-zA-Z]+$/)?.[0] || '';
    if (!cleanWord) return w;
    const lowerWord = cleanWord.toLowerCase();
    const overrides = {
      'nandri': 'நன்றி',
      'nandri!': 'நன்றி!',
      'vanakkam': 'வணக்கம்',
      'sari': 'சரி',
      'enquiry': 'என்கொயரி',
      'super': 'சூப்பர்',
      'bro': 'ப்ரோ',
      'rates': 'விலை',
      'rate': 'விலை',
      'cost': 'மதிப்பீடு',
      'welcome': 'வரவேற்கிறோம்',
      'thanks': 'நன்றி',
      'thank': 'நன்றி',
      'hi': 'வணக்கம்',
      'hello': 'வணக்கம்',
      'ok': 'சரி',
      'okay': 'சரி'
    };
    if (overrides[lowerWord]) {
      return punctuationPrefix + overrides[lowerWord] + punctuationSuffix;
    }
    const charMap = {
      'aa': 'ா', 'ii': 'ீ', 'uu': 'ூ', 'ee': 'ே', 'oo': 'ோ', 'ai': 'ை', 'au': 'ௌ',
      'a': '', 'i': 'ி', 'u': 'u', 'e': 'ெ', 'o': 'ொ'
    };
    const vowelStart = {
      'aa': 'ஆ', 'ii': 'ஈ', 'uu': 'ஊ', 'ee': 'ஏ', 'oo': 'ஓ', 'ai': 'ஐ', 'au': 'ஔ',
      'a': 'அ', 'i': 'இ', 'u': 'உ', 'e': 'எ', 'o': 'ஒ'
    };
    const consonantMap = {
      'ng': 'ங்', 'ch': 'ச்', 'nj': 'ஞ்', 'th': 'த்', 'nd': 'ந்த்', 'zh': 'ழ்', 'sh': 'ஷ்', 'lh': 'ள்', 'rr': 'ற்', 'nn': 'ன்',
      'k': 'க்', 'g': 'க்', 'c': 'ச்', 't': 'ட்', 'd': 'ட்', 'n': 'ந்', 'p': 'ப்', 'b': 'ப்', 'm': 'ம்', 'y': 'ய்', 'r': 'ர்', 'l': 'ல்', 'v': 'வ்', 's': 'ஸ்', 'h': 'ஹ்', 'j': 'ஜ்'
    };
    let result = '';
    let i = 0;
    const lower = lowerWord;
    while (i < lower.length) {
      let consonant = '';
      let matchLen = 0;
      if (i + 1 < lower.length && consonantMap[lower.substr(i, 2)]) {
        consonant = consonantMap[lower.substr(i, 2)];
        matchLen = 2;
      } else if (consonantMap[lower.substr(i, 1)]) {
        consonant = consonantMap[lower.substr(i, 1)];
        matchLen = 1;
      }
      if (matchLen > 0) {
        i += matchLen;
        let vowelMatch = '';
        let vowelLen = 0;
        if (i + 1 < lower.length && charMap[lower.substr(i, 2)] !== undefined) {
          vowelMatch = lower.substr(i, 2);
          vowelLen = 2;
        } else if (i < lower.length && charMap[lower.substr(i, 1)] !== undefined) {
          vowelMatch = lower.substr(i, 1);
          vowelLen = 1;
        }
        if (vowelLen > 0) {
          let vs = charMap[vowelMatch];
          if (consonant === 'ந்' && (vowelMatch === 'u' || vowelMatch === 'uu')) {
            result += 'நு';
          } else {
            result += consonant.replace('்', '') + vs;
          }
          i += vowelLen;
        } else {
          result += consonant;
        }
      } else {
        let vowelMatch = '';
        let vowelLen = 0;
        if (i + 1 < lower.length && vowelStart[lower.substr(i, 2)]) {
          vowelMatch = lower.substr(i, 2);
          vowelLen = 2;
        } else if (i < lower.length && vowelStart[lower.substr(i, 1)]) {
          vowelMatch = lower.substr(i, 1);
          vowelLen = 1;
        }
        if (vowelLen > 0) {
          result += vowelStart[vowelMatch];
          i += vowelLen;
        } else {
          result += lower[i];
          i++;
        }
      }
    }
    return punctuationPrefix + result + punctuationSuffix;
  });
  return converted.join(' ');
}
const BOT_RESPONSES = {
  ta: {
    pricing: (rate, otherRate, savingsPercent) => `எங்கள் தற்போதைய கட்டுமான கட்டணம் சதுர அடிக்கு **₹${rate.toLocaleString('en-IN')} / sqft**. \n\nமற்ற கட்டுமான நிறுவனங்கள் (Other Builders) சராசரியாக சதுர அடிக்கு **₹${otherRate.toLocaleString('en-IN')} / sqft** வாங்குகிறார்கள். \n\nபி.எஸ்.கே பிரதர்ஸ் மூலம் நீங்கள் சதுர அடிக்கு **${savingsPercent}%** வரை பணத்தை சேமிக்கலாம்!`,
    
    sqftCalculation: (sqftVal, pskTotal, rate, otherTotal, otherRate, savings, savingsPercent) => `**${sqftVal.toLocaleString('en-IN')} சதுர அடி (sq ft)** திட்டத்திற்கான கட்டுமான மதிப்பீடு இதோ:\n\n- **பி.எஸ்.கே பிரதர்ஸ் கட்டணம்**: ₹${Math.round(pskTotal).toLocaleString('en-IN')} (சதுர அடிக்கு ₹${rate.toLocaleString('en-IN')})\n- **மற்ற நிறுவனங்கள் கட்டணம்**: ₹${Math.round(otherTotal).toLocaleString('en-IN')} (சதுர அடிக்கு ₹${otherRate.toLocaleString('en-IN')})\n- **நீங்கள் சேமிக்கும் தொகை**: **₹${Math.round(savings).toLocaleString('en-IN')}**! (அதாவது ${savingsPercent}% வரை மலிவானது)\n\nஉங்களுக்கு இந்த அளவில் வீடு கட்ட என்கொயரி செய்ய வேண்டுமா? கீழே உள்ள "என்கொயரி செய்ய" பட்டனை அழுத்தவும்.`,
    
    services: `நாங்கள் பின்வரும் கட்டுமான சேவைகளை மிகச் சிறந்த முறையில் வழங்குகிறோம்:\n` +
              `- **Residential Construction**: அதிநவீன சொகுசு வீடுகள் கட்டுதல்.\n` +
              `- **Commercial Buildings**: வணிக வளாகங்கள் மற்றும் அலுவலகங்கள் கட்டுதல்.\n` +
              `- **Renovation & Remodeling**: வீடுகள் மற்றும் கட்டிடங்களை புதுப்பித்தல்.\n` +
              `- **Planning & Approval**: கட்டுமான வரைபடங்கள் மற்றும் அரசு அனுமதி பெறுதல்.\n` +
              `- **Interior Works**: நேர்த்தியான உள் அலங்கார வேலைகள் (Interiors).\n` +
              `- **Turnkey Projects**: வரைபடம் முதல் சாவி ஒப்படைப்பது வரை அனைத்து வேலைகளும்.`,
              
    contact: `எங்களை நீங்கள் பின்வரும் வழிகளில் தொடர்பு கொள்ளலாம்:\n` +
             `- **தொலைபேசி**: +91 90031 77934 அல்லது +91 99414 26479\n` +
             `- **மின்னஞ்சல்**: pskbrothers1991@gmail.com\n` +
             `- **அலுவலக முகவரி**: சூளைமேடு, சென்னை, தமிழ்நாடு - 600094\n\n` +
             `அல்லது இந்த சாட்டிலேயே "என்கொயரி செய்ய" பட்டனை க்ளிக் செய்து உங்கள் விவரங்களை அனுப்பலாம்!`,
             
    projects: `நாங்கள் **24+ வருடங்களுக்கும் மேலாக** கட்டுமான துறையில் அனுபவம் கொண்டுள்ளோம். கோயம்புத்தூர், சென்னை, ஈரோடு, திருப்பூர் போன்ற இடங்களில் **75-க்கும் மேற்பட்ட திட்டங்களை** வெற்றிகரமாக முடித்துள்ளோம். எங்களின் சிறந்த திட்டங்களை முகப்பு பக்கத்தில் உள்ள 'Selected Projects' பகுதியில் பார்க்கலாம்.`,
    
    process: `எங்கள் எளிய மற்றும் வெளிப்படையான 4 வழிமுறைகள்:\n` +
             `1. **என்கொயரி**: உங்களது தேவைகளை எங்களிடம் கூறுதல்.\n` +
             `2. **தள பார்வை (Site Visit)**: எங்கள் பொறியாளர்கள் உங்கள் இடத்தை நேரில் வந்து ஆய்வு செய்தல்.\n` +
             `3. **மதிப்பீடு (BOQ & Estimate)**: எந்தவொரு மறைமுக கட்டணமும் இல்லாமல் தெளிவான கட்டுமான மதிப்பீடு வழங்குதல்.\n` +
             `4. **பணி மற்றும் ஒப்படைப்பு**: தினசரி புகைப்பட அப்டேட்களுடன் குறிப்பிட்ட காலத்திற்குள் வேலையை முடித்து ஒப்படைத்தல்.`,
             
    whyChoose: `பி.எஸ்.கே பிரதர்ஸின் முக்கிய சிறப்புகள்:\n` +
               `- **கூடுதல் கட்டணம் இல்லை**: திட்டமிட்ட மதிப்பீட்டிலேயே வேலையை முடிப்போம்.\n` +
               `- **சரியான நேரத்தில் ஒப்படைப்பு**: கால தாமதம் இல்லாமல் ஒப்படைப்பு.\n` +
               `- **தினசரி கண்காணிப்பு**: வாடிக்கையாளர் போர்டல் மூலம் தினசரி புகைப்பட அப்டேட்கள்.\n` +
               `- **சொந்த ஆட்கள்**: அனுபவமிக்க சொந்த தொழிலாளர்கள் மற்றும் மேற்பார்வையாளர்கள்.`,
               
    hello: `வணக்கம்! நான் பி.எஸ்.கே பிரதர்ஸ் உதவியாளர். எங்களின் கட்டுமான விலை, திட்டங்கள், மற்றும் முகவரி பற்றி எப்போது வேண்டுமானாலும் என்னிடம் கேட்கலாம். நான் உங்களுக்கு எவ்வாறு உதவ வேண்டும்?`,
    
    thanks: `மிக்க நன்றி! மகிழ்ச்சி. உங்களுக்கு வேறு ஏதேனும் உதவி தேவையா?`,
    ok: `சரிங்க! உங்களுக்கு வேறு ஏதேனும் தகவல் வேண்டுமா?`,
    super: `மிக்க நன்றி! நாங்கள் எப்போதுமே தரம் மற்றும் வாடிக்கையாளர் திருப்திக்கு முன்னுரிமை அளிக்கிறோம்.`,
    bye: `நன்றி, மீண்டும் வரவும்! நல்ல நாளாக அமையட்டும்!`,
    
    defaultReply: `மன்னிக்கவும், நீங்கள் கேட்பது எனக்கு புரியவில்லை. கீழ்க்கண்டவற்றை பற்றி என்னிடம் கேட்கலாம்:\n` +
                  `- **கட்டுமான விலை (Rates)**: சதுர அடி கட்டணம்.\n` +
                  `- **சேவைகள் (Services)**: நாங்கள் செய்யும் வேலைகள்.\n` +
                  `- **திட்டங்கள் (Projects)**: எங்களின் முந்தைய கட்டுமானங்கள்.\n` +
                  `- **தொடர்பு கொள்ள (Contact)**: போன் நம்பர் & முகவரி.\n\n` +
                  `அல்லது இங்கு என்கொயரி பதிவு செய்ய **"என்கொயரி செய்ய"** பட்டனை அழுத்தவும்!`
  },
  en: {
    pricing: (rate, otherRate, savingsPercent) => `Our current construction rate is **₹${rate.toLocaleString('en-IN')} / sqft**, while typical market rates from other builders stand at **₹${otherRate.toLocaleString('en-IN')} / sqft**. By building with PSK Brothers, you save approximately **${savingsPercent}%** on your project! Feel free to adjust the cost calculator on our homepage to see your estimated savings.`,
    
    sqftCalculation: (sqftVal, pskTotal, rate, otherTotal, otherRate, savings, savingsPercent) => `For a **${sqftVal.toLocaleString('en-IN')} sq ft** project, here is the cost estimation comparison:\n- **PSK Brothers Cost**: ₹${Math.round(pskTotal).toLocaleString('en-IN')} (at ₹${rate.toLocaleString('en-IN')} / sqft)\n- **Other Builders Cost**: ₹${Math.round(otherTotal).toLocaleString('en-IN')} (at ₹${otherRate.toLocaleString('en-IN')} / sqft)\n- **You Save**: **₹${Math.round(savings).toLocaleString('en-IN')}**! (${savingsPercent}% cheaper!)\n\nWould you like us to schedule a site visit or prepare a formal quote for this size? Please submit an enquiry form on the page!`,
    
    services: `We provide comprehensive construction solutions including:\n` +
              `- **Residential Construction**: Custom-designed, premium homes.\n` +
              `- **Commercial Buildings**: Offices & commercial structures built for value.\n` +
              `- **Renovation & Remodeling**: Modern styling upgrades for existing structures.\n` +
              `- **Planning & Approval**: Structural plans and regulatory clearances.\n` +
              `- **Interior Works**: Practical and elegant interior execution.\n` +
              `- **Turnkey Projects**: Full lifecycle handling from concept to handover.`,
              
    contact: `You can reach PSK Brothers Builders & Constructions through the following channels:\n` +
             `- **Phone**: +91 90031 77934 or +91 99414 26479\n` +
             `- **Email**: pskbrothers1991@gmail.com\n` +
             `- **Office**: Choolaimedu, Chennai, Tamil Nadu - 600094\n\n` +
             `Alternatively, click the Send Enquiry chip to submit your details here in the chat.`,
             
    projects: `With over **24+ years of experience**, we have completed **75+ projects** across Tamil Nadu, including Coimbatore, Chennai, Erode, and Tiruppur. Some of our selected works are displayed in the 'Selected Projects' gallery on our homepage. We use only premium materials and guarantee on-time delivery.`,
    
    process: `Our streamlined process ensures transparency and quality:\n` +
             `1. **Enquiry**: Tell us about your residential or commercial requirements.\n` +
             `2. **Site Visit**: Our experts visit your plot to evaluate technical parameters.\n` +
             `3. **Estimate & Plan**: We provide a clear, itemized quote detailing the Bill of Quantities (BOQ).\n` +
             `4. **Execution & Handover**: We build with daily photo updates and hand over on schedule.`,
             
    whyChoose: `PSK Brothers is built on trust and a strict process. Key advantages include:\n` +
               `- **Zero surprise bills** (itemized cost estimate agreed upfront).\n` +
               `- **No delay handovers** (schedule penalty clauses).\n` +
               `- **Daily site tracking** (photo progress updates in your customer portal).\n` +
               `- **100% in-house skilled masons** (no third-party subcontracts).`,
               
    hello: `Hello! I am the PSK Construction AI assistant. I can guide you regarding our construction rates, project experiences, services, office location, or our delivery process. How can I help you today?`,
    
    thanks: `You're very welcome! Glad I could help. Let know if you need anything else!`,
    ok: `Alright! Let me know if you have any other questions!`,
    super: `Thank you! We always prioritize quality and customer satisfaction.`,
    bye: `Goodbye! Have a wonderful day!`,
    
    defaultReply: `I'm here to help you build your dream project! Ask me about:\n` +
                  `- **Rates**: Current per sqft rates and savings.\n` +
                  `- **Services**: What construction solutions we offer.\n` +
                  `- **Projects**: Completed and ongoing landmarks.\n` +
                  `- **Process**: How we transition from enquiry to handover.\n` +
                  `- **Contact**: Phone, email, and office address details.\n\n` +
                  `If you want to initiate a project, click the **Send Enquiry** chip to submit your request here!`
  }
};

function GlobalLoader({message}){
  return (
    <div className="globalLoader">
      <svg viewBox="0 0 1000 200">
        <path
          className="pulseLoadingPath"
          d="M 0,130 L 320,130 L 335,90 L 350,170 L 365,130 L 380,130 L 395,40 L 410,190 L 425,130 L 445,130 L 460,130 L 460,105 L 485,105 L 485,130 L 495,130 L 495,80 L 525,80 L 525,130 L 535,130 L 535,55 Q 547,40 550,40 L 552,15 L 554,40 Q 557,40 570,55 L 570,130 Q 530,165 480,165 Q 440,165 430,145 Q 425,135 445,135 L 1000,135"
          fill="none"
          stroke="url(#pulseGradLoader)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="pulseGradLoader" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2262b" />
            <stop offset="50%" stopColor="#f0c866" />
            <stop offset="100%" stopColor="#e2262b" />
          </linearGradient>
        </defs>
      </svg>
      <p>{message || "Loading..."}</p>
    </div>
  );
}

function App(){const projectsRowRef=useRef(null);const testimonialsRowRef=useRef(null);const[selectedDetailProject,setSelectedDetailProject]=useState(null);const[detailPhotoIdx,setDetailPhotoIdx]=useState(0);const[showRateModal,setShowRateModal]=useState(false);const[rateFormData,setRateFormData]=useState({customerName:'',phone:'',email:'',location:'',rating:5,message:''});const[rateSuccessMsg,setRateSuccessMsg]=useState('');const[d,setD]=useState(fallback),[lightbox,setLightbox]=useState(null),[profileModal,setProfileModal]=useState(null),[appLoading,setAppLoading]=useState(false),[open,setOpen]=useState(false),[msg,setMsg]=useState(''),[rate,setRate]=useState(1650),[otherRate,setOtherRate]=useState(1980),[sqft,setSqft]=useState(500),[editingSqft,setEditingSqft]=useState(false),[pillar,setPillar]=useState('time'),[step,setStep]=useState(1),formRef=useRef(null),[scrolled,setScrolled]=useState(false),[showEnquiryModal,setShowEnquiryModalRaw]=useState(false),[chatOpen,setChatOpen]=useState(false),[chatInput,setChatInput]=useState(''),[lang,setLang]=useState('en'),[calcTab,setCalcTab]=useState('cost'),[chatMessages,setChatMessages]=useState([{sender:'bot',text:'👋 **Welcome to PSK Brothers Builders & Constructions!**\n\nOur mission is to assist you in discovering your dream home or commercial space across Tamil Nadu. How can we help you today?',time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]),[chatTyping,setChatTyping]=useState(false),[enquiryStep,setEnquiryStep]=useState(0),[enquiryData,setEnquiryData]=useState({name:'',phone:'',service:'',message:''});const chatBodyRef=useRef(null);const[suggestions,setSuggestions]=useState([]);const suggestTimeout=useRef(null);
const [coords, setCoords] = useState({ latitude: '', longitude: '' });
function requestCoords() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({
        latitude: pos.coords.latitude.toString(),
        longitude: pos.coords.longitude.toString()
      });
    }, null, { enableHighAccuracy: true });
  }
}
function setShowEnquiryModal(val) {
  if (val) {
    requestCoords();
  }
  setShowEnquiryModalRaw(val);
}const fetchSuggestions=(val)=>{if(!val.trim()){setSuggestions([]);return;}const words=val.split(' ');const lastWord=words[words.length-1];if(!lastWord||!/^[a-zA-Z]+$/.test(lastWord)){setSuggestions([]);return;}if(suggestTimeout.current)clearTimeout(suggestTimeout.current);suggestTimeout.current=setTimeout(async()=>{try{const res=await fetch(`${API}/transliterate?text=${encodeURIComponent(lastWord)}`);if(!res.ok)return;const data=await res.json();if(data&&data[1]&&data[1][0]&&data[1][0][1]){setSuggestions(data[1][0][1]);}}catch(err){console.error(err);}},200);};const selectSuggestion=(selectedWord)=>{const words=chatInput.split(' ');words[words.length-1]=selectedWord;setChatInput(words.join(' ')+' ');setSuggestions([]);};const handleKeyDown=(e)=>{if(e.key===' '&&suggestions.length>0){e.preventDefault();selectSuggestion(suggestions[0]);}};useEffect(()=>{if(chatBodyRef.current){chatBodyRef.current.scrollTop=chatBodyRef.current.scrollHeight;}},[chatMessages,chatTyping]);async function sendChatMessage(textToSubmit){let msgText=textToSubmit||chatInput;if(lang==='ta'){msgText=convertToTamil(msgText);}setSuggestions([]);if(!msgText.trim())return;const timestamp=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});const userMsg={sender:'user',text:msgText,time:timestamp};setChatMessages((prev)=>[...prev,userMsg]);if(!textToSubmit)setChatInput('');setChatTyping(true);const savingsPercent=otherRate>0?Math.round(((otherRate-rate)/otherRate)*100):0;if(enquiryStep>0){setTimeout(async()=>{let nextStep=enquiryStep;let nextData={...enquiryData};let replyText='';if(enquiryStep===1){nextData.name=msgText;nextStep=2;replyText=lang==='ta'?`நன்றி **${msgText}**. அடுத்து, உங்களைத் தொடர்புகொள்ள உங்கள் **மொபைல் எண்ணை** டைப் செய்து அனுப்பவும்:`:`Thank you **${msgText}**. Next, please type your **mobile number** so we can contact you:`;setEnquiryData(nextData);setEnquiryStep(nextStep);setChatMessages((prev)=>[...prev,{sender:'bot',text:replyText,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);setChatTyping(false);}else if(enquiryStep===2){const phoneClean=msgText.replace(/[^0-9+]/g,'');if(phoneClean.length<10){replyText=lang==='ta'?`தவறான மொபைல் எண். தயவுசெய்து சரியான **10 இலக்க மொபைல் எண்ணை** அனுப்பவும்:`:`Invalid mobile number. Please enter a valid **10-digit mobile number**:`;setChatMessages((prev)=>[...prev,{sender:'bot',text:replyText,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);setChatTyping(false);return;}nextData.phone=msgText;nextStep=3;replyText=lang==='ta'?`சிறப்பு. எந்த வகையான சேவை உங்களுக்குத் தேவைப்படுகிறது? (கீழே உள்ளவற்றில் ஒன்றை க்ளிக் செய்யவும் அல்லது டைப் செய்யவும்):`:`Great. Which service do you require? (Click one of the chips below or type):`;setEnquiryData(nextData);setEnquiryStep(nextStep);setChatMessages((prev)=>[...prev,{sender:'bot',text:replyText,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);setChatTyping(false);}else if(enquiryStep===3){nextData.service=msgText;nextStep=4;replyText=lang==='ta'?`கடைசியாக, உங்கள் திட்டம் அல்லது தேவைகள் பற்றிய ஒரு சிறு குறிப்பை டைப் செய்து அனுப்பவும் (உதாரணமாக: "1200 சதுர அடியில் 2 மாடி வீடு"):`:`Finally, please type a brief message about your project requirements (e.g., "1200 sq ft double floor residential construction"):`;setEnquiryData(nextData);setEnquiryStep(nextStep);setChatMessages((prev)=>[...prev,{sender:'bot',text:replyText,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);setChatTyping(false);}else if(enquiryStep===4){nextData.message=msgText;replyText=lang==='ta'?`மிக்க நன்றி! உங்கள் என்கொயரி பதிவு செய்யப்படுகிறது...`:`Thank you! Submitting your enquiry...`;setChatMessages((prev)=>[...prev,{sender:'bot',text:replyText,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);try{const payload = {
              name: nextData.name,
              phone: nextData.phone,
              email: '',
              service: nextData.service,
              message: msgText
            };
            if (coords.latitude && coords.longitude) {
              payload.latitude = coords.latitude;
              payload.longitude = coords.longitude;
            }
            const res = await fetch(`${API}/enquiries`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const resData = await res.json().catch(() => null);
            if (res.ok && resData && resData.trackId) {
              replyText = lang === 'ta'
                ? `வாழ்த்துகள்! 🎉 உங்கள் என்கொயரி வெற்றிகரமாகப் பதிவு செய்யப்பட்டது. உங்களது ட்ராக்கிங் ஐடி: **${resData.trackId}**. எங்களது பொறியாளர் குழு உங்களை விரைவில் தொடர்புகொள்வார்கள்! 👍`
                : `Congratulations! 🎉 Your enquiry has been submitted successfully. Your Tracking ID is **${resData.trackId}**. Our team will contact you shortly! 👍`;
            } else {
              replyText = lang === 'ta' ? `மன்னிக்கவும், என்கொயரி சேமிப்பதில் ஏதோ பிழை ஏற்பட்டது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும் அல்லது நேரடியாக எங்களை அழைக்கவும்.` : `Sorry, there was an issue submitting your enquiry. Please try again later or call us directly.`;
            }
          }catch(err){
            console.error(err);
            replyText=lang==='ta'?`நெட்வொர்க் பிழை. தயவுசெய்து மீண்டும் முயற்சிக்கவும் அல்லது எங்களை நேரடியாக அழைக்கவும்.`:`Network error. Please try again later or call us directly.`;
          }
          setEnquiryStep(0);
          setEnquiryData({name:'',phone:'',service:'',message:''});
          setChatMessages((prev)=>[...prev,{sender:'bot',text:replyText,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);
          setChatTyping(false);
        }},800);return;}const lowerMsg=msgText.toLowerCase();if(lowerMsg.includes('enquiry')||lowerMsg.includes('என்கொயரி')||lowerMsg.includes('register')||lowerMsg.includes('contact me')||lowerMsg.includes('book site visit')||lowerMsg.includes('enquire')){setTimeout(()=>{setEnquiryStep(1);requestCoords();setEnquiryData({name:'',phone:'',service:'',message:''});const reply=lang==='ta'?`சரி! உங்கள் என்கொயரியை பதிவிடலாம். முதலில், உங்கள் **பெயரை** டைப் செய்து அனுப்பவும்:`:`Sure! Let's register your enquiry right here. First, please type your **name** and send:`;setChatMessages((prev)=>[...prev,{sender:'bot',text:reply,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);setChatTyping(false);},800);return;}let match=msgText.match(/(\d+(?:\.\d+)?)\s*(?:sq\s*ft|sqft|square\s*feet|square\s*foot|sft|srf)/i);if(!match){match=msgText.match(/(?:how\s*much\s*for|cost\s*for|rate\s*for|estimate\s*for|for)\s*(\d+(?:\.\d+)?)/i);}if(match){try{const sqftVal=parseFloat(match[1]);if(sqftVal>=10&&sqftVal<=1000000){const pskTotal=sqftVal*rate;const otherTotal=sqftVal*otherRate;const savings=otherTotal-pskTotal;const savingsPercent=otherRate>0?Math.round(((otherRate-rate)/otherRate)*100):0;const botReplyText=BOT_RESPONSES[lang].sqftCalculation(sqftVal,pskTotal,rate,otherTotal,otherRate,savings,savingsPercent);setTimeout(()=>{setChatMessages((prev)=>[...prev,{sender:'bot',text:botReplyText,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);setChatTyping(false);},800);return;}}catch(e){}}let reply='';const isThanks=msgText.includes('thank')||msgText.includes('thx')||msgText.includes('nandri')||msgText.includes('நன்றி')||msgText.includes('நன்றிங்க')||msgText.includes('நன்றி!');const isOk=msgText==='ok'||msgText==='okay'||msgText==='சரி'||msgText==='சரிங்க'||msgText==='sari';const isSuper=msgText.includes('super')||msgText.includes('good')||msgText.includes('great')||msgText.includes('nice')||msgText.includes('அருமை')||msgText.includes('செம')||msgText.includes('சூப்பர்')||msgText.includes('wow')||msgText.includes('வாவ்');const isBye=msgText.includes('bye')||msgText.includes('tata')||msgText.includes('கிளம்புகிறேன்');const isPrice=msgText.includes('price')||msgText.includes('rate')||msgText.includes('cost')||msgText.includes('charge')||msgText.includes('budget')||msgText.includes('estimation')||msgText.includes('விலை')||msgText.includes('மதிப்பீடு')||msgText.includes('கட்டணம்');const isService=msgText.includes('service')||msgText.includes('offer')||msgText.includes('do you build')||msgText.includes('work you do')||msgText.includes('சேவை')||msgText.includes('வேலை');const isContact=msgText.includes('contact')||msgText.includes('phone')||msgText.includes('call')||msgText.includes('email')||msgText.includes('address')||msgText.includes('location')||msgText.includes('office')||msgText.includes('முகவரி')||msgText.includes('போன்');const isProjects=msgText.includes('project')||msgText.includes('portfolio')||msgText.includes('completed')||msgText.includes('ongoing')||msgText.includes('experience')||msgText.includes('show work')||msgText.includes('திட்டம்')||msgText.includes('அனுபவம்');const isProcess=msgText.includes('process')||msgText.includes('step')||msgText.includes('how it works')||msgText.includes('flow')||msgText.includes('முறை');const isWhy=msgText.includes('why choose')||msgText.includes('trust')||msgText.includes('guarantee')||msgText.includes('advantage')||msgText.includes('quality')||msgText.includes('நம்பிக்கை');const isHello=msgText.includes('hello')||msgText.includes('hi')||msgText.includes('hey')||msgText.includes('hola')||msgText.includes('வணக்கம்')||msgText.includes('நலம்');if(isThanks){reply=BOT_RESPONSES[lang].thanks;}else if(isOk){reply=BOT_RESPONSES[lang].ok;}else if(isSuper){reply=BOT_RESPONSES[lang].super;}else if(isBye){reply=BOT_RESPONSES[lang].bye;}else if(isPrice){reply=BOT_RESPONSES[lang].pricing(rate,otherRate,savingsPercent);}else if(isService){reply=BOT_RESPONSES[lang].services;}else if(isContact){reply=BOT_RESPONSES[lang].contact;}else if(isProjects){reply=BOT_RESPONSES[lang].projects;}else if(isProcess){reply=BOT_RESPONSES[lang].process;}else if(isWhy){reply=BOT_RESPONSES[lang].whyChoose;}else if(isHello){reply=BOT_RESPONSES[lang].hello;}else{reply=BOT_RESPONSES[lang].defaultReply;}setTimeout(()=>{setChatMessages((prev)=>[...prev,{sender:'bot',text:reply,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);setChatTyping(false);},800);}useEffect(()=>{['services','projects','testimonials'].forEach(key=>{fetch(`${API}/${key}`).then(r=>{if(!r.ok)throw new Error('bad response');return r.json()}).then(data=>{if(Array.isArray(data))setD(prev=>({...prev,[key]:data}))}).catch(()=>{/* keep fallback data for this section */})});fetch(`${API}/settings`).then(r=>r.json()).then(s=>{if(s.ratePerSqft)setRate(s.ratePerSqft);if(s.otherBuilderRatePerSqft)setOtherRate(s.otherBuilderRatePerSqft)}).catch(()=>{})},[]);useEffect(()=>{
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
    if (window.location.hash) {
      const hash = window.location.hash;
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
    return ()=>io.disconnect();
  },[]);function goNext(){const f=formRef.current;const name=f.elements['name'],phone=f.elements['phone'];if(!name.value.trim()||!phone.checkValidity()){f.reportValidity();return}setStep(2)}
function commitSqft(val){let n=Math.round(Number(val));if(!Number.isFinite(n))n=sqft;n=Math.min(100000,Math.max(500,n));setSqft(n);setEditingSqft(false)}
async function submit(e){
  e.preventDefault();
  const form=e.currentTarget;
  setMsg(lang==='ta'?'அனுப்பப்படுகிறது...':'Sending...');
  setAppLoading(true);
  const formDataObj = Object.fromEntries(new FormData(form));
  if (coords.latitude && coords.longitude) {
    formDataObj.latitude = coords.latitude;
    formDataObj.longitude = coords.longitude;
  }
  try{
    let r=await fetch(`${API}/enquiries`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(formDataObj)});
    const resData = await r.json().catch(() => null);
    if(!r.ok){
      setMsg(resData?.message||`Error ${r.status}`);
      setAppLoading(false);
      return;
    }
    const succMsg = lang === 'ta' 
      ? `மிக்க நன்றி! வெற்றிகரமாகப் பதிவு செய்யப்பட்டது. என்கொயரி ஐடி: ${resData.trackId}` 
      : `Thank you! Registered successfully. Track ID: ${resData.trackId}`;
    setMsg(succMsg);
    form.reset();
    setStep(1);
    setTimeout(()=>{setShowEnquiryModal(false);setMsg('')},6000);
  }catch(err){
    console.error('Unexpected error:',err);
    setMsg('Something went wrong. Please try again.');
  }finally{
    setAppLoading(false);
  }
}
const percentDiff = rate > 0 ? Math.round(((otherRate - rate) / rate) * 100) : 0;
const savePercent = otherRate > 0 ? Math.round(((otherRate - rate) / otherRate) * 100) : 0;
return (
  <div className="site">
  {appLoading && <GlobalLoader message="Loading details..."/>}
  <header className={scrolled?'scrolled':''}>
    <a className="logo" href="#home"><img src="/logo.png" alt="PSK Brothers Builders & Constructions"/></a>
    <nav className={open?'open':''}>
      {['Home','About','Services','Why','Pillars','Calculator','Process','Projects','Testimonials','Contact'].map(x=>(
        <a key={x} onClick={()=>setOpen(false)} href={'#'+x.toLowerCase()}>
          {x}
        </a>
      ))}
      <a className="leadershipNav" href="/leadership" style={{ color: '#ff8a7a', fontWeight: 700 }}>Leadership</a>
      <a className="loginNav" href="/login">Login</a>
      <button className="primary navCta" onClick={()=>{setStep(1);setMsg('');setShowEnquiryModal(true)}} style={{cursor:'pointer',borderRadius:'20px'}}>GET A QUOTE</button>
    </nav>
    <button className={'menu'+(!scrolled&&!open?' onHero':'')} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
  </header>
  <main>
<section id="home" className="hero"><div className="shade"/><div className="heroText"><p className="eyebrow">BUILDING TRUST. CREATING LANDMARKS.</p><h1>We build spaces<br/>that inspire <em>life.</em></h1><p>Quality construction, honest communication and dependable delivery for homes and businesses across Tamil Nadu.</p><a className="primary" href="#projects">VIEW OUR WORK <ArrowRight size={18}/></a><a className="call" href="tel:+919003177934"><Phone size={18}/> +91 90031 77934 <br/>+91 99414 26479</a></div><div className="stats"><span><b>24+</b>YEARS EXPERIENCE</span><span><b>75+</b>PROJECTS COMPLETED</span><span><b>100%</b>QUALITY COMMITMENT</span></div></section>
<section id="about" className="about wrap"><div><p className="eyebrow">WHO WE ARE</p><h2>Strong foundations.<br/>Lasting relationships.</h2><p>PSK Brothers Builders & Constructions is committed to quality workmanship, transparent pricing and timely delivery.</p>{['Skilled and experienced team','Quality materials and standards','Clear estimates and regular updates'].map(x=><div className="check" key={x}><CheckCircle2/> {x}</div>)}</div><div className="aboutImg"><img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"/><b>Built with<br/>responsibility.</b></div>

<div className="leadershipSection">
  <div className="leadershipHeader">
    <p className="eyebrow">LEADERSHIP &amp; HEAD OFFICE</p>
    <h2>The Founders &amp; Heart of PSK Brothers</h2>
    <p>Direct site ownership, transparent engineering guidance, and our main headquarters in Chennai.</p>
  </div>

  <div className="leadershipGrid">
    <div className="ownerCard" onClick={() => window.location.href = '/leadership'}>
      <div className="ownerImgWrap">
        <img src="/owner1.png" alt="S. Senthil Murugan - Founder & Managing Director" />
        <span className="ownerBadge">FOUNDER &amp; MD</span>
        <span className="ownerClickHint"><Sparkles size={12}/> Open Page</span>
      </div>
      <div className="ownerInfo">
        <h3>S. Senthil Murugan</h3>
        <p className="ownerRole">Founder &amp; Managing Director</p>
        <p className="ownerBio">
          20+ years of civil engineering excellence. Directs structural load design, RCC beam standards, and institutional BOQ pricing transparency.
        </p>
        <div className="ownerTag"><CheckCircle2 size={15}/> Structural Engineering • Founder</div>
        <div className="ownerActionBtn">
          <span>VIEW FULL PAGE DETAILS</span> <ArrowRight size={14}/>
        </div>
      </div>
    </div>

    <div className="ownerCard" onClick={() => window.location.href = '/leadership'}>
      <div className="ownerImgWrap">
        <img src="/owner2.png" alt="S. Prakash - Co-Founder & Head of Operations" />
        <span className="ownerBadge">CO-FOUNDER</span>
        <span className="ownerClickHint"><Sparkles size={12}/> Open Page</span>
      </div>
      <div className="ownerInfo">
        <h3>S. Prakash</h3>
        <p className="ownerRole">Co-Founder &amp; Head of Operations</p>
        <p className="ownerBio">
          Commands daily site engineering, material quality audits, live customer progress tracking, and 100% on-time milestone handovers.
        </p>
        <div className="ownerTag"><CheckCircle2 size={15}/> Site Operations • Quality Control</div>
        <div className="ownerActionBtn">
          <span>VIEW FULL PAGE DETAILS</span> <ArrowRight size={14}/>
        </div>
      </div>
    </div>

    <div className="ownerCard officeCard" onClick={() => window.location.href = '/leadership'}>
      <div className="ownerImgWrap">
        <img 
          src="/office.png" 
          alt="PSK Main Head Office Chennai" 
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'; }}
        />
        <span className="ownerBadge officeBadge">CHENNAI HQ</span>
        <span className="ownerClickHint"><Building2 size={12}/> Open Page</span>
      </div>
      <div className="ownerInfo">
        <h3>PSK Main Head Office</h3>
        <p className="ownerRole">Headquarters &amp; Design Suite</p>
        <p className="ownerBio">
          Located at Choolaimedu, Chennai. Features our client consultation lounge, material quality sample display, and digital BOQ estimation station.
        </p>
        <div className="ownerTag"><MapPin size={15}/> Choolaimedu, Chennai - 600094</div>
        <div className="ownerActionBtn" style={{ background: 'rgba(37, 99, 235, 0.15)', borderColor: 'rgba(37, 99, 235, 0.3)' }}>
          <span>VIEW HEADQUARTERS PAGE</span> <ArrowRight size={14}/>
        </div>
      </div>
    </div>
  </div>

  <div style={{ textAlign: 'center', marginTop: '45px' }}>
    <a href="/leadership" className="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '15px 36px', borderRadius: '30px', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 10px 30px rgba(226, 38, 43, 0.3)' }}>
      EXPLORE DEDICATED LEADERSHIP &amp; OFFICE PAGE <ArrowRight size={18}/>
    </a>
  </div>
</div>
</section>
<section id="services" className="light"><div className="wrap"><p className="eyebrow">WHAT WE DO</p><h2>Complete construction solutions</h2><div className="grid services">{(d.services || []).map((x,i)=>x && <article key={x.id}><ServiceIcon title={x.title} idKey={x.id}/><i>0{i+1}</i><h3>{x.title}</h3><p>{x.description}</p><button onClick={()=>{setStep(1);setMsg('');setShowEnquiryModal(true)}} style={{background:'none',border:'none',padding:0,color:'#17201d',fontSize:'.75rem',fontWeight:700,display:'flex',gap:'8px',alignItems:'center',cursor:'pointer'}}>ENQUIRE <ArrowRight size={15}/></button></article>)}</div></div></section>
<section id="projects" className="wrap" style={{ position: 'relative' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
    <div>
      <p className="eyebrow">SELECTED LANDMARKS</p>
      <h2 style={{ margin: 0 }}>Work we're proud of</h2>
    </div>

    {/* CAROUSEL ARROW BUTTONS (LEFT & RIGHT) */}
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button 
        type="button" 
        onClick={() => projectsRowRef.current?.scrollBy({ left: -380, behavior: 'smooth' })}
        aria-label="Previous Projects"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#ffffff',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        className="carouselArrowBtn"
      >
        <ChevronLeft size={22}/>
      </button>

      <button 
        type="button" 
        onClick={() => projectsRowRef.current?.scrollBy({ left: 380, behavior: 'smooth' })}
        aria-label="Next Projects"
        style={{
          background: 'rgba(226,38,43,0.85)',
          border: '1px solid #e2262b',
          color: '#ffffff',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(226,38,43,0.4)',
          transition: 'all 0.2s ease'
        }}
        className="carouselArrowBtn"
      >
        <ChevronRight size={22}/>
      </button>
    </div>
  </div>

  {/* PROJECTS HORIZONTAL CAROUSEL SLIDER */}
  <div 
    ref={projectsRowRef}
    className="projectsCarouselRow"
    style={{
      display: 'flex',
      gap: '24px',
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      paddingBottom: '20px',
      scrollBehavior: 'smooth'
    }}
  >
    {(() => {
      const dbList = (d.projects || []).map((p) => ({
        ...p,
        gallery: p.imageUrls && p.imageUrls.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : (p.gallery || []))
      }));
      return dbList;
    })().map((x) => x && (
      <article 
        key={x.id} 
        style={{ 
          minWidth: '340px',
          maxWidth: '380px',
          flex: '0 0 auto',
          scrollSnapAlign: 'start',
          cursor: 'pointer',
          borderRadius: '20px',
          overflow: 'hidden',
          background: 'rgba(23, 23, 28, 0.85)',
          border: '1px solid rgba(255,255,255,0.1)'
        }} 
        onClick={() => {
          setSelectedDetailProject(x);
        }}
      >
        <ProjectSlideshow images={x.gallery && x.gallery.length ? x.gallery : (x.imageUrls && x.imageUrls.length ? x.imageUrls : (x.imageUrl ? [x.imageUrl] : (x.coverImage ? [x.coverImage] : [])))}/>
        <span className={'statusPill' + (x.status === 'Completed' ? ' done' : '')}>
          {x.status === 'Completed' ? <CheckCircle2 size={13}/> : <Hammer size={13}/>} {x.status}
        </span>
        <div>
          <small><MapPin size={12}/> {x.location}</small>
          <h3>{x.title}</h3>
          {x.sqft && <span style={{ fontSize: '0.78rem', color: '#ff8a7a', fontWeight: 600 }}>{x.sqft} · Click for photos</span>}
        </div>
      </article>
    ))}
  </div>

  {/* SEE MORE PROJECTS CTA BUTTON */}
  <div style={{ textAlign: 'center', marginTop: '28px' }}>
    <a 
      href="/projects" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '10px', 
        background: 'linear-gradient(135deg, rgba(226,38,43,0.2) 0%, rgba(255,255,255,0.06) 100%)', 
        border: '1.5px solid rgba(226,38,43,0.5)', 
        color: '#ffffff', 
        padding: '14px 32px', 
        borderRadius: '30px', 
        fontWeight: 800, 
        fontSize: '0.94rem', 
        textDecoration: 'none',
        boxShadow: '0 8px 25px rgba(226,38,43,0.3)',
        transition: 'all 0.25s ease'
      }}
      className="seeMoreProjectsBtn"
    >
      <span>SEE ALL PROJECTS &amp; SITE PHOTOS ({(d.projects ? d.projects.length : 0)}+ LANDMARKS)</span> <ArrowRight size={18}/>
    </a>
  </div>
</section>
<section id="why" className="wrap"><p className="eyebrow">WHY PSK BROTHERS</p><h2>Built on trust, backed by process</h2><div className="grid why">{[['Time','On-time delivery — no cost overruns from delayed schedules.'],['Transparency','Clear estimates, no hidden charges. Every cost explained upfront.'],['Quality Materials','We use only trusted, standard-grade materials — no shortcuts.'],['Regular Updates','You get progress updates at every stage, not just at handover.'],['In-house Team','Our own skilled masons and supervisors — no unreliable subcontracting.'],['Post-Construction Support','Issues after handover? We stay reachable, not gone with the payment.'],['Fair Pricing','Right quality for the right price — quotes tailored to your budget.'],['Local Expertise','Deep knowledge of Coimbatore soil, weather and approval processes.']].map(([t,d2])=><div key={t} className="whyCard"><h3>{t}</h3><p>{d2}</p></div>)}</div></section>
<section id="pillars" className="light"><div className="wrap"><p className="eyebrow">HOW WE WORK</p><h2>4 things we don't compromise on</h2><div className="pillarTabs">{Object.keys(pillars).map(k=><button key={k} className={'pillarTab'+(pillar===k?' active':'')} onClick={()=>setPillar(k)}>{pillars[k].label}</button>)}</div><div className="pillarPanel"><h3>{pillars[pillar].title}</h3><p>{pillars[pillar].body}</p><ul>{pillars[pillar].points.map(pt=><li key={pt}><CheckCircle2 size={16}/> {pt}</li>)}</ul></div></div></section>

{/* COST CALCULATOR */}
<section id="calculator" className="wrap">
  <p className="eyebrow">ESTIMATE YOUR CONSTRUCTION COST</p>
  <h2>Compare construction cost &amp; see instant savings</h2>

  <div className="calcBox2">
    <div className="calcCards">
      <div className="calcCard best">
        <span className="calcBadge">BEST PRICE</span>
        <div className="calcCardRow">
          <div><b className="calcCardLabel">PSK Brothers</b><span className="calcCardRate">₹{rate.toLocaleString('en-IN')} / sqft</span></div>
          <div className="calcCardAmt">₹{Math.round(rate*sqft).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div className="calcCard others">
        <span className="calcBadge grey">{percentDiff >= 0 ? `+${percentDiff}%` : `${percentDiff}%`}</span>
        <div className="calcCardRow">
          <div><b className="calcCardLabel">Other Builders</b><span className="calcCardRate">₹{otherRate.toLocaleString('en-IN')} / sqft</span></div>
          <div className="calcCardAmt">₹{Math.round(otherRate*sqft).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div className="calcCard save">
        <div className="calcCardRow">
          <div><b className="calcCardLabel save">You Save</b><span className="calcCardRate save">~{savePercent}% less</span></div>
          <div className="calcCardAmt save">₹{Math.round(otherRate*sqft-rate*sqft).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <button className="primary calcCta" onClick={()=>{setStep(1);setMsg('');setShowEnquiryModal(true)}} style={{cursor:'pointer'}}>
        Get Exact Quote <ArrowRight size={16}/>
      </button>
    </div>

    <div className="calcRight">
      <BuildingArt sqft={sqft}/>
      
      {/* SQFT PRESETS BAR */}
      <div style={{ display: 'flex', gap: '8px', margin: '14px 0 10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: '1,200 (2BHK)', val: 1200 },
          { label: '1,800 (3BHK)', val: 1800 },
          { label: '2,400 (Duplex)', val: 2400 },
          { label: '5,000 (Villa)', val: 5000 },
          { label: '10,000 (Tower)', val: 10000 }
        ].map(p => (
          <button 
            key={p.val}
            type="button" 
            onClick={() => setSqft(p.val)}
            style={{ 
              background: sqft === p.val ? '#e2262b' : 'rgba(255,255,255,0.06)',
              color: '#ffffff',
              border: sqft === p.val ? '1px solid #e2262b' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: sqft === p.val ? '0 4px 14px rgba(226,38,43,0.4)' : 'none'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <input type="range" min="500" max="100000" step="500" value={sqft} onChange={e=>setSqft(Number(e.target.value))}/>
      <div className="calcRange"><span>500 SQFT</span><span>100K SQFT</span></div>
      {editingSqft?(
        <form className="calcSqft editing" onSubmit={e=>{e.preventDefault();commitSqft(e.target.elements.sqftVal.value)}}>
          <input name="sqftVal" type="number" min="500" max="100000" defaultValue={sqft} autoFocus onBlur={e=>commitSqft(e.target.value)}/>
          <small>SQFT</small>
        </form>
      ):(
        <button type="button" className="calcSqft" onClick={()=>setEditingSqft(true)} style={{ marginTop: '12px' }}>
          {sqft.toLocaleString('en-IN')} <small>SQFT</small> <Pencil size={14}/>
        </button>
      )}
    </div>
  </div>
</section>
<section id="process" className="light"><div className="wrap"><p className="eyebrow">HOW IT WORKS</p><h2>From first call to handover</h2><div className="grid process">{[['01','Enquiry','Tell us about your project — home, office or renovation.'],['02','Site Visit','Our team visits your site and understands your requirements.'],['03','Estimate & Plan','You get a clear, itemised cost estimate and timeline.'],['04','Execution & Handover','We build with regular updates, and hand over on schedule.']].map(([n,t,d2])=><div key={n} className="processCard"><span>{n}</span><h3>{t}</h3><p>{d2}</p></div>)}</div></div></section>
<section id="testimonials" className="wrap" style={{ position: 'relative' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
    <div>
      <p className="eyebrow">CLIENT WORDS &amp; RATINGS</p>
      <h2 style={{ margin: 0 }}>What our clients say</h2>
    </div>

    {/* CAROUSEL ARROW BUTTONS & WRITE REVIEW BUTTON */}
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <button 
        type="button" 
        onClick={() => setShowRateModal(true)}
        style={{
          background: '#e2262b',
          color: '#ffffff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '20px',
          fontWeight: 800,
          fontSize: '0.82rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 14px rgba(226,38,43,0.4)'
        }}
      >
        <Plus size={16}/> WRITE A REVIEW / RATE US
      </button>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          type="button" 
          onClick={() => testimonialsRowRef.current?.scrollBy({ left: -360, behavior: 'smooth' })}
          aria-label="Previous Reviews"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#ffffff',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          className="carouselArrowBtn"
        >
          <ChevronLeft size={20}/>
        </button>

        <button 
          type="button" 
          onClick={() => testimonialsRowRef.current?.scrollBy({ left: 360, behavior: 'smooth' })}
          aria-label="Next Reviews"
          style={{
            background: 'rgba(226,38,43,0.85)',
            border: '1px solid #e2262b',
            color: '#ffffff',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(226,38,43,0.4)',
            transition: 'all 0.2s ease'
          }}
          className="carouselArrowBtn"
        >
          <ChevronRight size={20}/>
        </button>
      </div>
    </div>
  </div>

  {/* TESTIMONIALS CAROUSEL SLIDER */}
  <div 
    ref={testimonialsRowRef}
    className="testimonialsCarouselRow"
    style={{
      display: 'flex',
      gap: '24px',
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      paddingBottom: '16px',
      scrollBehavior: 'smooth'
    }}
  >
    {(d.testimonials || []).map(x => x && (
      <article 
        key={x.id} 
        style={{ 
          minWidth: '340px',
          maxWidth: '380px',
          flex: '0 0 auto',
          scrollSnapAlign: 'start',
          borderRadius: '20px',
          padding: '24px',
          background: 'rgba(23, 23, 28, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)'
        }}
      >
        <div>
          <div style={{ color: '#ffc107', fontSize: '1.2rem', letterSpacing: '2px', marginBottom: '10px' }}>
            {'★'.repeat(x.rating || 5)}{'☆'.repeat(5 - (x.rating || 5))}
          </div>
          <p style={{ fontSize: '0.94rem', color: '#e4e4e7', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            "{x.message}"
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <b style={{ color: '#ffffff', fontSize: '0.98rem', display: 'block', marginBottom: '2px' }}>{x.customerName}</b>
            <span style={{ fontSize: '0.78rem', color: '#ff8a7a', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {x.location}</span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '3px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
            <CheckCircle2 size={11}/> Verified
          </span>
        </div>
      </article>
    ))}
  </div>

  {/* SEE ALL REVIEWS BUTTON */}
  <div style={{ textAlign: 'center', marginTop: '28px' }}>
    <a 
      href="/reviews" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '10px', 
        background: 'linear-gradient(135deg, rgba(226,38,43,0.2) 0%, rgba(255,255,255,0.06) 100%)', 
        border: '1.5px solid rgba(226,38,43,0.5)', 
        color: '#ffffff', 
        padding: '14px 32px', 
        borderRadius: '30px', 
        fontWeight: 800, 
        fontSize: '0.92rem', 
        textDecoration: 'none',
        boxShadow: '0 8px 25px rgba(226,38,43,0.3)',
        transition: 'all 0.25s ease'
      }}
      className="seeMoreProjectsBtn"
    >
      <span>SEE ALL CLIENT RATINGS &amp; REVIEWS (4.9 ★★★★★)</span> <ArrowRight size={18}/>
    </a>
  </div>
</section>
<section className="promise"><div><p className="eyebrow">THE PSK PROMISE</p><h2>Your vision. Safe in our hands.</h2><p>From first conversation to final handover, we bring care, clarity and craftsmanship to every square foot — no shortcuts, no surprises.</p><button className="primary" onClick={()=>{setStep(1);setMsg('');setShowEnquiryModal(true)}} style={{cursor:'pointer'}}>START YOUR PROJECT <ArrowRight/></button></div><TrustHands/></section>
<section id="contact" className="contact wrap" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'stretch' }}>
  {/* LEFT COLUMN: CONTACT DETAILS CARDS */}
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <p className="eyebrow" style={{ color: '#ff8a7a' }}>LET'S BUILD TOGETHER</p>
    <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', color: '#ffffff', fontFamily: 'Fraunces, serif', margin: '12px 0 16px 0', lineHeight: 1.15 }}>
      Tell us about <br/><em style={{ color: '#e2262b', fontStyle: 'italic', fontWeight: 500 }}>your project.</em>
    </h2>
    <p style={{ color: '#a1a1aa', fontSize: '1.02rem', lineHeight: '1.6', marginBottom: '32px', maxWidth: '520px' }}>
      Planning a residential home, commercial office, or renovation? Our senior civil engineer will review your project and get back to you within 2 hours.
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* PHONE CARD */}
      <div className="contactDetailCard" style={{ background: 'rgba(23, 23, 28, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(226, 38, 43, 0.15)', border: '1px solid rgba(226, 38, 43, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6a5e', flexShrink: 0 }}>
          <Phone size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', color: '#ff8a7a', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>
            ENGINEERING &amp; ENQUIRY HOTLINE
          </div>
          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <a href="tel:+919003177934" style={{ color: '#ffffff', textDecoration: 'none' }}>+91 90031 77934</a>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <a href="tel:+919941426479" style={{ color: '#ffffff', textDecoration: 'none' }}>+91 99414 26479</a>
          </div>
        </div>
      </div>

      {/* EMAIL CARD */}
      <div className="contactDetailCard" style={{ background: 'rgba(23, 23, 28, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(226, 38, 43, 0.15)', border: '1px solid rgba(226, 38, 43, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6a5e', flexShrink: 0 }}>
          <Mail size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', color: '#ff8a7a', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>
            OFFICIAL CORRESPONDENCE
          </div>
          <a href="mailto:pskbrothers1991@gmail.com" style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
            pskbrothers1991@gmail.com
          </a>
        </div>
      </div>

      {/* ADDRESS CARD */}
      <div className="contactDetailCard" style={{ background: 'rgba(23, 23, 28, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(226, 38, 43, 0.15)', border: '1px solid rgba(226, 38, 43, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6a5e', flexShrink: 0 }}>
          <MapPin size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', color: '#ff8a7a', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>
            MAIN HEAD OFFICE &amp; DESIGN SUITE
          </div>
          <a href="https://maps.google.com/?q=Choolaimedu,+Chennai,+Tamil+Nadu+-+600094" target="_blank" rel="noreferrer" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', lineHeight: 1.4, display: 'inline-block' }}>
            Choolaimedu, Chennai, Tamil Nadu - 600094
          </a>
        </div>
      </div>
    </div>
  </div>

  {/* RIGHT COLUMN: MODERN DARK GLASSMORPHISM ENQUIRY CARD */}
  <div style={{ 
    background: 'linear-gradient(145deg, rgba(23, 23, 28, 0.95) 0%, rgba(15, 16, 21, 0.98) 100%)', 
    padding: '44px 36px', 
    borderRadius: '24px', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'space-between',
    gap: '24px', 
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 30px 70px rgba(0, 0, 0, 0.6)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Red Top Accent Glow */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #e2262b 0%, #ff8a7a 50%, #e2262b 100%)' }} />

    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(226,38,43,0.12)', border: '1px solid rgba(226,38,43,0.3)', padding: '6px 14px', borderRadius: '20px', color: '#ff8a7a', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
        ⚡ FREE SITE VISIT &amp; ESTIMATE
      </div>

      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', fontFamily: 'Fraunces, serif' }}>
        Have a project in mind?
      </h3>
      <p style={{ fontSize: '0.92rem', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>
        Click below to submit your building requirements. Get a complete itemised estimate, 3D floor plan review, and clear construction timeline.
      </p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <button 
        className="primary" 
        onClick={() => { setStep(1); setMsg(''); setShowEnquiryModal(true); }} 
        style={{ 
          cursor: 'pointer', 
          width: '100%', 
          justifyContent: 'center', 
          borderRadius: '14px',
          padding: '16px 24px',
          fontSize: '0.95rem',
          fontWeight: 800,
          boxShadow: '0 12px 30px rgba(226, 38, 43, 0.4)'
        }}
      >
        SEND PROJECT ENQUIRY <ArrowRight size={18}/>
      </button>

      <a 
        href="https://wa.me/919003177934?text=Hello%20PSK%20Brothers,%20I%20have%20a%20construction%20enquiry" 
        target="_blank" 
        rel="noreferrer" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          background: 'rgba(255,255,255,0.06)', 
          color: '#ffffff', 
          textDecoration: 'none', 
          padding: '14px 20px', 
          borderRadius: '14px', 
          fontWeight: 700, 
          fontSize: '0.88rem', 
          border: '1px solid rgba(255,255,255,0.12)'
        }}
      >
        <Phone size={16} style={{ color: '#25D366' }}/> Chat Instantly on WhatsApp
      </a>
    </div>

    {/* TRUST HIGHLIGHTS AT BOTTOM OF CARD */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', fontSize: '0.78rem', color: '#d4d4d8' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#ff6a5e' }}/> Free Site Inspection</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#ff6a5e' }}/> Zero Obligation</span>
    </div>
  </div>
</section>
</main>

{showEnquiryModal && (
  <div className="modalOverlay" onClick={() => setShowEnquiryModal(false)}>
    <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', width: '94%', borderRadius: '28px', padding: '0', overflow: 'hidden' }}>
      <button className="modalClose" onClick={() => setShowEnquiryModal(false)} style={{ zIndex: 10 }}><X size={20}/></button>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 0.8fr) 1.2fr' }}>
        {/* LEFT COLUMN: ACTIVE CONSTRUCTION SITE ILLUSTRATION SCENE */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', color: '#fff', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
          {/* Construction Site Vector Background */}
          <img 
            src="/construction_site_illustration.png" 
            alt="PSK Construction Site Scene" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, filter: 'brightness(0.92)' }} 
          />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.35) 50%, rgba(15, 23, 42, 0.88) 100%)', zIndex: 1 }} />

          {/* Top Badge */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', color: '#fff', padding: '5px 12px', borderRadius: '16px', fontSize: '0.74rem', fontWeight: '800', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.2)' }}>
              🏗️ PSK BROTHERS BUILDERS
            </div>
          </div>

          {/* Bottom Content Overlay */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px 0', color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
              Building With Trust 🏡
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#f1f5f9', margin: '0 0 12px 0', lineHeight: '1.4', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
              Quality craftsmanship &amp; transparent delivery for homes &amp; businesses across Tamil Nadu.
            </p>

            {/* Trust Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '10px 12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc' }}>
                <span style={{ fontSize: '13px' }}>✓</span> <span><strong>25+ Years Experience</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc' }}>
                <span style={{ fontSize: '13px' }}>✓</span> <span><strong>Free Site Visit &amp; Plan</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc' }}>
                <span style={{ fontSize: '13px' }}>✓</span> <span><strong>100% On-Time Delivery</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORM FIELDS */}
        <div style={{ padding: '32px' }}>
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 4px 0', color: '#0f172a' }}>
              Let's Build Together 🏡
            </h2>
            <p className="modalDesc" style={{ fontSize: '0.84rem', lineHeight: '1.4', margin: 0, color: '#64748b' }}>
              Fill in your details below. Our team will contact you shortly!
            </p>
          </div>

          <form onSubmit={submit} ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#0f172a' }}>
                  <User size={14} style={{ color: '#e2262b' }} /> Full Name *
                </label>
                <input name="name" placeholder="e.g. Karthik Raja" required style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', fontSize: '0.88rem', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#0f172a' }}>
                  <Phone size={14} style={{ color: '#e2262b' }} /> Mobile Phone *
                </label>
                <input name="phone" placeholder="+91 98765 43210" required style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', fontSize: '0.88rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#0f172a' }}>
                  <Mail size={14} style={{ color: '#e2262b' }} /> Email (Optional)
                </label>
                <input name="email" type="email" placeholder="karthik@gmail.com" style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', fontSize: '0.88rem', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#0f172a' }}>
                  <Building2 size={14} style={{ color: '#e2262b' }} /> Service Type *
                </label>
                <select name="service" required style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', fontSize: '0.88rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="" style={{ color: '#0f172a', background: '#fff' }}>Select service</option>
                  {(d.services || []).map(x => x && <option key={x.id} value={x.title} style={{ color: '#0f172a', background: '#fff' }}>{x.title}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#0f172a' }}>
                <MessageSquare size={14} style={{ color: '#e2262b' }} /> Project Notes *
              </label>
              <textarea name="message" placeholder="Location, estimated sqft, budget..." required rows={3} style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', fontSize: '0.88rem', outline: 'none', resize: 'vertical' }} />
            </div>

            {msg && <p className="modalMsg" style={{ color: msg.includes('Thank') ? '#2ea86f' : '#e2262b', margin: '2px 0 0 0', fontWeight: 'bold', fontSize: '0.85rem' }}>{msg}</p>}

            <button type="submit" className="primary" style={{ padding: '13px', borderRadius: '14px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', boxShadow: '0 8px 20px rgba(226, 38, 43, 0.4)' }}>
              🚀 SEND ENQUIRY REQUEST <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
)}

{/* Floating Chat Widget */}
<button 
  className={`chatBotLauncher ${!chatOpen ? 'pulsing' : ''}`} 
  onClick={() => setChatOpen(!chatOpen)}
  style={{ border: 'none' }}
>
  {chatOpen ? <X size={24} /> : <MessageSquare size={24} />}
</button>

{chatOpen && (
  <div className="chatBotWindow">
    <div className="chatBotHeader">
      <div className="chatBotHeaderInfo">
        <div className="chatBotAvatar">PSK</div>
        <div className="chatBotHeaderTitle">
          <h4>PSK Assistant</h4>
          <span>Online</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          type="button"
          onClick={() => {
            const nextLang = lang === 'ta' ? 'en' : 'ta';
            setLang(nextLang);
            setChatMessages((prev) => [
              ...prev,
              {
                sender: 'bot',
                text: nextLang === 'ta'
                  ? 'மொழி தமிழ்-க்கு மாற்றப்பட்டது. நான் உங்களுக்கு எவ்வாறு உதவ வேண்டும்?'
                  : 'Language switched to English. How can I help you today?',
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(226, 38, 43, 0.25) 0%, rgba(255,255,255,0.1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '20px',
            color: '#ffffff',
            padding: '5px 12px',
            fontSize: '0.74rem',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {lang === 'ta' ? '🇬🇧 English' : '🇮🇳 தமிழ்'}
        </button>
        <button className="chatBotClose" onClick={() => setChatOpen(false)}>
          <X size={18} />
        </button>
      </div>
    </div>

    <div className="chatBotBody" ref={chatBodyRef}>
      {chatMessages.map((m, idx) => (
        <div key={idx} className={`chatMsg ${m.sender}`}>
          <div className="chatBubble">
            {m.text.split('\n').map((line, lIdx) => {
              let content = line;
              const boldRegex = /\*\*(.*?)\*\*/g;
              const parts = [];
              let lastIndex = 0;
              let match;
              while ((match = boldRegex.exec(content)) !== null) {
                parts.push(content.substring(lastIndex, match.index));
                parts.push(<strong key={match.index}>{match[1]}</strong>);
                lastIndex = boldRegex.lastIndex;
              }
              parts.push(content.substring(lastIndex));
              
              return (
                <p key={lIdx} style={{ margin: '0 0 6px 0', lineSpacing: '1.4' }}>
                  {parts.length > 0 ? parts : content}
                </p>
              );
            })}
          </div>
          <span className="chatTime">{m.time}</span>
        </div>
      ))}
      
      {chatTyping && (
        <div className="chatMsg bot">
          <div className="typingIndicator">
            <span className="typingDot"></span>
            <span className="typingDot"></span>
            <span className="typingDot"></span>
          </div>
        </div>
      )}
      
      {/* Quick replies */}
      <div className="chatBotChips">
        {enquiryStep === 3 ? (
          <>
            <button className="chatChip" onClick={() => sendChatMessage("Residential Construction")}>🏡 Residential</button>
            <button className="chatChip" onClick={() => sendChatMessage("Commercial Buildings")}>🏢 Commercial</button>
            <button className="chatChip" onClick={() => sendChatMessage("Renovation & Remodeling")}>🔨 Renovation</button>
            <button className="chatChip" onClick={() => sendChatMessage("Interior Works")}>🛋️ Interior</button>
            <button className="chatChip" onClick={() => sendChatMessage("Turnkey Projects")}>🔑 Turnkey</button>
          </>
        ) : (
          <>
            <button className="chatChip" onClick={() => sendChatMessage(lang === 'ta' ? "கட்டுமான விலை எவ்வளவு?" : "What is your construction rate?")}>
              💰 {lang === 'ta' ? "விலை விவரம்" : "Construction Rates"}
            </button>
            <button className="chatChip" onClick={() => sendChatMessage(lang === 'ta' ? "என்னென்ன சேவைகள் உள்ளன?" : "What services do you offer?")}>
              🏗️ {lang === 'ta' ? "சேவைகள்" : "Our Services"}
            </button>
            <button className="chatChip" onClick={() => sendChatMessage(lang === 'ta' ? "அலுவலக முகவரி எங்குள்ளது?" : "Where is your office located?")}>
              📍 {lang === 'ta' ? "அலுவலக இடம்" : "Office Locations"}
            </button>
            <button className="chatChip" onClick={() => { setStep(1); setMsg(''); setShowEnquiryModal(true); setChatOpen(false); }}>
              📝 {lang === 'ta' ? "இலவச மதிப்பீடு பெறுக" : "Get Free Quote"}
            </button>
          </>
        )}
      </div>
    </div>

    {suggestions.length > 0 && (
      <div className="chatSuggestionsBar">
        {suggestions.map((s, idx) => (
          <button 
            type="button"
            key={idx} 
            className="chatSuggestBtn" 
            onClick={() => selectSuggestion(s)}
          >
            {s}
          </button>
        ))}
      </div>
    )}

    <form 
      className="chatBotFooter" 
      onSubmit={(e) => {
        e.preventDefault();
        sendChatMessage();
      }}
    >
      <input 
        type="text" 
        className="chatBotInput" 
        placeholder={lang === 'ta' ? 'கேள்விகளைக் கேளுங்கள்...' : 'Ask me anything...'} 
        value={chatInput} 
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const val = e.target.value;
          setChatInput(val);
          if (lang === 'ta') {
            fetchSuggestions(val);
          }
        }}
      />
      <button className="chatBotSend" type="submit">
        <Send size={16} />
      </button>
    </form>
  </div>
)}

<footer>
  <div className="logo footer-logo"><img src="/logo.png" alt="PSK Brothers Builders & Constructions"/></div>
  <p className="footerCopy">© 2026 PSK Brothers Builders & Constructions.</p>
  <a className="portalLink" href="/login">Login →</a>
</footer>

{lightbox && (
  <div className="lightboxOverlay" onClick={() => setLightbox(null)}>
    <button className="lightboxClose" onClick={() => setLightbox(null)}><X size={24} /></button>
    
    {lightbox.images.length > 1 && (
      <button 
        className="lightboxArrow left" 
        onClick={(e) => { 
          e.stopPropagation(); 
          setLightbox(prev => ({ ...prev, idx: (prev.idx - 1 + prev.images.length) % prev.images.length })); 
        }}
      >
        <ChevronLeft size={28} />
      </button>
    )}

    <div className="lightboxContent" onClick={(e) => e.stopPropagation()}>
      <img src={lightbox.images[lightbox.idx]} alt="" />
      <div className="lightboxCaption">
        <h3>{lightbox.title}</h3>
        <p>{lightbox.location} • Photo {lightbox.idx + 1} of {lightbox.images.length}</p>
      </div>
    </div>

    {lightbox.images.length > 1 && (
      <button 
        className="lightboxArrow right" 
        onClick={(e) => { 
          e.stopPropagation(); 
          setLightbox(prev => ({ ...prev, idx: (prev.idx + 1) % prev.images.length })); 
        }}
      >
        <ChevronRight size={28} />
      </button>
    )}
  </div>
)}

{profileModal && (
  <div className="modalOverlay" onClick={() => setProfileModal(null)}>
    <div className="profileModalContent" onClick={(e) => e.stopPropagation()}>
      <button className="modalClose" onClick={() => setProfileModal(null)} style={{ zIndex: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}><X size={20}/></button>

      {profileModal === 'owner1' && (
        <>
          <div className="profileModalBanner">
            <img src="/owner1.png" alt="P. Saravana Kumar" />
            <div className="profileModalBannerShade" />
            <span className="profileModalBadge">FOUNDER &amp; MANAGING DIRECTOR</span>
          </div>
          <div className="profileModalBody">
            <h2 className="profileModalTitle">P. Saravana Kumar</h2>
            <p className="profileModalSub">Founder &amp; Managing Director • 20+ Years Civil Expertise</p>
            
            <div className="profileQuoteBox">
              "Building with integrity and structural perfection is our non-negotiable standard. Every foundation we lay is built as if our own family lived there."
            </div>

            <div className="profileSectionTitle">Key Responsibilities &amp; Direct Leadership</div>
            <div className="profileFeatureList">
              <div className="profileFeatureCard">
                <h4><CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Structural Engineering</h4>
                <p>Personal oversight on building load calculations, foundation design, and RCC beam reinforcement standards.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Transparent BOQ Pricing</h4>
                <p>Verifies itemised estimation quotes before client signing to guarantee zero mid-project cost escalations.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Client Trust &amp; Approvals</h4>
                <p>Directly handles high-value project consultations, government site approvals, and structural certification.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> 75+ Delivered Landmarks</h4>
                <p>24+ years leading premium residential villas, multi-story apartments, and commercial projects in Tamil Nadu.</p>
              </div>
            </div>

            <div className="profileModalActions">
              <a href="https://wa.me/919003177934?text=Hello%20P.%20Saravana%20Kumar,%20I%20would%20like%20to%20discuss%20a%20construction%20project" target="_blank" rel="noreferrer" className="profileBtnPrimary">
                <Phone size={16}/> Connect on WhatsApp (+91 90031 77934)
              </a>
              <button className="profileBtnSecondary" onClick={() => { setProfileModal(null); setShowEnquiryModal(true); }}>
                <Sparkles size={16}/> Send Direct Project Enquiry
              </button>
            </div>
          </div>
        </>
      )}

      {profileModal === 'owner2' && (
        <>
          <div className="profileModalBanner">
            <img src="/owner2.png" alt="S. Suresh Kumar" />
            <div className="profileModalBannerShade" />
            <span className="profileModalBadge">CO-FOUNDER &amp; HEAD OF OPERATIONS</span>
          </div>
          <div className="profileModalBody">
            <h2 className="profileModalTitle">S. Suresh Kumar</h2>
            <p className="profileModalSub">Co-Founder &amp; Head of Site Operations • On-Time Delivery Guarantee</p>
            
            <div className="profileQuoteBox">
              "A delay on site is a delay in a client's dream. We enforce daily progress milestones and strict material quality checks on every project."
            </div>

            <div className="profileSectionTitle">Field Execution &amp; Quality Control</div>
            <div className="profileFeatureList">
              <div className="profileFeatureCard">
                <h4><CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> On-Site Quality Audits</h4>
                <p>Daily inspections for concrete mixing ratios, brickwork verticality, slump testing, and waterproofing coats.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Daily Photo Tracking</h4>
                <p>Oversees live site updates uploaded to the Customer Portal so clients see real-time building progress.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> Approved Material Guarantee</h4>
                <p>Ensures only 53-grade OPC/PPC cement and Fe-550 TMT steel bars enter the construction site.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><CheckCircle2 size={16} style={{ color: '#ff6a5e' }}/> 100% On-Time Handover</h4>
                <p>Rigorous schedule tracking ensuring every project is handed over strictly within the agreed milestone date.</p>
              </div>
            </div>

            <div className="profileModalActions">
              <a href="https://wa.me/919941426479?text=Hello%20S.%20Suresh%20Kumar,%20I%20would%20like%20to%20discuss%20site%20operations" target="_blank" rel="noreferrer" className="profileBtnPrimary">
                <Phone size={16}/> Call Operations (+91 99414 26479)
              </a>
              <button className="profileBtnSecondary" onClick={() => { setProfileModal(null); setShowEnquiryModal(true); }}>
                <Hammer size={16}/> Book Site Visit &amp; Estimation
              </button>
            </div>
          </div>
        </>
      )}

      {profileModal === 'office' && (
        <>
          <div className="profileModalBanner">
            <img src="/office.png" alt="PSK Main Head Office" />
            <div className="profileModalBannerShade" />
            <span className="profileModalBadge" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>HEADQUARTERS &amp; DESIGN SUITE</span>
          </div>
          <div className="profileModalBody">
            <h2 className="profileModalTitle">PSK Main Head Office</h2>
            <p className="profileModalSub">Choolaimedu, Chennai, Tamil Nadu - 600094</p>
            
            <div className="profileQuoteBox" style={{ background: 'rgba(37, 99, 235, 0.08)', borderLeftColor: '#2563eb' }}>
              "Visit our Chennai headquarters to review 3D floor plans, touch real material samples, and calculate your exact itemised construction budget."
            </div>

            <div className="profileSectionTitle">Headquarters Facilities &amp; Customer Suite</div>
            <div className="profileFeatureList">
              <div className="profileFeatureCard">
                <h4><Building2 size={16} style={{ color: '#60a5fa' }}/> 3D Architectural Lounge</h4>
                <p>Interactive floor plan review and 3D elevation walkthroughs with our senior civil engineers.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><Building2 size={16} style={{ color: '#60a5fa' }}/> Material Sample Gallery</h4>
                <p>Examine first-quality chamber bricks, granite, vitrified tiles, electrical fittings, and plumbing fixtures in person.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><Building2 size={16} style={{ color: '#60a5fa' }}/> Instant BOQ Estimator Station</h4>
                <p>Get instant itemised cost breakdowns based on current Tamil Nadu market standards and your customized sqft needs.</p>
              </div>
              <div className="profileFeatureCard">
                <h4><Building2 size={16} style={{ color: '#60a5fa' }}/> Operating Hours</h4>
                <p>Monday to Saturday: 9:00 AM – 7:30 PM • Sunday: Prior appointment site visits available.</p>
              </div>
            </div>

            <div className="profileModalActions">
              <a href="https://maps.google.com/?q=Choolaimedu,+Chennai,+Tamil+Nadu+-+600094" target="_blank" rel="noreferrer" className="profileBtnPrimary" style={{ background: '#2563eb' }}>
                <MapPin size={16}/> Get Directions on Google Maps
              </a>
              <button className="profileBtnSecondary" onClick={() => { setProfileModal(null); setShowEnquiryModal(true); }}>
                <Mail size={16}/> Schedule Office Appointment
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}

{selectedDetailProject && (() => {
  const detailGallery = selectedDetailProject.gallery && selectedDetailProject.gallery.length 
    ? selectedDetailProject.gallery 
    : (selectedDetailProject.imageUrls && selectedDetailProject.imageUrls.length 
      ? selectedDetailProject.imageUrls 
      : (selectedDetailProject.imageUrl ? [selectedDetailProject.imageUrl] : (selectedDetailProject.coverImage ? [selectedDetailProject.coverImage] : [])));
  return (
    <div className="modalOverlay" onClick={() => setSelectedDetailProject(null)} style={{ zIndex: 9999, background: 'rgba(5, 5, 8, 0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '920px', width: '95%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '0', background: '#0d0d11', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 30px 80px rgba(0,0,0,0.9)' }}>
        <button type="button" onClick={() => setSelectedDetailProject(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <X size={20} />
        </button>

        <div style={{ position: 'relative', height: '400px', background: '#000' }}>
          <img 
            src={detailGallery[detailPhotoIdx] || detailGallery[0] || selectedDetailProject.coverImage || selectedDetailProject.imageUrl} 
            alt={selectedDetailProject.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)' }} />

          {detailGallery.length > 1 && (
            <>
              <button type="button" onClick={() => setDetailPhotoIdx((prev) => (prev === 0 ? detailGallery.length - 1 : prev - 1))} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={24} />
              </button>
              <button type="button" onClick={() => setDetailPhotoIdx((prev) => (prev === detailGallery.length - 1 ? 0 : prev + 1))} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div style={{ position: 'absolute', bottom: '20px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff8a7a', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                <MapPin size={16}/> {selectedDetailProject.location}
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0, fontFamily: 'Fraunces, serif' }}>
                {selectedDetailProject.title}
              </h2>
            </div>
            <span style={{ background: selectedDetailProject.status === 'Completed' ? '#22c55e' : '#e2262b', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {selectedDetailProject.status === 'Completed' ? <CheckCircle2 size={14}/> : <Hammer size={14}/>}
              {selectedDetailProject.status}
            </span>
          </div>
        </div>

        {detailGallery.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', padding: '14px 24px', background: '#070709', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
            {detailGallery.map((img, idx) => (
              <img key={idx} src={img} alt={`Photo ${idx + 1}`} onClick={() => setDetailPhotoIdx(idx)} style={{ width: '72px', height: '52px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: detailPhotoIdx === idx ? '2px solid #e2262b' : '2px solid transparent', opacity: detailPhotoIdx === idx ? 1 : 0.6 }} />
            ))}
          </div>
        )}

      <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: 'rgba(255,255,255,0.04)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div><small style={{ color: '#a1a1aa', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>BUILT-UP AREA</small><strong style={{ color: '#ffffff', fontSize: '1rem' }}>{selectedDetailProject.sqft || '3,200 Sq.Ft.'}</strong></div>
          <div><small style={{ color: '#a1a1aa', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>CONSTRUCTION DURATION</small><strong style={{ color: '#ffffff', fontSize: '1rem' }}>{selectedDetailProject.duration || '12 Months'}</strong></div>
          <div><small style={{ color: '#a1a1aa', fontSize: '0.76rem', display: 'block', marginBottom: '2px' }}>PROJECT TYPE</small><strong style={{ color: '#ff8a7a', fontSize: '1rem' }}>{selectedDetailProject.category || 'Residential'}</strong></div>
        </div>

        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f4f4f5', margin: '0 0 8px 0' }}>Project Overview</h4>
          <p style={{ fontSize: '0.94rem', color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>
            {selectedDetailProject.description || 'Quality residential & commercial construction project built by PSK Brothers with premium materials and on-time handover guarantee.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', paddingTop: '10px' }}>
          <button type="button" onClick={() => { setSelectedDetailProject(null); setShowEnquiryModal(true); }} style={{ background: '#e2262b', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '20px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Enquire About Similar Project <Phone size={16}/>
          </button>
        </div>
      </div>
    </div>
  </div>
); })()}

{showRateModal && (
  <div className="modalOverlay" onClick={() => setShowRateModal(false)} style={{ zIndex: 9999, background: 'rgba(5, 5, 8, 0.92)', backdropFilter: 'blur(12px)' }}>
    <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%', borderRadius: '24px', padding: '32px', background: '#0d0d11', border: '1px solid rgba(255,255,255,0.15)' }}>
      <button type="button" onClick={() => setShowRateModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={20} />
      </button>

      <div style={{ textAlign: 'left', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(226,38,43,0.15)', color: '#ff8a7a', padding: '4px 12px', borderRadius: '16px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '10px' }}>
          ⭐ PUBLIC CLIENT RATING
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff', fontFamily: 'Fraunces, serif' }}>
          Rate Your Experience with PSK
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#a1a1aa', margin: 0, lineHeight: 1.4 }}>
          Provide your name, mobile number, and email address to submit your genuine rating &amp; review.
        </p>
      </div>

      <form onSubmit={async (e) => {
        e.preventDefault();
        setRateSuccessMsg('');
        try {
          const resp = await fetch(`${API}/testimonials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rateFormData)
          });
          if (resp.ok) {
            const newT = await resp.json();
            setD(prev => ({ ...prev, testimonials: [newT, ...(prev.testimonials || [])] }));
          } else {
            setD(prev => ({ ...prev, testimonials: [{ id: Date.now(), ...rateFormData }, ...(prev.testimonials || [])] }));
          }
          setRateSuccessMsg('🎉 Thank you! Your rating & review has been posted successfully.');
          setTimeout(() => {
            setShowRateModal(false);
            setRateSuccessMsg('');
            setRateFormData({ customerName: '', phone: '', email: '', location: '', rating: 5, message: '' });
          }, 1800);
        } catch (err) {
          setD(prev => ({ ...prev, testimonials: [{ id: Date.now(), ...rateFormData }, ...(prev.testimonials || [])] }));
          setRateSuccessMsg('🎉 Thank you! Rating saved.');
          setTimeout(() => {
            setShowRateModal(false);
            setRateSuccessMsg('');
            setRateFormData({ customerName: '', phone: '', email: '', location: '', rating: 5, message: '' });
          }, 1800);
        }
      }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Full Name *</label>
            <input required placeholder="e.g. Ramesh Kumar" value={rateFormData.customerName} onChange={(e) => setRateFormData({ ...rateFormData, customerName: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Mobile Phone *</label>
            <input required type="tel" placeholder="+91 98765 43210" value={rateFormData.phone} onChange={(e) => setRateFormData({ ...rateFormData, phone: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Email Address *</label>
            <input required type="email" placeholder="name@gmail.com" value={rateFormData.email} onChange={(e) => setRateFormData({ ...rateFormData, email: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>City / Location *</label>
            <input required placeholder="e.g. Coimbatore, Erode" value={rateFormData.location} onChange={(e) => setRateFormData({ ...rateFormData, location: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Rating (1 to 5 Stars) *</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRateFormData({ ...rateFormData, rating: star })} style={{ background: star <= rateFormData.rating ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255,255,255,0.06)', border: star <= rateFormData.rating ? '1px solid #ffc107' : '1px solid rgba(255,255,255,0.14)', color: star <= rateFormData.rating ? '#ffc107' : '#71717a', borderRadius: '12px', padding: '8px 14px', fontSize: '1.1rem', cursor: 'pointer' }}>
                ★ {star}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#d4d4d8', marginBottom: '4px' }}>Review Feedback *</label>
          <textarea required rows={3} placeholder="Tell us about the construction quality, timing, and experience..." value={rateFormData.message} onChange={(e) => setRateFormData({ ...rateFormData, message: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', outline: 'none', resize: 'vertical' }} />
        </div>

        {rateSuccessMsg && <p style={{ color: '#4ade80', fontSize: '0.84rem', fontWeight: 700, margin: 0 }}>{rateSuccessMsg}</p>}

        <button type="submit" style={{ background: '#e2262b', color: '#fff', border: 'none', padding: '13px', borderRadius: '14px', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', boxShadow: '0 8px 20px rgba(226,38,43,0.4)' }}>
          <Send size={16}/> SUBMIT YOUR RATING &amp; REVIEW
        </button>
      </form>
    </div>
  </div>
)}
</div>
);
}
createRoot(document.getElementById('root')).render(window.location.pathname.startsWith('/admin')?<AdminApp/>:window.location.pathname.startsWith('/portal')?<CustomerApp/>:window.location.pathname.startsWith('/login')?<LoginPage/>:window.location.pathname.startsWith('/leadership')?<LeadershipPage/>:window.location.pathname.startsWith('/projects')?<ProjectsPage/>:window.location.pathname.startsWith('/reviews')||window.location.pathname.startsWith('/testimonials')?<ReviewsPage/>:<App/>);
