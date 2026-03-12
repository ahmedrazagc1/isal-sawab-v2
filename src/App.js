import React, { useState, useEffect, useCallback } from "react";

// Configs
const MASTER_RECOVERY_KEY = "isal-e-sawab-786";
const DEFAULT_PASSWORD = "Awhahum";
const STORAGE_AMAL = "isal-amal-v1";
const STORAGE_NAMES = "isal-names-v1";
const STORAGE_PASS = "isal-pass-v1";
const STORAGE_PENDING_NAMES = "isal-pending-names-v1";
const STORAGE_PENDING_AMAL = "isal-pending-amal-v1";

// Yahan apni Gemini API Key dalein
const GEMINI_API_KEY = "AIzaSyApOheLiHFf_fEx_cvbr0vu950ly7rqsBQ";

const AMAL_ALIASES = {
  "درود": ["durood","darood","درود","durood sharif","darood sharif","durood pak","darood pak","درود شریف","الصلاة على النبي","صلوات","salawat","salat alan nabi","salavat"],
  "قرآن": ["quran","quraan","قرآن","kalaam","kalam","kalaam e pak","kalam pak","قرآن پاک","القرآن","quran pak","quraan pak","tilawat","tilaawat"],
  "تسبیح": ["tasbeeh","tasbih","تسبیح","zikr","zikar","ذکر","subhanallah","alhamdulillah","allahu akbar","subhan allah"],
  "نماز": ["namaz","salah","salat","نماز","الصلاة","prayer","namaz e janaza","namaz janaza"],
  "صدقہ": ["sadqa","sadqah","صدقہ","khairaat","khairat","charity","donation","الصدقة"],
  "فاتحہ": ["fatiha","fatihah","فاتحہ","surah fatiha","al fatiha","الفاتحة"],
  "دعا": ["dua","duaa","دعا","الدعاء","supplication"],
  "کلمہ": ["kalma","kalima","کلمہ","shahada","شہادت","لا إله إلا الله"],
};

function normalizeAmal(text) {
  const lower = text.toLowerCase().trim();
  for (const [urduName, aliases] of Object.entries(AMAL_ALIASES)) {
    if (aliases.some(a => lower.includes(a))) return urduName;
  }
  return null;
}

async function parseMessageWithAI(message) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `You are an Islamic sawab tracker. Extract amals from this message: "${message}". 
  Reply ONLY with JSON: {"amals":[{"name":"amal name","count":number}],"personName":"name or null"}.
  Standard names: Quran, Durood, Tasbeeh, Namaz, Sadqa, Fatiha, Dua, Kalma. Default count=1.`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("AI Error:", e);
    return { amals: [], personName: null };
  }
}

function IslamicPattern() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',opacity:0.04,pointerEvents:'none',zIndex:0}}>
      <defs>
        <pattern id="ip" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <polygon points="25,2 48,14 48,36 25,48 2,36 2,14" fill="none" stroke="#D4AF37" strokeWidth="1"/>
          <circle cx="25" cy="25" r="3" fill="#D4AF37"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ip)"/>
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState("public");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(DEFAULT_PASSWORD);
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState("login");
  const [amalData, setAmalData] = useState({});
  const [names, setNames] = useState([]);
  const [pendingNames, setPendingNames] = useState([]);
  const [pendingAmal, setPendingAmal] = useState([]);
  const [publicMsg, setPublicMsg] = useState("");
  const [publicProcessing, setPublicProcessing] = useState(false);
  const [publicResult, setPublicResult] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const load = (key, fallback) => {
      const saved = localStorage.getItem(key);
      try { return saved ? JSON.parse(saved) : fallback; } catch { return fallback; }
    };
    
    setCurrentPassword(localStorage.getItem(STORAGE_PASS) || DEFAULT_PASSWORD);
    setAmalData(load(STORAGE_AMAL, {}));
    setNames(load(STORAGE_NAMES, []));
    setPendingNames(load(STORAGE_PENDING_NAMES, []));
    setPendingAmal(load(STORAGE_PENDING_AMAL, []));
    setStorageReady(true);
  }, []);

  // Save to LocalStorage
  const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  async function handlePublicSubmit() {
    if (!publicMsg.trim()) return;
    setPublicProcessing(true);
    try {
      const result = await parseMessageWithAI(publicMsg);
      if (!result.amals || result.amals.length === 0) {
        setPublicResult("⚠️ کوئی عمل نہیں ملا، دوبارہ لکھیں");
      } else {
        const entry = { id: Date.now(), message: publicMsg, amals: result.amals, time: new Date().toLocaleString('ur-PK') };
        const updated = [...pendingAmal, entry];
        setPendingAmal(updated);
        save(STORAGE_PENDING_AMAL, updated);
        setPublicResult("✅ آپ کا ثواب ایڈمن کی منظوری کے بعد شامل ہو جائے گا!");
        setPublicMsg("");
      }
    } catch { setPublicResult("❌ خرابی آئی"); }
    setPublicProcessing(false);
  }

  const totalSawab = Object.values(amalData).reduce((a, b) => a + b, 0);

  if (!storageReady) return <div style={{color:'#D4AF37', textAlign:'center', marginTop:'50px'}}>Loading...</div>;

  return (
    <div style={{background: '#071120', minHeight: '100vh', color: '#e8d5a0', fontFamily: 'serif', direction: 'rtl'}}>
      <IslamicPattern />
      <header style={{padding: '20px', textAlign: 'center', borderBottom: '1px solid #D4AF37'}}>
        <h1>🕌 ایصالِ ثواب ٹریکر</h1>
        <button onClick={() => setView(view === 'public' ? 'admin' : 'public')} style={{marginTop:'10px', background:'none', border:'1px solid #D4AF37', color:'#D4AF37', padding:'5px 15px', cursor:'pointer'}}>
          {view === 'public' ? 'ایڈمن لاگ ان' : 'واپس'}
        </button>
      </header>

      <main style={{padding: '20px', maxWidth: '600px', margin: '0 auto'}}>
        {view === 'public' ? (
          <>
            <div style={{textAlign: 'center', margin: '20px 0', padding: '20px', border: '1px solid #D4AF37', borderRadius: '10px'}}>
              <h3>مجموعی ثواب</h3>
              <h2 style={{fontSize: '40px', color: '#D4AF37'}}>{totalSawab}</h2>
            </div>

            <div style={{background: '#0d1f3c', padding: '15px', borderRadius: '10px'}}>
              <textarea 
                value={publicMsg} 
                onChange={(e) => setPublicMsg(e.target.value)}
                placeholder="مثلاً: 100 بار درود پاک پڑھا..." 
                style={{width: '100%', height: '80px', background: '#071120', color: 'white', border: '1px solid #D4AF37', padding: '10px'}}
              />
              <button 
                onClick={handlePublicSubmit} 
                disabled={publicProcessing}
                style={{width: '100%', padding: '10px', background: '#D4AF37', color: '#071120', fontWeight: 'bold', marginTop: '10px', cursor:'pointer'}}
              >
                {publicProcessing ? "پروسیس ہو رہا ہے..." : "📤 ثواب بھیجیں"}
              </button>
              {publicResult && <p style={{textAlign: 'center', marginTop: '10px'}}>{publicResult}</p>}
            </div>

            <div style={{marginTop: '20px'}}>
              <h3>اعمال کی تفصیل:</h3>
              {Object.entries(amalData).map(([name, count]) => (
                <div key={name} style={{display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222'}}>
                  <span>{name}</span>
                  <span style={{color: '#D4AF37'}}>{count}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{textAlign: 'center'}}>
            {!adminLoggedIn ? (
              <div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="پاس ورڈ"
                  style={{padding: '10px', width: '100%', marginBottom: '10px'}}
                />
                <button onClick={() => password === currentPassword ? setAdminLoggedIn(true) : alert("Wrong!")} style={{width: '100%', padding: '10px', background: '#D4AF37'}}>لاگ ان</button>
              </div>
            ) : (
              <div>
                <h3>پینڈنگ اعمال ({pendingAmal.length})</h3>
                {pendingAmal.map(item => (
                  <div key={item.id} style={{background: '#0d1f3c', padding: '10px', margin: '10px 0', borderRadius: '5px'}}>
                    <p>{item.message}</p>
                    <button onClick={() => {
                      const newAmal = {...amalData};
                      item.amals.forEach(a => {
                        const name = normalizeAmal(a.name) || a.name;
                        newAmal[name] = (newAmal[name] || 0) + (a.count || 1);
                      });
                      setAmalData(newAmal);
                      save(STORAGE_AMAL, newAmal);
                      const filtered = pendingAmal.filter(p => p.id !== item.id);
                      setPendingAmal(filtered);
                      save(STORAGE_PENDING_AMAL, filtered);
                    }} style={{background: 'green', color: 'white', marginRight: '5px'}}>Approve</button>
                    <button onClick={() => {
                      const filtered = pendingAmal.filter(p => p.id !== item.id);
                      setPendingAmal(filtered);
                      save(STORAGE_PENDING_AMAL, filtered);
                    }} style={{background: 'red', color: 'white'}}>Reject</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
